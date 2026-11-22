import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Radar,
  Activity,
  PieChart,
  KanbanSquare,
  CalendarClock,
  Newspaper,
  Target as TargetIcon,
  Scale,
} from 'lucide-react';
import { useDealflow } from '../../context/DealflowContext';
import type { DealStage } from '../../types/mna';
import { TargetCard } from '../screener/TargetCard';
import { MetricRibbon } from '../layout/MetricRibbon';
import { LegalDocumentationSection } from './LegalDocumentationSection';
import { formatCurrency } from '../../utils/financialFormulas';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { PageContainer, Panel, Dot } from '../ui/primitives';

const STAGES: { stage: DealStage; label: string; color: string }[] = [
  { stage: 'Longlist', label: 'Longlist', color: '#8d93a5' },
  { stage: 'Screening', label: 'Screening', color: '#7c87ff' },
  { stage: 'Initial DD & Valuation', label: 'Initial DD', color: '#9b8cff' },
  { stage: 'IOI Submitted', label: 'IOI submitted', color: '#b48cff' },
  { stage: 'Confirmatory DD', label: 'Confirmatory DD', color: '#fbbf24' },
  { stage: 'Closing & SPA', label: 'Closing & SPA', color: '#34d399' },
];

const SIGNALS = [
  { tone: 'var(--emerald)', tag: 'Ownership', title: 'Aegis Sentinel lead investor exploring liquidity', body: 'Window for a negotiated bilateral deal before a broad auction.', time: '2h ago' },
  { tone: 'var(--accent)', tag: 'Regulatory', title: 'HSR 2026 filing thresholds published', body: 'Transactions below $126.9M qualify for expedited clearance.', time: 'Yesterday' },
  { tone: 'var(--violet)', tag: 'Valuation', title: 'Public cyber infrastructure multiples at 9.8x EV/ARR', body: 'Supports current entry valuations for Project Vulcan and Bastion.', time: '2d ago' },
  { tone: 'var(--amber)', tag: 'IP', title: 'QuantumKey granted a core PQC lattice patent', body: 'Strengthens the IP moat ahead of the 2030 crypto-agility mandate.', time: '3d ago' },
];

const SECTOR_COLORS = ['#7c87ff', '#b48cff', '#5eead4', '#60a5fa', '#fbbf24', '#34d399', '#8d93a5', '#f472b6'];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export const DealOverviewDashboard: React.FC = () => {
  const { targets, pipeline, acquirer, setCurrentView, setSelectedTarget } = useDealflow();

  const topFit = useMemo(() => [...targets].sort((a, b) => b.strategicFit.overallScore - a.strategicFit.overallScore).slice(0, 3), [targets]);

  const sectors = useMemo(() => {
    const map = new Map<string, { count: number; ev: number }>();
    targets.forEach((t) => {
      const cur = map.get(t.sector) ?? { count: 0, ev: 0 };
      map.set(t.sector, { count: cur.count + 1, ev: cur.ev + t.valuation.targetEnterpriseValue });
    });
    const total = [...map.values()].reduce((a, b) => a + b.ev, 0) || 1;
    return [...map.entries()].map(([name, v]) => ({ name, ...v, pct: (v.ev / total) * 100 })).sort((a, b) => b.ev - a.ev);
  }, [targets]);

  const funnel = useMemo(() => {
    const maxEv = Math.max(1, ...STAGES.map((s) => pipeline.filter((d) => d.stage === s.stage).reduce((a, d) => a + d.expectedValuationM, 0)));
    return STAGES.map((s) => {
      const deals = pipeline.filter((d) => d.stage === s.stage);
      const ev = deals.reduce((a, d) => a + d.expectedValuationM, 0);
      return { ...s, count: deals.length, ev, pct: (ev / maxEv) * 100 };
    });
  }, [pipeline]);

  const milestones = useMemo(
    () =>
      [...pipeline]
        .sort((a, b) => a.targetClosingDate.localeCompare(b.targetClosingDate))
        .slice(0, 4)
        .map((d) => ({ deal: d, target: targets.find((t) => t.id === d.targetId) })),
    [pipeline, targets]
  );

  const powder = acquirer.cashAndEquivalentsM + acquirer.creditFacilityAvailableM;
  const pipelineEv = pipeline.reduce((a, d) => a + d.expectedValuationM, 0);
  const utilisationRaw = (pipelineEv / powder) * 100;
  const utilisation = Math.min(100, utilisationRaw);

  const criteria = ['ARR $25M–$70M', 'Net retention > 115%', 'Rule of 40 > 50%', 'Differentiated IP'];

  return (
    <PageContainer wide>
      {/* Hero */}
      <section className="page-hero" style={{ marginTop: 8, marginBottom: 20 }}>
        <div className="page-hero__orb" />
        <div className="page-hero__rings desktop-only" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 32, alignItems: 'end' }} className="hero-grid">
          <div style={{ maxWidth: 820 }}>
            <div className="eyebrow">
              {greeting()} · {acquirer.name}
            </div>
            <h1 style={{ fontSize: 'clamp(1.9rem, 3.2vw, 2.75rem)', fontWeight: 650, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              Your acquisition mandate, <span className="serif-accent text-gradient" style={{ fontSize: '1.08em' }}>at a glance</span>
            </h1>
            <p style={{ fontSize: '0.98rem', color: 'var(--text-soft)', lineHeight: 1.65, marginTop: 14, maxWidth: 700 }}>
              Expand the platform inorganically across mission-critical cybersecurity, agentic AI workflows and cross-border payments.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              {criteria.map((c, i) => (
                <motion.span
                  key={c}
                  className="chip"
                  style={{ cursor: 'default', height: 28, fontSize: '0.78rem' }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Dot color="var(--accent)" /> {c}
                </motion.span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => setCurrentView('screener')}>
                <Radar size={15} /> Screen targets <ArrowRight size={15} />
              </button>
              <button className="btn btn-secondary" onClick={() => setCurrentView('pipeline')}>
                <Activity size={15} /> Review pipeline
              </button>
              <a href="#legal-documentation-section" className="btn btn-ghost" id="link-jump-legal-vault">
                <Scale size={15} /> Legal vault
              </a>
            </div>
          </div>

          <div className="surface-inset hero-powder" style={{ padding: '20px 22px', minWidth: 290, background: 'rgba(var(--base-rgb), 0.55)', backdropFilter: 'blur(12px)' }}>
            <div className="stat__label" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Deployable capital</div>
            <div className="font-mono" style={{ fontSize: '2.1rem', fontWeight: 600, color: '#fff', letterSpacing: '-0.05em', margin: '4px 0 14px' }}>
              <AnimatedNumber value={powder} format={(n) => `$${Math.round(n).toLocaleString()}M`} />
            </div>
            <div style={{ display: 'flex', height: 6, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
              <div className="bar-grow" style={{ flex: acquirer.cashAndEquivalentsM, background: 'var(--emerald)', borderRadius: 6 }} />
              <div className="bar-grow" style={{ flex: acquirer.creditFacilityAvailableM, background: 'var(--accent)', borderRadius: 6, animationDelay: '0.15s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 10, gap: 16 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Dot color="var(--emerald)" /> Cash ${acquirer.cashAndEquivalentsM}M</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Dot color="var(--accent)" /> Credit ${acquirer.creditFacilityAvailableM}M</span>
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <span>Pipeline vs. capacity</span>
                <span className="font-mono" style={{ color: '#fff' }}>{utilisationRaw.toFixed(0)}%</span>
              </div>
              <div className="tcard__bar" style={{ marginTop: 8 }}>
                <i style={{ width: `${utilisation}%`, background: utilisationRaw > 100 ? 'linear-gradient(90deg, var(--amber), var(--rose))' : 'linear-gradient(90deg, var(--accent), var(--emerald))' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <MetricRibbon />

      {/* Funnel + sectors */}
      <div className="dash-grid" style={{ marginTop: 20 }}>
        <Panel
          title="Pipeline by stage"
          subtitle={`${pipeline.length} active deals · ${formatCurrency(pipelineEv)} expected value`}
          icon={<KanbanSquare size={16} />}
          actions={
            <button className="btn btn-ghost btn-sm" onClick={() => setCurrentView('pipeline')}>
              Open board <ArrowRight size={14} />
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {funnel.map((s, i) => (
              <div key={s.stage} className="funnel-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <Dot color={s.color} />
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-soft)', whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
                <div className="funnel-row__track">
                  <motion.div
                    className="funnel-row__fill"
                    style={{ background: `linear-gradient(90deg, ${s.color}55, ${s.color})` }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.max(s.count ? 6 : 0, s.pct)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right' }}>{s.count}</span>
                <span className="font-mono" style={{ fontSize: '0.8rem', color: '#fff', textAlign: 'right' }}>{s.ev ? formatCurrency(s.ev) : '—'}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Universe by sector" subtitle={`${targets.length} companies · share of total EV`} icon={<PieChart size={16} />}>
          <div className="alloc-bar">
            {sectors.map((s, i) => (
              <motion.span
                key={s.name}
                title={`${s.name} · ${s.pct.toFixed(0)}%`}
                style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                initial={{ flexGrow: 0 }}
                whileInView={{ flexGrow: s.pct }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
            {sectors.map((s, i) => (
              <div key={s.name} className="alloc-row">
                <Dot color={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                <span className="font-mono" style={{ color: 'var(--text-subtle)', width: 28, textAlign: 'right' }}>{s.count}</span>
                <span className="font-mono" style={{ color: 'var(--text-muted)', width: 64, textAlign: 'right' }}>{formatCurrency(s.ev)}</span>
                <span className="font-mono" style={{ color: '#fff', width: 40, textAlign: 'right' }}>{s.pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Signals + milestones */}
      <div className="dash-grid" style={{ marginTop: 20 }}>
        <Panel
          title="Market signals"
          subtitle="Events relevant to your target universe"
          icon={<Newspaper size={16} />}
          actions={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              <span className="live-dot" /> Live
            </span>
          }
        >
          <div className="timeline">
            {SIGNALS.map((s) => (
              <div key={s.title} className="timeline__item lift-row" data-reveal-item>
                <span className="timeline__dot" style={{ background: s.tone, boxShadow: `0 0 0 4px color-mix(in srgb, ${s.tone} 18%, transparent)` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: s.tone, fontWeight: 600 }}>{s.tag}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{s.time}</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 550, color: '#fff', marginTop: 3 }}>{s.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Upcoming closings" subtitle="Target signing dates across the pipeline" icon={<CalendarClock size={16} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {milestones.map(({ deal, target }) => {
              const d = new Date(deal.targetClosingDate);
              const stage = STAGES.find((s) => s.stage === deal.stage);
              return (
                <button
                  key={deal.id}
                  className="milestone lift-row"
                  data-reveal-item
                  onClick={() => target && setSelectedTarget(target)}
                >
                  <div className="milestone__date">
                    <span>{d.toLocaleString('en', { month: 'short' })}</span>
                    <strong>{d.getDate()}</strong>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 550, color: '#fff' }}>{target?.name ?? 'Unknown target'}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deal.nextMilestone}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="font-mono" style={{ fontSize: '0.82rem', color: '#fff' }}>{formatCurrency(deal.expectedValuationM)}</div>
                    <div style={{ fontSize: '0.7rem', color: stage?.color }}>{stage?.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Top fit targets */}
      <div style={{ marginTop: 36 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="eyebrow">Recommended</div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 650 }}>Highest strategic fit</h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: 4 }}>Ranked by thesis fit, technology alignment and synergy potential.</p>
          </div>
          <button onClick={() => setCurrentView('screener')} className="btn btn-secondary btn-sm" id="btn-view-all-screener">
            <TargetIcon size={14} /> View all {targets.length} <ArrowRight size={14} />
          </button>
        </div>
        <div className="card-grid">
          {topFit.map((t) => (
            <TargetCard key={t.id} target={t} />
          ))}
        </div>
      </div>

      <LegalDocumentationSection />
    </PageContainer>
  );
};
