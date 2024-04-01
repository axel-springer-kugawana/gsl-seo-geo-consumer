import { IHeaders } from "routes/headers";

const getUserContext = (headers: IHeaders): { principalId: string } | undefined => {

    try {

        const requestContext = headers["x-amzn-request-context"];

        if (requestContext) {
            const context = JSON.parse(requestContext) as { authorizer: { principalId: string } };

            const principalId = context?.authorizer?.principalId;

            if (principalId) {
                return { principalId }
            }
        }

    } catch (error) {
        return undefined;
    }

}

export { getUserContext }