import express from 'express';
import { Device } from '../models/Device';
import { Sequelize } from 'sequelize';
import { createDevice } from '../models';
import { ProvenanceRecord } from '../models/ProvenanceRecord';

export const router = express.Router();

router.get('/', async (req, res) => {
    const devices = (await Device.findAll()) ?? [];
    res.render('devices', { devices });
});

router.post('/', async (req, res) => {
    const { deviceName } = req.body;
    const sequelize = req.app.get('sequelize') as Sequelize;
    const device = await createDevice(sequelize, deviceName);
    res.redirect('/');
});

router.get('/:deviceKey([0-9A-Fa-f]{64})', async (req, res) => {
    const { deviceKey } = req.params;
    const device = await Device.get(deviceKey);
    if (device) {
        res.render('device', { device });
    } else {
        res.redirect('/devices');
    }
});

router.get('/provenance/:deviceKey([0-9A-Fa-f]{64})', async (req, res) => {
    const { deviceKey } = req.params;
    const { deviceID, records} = await ProvenanceRecord.getRecords(deviceKey);
    res.render('provenance', { deviceID, records });
});


router.post('/provenance/:deviceKey([0-9A-Fa-f]{64})', async (req, res) => {
    const { deviceKey } = req.params;
    const { assertion } = req.body;

    await ProvenanceRecord.make(deviceKey, assertion).save();
    const { deviceID, records} = await ProvenanceRecord.getRecords(deviceKey);
    res.render('provenance', { deviceID, records });
});

