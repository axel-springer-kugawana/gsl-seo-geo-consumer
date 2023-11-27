import { SSoTEntity } from "./ssot-model";

export type SSoTEvent =  {
    entity: SSoTEntity,
    eventType: "Created" | "Deleted" | "Updated"
};


