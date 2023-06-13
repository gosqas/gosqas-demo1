import express from 'express';
import { Device } from '../models';

export const router = express.Router();

router.get('/', async (req, res) => {
    const devices = (await Device.findAll()) ?? [];
    res.render('devices', { devices });
});

router.post('/', async (req, res) => {
    const { deviceName } = req.body;
    const device = Device.$build(deviceName);
    await device.save();
    res.redirect('/devices');
});
