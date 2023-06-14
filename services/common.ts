import * as fnv from 'fnv-plus';

export function calculateDeviceID(key: string | Uint8Array): bigint {
    // if key is a string, convert it to a buffer to ensure it's hex encoded. 
    key = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
    // the fnv library only accepts strings, so convert the key Uint8Array to a lower cased hex string
    const $key = Buffer.from(key).toString('hex').toLowerCase();
    // calculate the 64 bit hash and convert it to a bigint
    const hash = fnv.hash($key, 64).dec();
    return BigInt(hash);
}

