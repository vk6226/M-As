import React from 'react';
import { motion } from 'motion/react';
import { Search, RotateCcw, Check } from 'lucide-react';
import { useDealflow } from '../../context/DealflowContext';
import type { Sector, ScreenerFilterState } from '../../types/mna';

export const ALL_SECTORS: Sector[] = [
  'Enterprise AI',
  'Cybersecurity',
  'FinTech & Payments',
  'HealthTech & Bio',
  'Supply Chain & Logistics',
  'CleanTech & Energy',
  'DevOps & Cloud Infra',
];

const REGIONS = ['North America', 'EMEA', 'APAC', 'LATAM'] as const;
type Region = (typeof REGIONS)[number];

type NumericKey = 'minArr' | 'minRevenueGrowth' | 'minRuleOf40' | 'maxEvArr' | 'minStrategicFit';

const RANGES: { key: NumericKey; label: string; min: number; max: number; step: number; fmt: (v: number) => string }[] = [
  { key: 'minArr', label: 'Minimum ARR', min: 0, max: 60, step: 5, fmt: (v) => `$${v}M+` },
  { key: 'minRevenueGrowth', label: 'Minimum YoY growth', min: 0, max: 80, step: 5, fmt: (v) => `${v}%+` },
  { key: 'minRuleOf40', label: 'Minimum Rule of 40', min: 0, max: 80, step: 5, fmt: (v) => `${v}+` },
  { key: 'maxEvArr', label: 'Maximum EV / ARR', min: 5, max: 20, step: 0.5, fmt: (v) => `${v}x` },
  { key: 'minStrategicFit', label: 'Minimum strategic fit', min: 0, max: 95, step: 5, fmt: (v) => `${v}` },
];

const DEFAULTS: Partial<ScreenerFilterState> = { minArr: 0, minRevenueGrowth: 0, minRuleOf40: 0, maxEvArr: 20, minStrategicFit: 0 };

export const FilterPanel: React.FC = () => {
  const { filterState, setFilterState, resetFilters, targets } = useDealflow();

  const toggleSector = (sector: Sector) =>
    setFilterState((prev) => ({
      ...prev,
      sectors: prev.sectors.includes(sector) ? prev.sectors.filter((s) => s !== sector) : [...prev.sectors, sector],
    }));

  const toggleRegion = (region: Region) =>
    setFilterState((prev) => ({
      ...prev,
      regions: prev.regions.includes(region) ? prev.regions.filter((r) => r !== region) : [...prev.regions, region],
    }));

  const activeCount =
    filterState.sectors.length +
    filterState.regions.length +
    (filterState.searchQuery.trim() ? 1 : 0) +
    RANGES.filter((r) => filterState[r.key] !== DEFAULTS[r.key]).length;

  return (
    <aside className="glass-panel filter-rail" style={{ padding: 18 }} aria-label="Filters" data-no-reveal>
      <div className="filter-rail__section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Filters</h3>
            {activeCount > 0 && (
              <motion.span
                key={activeCount}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                className="badge badge-cyan"
                style={{ height: 20, padding: '0 7px' }}
              >
                {activeCount}
              </motion.span>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={resetFilters} disabled={activeCount === 0} style={{ height: 28 }}>
            <RotateCcw size={13} /> Reset
          </button>
        </div>
        <label className="search-field" style={{ display: 'block' }}>
          <Search size={15} />
          <input
            type="text"
            className="input-text"
            placeholder="Name, project, tech stack…"
            value={filterState.searchQuery}
            onChange={(e) => setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }))}
            id="input-screener-search"
          />
        </label>
      </div>

      <div className="filter-rail__section">
        <div className="filter-rail__label">Sector</div>
        {ALL_SECTORS.map((sector) => {
          const checked = filterState.sectors.includes(sector);
          const count = targets.filter((t) => t.sector === sector).length;
          return (
            <button key={sector} className={`check-row${checked ? ' is-checked' : ''}`} onClick={() => toggleSector(sector)} aria-pressed={checked}>
              <span className="check-box">{checked && <Check size={11} strokeWidth={3.2} color="#fff" />}</span>
              <span>{sector}</span>
              <span className="check-row__count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="filter-rail__section">
        <div className="filter-rail__label">Region</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {REGIONS.map((r) => (
            <button key={r} className={`chip${filterState.regions.includes(r) ? ' is-active' : ''}`} onClick={() => toggleRegion(r)} style={{ height: 28, fontSize: '0.76rem' }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-rail__section" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="filter-rail__label" style={{ marginBottom: -6 }}>Financial criteria</div>
        {RANGES.map((r) => {
          const v = filterState[r.key] as number;
          const fill = ((v - r.min) / (r.max - r.min)) * 100;
          return (
            <div key={r.key} className="range-field">
              <div className="range-field__head">
                <span>{r.label}</span>
                <span className="range-field__value">{r.fmt(v)}</span>
              </div>
              <input
                type="range"
                className="range-slider is-filled"
                min={r.min}
                max={r.max}
                step={r.step}
                value={v}
                style={{ ['--fill' as string]: `${fill}%` }}
                onChange={(e) => setFilterState((prev) => ({ ...prev, [r.key]: Number(e.target.value) }))}
                aria-label={r.label}
              />
            </div>
          );
        })}
      </div>
    </aside>
  );
};
