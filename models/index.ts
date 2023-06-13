import { Model, Sequelize } from 'sequelize'
import { Device } from './Device';
import { ProvenanceRecord } from './ProvenanceRecord';

export function init(sequelize: Sequelize) {
    Device.$init(sequelize);
    ProvenanceRecord.$init(sequelize);
}

export async function createDevice(sequelize: Sequelize, name: string) {
    return await sequelize.transaction(async (tx) => {
        const device = await Device.make(name).save({ transaction: tx });
        await ProvenanceRecord.make(device.key, `${name} created`).save({ transaction: tx });
        return device;
    });
}

export { Device } from './Device';
export { ProvenanceRecord } from './ProvenanceRecord';