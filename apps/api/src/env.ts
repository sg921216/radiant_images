export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  RECOVERY: R2Bucket;
  WEB_ORIGIN: string;
  API_ORIGIN: string;
  OWNER_ALLOWLIST: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GMAIL_REFRESH_TOKEN: string;
  TURNSTILE_SECRET: string;
  RATE_LIMIT_KEY: string;
  AUTH_KEY: string;
}
export interface Variables {
  requestId: string;
  owner: { id: string; email: string; expiresAt: string };
}
export type AppEnv = { Bindings: Env; Variables: Variables };
