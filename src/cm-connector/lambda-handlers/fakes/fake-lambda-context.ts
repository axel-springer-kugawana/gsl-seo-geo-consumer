
export const createFakeLambdaContext = (remainingTimeInMillis?: number) => {
    return {
        getRemainingTimeInMillis(): number {
            return  remainingTimeInMillis ?? 999;
        },
        done(error?: Error, result?: any): void {
            return;
        },
        fail(error: Error | string): void {
            return;
        },
        succeed(messageOrObject: any): void {
            return;
        },
        "callbackWaitsForEmptyEventLoop": false,
        "functionName": "mocked",
        "functionVersion": "mocked",
        "invokedFunctionArn": "mocked",
        "memoryLimitInMB": "mocked",
        "awsRequestId": "mocked",
        "logGroupName": "mocked",
        "logStreamName": "mocked"
    }
}

