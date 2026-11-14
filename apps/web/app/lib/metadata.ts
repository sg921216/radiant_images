export const publicPaths = [
  '/',
  '/maternity',
  '/newborn',
  '/family',
  '/about',
  '/contact',
  '/faq',
] as const;
const titles: Record<string, string> = {
  '/': 'Radiant Images | Photography by Rebekah',
  '/maternity': 'Maternity Photography | Radiant Images',
  '/newborn': 'Newborn Photography | Radiant Images',
  '/family': 'Family Photography | Radiant Images',
  '/about': 'About Rebekah | Radiant Images',
  '/contact': 'Plan Your Session | Radiant Images',
  '/faq': 'Frequently Asked Questions | Radiant Images',
};
export function routeMetadata(path: string): {
  title: string;
  canonical: string | null;
  robots: string;
} {
  path = path.replace(/\/+$/, '') || '/';
  const title = titles[path];
  if (!title)
    return {
      title: 'Radiant Images | Private workspace',
      canonical: null,
      robots: 'noindex, nofollow',
    };
  return {
    title,
    canonical: new URL(path, import.meta.env.VITE_WEB_ORIGIN || 'http://127.0.0.1:5173').href,
    robots: 'index, follow',
  };
}
