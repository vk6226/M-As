import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, ChevronDown, Menu, X, Plus } from 'lucide-react';
import { useDealflow } from '../../context/DealflowContext';
import { NAV_ITEMS } from './navConfig';

const ease = [0.16, 1, 0.3, 1] as const;

const Mark: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
    {Array.from({ length: 6 }).map((_, i) => (
      <line key={i} x1="12" y1="12" x2={12 + Math.cos((i * Math.PI) / 3) * 10} y2={12 + Math.sin((i * Math.PI) / 3) * 10} stroke="url(#mk)" strokeWidth="2.2" strokeLinecap="round" />
    ))}
    <defs>
      <linearGradient id="mk" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#c9d4ff" />
        <stop offset="1" stopColor="#6f86ff" />
      </linearGradient>
    </defs>
  </svg>
);

export const TopNav: React.FC<{ onOpenPalette: () => void }> = ({ onOpenPalette }) => {
  const { currentView, setCurrentView, setIsAddTargetOpen, pipeline, compareTargets } = useDealflow();
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const isHome = currentView === 'home';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const close = (e: MouseEvent) => !moreRef.current?.contains(e.target as Node) && setMoreOpen(false);
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [moreOpen]);

  const primary = NAV_ITEMS.filter((n) => n.primary);
  const more = NAV_ITEMS.filter((n) => !n.primary);
  const moreActive = more.some((n) => n.id === currentView);
  const badge = (id: string) => (id === 'pipeline' ? pipeline.length : id === 'compare' ? compareTargets.length || undefined : undefined);

  const go = (id: (typeof NAV_ITEMS)[number]['id']) => {
    setCurrentView(id);
    setMoreOpen(false);
    setMobileOpen(false);
  };

  return (
    <>
      <header className={`topnav${scrolled || !isHome ? ' is-solid' : ''}${isHome ? ' is-home' : ''}`}>
        <button className="topnav__brand" onClick={() => go('home')} aria-label="AURA M&A home">
          <motion.span className="topnav__mark" whileHover={{ rotate: 60 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
            <Mark />
          </motion.span>
          <span>AURA</span>
          <span className="topnav__brand-sub">M&amp;A</span>
        </button>

        <nav className="topnav__links" aria-label="Primary">
          {primary.map((n) => (
            <button key={n.id} id={`nav-btn-${n.id}`} className={`topnav__link${currentView === n.id ? ' is-active' : ''}`} onClick={() => go(n.id)} aria-current={currentView === n.id ? 'page' : undefined}>
              {currentView === n.id && <motion.span layoutId="topnav-active" className="topnav__active" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
              <span>{n.short}</span>
              {badge(n.id) !== undefined && <span className="topnav__badge">{badge(n.id)}</span>}
            </button>
          ))}
          <div className="topnav__more" ref={moreRef}>
            <button className={`topnav__link${moreActive ? ' is-active' : ''}`} onClick={() => setMoreOpen((o) => !o)} aria-expanded={moreOpen}>
              {moreActive && <motion.span layoutId="topnav-active" className="topnav__active" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
              <span>{moreActive ? NAV_ITEMS.find((n) => n.id === currentView)?.short : 'More'}</span>
              <ChevronDown size={13} style={{ transition: 'transform .3s', transform: moreOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div className="topnav__menu" initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.22, ease }}>
                  {more.map((n) => (
                    <button key={n.id} id={`nav-btn-${n.id}`} className={`topnav__menu-item${currentView === n.id ? ' is-active' : ''}`} onClick={() => go(n.id)}>
                      <span className="topnav__menu-icon">{n.icon(15)}</span>
                      <span>
                        <span className="topnav__menu-title">{n.label}</span>
                        <span className="topnav__menu-desc">{n.description}</span>
                      </span>
                      {badge(n.id) !== undefined && <span className="topnav__badge" style={{ marginLeft: 'auto' }}>{badge(n.id)}</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <div className="topnav__actions">
          <button className="round-btn" onClick={onOpenPalette} aria-label="Search (Ctrl K)" title="Search · Ctrl K">
            <Search size={15} />
          </button>
          <button className="ghost-pill desktop-only" onClick={() => setIsAddTargetOpen(true)} id="btn-header-add-target">
            <Plus size={14} /> Add company
          </button>
          <button className="round-btn mobile-only" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={16} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="mobile-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <button className="round-btn mobile-menu__close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X size={16} />
            </button>
            <nav>
              {NAV_ITEMS.map((n, i) => (
                <motion.button
                  key={n.id}
                  id={`nav-btn-${n.id}-m`}
                  className={currentView === n.id ? 'is-active' : ''}
                  onClick={() => go(n.id)}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.45, ease }}
                >
                  {n.label}
                </motion.button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
