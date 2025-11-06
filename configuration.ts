export default () => ({
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secretKey: process.env.JWT_SECRET_KEY,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  app: {
    url: process.env.APP_URL,
    name: process.env.APP_NAME,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  ttlockCloud: {
    baseUrl: process.env.TTLOCK_BASE_URL,
    historyUnlock: process.env.TTLOCK_PREFIX_HISTORY_UNLOCK,
    clientId: process.env.CLOUD_CLIENT_ID,
    accessToken: process.env.CLOUD_ACCESS_TOKEN,
    lockId: process.env.CLOUD_LOCK_ID,
  },
  notification: {
    config: {
      belowMinOccupancy: process.env.BELOW_MIN_OCCUPANCY,
      aboveMaxOccupancy: process.env.ABOVE_MAX_OCCUPANCY,
    },
  },
  cookie: {
    accessTokenTTL: process.env.COOKIE_ACCESSTOKEN_TTL,
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) || [],
  },
  vapidKey: {
    public: process.env.VAPID_PUBLIC_KEY,
    private: process.env.VAPID_PRIVATE_KEY,
  },
  ttl: {
    unconfirmed: process.env.UNCONFIRMED_UNLOCK_EVENT_TTL,
    pending: process.env.PENDING_UNLOCK_EVENT_TTL,
    pendingSensorEntry: process.env.PENDING_SENSOR_ENTRY_TTL,
    checkLockBeforeEntrySensor: process.env.CHECK_BEFORE_LOCK_SENSOR_ENTRY_TTL,
    checkLockAfterEntrySensor: process.env.CHECK_AFTER_LOCK_SENSOR_ENTRY_TTL,
    ttlAI: process.env.TTL_AI,
    checkEventLockVehicleEntry: process.env.CHECK_EVENTLOCK_VEHICLE_ENTRY_TTL,
  },
});
