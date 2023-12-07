import { config } from "@cm-connector/config/configuration-provider"
import { Classified } from "@shared/models/classified/1.0.0/classified";
import { getClassifiedApiSecret } from "./classified-api-secrets";
import { logger } from "@shared/cross-cutting/logger";

const getClassifiedById = async (link: string): Promise<Classified> => {
    const apiUrl = config.get("cmApiUrl");
    const apisecrets = await getClassifiedApiSecret();

    const headers =  {
        "ClientId": apisecrets.ClientId,
        "Authorization": apisecrets.Authorization
    }

    const res = await fetch(`${apiUrl}${link}`, {
        headers
    });

    const classified = await res.json() as Classified;


    logger.info("Classified", {
        url: `${apiUrl}/${link}`,
        classified
    });

    return classified;

}

export {
    getClassifiedById
}