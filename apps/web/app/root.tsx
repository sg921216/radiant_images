import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation } from 'react-router';
import { routeMetadata } from './lib/metadata';
import { PublicContentProvider } from './lib/publicContent';
import { PublicLayout } from './components/PublicLayout';
import { API_ORIGIN } from './lib/api';
import { publicBootstrapScript } from './lib/bootstrapScript';
import './styles/theme.css';
export default function Root() {
  const location = useLocation();
  const metadata = routeMetadata(location.pathname);
  const isPublic = metadata.canonical !== null;
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{metadata.title}</title>
        <meta name="robots" content={metadata.robots} />
        <meta name="referrer" content="no-referrer" />
        <meta
          name="description"
          content="Maternity, newborn, and family photography by Rebekah. Explore sessions and get in touch to plan yours."
        />
        {metadata.canonical && <link rel="canonical" href={metadata.canonical} />}
        {isPublic && (
          <script
            dangerouslySetInnerHTML={{
              __html: publicBootstrapScript(API_ORIGIN, location.pathname),
            }}
          />
        )}
        <Meta />
        <Links />
      </head>
      <body>
        {isPublic ? (
          <PublicContentProvider>
            <PublicLayout>
              <Outlet />
            </PublicLayout>
          </PublicContentProvider>
        ) : (
          <Outlet />
        )}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
