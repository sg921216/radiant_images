export type Env = ApiBindings;
export interface Variables {
  requestId: string;
  owner: { id: string; email: string; expiresAt: string };
}
export type AppEnv = { Bindings: Env; Variables: Variables };
