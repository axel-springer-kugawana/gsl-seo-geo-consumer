import { logger } from "@shared/cross-cutting/logger"
import { ClassifiedCensoredEventDataObject } from "@shared/models/classifieds/1.0.0/models"
import { Unit } from "@shared/models/unit";

export const handleCensoredClassified = async (data: ClassifiedCensoredEventDataObject) : Promise<Unit> => {
    logger.info(`processing censored classified ${data.classifiedId}`);
    return Promise.resolve(Unit);
}