import { DataTypes, Model, Sequelize } from 'sequelize';
import * as crypto from 'crypto';
import { Device } from './Device';

export class ProvenanceRecord extends Model {
    declare deviceID: string;
    declare salt: string;
    declare assertion: Uint8Array;
    declare createdAt: Date;

    static make(deviceKey: string, assertion: string) {
        const key = Buffer.from(deviceKey, 'hex');
        const deviceID = Device.calcDeviceID(deviceKey);
        const salt = crypto.randomBytes(16);
        const crypter = crypto.createCipheriv('aes-256-cbc', key, salt);

        const $1 = crypter.update(Buffer.from(assertion, 'utf8'));
        const $2 = crypter.final();
        const $assertion = Buffer.concat([$1, $2]);

        return ProvenanceRecord.build({ deviceID: deviceID, salt: salt.toString('hex'), assertion: $assertion });
    }

    static async getRecords(deviceKey: string) {
        const deviceID = Device.calcDeviceID(deviceKey);
        const encryptedRecords = await ProvenanceRecord.findAll({ 
            order: [['createdAt', 'DESC']],
            where: { deviceID } 
        });
        const key = Buffer.from(deviceKey, 'hex');
        const records = encryptedRecords.map(record => {
            const salt = Buffer.from(record.salt, 'hex');
            const crypter = crypto.createDecipheriv('aes-256-cbc', key, salt);

            const $1 = crypter.update(record.assertion);
            const $2 = crypter.final();
            const assertion = Buffer.concat([$1, $2]);

            return { assertion, createdAt: record.createdAt };
        });
        return { deviceID, records }
    }

    static $init(sequelize: Sequelize) {
        ProvenanceRecord.init({
            deviceID: {
                type: DataTypes.STRING(64).BINARY,
                allowNull: false,
            },
            salt: {
                type: DataTypes.STRING(32).BINARY,
                allowNull: false
            },
            assertion: {
                type: DataTypes.BLOB,
                allowNull: false
            }
        }, {
            indexes: [
                {
                    fields: ['deviceID']
                }
            ],
            sequelize
        });
    }

}
