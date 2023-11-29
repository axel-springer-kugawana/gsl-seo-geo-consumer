import { SsotEntity } from "./ssot-entity/models";

export type SsotInternalEvent = { entity: SsotEntity, eventType: "Created"  | "Updated"  | "Deleted" };
