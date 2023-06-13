import { DataTypes, Model, Sequelize } from 'sequelize';
import * as fnv from 'fnv-plus';
import * as crypto from 'crypto';

export class Device extends Model {
    declare key: string;
    declare name: string;

    get deviceKey(): Uint8Array {
        return Buffer.from(this.key, 'hex');
    }

    get deviceID(): bigint {
        const hash = fnv.hash(this.key.toLowerCase(), 64).dec();
        return BigInt(hash);
    }

    static make(name: string) {
        const key = crypto.randomBytes(32);
        return Device.build({ key: key.toString('hex').toLowerCase(), name });
    }

    static get(key: string) {
        return Device.findOne({ where: { key } });
    }

    static $init(sequelize: Sequelize) {
        Device.init({
            key: {
                type: DataTypes.STRING(64).BINARY,
                allowNull: false,
                unique: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            }
        }, {
            indexes: [
                {
                    unique: true,
                    fields: ['key']
                }
            ],
            sequelize
        });
    }
}
