export interface Device {
    readonly name: string;
    readonly key: string;
    readonly deviceID: bigint;
}

export interface ProvenanceRecord {
    readonly deviceID: bigint;
    readonly type: string;
    readonly data: Uint8Array;
    readonly createdAt: Date;
    readonly dataURI: string;
}

export interface Repository {
    createDevice(name: string): Promise<Device>;
    getDevice(key: string | Uint8Array): Promise<Device | null>;
    getDevices(): Promise<readonly Device[]>;
    createProvenanceRecord(key: string | Uint8Array, type: string, data: Uint8Array): Promise<ProvenanceRecord>;
    getProvenanceRecords(key: string | Uint8Array): Promise<readonly ProvenanceRecord[]>;
}