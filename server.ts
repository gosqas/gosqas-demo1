import express, { Application, urlencoded } from "express";
import { Repository } from "./services/types";
import * as QR from 'qrcode';
import { calculateDeviceID } from "./services";

function getRepo(app: Application) {
    const repo = app.get('repo') as Repository | undefined;
    if (!repo) throw new Error('Repository not found');
    return repo;
}

export function createExpressApp(repo: Repository) {
    const app = express();
    app.set('view engine', 'ejs');
    app.set('repo', repo);
    app.use(urlencoded({ extended: true }));

    app.get('/', async (req, res) => {
        res.render('index', {});
    });


    app.get('/devices', async (req, res) => {
        const repo = getRepo(req.app);
        const devices = await repo.getDevices();
        res.render('devices', { devices });
    });

    app.post('/devices', async (req, res) => {
        const deviceName = req.body.deviceName as string;
        const repo = getRepo(req.app);
        const device = await repo.createDevice(deviceName);
        res.redirect('/devices');
    });

    app.get('/device/:deviceKey([0-9A-Fa-f]{64})', async (req, res) => {
        const { deviceKey } = req.params;
        const repo = getRepo(req.app);
        const device = await repo.getDevice(deviceKey);
        if (!device) throw new Error('Device not found');
        const dataURL = await QR.toDataURL(`${process.env.BASE_URL}/provenance/${device.deviceID}`);
        res.render('device', { device, dataURL });
    });

    app.get('/provenance/:deviceKey([0-9A-Fa-f]{64})', async (req, res) => {
        const { deviceKey } = req.params;
        const repo = getRepo(req.app);
        const deviceID = calculateDeviceID(deviceKey);
        const records = await repo.getProvenanceRecords(deviceKey);

        res.render('provenance', { deviceID, records });
    });

    app.post('/provenance/:deviceKey([0-9A-Fa-f]{64})', async (req, res) => {
        const { deviceKey } = req.params;
        const assertion = req.body.assertion as string;
        const data = Buffer.from(assertion, 'utf8');

        const repo = getRepo(req.app);
        await repo.createProvenanceRecord(deviceKey, "text/plain", data);

        res.redirect(`/provenance/${deviceKey}`);
    });

    return app;
}