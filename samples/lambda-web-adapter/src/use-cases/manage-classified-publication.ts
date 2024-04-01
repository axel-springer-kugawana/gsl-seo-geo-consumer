import { PublicationStatus } from "models/classified";

const managePublication = async (
    classifiedId: string,
    newDesiredPublicationState: PublicationStatus) => {

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