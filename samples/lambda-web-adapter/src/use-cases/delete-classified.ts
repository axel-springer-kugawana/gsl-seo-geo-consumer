import { deleteClassified } from "adapters/classifieds-repository";
import { Result } from "models/operation-result";

const deleteClassifiedById = async (
    classifiedId: string): Promise<Result<{}, { error: Error, message: string }>> => {
    try {
        const classified = await deleteClassified(classifiedId);
        if (classified == null) {
            return None();
        }
        return OK(classified);
    } catch (error) {
        return Err({ error, message: `Cannot find classified for ${classifiedId}` })
    }
}