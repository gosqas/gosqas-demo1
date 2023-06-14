import fastify from 'fastify'
import { fastifyView } from '@fastify/view'
import { fastifyFormbody } from '@fastify/formbody'
import { Repository, calculateDeviceID } from './services';
import * as qrcode from 'qrcode';

export function createFastifyServer(repo: Repository) {

    const server = fastify({ logger: true })
    server.register(fastifyView, {
        engine: { ejs: require('ejs') },
    });
    server.register(fastifyFormbody);

    server.get('/', async (request, reply) => {
        return reply.view('views/index.ejs', {})
    });

    server.get('/devices', async (request, reply) => {
        const devices = await repo.getDevices();
        return reply.view('views/devices.ejs', { devices })
    });

    type DeviceKey = { deviceKey: string };

    server.post<{ Body: { deviceName: string } }>('/devices', async (request, reply) => {
        const { deviceName } = request.body;
        const device = await repo.createDevice(deviceName);
        reply.redirect('/devices');
    });

    server.get<{ Params: DeviceKey }>('/device/:deviceKey([0-9A-Fa-f]{64})', async (request, reply) => {
        const { deviceKey } = request.params;
        const device = await repo.getDevice(deviceKey);
        if (!device) throw new Error('Device not found');
        const dataURL = await qrcode.toDataURL(`${process.env.BASE_URL}/provenance/${device.deviceID}`);
        return reply.view('views/device.ejs', { device, dataURL });
    });

    server.get<{ Params: DeviceKey }>('/provenance/:deviceKey([0-9A-Fa-f]{64})', async (request, reply) => {
        const { deviceKey } = request.params;
        const deviceID = calculateDeviceID(deviceKey);
        const records = await repo.getProvenanceRecords(deviceKey);

        return reply.view('views/provenance.ejs', { deviceID, records });
    });

    server.post<{ Params: DeviceKey, Body: { assertion: string } }>('/provenance/:deviceKey([0-9A-Fa-f]{64})', async (request, reply) => {
        const { deviceKey } = request.params;
        const { assertion } = request.body;
        const data = Buffer.from(assertion, 'utf8');
        await repo.createProvenanceRecord(deviceKey, "text/plain", data);
        reply.redirect(`/provenance/${deviceKey}`);
    })

    return server;
}
