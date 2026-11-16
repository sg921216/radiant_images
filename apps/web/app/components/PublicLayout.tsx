import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { Header } from './Header';
import { Banner } from './Banner';
import { usePublicContent } from '../lib/publicContent';
export function PublicLayout({ children }: { children: ReactNode }) {
  const { data } = usePublicContent();
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    main.current?.focus({ preventScroll: true });
  }, [pathname]);
  return (
    <>
      <a className="skip-link" href="#main" tabIndex={0}>
        Skip to content
      </a>
      <Header />
      <Banner banner={data?.banner ?? null} />
      <main ref={main} id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <Link to="/">Radiant Images</Link>
        <p>Maternity · Newborn · Family</p>
        <Link to="/contact">Let’s plan your session</Link>
      </footer>
    </>
  );
}
