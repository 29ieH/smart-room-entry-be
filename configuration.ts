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
});
