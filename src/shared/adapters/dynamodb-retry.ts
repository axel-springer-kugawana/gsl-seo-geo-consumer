// Transient DynamoDB errors (throttling, cold warmup of an on-demand table, request limits)
// for which callers should retry instead of failing the whole operation.
export const RETRYABLE_DYNAMODB_ERROR_NAMES = new Set([
  'ProvisionedThroughputExceededException',
  'ThrottlingException',
  'RequestLimitExceeded',
  'InternalServerError',
  'LimitExceededException',
]);

export function isRetryableDynamoDbError(error: unknown): boolean {
  const errorName = (error as { name?: string })?.name;
  return typeof errorName === 'string' && RETRYABLE_DYNAMODB_ERROR_NAMES.has(errorName);
}

// Retries a DynamoDB call with exponential backoff, but only for transient errors; anything
// else (e.g. ConditionalCheckFailedException) is rethrown immediately on the first attempt.
export async function withDynamoDbRetry<T>(
  operation: () => Promise<T>,
  options?: { maxAttempts?: number; baseDelayMs?: number }
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 5;
  const baseDelayMs = options?.baseDelayMs ?? 200;
  let attempt = 0;

  for (; ;) {
    try {
      return await operation();
    } catch (error) {
      attempt += 1;
      if (!isRetryableDynamoDbError(error) || attempt > maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** attempt));
    }
  }
}
