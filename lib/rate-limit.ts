/**
 * Rate limiting utility for API endpoints
 * @param interval - Time window in milliseconds
 * @param uniqueTokenPerInterval - Maximum number of unique tokens per interval
 * @returns Rate limiter instance
 */
export function rateLimit({ 
  interval = 60 * 1000, // Default: 1 minute
  uniqueTokenPerInterval = 500 
}) {
  const tokenCache = new Map();
  let lastInterval = Date.now();

  return {
    /**
     * Check if the request should be rate limited
     * @param request - Incoming request object
     * @throws Error if rate limit is exceeded
     */
    check: (request: Request) => {
      const now = Date.now();
      const intervalStart = now - (now % interval);

      // Reset cache if we're in a new interval
      if (intervalStart !== lastInterval) {
        lastInterval = intervalStart;
        tokenCache.clear();
      }

      // Use IP address as token key
      const ip = request.headers.get('x-forwarded-for') || 'anonymous';
      const tokenCount = (tokenCache.get(ip) || 0) + 1;

      if (tokenCount > uniqueTokenPerInterval) {
        throw new Error('Rate limit exceeded');
      }

      tokenCache.set(ip, tokenCount);
      return Promise.resolve();
    },
  };
}