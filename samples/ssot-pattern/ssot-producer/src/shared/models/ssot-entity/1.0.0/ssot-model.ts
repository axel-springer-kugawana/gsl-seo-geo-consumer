export type SSoTData = {
    prop1: string,
    prop2: string,
    prop3: string
}

export type SSoTModel = {
    id: string,
    version: number,
    dataModelVersion: string,
    partition: string,
    data : SSoTData
}