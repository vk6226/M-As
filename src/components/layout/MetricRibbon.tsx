import React, { useMemo } from 'react';
import { useDealflow } from '../../context/DealflowContext';
import { Target, TrendingUp, Sparkles, ShieldCheck, DollarSign, Activity } from 'lucide-react';
import { AnimatedNumber } from '../ui/AnimatedNumber';

const fmtM = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(2)}B` : `$${n.toFixed(1)}M`);

/** Deterministic pseudo-sparkline so each tile has a stable, unique shape. */
const spark = (seed: number, n = 14) => {
  const out: number[] = [];
  let v = 0.45;
  for (let i = 0; i < n; i++) {
    const r = Math.sin(seed * 9.13 + i * 1.71) * 0.5 + 0.5;
    v = Math.min(1, Math.max(0.15, v + (r - 0.42) * 0.28));
    out.push(v);
  }
  return out;
};

export const MetricRibbon: React.FC = () => {
  const { targets, pipeline, acquirer } = useDealflow();

  const m = useMemo(() => {
    const count = Math.max(targets.length, 1);
    const totalEv = targets.reduce((a, t) => a + t.valuation.targetEnterpriseValue, 0);
    const synergies = targets.reduce((a, t) => a + t.strategicFit.potentialSynergiesRunRateM, 0);
    const pipeEv = pipeline.reduce((a, p) => a + p.expectedValuationM, 0);
    const avgFit = targets.reduce((a, t) => a + t.strategicFit.overallScore, 0) / count;
    const avgMult = targets.reduce((a, t) => a + t.valuation.evArrMultiple, 0) / count;
    const sectors = new Set(targets.map((t) => t.sector)).size;
    const powder = acquirer.cashAndEquivalentsM + acquirer.creditFacilityAvailableM;
    return { totalEv, synergies, pipeEv, avgFit, avgMult, sectors, powder };
  }, [targets, pipeline, acquirer]);

  const tiles = [
    { label: 'Targets monitored', value: targets.length, fmt: (n: number) => Math.round(n).toString(), sub: `Across ${m.sectors} tech sectors`, icon: Target, color: 'var(--accent)', rgb: 'var(--accent-rgb)' },
    { label: 'Dealflow universe', value: m.totalEv, fmt: fmtM, sub: `Avg ${m.avgMult.toFixed(1)}x EV / ARR`, icon: DollarSign, color: 'var(--emerald)', rgb: 'var(--emerald-rgb)' },
    { label: 'Annual synergies', value: m.synergies, fmt: fmtM, sub: 'Pre-tax run-rate EBITDA', icon: Sparkles, color: 'var(--violet)', rgb: 'var(--violet-rgb)' },
    { label: 'Active pipeline', value: pipeline.length, fmt: (n: number) => Math.round(n).toString(), suffix: 'deals', sub: `${fmtM(m.pipeEv)} committed`, icon: Activity, color: 'var(--amber)', rgb: 'var(--amber-rgb)' },
    { label: 'Mean strategic fit', value: m.avgFit, fmt: (n: number) => n.toFixed(1), suffix: '/100', sub: 'Thesis alignment score', icon: ShieldCheck, color: 'var(--accent)', rgb: 'var(--accent-rgb)' },
    { label: 'M&A firepower', value: m.powder, fmt: fmtM, sub: `$${acquirer.cashAndEquivalentsM}M cash + $${acquirer.creditFacilityAvailableM}M credit`, icon: TrendingUp, color: 'var(--emerald)', rgb: 'var(--emerald-rgb)' },
  ];

  return (
    <div style={{ width: '100%' }}>
      <div className="kpi-grid">
        {tiles.map((t, i) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="glass-panel kpi">
              <div className="kpi__head">
                <span className="kpi__label">{t.label}</span>
                <span className="kpi__icon" style={{ color: t.color }}>
                  <Icon size={15} strokeWidth={2} />
                </span>
              </div>
              <div className="kpi__value">
                <AnimatedNumber value={t.value} format={t.fmt} duration={1.6 + i * 0.08} />
                {t.suffix && <small>{t.suffix}</small>}
              </div>
              <div className="kpi__spark" aria-hidden>
                {spark(i + 1).map((h, j, arr) => (
                  <i
                    key={j}
                    style={{
                      height: `${h * 100}%`,
                      background: j === arr.length - 1 ? t.color : `rgba(${t.rgb}, ${0.12 + (j / arr.length) * 0.3})`,
                      animationDelay: `${300 + i * 60 + j * 25}ms`,
                    }}
                  />
                ))}
              </div>
              <div className="kpi__sub">{t.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
