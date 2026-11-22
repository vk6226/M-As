import React from 'react';
import { motion } from 'motion/react';
import { Radar, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useDealflow } from '../../context/DealflowContext';
import { NAV_ITEMS } from './navConfig';
import { AnimatedNumber } from '../ui/AnimatedNumber';

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<Props> = ({ collapsed, onToggleCollapse, onNavigate }) => {
  const { currentView, setCurrentView, targets, pipeline, compareTargets, acquirer } = useDealflow();

  const badges: Record<string, number | undefined> = {
    screener: targets.length,
    pipeline: pipeline.length,
    compare: compareTargets.length || undefined,
  };

  const cash = acquirer.cashAndEquivalentsM;
  const facility = acquirer.creditFacilityAvailableM;
  const committed = pipeline.reduce((a, p) => a + p.expectedValuationM, 0);
  const total = cash + facility;

  const sections = ['Workspace', 'Live data', 'Infrastructure'] as const;

  return (
    <aside className="sidebar" aria-label="Primary">
      <div
        className="sidebar__brand"
        onClick={() => {
          setCurrentView('dashboard');
          onNavigate?.();
        }}
      >
        <motion.div
          className="brand-mark"
          whileHover={{ rotate: 8, scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <Radar size={18} color="#c7ccff" strokeWidth={2} />
        </motion.div>
        <div className="sidebar__brand-text">
          <div className="sidebar__brand-name">
            AURA <span className="text-gradient">M&amp;A</span>
          </div>
          <div className="sidebar__brand-sub">Deal intelligence · v4</div>
        </div>
      </div>

      {sections.map((section) => (
        <React.Fragment key={section}>
          <div className="sidebar__section">{section}</div>
          {NAV_ITEMS.filter((n) => n.section === section).map((item) => {
            const active = currentView === item.id;
            const badge = badges[item.id];
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                className={`nav-item${active ? ' is-active' : ''}`}
                onClick={() => {
                  setCurrentView(item.id);
                  onNavigate?.();
                }}
                title={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="nav-item__indicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="nav-item__icon">{item.icon()}</span>
                <span className="nav-item__label">{item.label}</span>
                {badge !== undefined && (
                  <motion.span
                    key={badge}
                    className="nav-item__badge"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    {badge}
                  </motion.span>
                )}
              </button>
            );
          })}
        </React.Fragment>
      ))}

      <div className="sidebar__footer">
        <div className="firepower-card">
          <div className="firepower-card__label">Available firepower</div>
          <div className="firepower-card__value">
            <AnimatedNumber value={total} format={(n) => `$${(n / 1000).toFixed(2)}B`} />
          </div>
          <div className="firepower-card__meter" aria-hidden>
            <motion.span
              style={{ background: 'var(--emerald)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(cash / total) * 100}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            />
            <motion.span
              style={{ background: 'var(--accent)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(facility / total) * 100}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
            <span>
              <i style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 2, background: 'var(--emerald)', marginRight: 5 }} />
              Cash ${cash}M
            </span>
            <span>
              <i style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 2, background: 'var(--accent)', marginRight: 5 }} />
              Credit ${facility}M
            </span>
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>In pipeline</span>
            <span className="font-mono" style={{ color: 'var(--text-main)' }}>${(committed / 1000).toFixed(2)}B</span>
          </div>
        </div>

        <button className="collapse-btn desktop-only" onClick={onToggleCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          <span>Collapse</span>
        </button>
      </div>
    </aside>
  );
};
