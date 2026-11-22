import React from 'react';
import { Scale, Plus, Check, ArrowUpRight, MapPin } from 'lucide-react';
import type { TargetCompany } from '../../types/mna';
import { useDealflow } from '../../context/DealflowContext';
import { formatCurrency, formatMultiple } from '../../utils/financialFormulas';

interface TargetCardProps {
  target: TargetCompany;
}

export const readinessBadge = (readiness: string) => {
  if (readiness.includes('Immediate')) return 'badge-rose';
  if (readiness.includes('Approachable')) return 'badge-emerald';
  if (readiness.includes('Pre-Auction')) return 'badge-amber';
  return 'badge-purple';
};

export const fitTone = (score: number) => (score >= 90 ? 'score-high' : score >= 80 ? 'score-medium' : 'score-low');

const shortCountry = (c: string) => c.replace('United States', 'US').replace('United Kingdom', 'UK');

export const TargetCard: React.FC<TargetCardProps> = ({ target }) => {
  const { setSelectedTarget, addToPipeline, pipeline, addToCompare, compareTargets } = useDealflow();

  const inPipeline = pipeline.some((p) => p.targetId === target.id);
  const comparing = compareTargets.some((t) => t.id === target.id);
  const f = target.financials;
  const synergyPct = Math.min(100, (target.strategicFit.potentialSynergiesRunRateM / Math.max(target.valuation.targetEnterpriseValue, 1)) * 100 * 8);

  return (
    <article className="glass-panel glass-panel-interactive tcard" onClick={() => setSelectedTarget(target)}>
      <div className="tcard__head">
        <div className="tcard__logo" style={{ background: `linear-gradient(140deg, ${target.logoColor}, ${target.logoAccent ?? target.logoColor} 120%)` }}>
          {target.name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="tcard__name">{target.name}</div>
          <div className="tcard__meta">
            <span className="font-mono" style={{ color: '#aab1ff', flexShrink: 0 }}>{target.codeName}</span>
            <span style={{ flexShrink: 0 }}>·</span>
            <MapPin size={11} style={{ flexShrink: 0 }} />
            <span>
              {target.headquarters.city}, {shortCountry(target.headquarters.country)}
            </span>
          </div>
        </div>
        <div className="tooltip-box" onClick={(e) => e.stopPropagation()}>
          <div className={`score-ring ${fitTone(target.strategicFit.overallScore)}`} style={{ ['--val' as string]: target.strategicFit.overallScore }}>
            <span>{target.strategicFit.overallScore}</span>
          </div>
          <span className="tooltip-text">Strategic fit score</span>
        </div>
      </div>

      <p className="tcard__tagline">{target.tagline}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span className="badge badge-gray">{target.sector}</span>
        <span className={`badge ${readinessBadge(target.dealReadiness)}`}>{target.dealReadiness.replace(/ \(.*\)/, '')}</span>
        <span className="badge badge-gray">{target.ownership}</span>
      </div>

      <div className="tcard__metrics">
        <div>
          <div className="stat__label">ARR</div>
          <div className="stat__value">{formatCurrency(f.arr)}</div>
          <div className="stat__hint" style={{ color: f.revenueGrowthYoY >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
            {f.revenueGrowthYoY >= 0 ? '+' : ''}
            {f.revenueGrowthYoY.toFixed(0)}% YoY
          </div>
        </div>
        <div>
          <div className="stat__label">Target EV</div>
          <div className="stat__value">{formatCurrency(target.valuation.targetEnterpriseValue)}</div>
          <div className="stat__hint">{formatMultiple(target.valuation.evArrMultiple)} ARR</div>
        </div>
        <div>
          <div className="stat__label">Rule of 40</div>
          <div className={`stat__value ${f.ruleOf40 >= 40 ? 'stat__value--positive' : ''}`}>{f.ruleOf40.toFixed(0)}</div>
          <div className="stat__hint">NDR {f.netDollarRetention}%</div>
        </div>
      </div>

      <div>
        <div className="tcard__synergy">
          <span>Run-rate synergies</span>
          <span className="font-mono" style={{ color: 'var(--violet)', fontWeight: 600 }}>
            +{formatCurrency(target.strategicFit.potentialSynergiesRunRateM)}/yr
          </span>
        </div>
        <div className="tcard__bar">
          <i style={{ width: `${Math.max(12, synergyPct)}%` }} />
        </div>
      </div>

      <div className="tcard__actions" onClick={(e) => e.stopPropagation()}>
        <button
          className={`btn btn-sm ${comparing ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => !comparing && addToCompare(target)}
          disabled={comparing}
          title={comparing ? 'In comparison' : 'Add to comparison'}
          style={comparing ? { color: '#aab1ff', opacity: 1 } : { border: '1px solid var(--border-subtle)' }}
        >
          {comparing ? <Check size={14} /> : <Scale size={14} />}
          {comparing ? 'Comparing' : 'Compare'}
        </button>
        <button
          className={`btn btn-sm ${inPipeline ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => !inPipeline && addToPipeline(target.id)}
          disabled={inPipeline}
          style={inPipeline ? { color: 'var(--emerald)', opacity: 1 } : { border: '1px solid var(--border-subtle)' }}
        >
          {inPipeline ? <Check size={14} /> : <Plus size={14} />}
          {inPipeline ? 'In pipeline' : 'Pipeline'}
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => setSelectedTarget(target)} id={`btn-dossier-${target.id}`}>
          Open dossier <ArrowUpRight size={14} />
        </button>
      </div>
    </article>
  );
};
