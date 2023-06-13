import express from 'express';
import { Device } from '../models/Device';
import { Sequelize } from 'sequelize';
import { createDevice } from '../models';

export const router = express.Router();

router.get('/', async (req, res) => {
    const devices = (await Device.findAll()) ?? [];
    res.render('devices', { devices });
});

router.post('/', async (req, res) => {
    const { deviceName } = req.body;
    const sequelize = req.app.get('sequelize') as Sequelize;
    const device = await createDevice(sequelize, deviceName);
    res.redirect('/devices');
});

router.get('/:deviceKey', async (req, res) => {
    const { deviceKey } = req.params;
    const device = await Device.get(deviceKey);
    if (device) {
        res.render('device', { device });
    } else {
        res.redirect('/devices');
    }
});