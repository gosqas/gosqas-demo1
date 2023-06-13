import express from 'express';
import dotenv from 'dotenv';
import { urlencoded } from 'body-parser';
import * as QR from 'qrcode';

import { Sequelize } from 'sequelize';
import { createDevice, init, Device, ProvenanceRecord } from './models';

dotenv.config();

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
})

init(sequelize);

const port = process.env.PORT || 3000;

const app = express();
app.set('view engine', 'ejs');
app.use(urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    res.render('index', { });
});

app.get('/devices', async (req, res) => {
    const devices = (await Device.findAll()) ?? [];
    res.render('devices', { devices });
});

app.post('/devices', async (req, res) => {
    const { deviceName } = req.body;
    await createDevice(sequelize, deviceName);
    res.redirect('/devices');
});

app.get('/device/:deviceKey([0-9A-Fa-f]{64})', async (req, res) => {
    const { deviceKey } = req.params;
    const device = await Device.get(deviceKey);
    if (!device) throw new Error('Device not found');

    const dataURL = await QR.toDataURL(`${process.env.BASE_URL}/provenance/${device.deviceID}`);
    res.render('device', { device, dataURL });
});

app.get('/provenance/:deviceKey([0-9A-Fa-f]{64})', async (req, res) => {
    const { deviceKey } = req.params;
    const { deviceID, records } = await ProvenanceRecord.getRecords(deviceKey);

    res.render('provenance', { deviceID, records });
});

app.post('/provenance/:deviceKey([0-9A-Fa-f]{64})', async (req, res) => {
    const { deviceKey } = req.params;
    const { assertion } = req.body;

    await ProvenanceRecord.make(deviceKey, assertion).save();
    res.redirect(`/provenance/${deviceKey}`);
});

async function main() {
    await sequelize.sync();
    app.listen(port, () => {
        console.log(`[server]: Server is running at http://localhost:${port}`);
    });
}

main();