import express from 'express';
import dotenv from 'dotenv';
import { urlencoded } from 'body-parser';

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
app.set('sequelize', sequelize);
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
    const sequelize = req.app.get('sequelize') as Sequelize;
    const device = await createDevice(sequelize, deviceName);
    res.redirect('/devices');
});

app.get('/device/:deviceKey([0-9A-Fa-f]{64})', async (req, res) => {
    const { deviceKey } = req.params;
    const device = await Device.get(deviceKey);
    res.render('device', { device });
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