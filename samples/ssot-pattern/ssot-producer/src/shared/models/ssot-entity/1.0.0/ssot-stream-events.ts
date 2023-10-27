import { SSoTModel } from "./ssot-model";

export type SSoTStream =  SSoTModel & {
    type: "Created" | "Deleted" | "Updated",
}



