import { getClassified } from "adapters/classifieds-repository"
import { Classified } from "models/classified"
import { Err, None, OK, Result } from "models/operation-result";

const getClassifiedById = async (
    classifiedId: string): Promise<Result<Classified, { error: Error, message: string }>> => {
    try {
        const classified = await getClassified(classifiedId);
        if (classified == null) {
            return None();
        }
        return OK(classified);
    } catch (error) {
        return Err({ error, message: `Cannot find classified for ${classifiedId}` })
    }
}

export { getClassifiedById }





