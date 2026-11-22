import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { DealflowProvider, useDealflow, type AppView } from './context/DealflowContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { CommandPalette } from './components/layout/CommandPalette';
import { viewIndex } from './components/layout/navConfig';
import { DealOverviewDashboard } from './components/dashboard/DealOverviewDashboard';
import { TargetScreener } from './components/screener/TargetScreener';
import { DealPipelineKanban } from './components/pipeline/DealPipelineKanban';
import { HeadToHeadCompare } from './components/compare/HeadToHeadCompare';
import { AwsDeploymentGuide } from './components/aws/AwsDeploymentGuide';
import { CompanyResearch } from './components/research/CompanyResearch';
import { MaActivity } from './components/research/MaActivity';
import { DealDocuments } from './components/documents/DealDocuments';
import { TargetDossierModal } from './components/dossier/TargetDossierModal';
import { AddTargetModal } from './components/screener/AddTargetModal';
import { useAutoReveal, useSpotlight } from './hooks/useInteractionFx';

const VIEWS: Record<AppView, React.FC> = {
  dashboard: DealOverviewDashboard,
  screener: TargetScreener,
  pipeline: DealPipelineKanban,
  compare: HeadToHeadCompare,
  research: CompanyResearch,
  activity: MaActivity,
  documents: DealDocuments,
  'aws-guide': AwsDeploymentGuide,
};

const ease = [0.16, 1, 0.3, 1] as const;

const pageVariants = {
  initial: (dir: number) => ({ opacity: 0, x: dir * 36, filter: 'blur(6px)' }),
  animate: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease }, transitionEnd: { filter: 'none' } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24, filter: 'blur(4px)', transition: { duration: 0.22, ease } }),
};

const Ambient: React.FC = () => (
  <div className="ambient" aria-hidden>
    <div className="ambient__blob ambient__blob--a" />
    <div className="ambient__blob ambient__blob--b" />
    <div className="ambient__blob ambient__blob--c" />
    <div className="ambient__grid" />
    <div className="ambient__noise" />
  </div>
);

const Toasts: React.FC = () => {
  const { toasts, dismissToast } = useDealflow();
  return (
    <div className="toast-container" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            className={`toast toast-${toast.type}`}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.1, right: 0.8 }}
            onDragEnd={(_, info) => info.offset.x > 90 && dismissToast(toast.id)}
          >
            <div className="toast__icon">
              {toast.type === 'success' && <CheckCircle2 size={16} color="var(--emerald)" />}
              {toast.type === 'warning' && <AlertTriangle size={16} color="var(--amber)" />}
              {toast.type === 'info' && <Info size={16} color="var(--accent)" />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-strong)' }}>{toast.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.45 }}>{toast.message}</div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="btn-ghost"
              style={{ border: 0, borderRadius: 7, padding: 4, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
            <div className="toast__progress" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const MainAppContent: React.FC = () => {
  const { currentView } = useDealflow();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('aura_sidebar_collapsed') === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  // Direction-aware page transitions
  const prevIdx = useRef(viewIndex(currentView));
  const idx = viewIndex(currentView);
  const direction = idx >= prevIdx.current ? 1 : -1;
  useEffect(() => {
    prevIdx.current = idx;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [idx]);

  useSpotlight();
  useAutoReveal(pageRef, currentView);

  useEffect(() => {
    localStorage.setItem('aura_sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const View = VIEWS[currentView];

  return (
    <MotionConfig reducedMotion="user">
      <Ambient />

      {/* Route progress shimmer */}
      <motion.div
        key={`progress-${currentView}`}
        className="route-progress"
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: [1, 1, 0] }}
        transition={{ duration: 0.7, ease, opacity: { times: [0, 0.7, 1], duration: 0.9 } }}
      />

      <div className={`app-shell${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`}>
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} onNavigate={() => setMobileOpen(false)} />

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="mobile-scrim mobile-only"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
          )}
        </AnimatePresence>

        <div className="main-col">
          <Topbar onOpenPalette={() => setPaletteOpen(true)} onOpenMobileNav={() => setMobileOpen(true)} />

          <main className="page" ref={pageRef}>
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={currentView}
                custom={direction}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <View />
              </motion.div>
            </AnimatePresence>
          </main>

          <footer className="app-footer">
            <div className="app-footer__inner">
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>AURA M&amp;A</span>
                <span> — Target discovery, underwriting &amp; valuation orchestration</span>
              </div>
              <div className="app-footer__chips">
                <span>AWS ready</span>
                <span>SOC 2 Type II architecture</span>
                <span>Confidential</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <TargetDossierModal />
      <AddTargetModal />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Toasts />
    </MotionConfig>
  );
};

export default function App() {
  return (
    <DealflowProvider>
      <MainAppContent />
    </DealflowProvider>
  );
}
