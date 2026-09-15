/**
 * App configuration.
 *
 * Every secret comes from the environment. There are NO hardcoded fallbacks, so
 * the repository never carries a working credential. If ADMIN_TOKEN is unset the
 * admin route stays closed rather than falling open to a baked-in default.
 */
export const config = {
  port: Number(process.env.PORT) || 3000,
  env: process.env.NODE_ENV || 'development',
  // No default: unset means the admin route rejects every request.
  adminToken: process.env.ADMIN_TOKEN || null,
  // A single allowed cross-origin, or null for same-origin only. Never '*'.
  corsOrigin: process.env.CORS_ORIGIN || null,
};

export default config;
