export const createLambdaContextObjectFromContextPayload = (
  context: Record<string, unknown>
) => {
  return {
    ...context,
    getRemainingTimeInMillis(): number {
      return 999;
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    done(_?: Error, result?: unknown): void {
      return;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fail(error: Error | string): void {
      return;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    succeed(messageOrObject: unknown): void {
      return;
    }
  };
};
