export const createLambdaContextObjectFromContextPayload = (context) => {

    return {
        ...context,
        getRemainingTimeInMillis(): number {
            return 999;
        },
        done(error?: Error, result?: any): void {
            return;
        },
        fail(error: Error | string): void {
            return;
        },
        succeed(messageOrObject: any): void {
            return;
        }
    }

}