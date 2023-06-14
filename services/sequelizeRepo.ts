import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, ModelStatic, Sequelize, Transaction } from "sequelize";
import { Device, Repository as IRepository, ProvenanceRecord } from "./types";
import * as crypto from 'crypto';
import { calculateDeviceID } from "./common";

interface DeviceModel extends Model<InferAttributes<DeviceModel>, InferCreationAttributes<DeviceModel>> {
    id: CreationOptional<number>;
    name: string;
    key: string;
}

interface ProvenanceRecordModel extends Model<InferAttributes<ProvenanceRecordModel>, InferCreationAttributes<ProvenanceRecordModel>> {
    id: CreationOptional<number>;
    deviceID: bigint;
    salt: string;
    type: string;
    data: Uint8Array;
    createdAt: CreationOptional<Date>;
}

class $ProvenanceRecord implements ProvenanceRecord {
    constructor(
        readonly deviceID: bigint,
        readonly type: string,
        readonly data: Uint8Array,
        readonly createdAt: Date,
    ) {}

    get dataURI(): string {
        const buffer = Buffer.from(this.data);
        return `data:${this.type};base64,${buffer.toString('base64')}`;
    }
}

class Repository implements IRepository {

    constructor(
        private readonly sequelize: Sequelize,
        private readonly device: ModelStatic<DeviceModel>,
        private readonly provenanceRecord: ModelStatic<ProvenanceRecordModel>
    ) {}

    async createDevice(name: string): Promise<Device> {
        const $key = crypto.randomBytes(32)
        const key = $key.toString('hex').toLowerCase();
        const deviceID = await this.sequelize.transaction(async (tx) => {
            await this.device.create({ key, name }, { transaction: tx });
            const record  = await this.provenanceRecordFactory($key, 'text/plain', Buffer.from(`${name} created`, 'utf8'), tx);
            return record.deviceID;
        });
        return { name, key, deviceID };
    }

    async getDevice(key: string): Promise<Device | null> {
        const device = await this.device.findOne({ where: { key } });
        return device ? Repository.mapDevice(device) : null;
    }

    async getDevices(): Promise<readonly Device[]> {
        const devices = await this.device.findAll();
        return devices.map(Repository.mapDevice);
    }

    private static mapDevice(device: DeviceModel): Device {
        const deviceID = calculateDeviceID(device.key);
        return { deviceID, key: device.key, name: device.name };
    }

    private async provenanceRecordFactory(key: Uint8Array, type: string, data: Uint8Array, transaction?: Transaction) {
        const salt = crypto.randomBytes(16);
        const deviceID = calculateDeviceID(key);
        const crypter = crypto.createCipheriv('aes-256-cbc', key, salt);
        const encryptedData = Buffer.concat([
            crypter.update(data), 
            crypter.final()
        ]);
        return await this.provenanceRecord.create({
            deviceID,
            salt: salt.toString('hex'),
            type,
            data: encryptedData,
        }, { transaction });
    }
    
    async createProvenanceRecord(key: string | Uint8Array, type: string, data: Uint8Array): Promise<ProvenanceRecord> {
        key = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
        const { deviceID, createdAt } = await this.provenanceRecordFactory(key, type, data);
        return new $ProvenanceRecord(deviceID, type, data, createdAt);
    }

    async getProvenanceRecords(key: string | Uint8Array): Promise<readonly ProvenanceRecord[]> {
        key = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
        const deviceID = calculateDeviceID(key);
        const records = await this.provenanceRecord.findAll({
            order: [['createdAt', 'DESC']],
            where: { deviceID }
        });
        return records.map(record => {
            const salt = Buffer.from(record.salt, 'hex');
            const crypter = crypto.createDecipheriv('aes-256-cbc', key, salt);

            const $1 = crypter.update(record.data);
            const $2 = crypter.final();
            const data = Buffer.concat([$1, $2]);

            return new $ProvenanceRecord(deviceID, record.type, data, record.createdAt);
        });
    }
}

export async function createSequelizeRepository(sequelize: Sequelize): Promise<IRepository> {

    const device = sequelize.define<DeviceModel>('Device', {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        key: {
            type: DataTypes.STRING(64).BINARY,
            allowNull: false,
            unique: true
        }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['key']
            }
        ]
    });

    const provenanceRecord = sequelize.define<ProvenanceRecordModel>('ProvenanceRecord', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        deviceID: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        salt: {
            type: DataTypes.STRING(32).BINARY,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        data: {
            type: DataTypes.BLOB,
            allowNull: false
        },
        createdAt: DataTypes.DATE,
    }, {
        indexes: [
            {
                fields: ['deviceID']
            }
        ],
    });

    await sequelize.sync();
    return new Repository(sequelize, device, provenanceRecord);
}