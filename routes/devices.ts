import express from 'express';
import { Device, createDevice, getDevice } from '../models';

export const router = express.Router();

router.get('/', async (req, res) => {
    const devices = (await Device.findAll()) ?? [];
    res.render('devices', { devices });
});

router.post('/', async (req, res) => {
    const { deviceName } = req.body;
    await createDevice(deviceName);
    res.redirect('/devices');
});

router.get('/:deviceKey', async (req, res) => {
    const { deviceKey } = req.params;
    const device = await getDevice(deviceKey);
    if (device) {
        res.render('device', { device });
    } else {
        res.redirect('/devices');
    }
});