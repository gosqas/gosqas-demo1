import { calculateDeviceID, decodeKey, encodeKey, fnv1 } from "./common";
import { CreateRecordOptions, Device, DeviceRepository, ProvenanceAttachment, ProvenanceRecord, ProvenanceRecordFactory, ProvenanceRepository } from "./types";
import * as crypto from 'crypto';

function createDeviceRepository(): DeviceRepository {
    const $devices: Device[] = [];

    async function createDevice(name: string, factory: ProvenanceRecordFactory, key?: string | Uint8Array): Promise<Device> {
        key = key
            ? typeof key === 'string' ? decodeKey(key) : key
            : crypto.randomBytes(32);
        const deviceID = calculateDeviceID(key);
        const device = { name, key: encodeKey(key), deviceID };
        $devices.push(device);
        const report = await factory(key, `created ${name}`, { tags: ['creation'] });
        return device;
    }

    function getDevice(key: string | Uint8Array): Promise<Device | null> {
        const deviceID = calculateDeviceID(key);
        const device = $devices.find(d => d.deviceID === deviceID);
        return Promise.resolve(device ?? null);
    }

    function getDevices(): Promise<readonly Device[]> {
        return Promise.resolve($devices);
    }

    return { createDevice, getDevice, getDevices };
}

function createProvenanceRepository(): ProvenanceRepository {
    const $attachments: ProvenanceAttachment[] = [];
    const $reports: ProvenanceRecord[] = [];

    function createReport(key: string | Uint8Array, description: string, options?: CreateRecordOptions): Promise<ProvenanceRecord> {
        const deviceID = calculateDeviceID(key);
        const createdAt = options?.createdAt ?? new Date();
        const attachments = options?.attachments?.map(({ type, data }) => {
            const attachmentID = fnv1(data);
            return <ProvenanceAttachment>{ deviceID, attachmentID, type, data, createdAt };
        }) ?? [];

        const report = <ProvenanceRecord>{
            deviceID,
            description,
            attachments: attachments.map(a => ({ attachmentID: a.attachmentID, type: a.type })),
            tags: options?.tags ?? [],
            createdAt
        };
        $reports.push(report);
        $attachments.push(...attachments);
        return Promise.resolve(report);
    }

    function getReports(key: string | Uint8Array): Promise<readonly ProvenanceRecord[]> {
        const deviceID = calculateDeviceID(key);
        return Promise.resolve($reports.filter(r => r.deviceID === deviceID));
    }

    function getAttachment(key: string | Uint8Array, attachmentID: bigint): Promise<ProvenanceAttachment | null> {
        const deviceID = calculateDeviceID(key);
        const device = $attachments.find(a => a.deviceID === deviceID && a.attachmentID === attachmentID);
        return Promise.resolve(device ? device : null);
    }

    return { createRecord: createReport, getRecords: getReports, getAttachment };
}

export function createMemoryRepositories(): { devices: DeviceRepository, provenance: ProvenanceRepository } {
    return {
        devices: createDeviceRepository(),
        provenance: createProvenanceRepository()
    };
}

