import { Model, Sequelize } from 'sequelize'
import { Device } from './Device';
import { ProvenanceRecord } from './ProvenanceRecord';
import * as crypto from 'crypto';

export function init(sequelize: Sequelize) {
    Device.$init(sequelize);
    ProvenanceRecord.$init(sequelize);
}

export async function createDevice(sequelize: Sequelize, name: string) {
    return await sequelize.transaction(async (tx) => {
        const device = await Device.make(name).save({ transaction: tx });
        const record = await ProvenanceRecord.make(device, 'Device created').save({ transaction: tx });
        return device;
    });
}