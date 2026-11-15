import type { Config } from '@react-router/dev/config';
export default {
  ssr: false,
  basename: '/',
  prerender: ['/', '/maternity', '/newborn', '/family', '/about', '/faq', '/contact'],
} satisfies Config;
