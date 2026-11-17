import { useRef, useState, useSyncExternalStore } from 'react';
import { Link, NavLink } from 'react-router';
import logo from '../../assets/logo-320.webp';
import logoLarge from '../../assets/logo-640.webp';
const links = [
  ['Maternity', '/maternity'],
  ['Newborn', '/newborn'],
  ['Family', '/family'],
  ['About', '/about'],
  ['Contact', '/contact'],
  ['FAQ', '/faq'],
] as const;
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
export function Header() {
  const hydrated = useSyncExternalStore(subscribe, clientReady, serverReady);
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return (
    <header
      className="site-header"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <Link className="brand" to="/">
        <img
          src={logo}
          srcSet={`${logo} 320w, ${logoLarge} 640w`}
          sizes="(max-width: 700px) 160px, 260px"
          width={320}
          height={160}
          alt="Radiant Images Photography by Rebekah Galarza"
        />
      </Link>
      <button
        ref={toggle}
        type="button"
        disabled={!hydrated}
        className="menu-toggle secondary"
        aria-expanded={open}
        aria-controls="main-navigation"
        onClick={() => setOpen(!open)}
      >
        Menu
      </button>
      <nav id="main-navigation" aria-label="Main navigation" className="main-nav" data-open={open}>
        {links.map(([label, path]) => (
          <NavLink key={path} to={path} onClick={() => setOpen(false)}>
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
