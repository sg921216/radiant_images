import web from '../../apps/web/worker';
import { gateway, webOrigin } from './gateway';

export default {
  fetch(request, env) {
    return gateway(request, webOrigin, (forwarded) =>
      /^\/(?:admin(?:\/|$)|q\/)/.test(new URL(forwarded.url).pathname)
        ? web.fetch(forwarded, env)
        : env.ASSETS.fetch(forwarded),
    );
  },
} satisfies ExportedHandler<PrivateBrowserWebEnv>;
