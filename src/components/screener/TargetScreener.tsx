import React, { useState } from 'react';
import { useDealflow } from '../../context/DealflowContext';
import { FilterPanel } from './FilterPanel';
import { TargetCard } from './TargetCard';
import { TargetCompany } from '../../types/mna';
import { Sparkles, Plus, Globe, Cpu, Shield, CreditCard, Building2, ArrowUpRight, LayoutGrid, Rows3, SearchX, RotateCcw, Wand2, SlidersHorizontal } from 'lucide-react';
import { PageContainer, PageHeader, Segmented, EmptyState } from '../ui/primitives';
import { readinessBadge, fitTone } from './TargetCard';
import { formatCurrency, formatMultiple } from '../../utils/financialFormulas';
import { generateCompanyWithAi, generateBatchFromPrompt, generateGlobalMegaUniverse } from '../../utils/aiCompanyGenerator';
import confetti from 'canvas-confetti';

type SortOption = 'fitScore' | 'arr' | 'growth' | 'ev' | 'multiple' | 'synergy';

export const TargetScreener: React.FC = () => {
  const { targets, filterState, setFilterState, setIsAddTargetOpen, resetTargets, addTarget, importTargets, showToast } = useDealflow();
  const [sortBy, setSortBy] = useState<SortOption>('fitScore');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { setSelectedTarget } = useDealflow();
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isPromptBatchLoading, setIsPromptBatchLoading] = useState(false);

  // Filter logic
  const filteredTargets = targets.filter((target) => {
    // Search query (name, codeName, sector, subSector, techStack)
    if (filterState.searchQuery.trim()) {
      const q = filterState.searchQuery.toLowerCase();
      const matchName = target.name.toLowerCase().includes(q);
      const matchCode = target.codeName.toLowerCase().includes(q);
      const matchSector = target.sector.toLowerCase().includes(q);
      const matchSubSector = target.subSector.toLowerCase().includes(q);
      const matchTech = target.techStack.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchCode && !matchSector && !matchSubSector && !matchTech) {
        return false;
      }
    }

    // Sector Filter
    if (filterState.sectors.length > 0 && !filterState.sectors.includes(target.sector)) {
      return false;
    }
    if (filterState.regions.length > 0 && !filterState.regions.includes(target.headquarters.region)) {
      return false;
    }

    // Numerical criteria
    if (target.financials.arr < filterState.minArr) return false;
    if (target.financials.revenueGrowthYoY < filterState.minRevenueGrowth) return false;
    if (target.financials.ruleOf40 < filterState.minRuleOf40) return false;
    if (target.valuation.evArrMultiple > filterState.maxEvArr) return false;
    if (target.strategicFit.overallScore < filterState.minStrategicFit) return false;

    return true;
  });

  // Sort logic
  const sortedTargets = [...filteredTargets].sort((a, b) => {
    switch (sortBy) {
      case 'fitScore':
        return b.strategicFit.overallScore - a.strategicFit.overallScore;
      case 'arr':
        return b.financials.arr - a.financials.arr;
      case 'growth':
        return b.financials.revenueGrowthYoY - a.financials.revenueGrowthYoY;
      case 'ev':
        return b.valuation.targetEnterpriseValue - a.valuation.targetEnterpriseValue;
      case 'multiple':
        return a.valuation.evArrMultiple - b.valuation.evArrMultiple; // lower multiple first
      case 'synergy':
        return b.strategicFit.potentialSynergiesRunRateM - a.strategicFit.potentialSynergiesRunRateM;
      default:
        return 0;
    }
  });

  const handleQuickAiGenerate = (queryName: string) => {
    if (!queryName.trim()) return;
    setIsAiGenerating(true);

    setTimeout(() => {
      const newTarget = generateCompanyWithAi(queryName.trim());
      addTarget(newTarget);
      setIsAiGenerating(false);
      showToast('success', 'Company profiled', `Generated an M&A profile for ${newTarget.name}.`);
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      } catch (e) {
        // ignore
      }
    }, 600);
  };

  const handleGlobalMegaIngest = () => {
    setIsPromptBatchLoading(true);
    setTimeout(() => {
      const megaUniverse = generateGlobalMegaUniverse();
      importTargets(megaUniverse);
      setIsPromptBatchLoading(false);
      showToast('success', 'Benchmark set loaded', `Added ${megaUniverse.length} global companies across all 7 sectors.`);
      try {
        confetti({ particleCount: 140, spread: 100, origin: { y: 0.5 } });
      } catch (e) {
        // ignore
      }
    }, 800);
  };

  const handlePromptBatchIngest = (customPromptText?: string) => {
    const promptToUse = (customPromptText || aiPromptInput).trim();
    if (!promptToUse) {
      showToast('warning', 'Prompt Required', 'Please enter a target query or category prompt.');
      return;
    }

    setIsPromptBatchLoading(true);
    setTimeout(() => {
      const batch = generateBatchFromPrompt(promptToUse);
      importTargets(batch);
      setIsPromptBatchLoading(false);
      setAiPromptInput('');
      showToast('success', 'Sourcing complete', `Profiled ${batch.length} companies matching "${promptToUse}".`);
      try {
        confetti({ particleCount: 110, spread: 90, origin: { y: 0.5 } });
      } catch (e) {
        // ignore
      }
    }, 700);
  };

  const themes: { label: string; prompt: string; icon: React.ReactNode }[] = [
    { label: 'AI & foundation models', prompt: 'AI & Foundation Models', icon: <Cpu size={13} /> },
    { label: 'Cybersecurity', prompt: 'Cybersecurity', icon: <Shield size={13} /> },
    { label: 'FinTech & payments', prompt: 'FinTech & Payments', icon: <CreditCard size={13} /> },
    { label: 'India tech leaders', prompt: 'Indian Tech Leaders', icon: <Building2 size={13} /> },
    { label: 'European champions', prompt: 'European Tech Champions', icon: <Globe size={13} /> },
  ];

  const query = filterState.searchQuery.trim();

  return (
    <PageContainer wide>
      <PageHeader
        eyebrow="Origination"
        title="Target screener"
        description="Filter the target universe on financial and strategic criteria, or source new companies from a prompt."
        actions={
          <>
            <button className="btn btn-secondary" onClick={resetTargets} title="Restore the default target set">
              <RotateCcw size={15} /> Reset universe
            </button>
            <button className="btn btn-primary" onClick={() => setIsAddTargetOpen(true)}>
              <Plus size={15} /> Add company
            </button>
          </>
        }
      />

      <button className="btn btn-secondary filter-toggle" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
        <SlidersHorizontal size={15} /> {filtersOpen ? 'Hide filters' : 'Show filters'}
      </button>

      <div className="screener-layout">
        <div className={`filter-rail-wrap${filtersOpen ? ' is-open' : ''}`}>
          <FilterPanel />
        </div>

        <div style={{ minWidth: 0 }}>
          <section className="ai-bar" data-reveal-item>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="panel__icon"><Sparkles size={16} /></span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>AI sourcing</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>Describe a market and get fully profiled targets in seconds.</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleGlobalMegaIngest} disabled={isPromptBatchLoading} style={{ border: '1px solid var(--border-subtle)' }}>
                <Globe size={14} /> Load global benchmark set
              </button>
            </div>
            <div className="ai-bar__input-row">
              <label className="ai-bar__input">
                <Wand2 size={16} />
                <input
                  type="text"
                  className="input-text"
                  placeholder="e.g. European AI scale-ups with $50M+ ARR"
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePromptBatchIngest();
                  }}
                  id="input-ai-prompt"
                />
              </label>
              <button className="btn btn-primary" style={{ height: 44, padding: '0 18px' }} onClick={() => handlePromptBatchIngest()} disabled={isPromptBatchLoading}>
                {isPromptBatchLoading ? <span className="spinner" /> : <Sparkles size={15} />}
                {isPromptBatchLoading ? 'Sourcing…' : 'Source targets'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginRight: 4 }}>Try</span>
              {themes.map((t) => (
                <button key={t.prompt} className="chip" onClick={() => handlePromptBatchIngest(t.prompt)} disabled={isPromptBatchLoading} style={{ height: 28, fontSize: '0.76rem' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </section>

          <div className="results-toolbar">
            <div className="results-count">
              <strong>{sortedTargets.length}</strong> of {targets.length} companies
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                id="select-sort-screener"
                style={{ width: 'auto', height: 36, padding: '0 34px 0 12px', fontSize: '0.82rem' }}
                aria-label="Sort by"
              >
                <option value="fitScore">Sort: Strategic fit</option>
                <option value="arr">Sort: ARR</option>
                <option value="growth">Sort: Revenue growth</option>
                <option value="ev">Sort: Enterprise value</option>
                <option value="multiple">Sort: Lowest EV / ARR</option>
                <option value="synergy">Sort: Synergies</option>
              </select>
              <Segmented
                value={view}
                onChange={setView}
                layoutId="screener-view"
                size="sm"
                options={[
                  { value: 'grid', label: 'Cards', icon: <LayoutGrid size={14} /> },
                  { value: 'table', label: 'Table', icon: <Rows3 size={14} /> },
                ]}
              />
            </div>
          </div>

          {sortedTargets.length === 0 ? (
            <EmptyState
              icon={<SearchX size={22} />}
              title="No companies match these filters"
              description={query ? `Nothing in the universe matches “${query}”. Generate a profile for it, or loosen the filters.` : 'Try loosening the financial criteria or clearing a sector.'}
              action={
                query ? (
                  <button className="btn btn-primary" onClick={() => handleQuickAiGenerate(query)} disabled={isAiGenerating}>
                    {isAiGenerating ? <span className="spinner" /> : <Sparkles size={15} />}
                    {isAiGenerating ? 'Generating…' : `Generate profile for “${query}”`}
                  </button>
                ) : undefined
              }
            />
          ) : view === 'grid' ? (
            <div className="card-grid">
              {sortedTargets.map((target) => (
                <TargetCard key={target.id} target={target} />
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ overflow: 'auto', padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Sector</th>
                    <th>Readiness</th>
                    <th className="num">ARR</th>
                    <th className="num">Growth</th>
                    <th className="num">Target EV</th>
                    <th className="num">EV / ARR</th>
                    <th className="num">Fit</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sortedTargets.map((t) => (
                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTarget(t)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="tcard__logo" style={{ width: 30, height: 30, borderRadius: 8, fontSize: '0.7rem', background: `linear-gradient(140deg, ${t.logoColor}, ${t.logoAccent ?? t.logoColor} 120%)` }}>
                            {t.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <div style={{ color: '#fff', fontWeight: 550 }}>{t.name}</div>
                            <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{t.codeName}</div>
                          </div>
                        </div>
                      </td>
                      <td>{t.sector}</td>
                      <td><span className={`badge ${readinessBadge(t.dealReadiness)}`}>{t.dealReadiness.replace(/ \(.*\)/, '')}</span></td>
                      <td className="num">{formatCurrency(t.financials.arr)}</td>
                      <td className="num" style={{ color: 'var(--emerald)' }}>+{t.financials.revenueGrowthYoY.toFixed(0)}%</td>
                      <td className="num">{formatCurrency(t.valuation.targetEnterpriseValue)}</td>
                      <td className="num">{formatMultiple(t.valuation.evArrMultiple)}</td>
                      <td className="num"><span className={`score-pill ${fitTone(t.strategicFit.overallScore)}`}>{t.strategicFit.overallScore}</span></td>
                      <td style={{ color: 'var(--text-subtle)' }}><ArrowUpRight size={15} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
