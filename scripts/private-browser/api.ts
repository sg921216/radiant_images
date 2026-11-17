import { apiOrigin, gateway } from './gateway';

export default {
  fetch(request, env) {
    return gateway(request, apiOrigin, (forwarded) => env.API.fetch(forwarded));
  },
} satisfies ExportedHandler<PrivateBrowserApiEnv>;
