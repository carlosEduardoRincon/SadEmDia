import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const links = [
  { href: '#inicio', label: 'Início' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#trajetoria', label: 'Trajetória' },
  { href: '#projetos', label: 'Projetos' },
  { href: '#habilidades', label: 'Skills' },
  { href: '#contato', label: 'Contato' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('#inicio');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const sections = links
        .map((l) => ({ id: l.href.slice(1), el: document.getElementById(l.href.slice(1)) }))
        .filter((s) => s.el);
      const scrollY = window.scrollY + 150;
      for (let i = sections.length - 1; i >= 0; i--) {
        const top = sections[i].el!.offsetTop;
        if (scrollY >= top) {
          setActiveSection(`#${sections[i].id}`);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      className={`nav ${scrolled ? 'nav--scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <nav className="nav__inner">
        <a href="#inicio" className="nav__logo">
          <span className="nav__logo-text">{'<CR />'}</span>
        </a>

        <ul className="nav__links">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`nav__link ${activeSection === link.href ? 'nav__link--active' : ''}`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          className="nav__mobile-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileOpen}
        >
          <span className={`nav__hamburger ${mobileOpen ? 'nav__hamburger--open' : ''}`} />
          <span className={`nav__hamburger ${mobileOpen ? 'nav__hamburger--open' : ''}`} />
          <span className={`nav__hamburger ${mobileOpen ? 'nav__hamburger--open' : ''}`} />
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="nav__mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <ul className="nav__mobile-links">
              {links.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <a
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={activeSection === link.href ? 'nav__link nav__link--active' : 'nav__link'}
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
