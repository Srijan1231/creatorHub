type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

class Cache {
  private store: Map<string, CacheEntry<any>>;
  private readonly defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // 5 minutes default TTL
    this.store = new Map();
    this.defaultTTL = defaultTTL;
  }

  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    Array.from(this.store.keys()).forEach((key) => {
      const entry = this.store.get(key);
      if (entry && now > entry.expiresAt) {
        this.store.delete(key);
      }
    });
  }
}

// Create cache instances with different TTLs for different use cases
export const shortTermCache = new Cache(60 * 1000); // 1 minute
export const mediumTermCache = new Cache(5 * 60 * 1000); // 5 minutes
export const longTermCache = new Cache(30 * 60 * 1000); // 30 minutes

// Utility function to generate cache keys
export function generateCacheKey(
  prefix: string,
  params: Record<string, any>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join("|");
  return `${prefix}:${sortedParams}`;
}

// Higher-order function for caching API responses
export function withCache<T>(
  fn: (...args: any[]) => Promise<T>,
  options: {
    prefix: string;
    ttl?: number;
    cache?: Cache;
  }
): (...args: any[]) => Promise<T> {
  const cache = options.cache || mediumTermCache;

  return async (...args: any[]): Promise<T> => {
    const cacheKey = generateCacheKey(options.prefix, {
      args: JSON.stringify(args),
    });

    const cachedValue = cache.get<T>(cacheKey);
    if (cachedValue !== null) {
      return cachedValue;
    }

    const result = await fn(...args);
    cache.set(cacheKey, result, options.ttl);
    return result;
  };
}

// Schedule cache cleanup every minute
if (typeof window === "undefined") {
  // Only run on server
  setInterval(() => {
    shortTermCache.cleanup();
    mediumTermCache.cleanup();
    longTermCache.cleanup();
  }, 60 * 1000);
}

// Example usage:
// const cachedFetch = withCache(fetch, { prefix: "api-call" });
// const result = await cachedFetch("https://api.example.com/data");
