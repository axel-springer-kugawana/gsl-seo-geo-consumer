type SSoTEntityMetadata = {
    metadata : {
        objectVersion: number, 
        dataModelVersion: string,
        partition: string
    }
}

export type SSoTEntity = {
    id: string,
    prop1: string,
    prop2: string,
    prop3: string
} & SSoTEntityMetadata;

export const SSoTName ="ssot-name";
export const SSoTEntityName = "ssot-entity-name";