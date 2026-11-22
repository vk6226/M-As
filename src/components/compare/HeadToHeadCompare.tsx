import React from 'react';
import { motion } from 'motion/react';
import { Scale, X, Plus, Check, ArrowUpRight, Trophy } from 'lucide-react';
import { useDealflow } from '../../context/DealflowContext';
import type { TargetCompany } from '../../types/mna';
import { formatCurrency, formatMultiple } from '../../utils/financialFormulas';
import { PageContainer, PageHeader, EmptyState } from '../ui/primitives';
import { fitTone, readinessBadge } from '../screener/TargetCard';

type Better = 'high' | 'low' | null;

interface Row {
  group: string;
  label: string;
  value?: (t: TargetCompany) => number;
  better?: Better;
  render: (t: TargetCompany) => React.ReactNode;
}

const pct = (n: number) => `${n.toFixed(1)}%`;

const ROWS: Row[] = [
  { group: 'Profile', label: 'Sector', render: (t) => <><div>{t.sector}</div><div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>{t.subSector}</div></> },
  { group: 'Profile', label: 'Headquarters', render: (t) => `${t.headquarters.city}, ${t.headquarters.country}` },
  { group: 'Profile', label: 'Ownership', render: (t) => t.ownership },
  { group: 'Profile', label: 'Deal readiness', render: (t) => <span className={`badge ${readinessBadge(t.dealReadiness)}`}>{t.dealReadiness.replace(/ \(.*\)/, '')}</span> },

  { group: 'Growth & efficiency', label: 'ARR', value: (t) => t.financials.arr, better: 'high', render: (t) => formatCurrency(t.financials.arr) },
  { group: 'Growth & efficiency', label: 'Revenue growth (YoY)', value: (t) => t.financials.revenueGrowthYoY, better: 'high', render: (t) => pct(t.financials.revenueGrowthYoY) },
  { group: 'Growth & efficiency', label: 'Gross margin', value: (t) => t.financials.grossMargin, better: 'high', render: (t) => pct(t.financials.grossMargin) },
  { group: 'Growth & efficiency', label: 'EBITDA margin', value: (t) => t.financials.ebitdaMargin, better: 'high', render: (t) => pct(t.financials.ebitdaMargin) },
  { group: 'Growth & efficiency', label: 'Rule of 40', value: (t) => t.financials.ruleOf40, better: 'high', render: (t) => t.financials.ruleOf40.toFixed(0) },
  { group: 'Growth & efficiency', label: 'Net dollar retention', value: (t) => t.financials.netDollarRetention, better: 'high', render: (t) => `${t.financials.netDollarRetention}%` },
  { group: 'Growth & efficiency', label: 'LTV / CAC', value: (t) => t.financials.ltvCac, better: 'high', render: (t) => `${t.financials.ltvCac}x` },

  { group: 'Valuation', label: 'Target enterprise value', value: (t) => t.valuation.targetEnterpriseValue, better: null, render: (t) => formatCurrency(t.valuation.targetEnterpriseValue) },
  { group: 'Valuation', label: 'EV / ARR', value: (t) => t.valuation.evArrMultiple, better: 'low', render: (t) => formatMultiple(t.valuation.evArrMultiple) },
  { group: 'Valuation', label: 'Precedent multiple', value: (t) => t.valuation.precedentTransactionMultiple, better: null, render: (t) => formatMultiple(t.valuation.precedentTransactionMultiple) },
  { group: 'Valuation', label: 'DCF implied EV', value: (t) => t.valuation.dcfImpliedEv, better: null, render: (t) => formatCurrency(t.valuation.dcfImpliedEv) },

  { group: 'Strategic fit', label: 'Overall fit', value: (t) => t.strategicFit.overallScore, better: 'high', render: (t) => t.strategicFit.overallScore },
  { group: 'Strategic fit', label: 'Run-rate synergies', value: (t) => t.strategicFit.potentialSynergiesRunRateM, better: 'high', render: (t) => `+${formatCurrency(t.strategicFit.potentialSynergiesRunRateM)}/yr` },
  { group: 'Strategic fit', label: 'Key customers', render: (t) => <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.keyCustomers.join(', ')}</span> },
];

const FIT_DIMENSIONS: { key: keyof TargetCompany['strategicFit']; label: string }[] = [
  { key: 'techStackSynergy', label: 'Technology' },
  { key: 'marketExpansion', label: 'Market expansion' },
  { key: 'culturalCompatibility', label: 'Culture' },
  { key: 'talentIPRetention', label: 'Talent & IP' },
];

export const HeadToHeadCompare: React.FC = () => {
  const { compareTargets, removeFromCompare, clearCompare, setCurrentView, setSelectedTarget, addToPipeline, pipeline } = useDealflow();

  if (compareTargets.length === 0) {
    return (
      <PageContainer>
        <PageHeader eyebrow="Analysis" title="Compare targets" description="Evaluate up to three companies side by side on growth, efficiency, valuation and fit." />
        <EmptyState
          icon={<Scale size={22} />}
          title="No companies selected"
          description="Choose Compare on any company in the screener to add it here."
          action={
            <button onClick={() => setCurrentView('screener')} className="btn btn-primary" id="btn-go-screener-from-compare">
              Open screener <ArrowUpRight size={15} />
            </button>
          }
        />
      </PageContainer>
    );
  }

  const cols = compareTargets.length;
  const winners = new Map<string, Set<string>>();
  ROWS.forEach((r) => {
    if (!r.value || !r.better || cols < 2) return;
    const vals = compareTargets.map((t) => r.value!(t));
    const best = r.better === 'high' ? Math.max(...vals) : Math.min(...vals);
    winners.set(r.label, new Set(compareTargets.filter((t) => r.value!(t) === best).map((t) => t.id)));
  });
  const wins = (id: string) => [...winners.values()].filter((s) => s.has(id)).length;
  const leader = cols > 1 ? [...compareTargets].sort((a, b) => wins(b.id) - wins(a.id))[0] : null;

  let lastGroup = '';

  return (
    <PageContainer wide>
      <PageHeader
        eyebrow="Analysis"
        title="Compare targets"
        description="The strongest value in each row is highlighted. Lower EV/ARR counts as better."
        actions={
          <>
            <button onClick={clearCompare} className="btn btn-secondary">
              Clear all
            </button>
            {cols < 3 && (
              <button onClick={() => setCurrentView('screener')} className="btn btn-primary">
                <Plus size={15} /> Add company
              </button>
            )}
          </>
        }
      />

      {/* Company headers */}
      <div className="compare-heads" style={{ gridTemplateColumns: `220px repeat(${cols}, minmax(220px, 1fr))` }}>
        <div className="compare-heads__label desktop-only">
          {leader && (
            <div className="glass-panel" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--amber)', fontSize: '0.74rem', fontWeight: 600 }}>
                <Trophy size={14} /> Leads on most metrics
              </div>
              <div style={{ color: '#fff', fontWeight: 600, marginTop: 6 }}>{leader.name}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                Best in {wins(leader.id)} of {winners.size} metrics
              </div>
            </div>
          )}
        </div>
        {compareTargets.map((t, i) => {
          const inPipe = pipeline.some((p) => p.targetId === t.id);
          return (
            <motion.div
              key={t.id}
              className="glass-panel compare-head"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              data-no-reveal
            >
              <button className="compare-head__remove" onClick={() => removeFromCompare(t.id)} aria-label={`Remove ${t.name}`}>
                <X size={14} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="tcard__logo" style={{ background: `linear-gradient(140deg, ${t.logoColor}, ${t.logoAccent ?? t.logoColor} 120%)` }}>
                  {t.name.slice(0, 2).toUpperCase()}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="tcard__name">{t.name}</div>
                  <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{t.codeName}</div>
                </div>
                <div className={`score-ring ${fitTone(t.strategicFit.overallScore)}`} style={{ ['--val' as string]: t.strategicFit.overallScore }}>
                  <span>{t.strategicFit.overallScore}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                {FIT_DIMENSIONS.map((d) => (
                  <div key={d.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span>{d.label}</span>
                      <span className="font-mono" style={{ color: '#fff' }}>{t.strategicFit[d.key]}</span>
                    </div>
                    <div className="tcard__bar" style={{ marginTop: 4 }}>
                      <i style={{ width: `${t.strategicFit[d.key]}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
                <button
                  onClick={() => !inPipe && addToPipeline(t.id)}
                  disabled={inPipe}
                  className="btn btn-secondary btn-sm"
                  style={inPipe ? { color: 'var(--emerald)', opacity: 1 } : undefined}
                >
                  {inPipe ? <Check size={14} /> : <Plus size={14} />} {inPipe ? 'In pipeline' : 'Pipeline'}
                </button>
                <button onClick={() => setSelectedTarget(t)} className="btn btn-primary btn-sm">
                  Dossier <ArrowUpRight size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Metrics table */}
      <div className="glass-panel" style={{ padding: 0, overflowX: 'auto', marginTop: 16 }} data-no-reveal>
        <table className="data-table compare-table" style={{ tableLayout: 'fixed', minWidth: 220 + cols * 220 }}>
          <colgroup>
            <col style={{ width: 220 }} />
            {compareTargets.map((t) => (
              <col key={t.id} />
            ))}
          </colgroup>
          <tbody>
            {ROWS.map((r) => {
              const header = r.group !== lastGroup;
              lastGroup = r.group;
              const best = winners.get(r.label);
              return (
                <React.Fragment key={r.label}>
                  {header && (
                    <tr className="group-row">
                      <td colSpan={cols + 1}>{r.group}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>{r.label}</td>
                    {compareTargets.map((t) => {
                      const isBest = best?.has(t.id);
                      return (
                        <td key={t.id} className={r.value ? 'font-mono' : ''} style={{ color: isBest ? 'var(--emerald)' : r.value ? '#fff' : undefined, fontWeight: isBest ? 600 : undefined }}>
                          {r.value ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {r.render(t)}
                              {isBest && <span className="best-tag">Best</span>}
                            </span>
                          ) : (
                            r.render(t)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
};
