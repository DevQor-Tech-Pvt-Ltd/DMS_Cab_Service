const cache = new Map();

/**
 * Get cached value for a key
 * @param {string} key 
 * @returns {any|null}
 */
exports.get = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    cache.delete(key);
    return null;
  }
  return cached.value;
};

/**
 * Set a value in the cache with a TTL
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds 
 */
exports.set = (key, value, ttlSeconds) => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + (ttlSeconds * 1000)
  });
};

/**
 * Delete a specific key from the cache
 * @param {string} key 
 */
exports.delete = (key) => {
  cache.delete(key);
};

/**
 * Clear the entire cache
 */
exports.clear = () => {
  cache.clear();
};

/**
 * Helper to delete the admin dashboard stats key
 */
exports.clearDashboardCache = () => {
  cache.delete('admin_dashboard_stats');
};
