import { recordError } from "./monitoring";

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableStatusCodes?: number[];
}

const defaultRetryOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

export class PlatformError extends Error {
  constructor(
    public readonly platform: string,
    message: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "PlatformError";
  }
}

function isRetryableError(
  error: unknown,
  options: Required<RetryOptions>
): boolean {
  if (error instanceof PlatformError) {
    return error.retryable;
  }

  if (error instanceof Response) {
    return options.retryableStatusCodes.includes(error.status);
  }

  // For fetch errors (network issues)
  if (error instanceof Error && "type" in error) {
    return (
      (error as any).type === "system" || (error as any).type === "network"
    );
  }

  return false;
}

function calculateDelay(
  attempt: number,
  options: Required<RetryOptions>
): number {
  const delay =
    options.initialDelay * Math.pow(options.backoffFactor, attempt - 1);
  return Math.min(delay, options.maxDelay);
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  platform: string,
  endpoint: string,
  customOptions: RetryOptions = {}
): Promise<T> {
  const options = { ...defaultRetryOptions, ...customOptions };
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (
        !isRetryableError(error, options) ||
        attempt === options.maxAttempts
      ) {
        // Record the error in monitoring
        recordError(
          endpoint,
          "Platform API",
          error instanceof PlatformError ? error.statusCode || 500 : 500,
          error
        );

        throw new PlatformError(
          platform,
          `Operation failed after ${attempt} attempts`,
          error instanceof PlatformError ? error.statusCode : undefined,
          false,
          error
        );
      }

      // Calculate delay for next retry
      const delay = calculateDelay(attempt, options);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never happen due to the throw in the loop
  throw lastError;
}

// Utility function to create platform-specific API calls with retry
export function createPlatformApiCall<T>(
  platform: string,
  endpoint: string,
  operation: () => Promise<T>,
  customOptions?: RetryOptions
): () => Promise<T> {
  return () => withRetry(operation, platform, endpoint, customOptions);
}

// Example usage:
// const fetchSpotifyProfile = createPlatformApiCall(
//   "spotify",
//   "/me",
//   () => spotifyApi.getProfile(),
//   { maxAttempts: 5 }
// );
