/**
 * Cache Utility
 * 
 * PURPOSE: Provides a simple caching interface that works in development
 * (in-memory) and can be swapped to Redis in production.
 * 
 * BENEFITS:
 * - Reduces database load by caching frequently-accessed data
 * - Improves response times from ~50ms to ~5ms for cached data
 * - Automatic TTL expiration
 * 
 * USAGE:
 *   const cache = require('./utils/cache');
 *   
 *   // Get cached or fetch fresh
 *   const data = cache.get('key') || await fetchFromDB();
 *   cache.set('key', data, 300); // Cache for 5 minutes
 *   
 *   // Invalidate on data change
 *   cache.del('key');
 */

// In-memory cache store
const cacheStore = new Map();

/**
 * Get a cached value
 * @param {string} key - Cache key
 * @returns {any} Cached value or undefined
 */
const get = (key) => {
    const cached = cacheStore.get(key);

    if (!cached) return undefined;

    // Check if expired
    if (cached.expiresAt && Date.now() > cached.expiresAt) {
        cacheStore.delete(key);
        return undefined;
    }

    return cached.value;
};

/**
 * Set a cached value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds (default: 5 minutes)
 */
const set = (key, value, ttlSeconds = 300) => {
    cacheStore.set(key, {
        value,
        expiresAt: Date.now() + (ttlSeconds * 1000),
        createdAt: Date.now()
    });
};

/**
 * Delete a cached value
 * @param {string} key - Cache key
 */
const del = (key) => {
    cacheStore.delete(key);
};

/**
 * Delete all cache entries matching a pattern
 * @param {string} pattern - Pattern to match (supports * wildcard)
 */
const delPattern = (pattern) => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');

    for (const key of cacheStore.keys()) {
        if (regex.test(key)) {
            cacheStore.delete(key);
        }
    }
};

/**
 * Clear all cache
 */
const clear = () => {
    cacheStore.clear();
};

/**
 * Get cache statistics
 */
const stats = () => {
    let validCount = 0;
    let expiredCount = 0;
    const now = Date.now();

    for (const [key, cached] of cacheStore.entries()) {
        if (cached.expiresAt && now > cached.expiresAt) {
            expiredCount++;
        } else {
            validCount++;
        }
    }

    return {
        total: cacheStore.size,
        valid: validCount,
        expired: expiredCount
    };
};

/**
 * Cleanup expired entries (runs automatically)
 */
const cleanup = () => {
    const now = Date.now();
    for (const [key, cached] of cacheStore.entries()) {
        if (cached.expiresAt && now > cached.expiresAt) {
            cacheStore.delete(key);
        }
    }
};

// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

/**
 * Cache wrapper for async functions
 * @param {string} key - Cache key
 * @param {function} fetchFn - Async function to fetch data if not cached
 * @param {number} ttlSeconds - TTL in seconds
 */
const wrap = async (key, fetchFn, ttlSeconds = 300) => {
    const cached = get(key);
    if (cached !== undefined) {
        return cached;
    }

    const data = await fetchFn();
    set(key, data, ttlSeconds);
    return data;
};

module.exports = {
    get,
    set,
    del,
    delPattern,
    clear,
    stats,
    wrap
};
