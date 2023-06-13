import { DataTypes, Model, Sequelize } from 'sequelize';
import * as crypto from 'crypto';
import { Device } from './Device';

export class ProvenanceRecord extends Model {
    declare deviceID: string;
    declare salt: string;
    declare assertion: Uint8Array;
    declare createdAt: Date;

    static make(device: Device, assertion: string) {
        const salt = crypto.randomBytes(16);
        const crypter = crypto.createCipheriv('aes-256-cbc', device.deviceKey, salt);

        const $1 = crypter.update(Buffer.from(assertion, 'utf8'));
        const $2 = crypter.final();
        const $assertion = Buffer.concat([$1, $2]);
    
        return ProvenanceRecord.build({ deviceID: device.deviceID, salt: salt.toString('hex'), assertion: $assertion });
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
                    unique: true,
                    fields: ['deviceID']
                }
            ],
            sequelize
        });
    }

}
