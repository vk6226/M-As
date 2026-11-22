import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Menu, Download, Plus, ChevronRight, Building2 } from 'lucide-react';
import { useDealflow } from '../../context/DealflowContext';
import { NAV_ITEMS } from './navConfig';
import { exportTargetsCsv } from '../../utils/exportUtils';

interface Props {
  onOpenPalette: () => void;
  onOpenMobileNav: () => void;
}

export const Topbar: React.FC<Props> = ({ onOpenPalette, onOpenMobileNav }) => {
  const { currentView, acquirer, targets, showToast, setIsAddTargetOpen } = useDealflow();
  const [scrolled, setScrolled] = useState(false);
  const current = NAV_ITEMS.find((n) => n.id === currentView);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleExport = () => {
    exportTargetsCsv(targets);
    showToast('success', 'CSV export complete', `Exported ${targets.length} targets with full financial metrics.`);
  };

  return (
    <header className={`topbar${scrolled ? ' is-scrolled' : ''}`}>
      <button className="icon-btn mobile-only" onClick={onOpenMobileNav} aria-label="Open navigation">
        <Menu size={17} />
      </button>

      <nav className="breadcrumb desktop-only" aria-label="Breadcrumb">
        <Building2 size={14} />
        <span>{acquirer.shortCode}</span>
        <ChevronRight size={14} />
        <span style={{ position: 'relative', display: 'inline-flex', overflow: 'hidden', height: 20, alignItems: 'center' }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.strong
              key={current?.id}
              initial={{ y: 14, opacity: 0, filter: 'blur(4px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -14, opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {current?.label}
            </motion.strong>
          </AnimatePresence>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 10, paddingLeft: 12, borderLeft: '1px solid var(--border-subtle)' }}>
          <span className="live-dot" />
          <span style={{ color: 'var(--text-muted)' }}>Radar live</span>
        </span>
      </nav>

      <button className="topbar__search" onClick={onOpenPalette} aria-label="Search and commands">
        <Search size={15} />
        <span>Search targets, jump to…</span>
        <span className="kbd">{isMac ? '⌘' : 'Ctrl'}</span>
        <span className="kbd">K</span>
      </button>

      <div className="topbar__actions">
        <button className="icon-btn desktop-only" onClick={handleExport} title="Export targets to CSV" id="btn-export-csv">
          <Download size={16} />
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => setIsAddTargetOpen(true)} id="btn-header-add-target">
          <Plus size={15} strokeWidth={2.4} />
          <span className="desktop-only">Add company</span>
        </button>
      </div>
    </header>
  );
};
