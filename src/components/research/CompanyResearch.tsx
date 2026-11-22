import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search,
  Building2,
  ExternalLink,
  Download,
  AlertTriangle,
  Landmark,
  FileText,
  LineChart,
  Calculator,
  FolderOpen,
  Handshake,
  Plus,
  RefreshCw,
  KeyRound,
  Database,
  Sparkles,
  Info,
} from 'lucide-react';
import { useDealflow } from '../../context/DealflowContext';
import { PageContainer, PageHeader, Panel, Segmented, EmptyState } from '../ui/primitives';
import {
  loadDirectory,
  searchDirectory,
  getCompanyProfile,
  getCompanyFacts,
  buildStatements,
  categorizeForm,
  findDealAgreements,
  ITEM_LABELS,
  MA_RELEVANT_ITEMS,
  SecError,
  type CompanyRef,
  type CompanyProfile,
  type FinancialStatements,
  type FilingCategory,
  type FtsHit,
  type Filing,
} from '../../services/sec';
import { getQuote, getMarketKey, setMarketKey, type Quote } from '../../services/marketData';
import { FinancialBars } from './FinancialBars';
import { downloadTextFile } from '../../utils/exportUtils';
import { generateCompanyWithAi } from '../../utils/aiCompanyGenerator';
import { IndiaResearch } from './IndiaResearch';
import { IndiaPrivate } from './IndiaPrivate';
import type { ResearchMarket } from '../../context/DealflowContext';

/* ---------- formatting ---------- */
const SYMBOL: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CNY: '¥', CAD: 'C$', AUD: 'A$', CHF: 'CHF ' };
export const fmtMoney = (n: number | undefined, ccy = 'USD') => {
  if (n === undefined || Number.isNaN(n)) return '—';
  const s = SYMBOL[ccy] ?? `${ccy} `;
  const a = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (a >= 1e12) return `${sign}${s}${(a / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `${sign}${s}${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}${s}${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${sign}${s}${(a / 1e3).toFixed(1)}K`;
  return `${sign}${s}${a.toFixed(2)}`;
};
const fmtPct = (n?: number) => (n === undefined || Number.isNaN(n) ? '—' : `${n >= 0 ? '' : '−'}${Math.abs(n).toFixed(1)}%`);
const fmtX = (n?: number) => (n === undefined || !Number.isFinite(n) ? '—' : `${n.toFixed(1)}x`);
const fmtNum = (n?: number) => (n === undefined ? '—' : n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n.toLocaleString());

type Tab = 'overview' | 'statements' | 'valuation' | 'filings' | 'deals';

export const CompanyResearch: React.FC = () => {
  const { researchCik, openResearch } = useDealflow();
  const [query, setQuery] = useState('');
  const [directory, setDirectory] = useState<CompanyRef[] | null>(null);
  const [dirError, setDirError] = useState('');
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { researchMarket: market } = useDealflow();
  useEffect(() => {
    if (market !== 'us' || directory) return;
    loadDirectory()
      .then(setDirectory)
      .catch((e: Error) => setDirError(e.message));
  }, [market, directory]);

  const suggestions = useMemo(() => (directory ? searchDirectory(directory, query) : []), [directory, query]);
  useEffect(() => setActive(0), [query]);

  const choose = (c: CompanyRef) => {
    setQuery('');
    setFocused(false);
    inputRef.current?.blur();
    openResearch(c.cik);
  };

  const { researchMarket, setResearchMarket } = useDealflow();
  const MARKET_COPY: Record<ResearchMarket, { eyebrow: string; desc: string }> = {
    us: { eyebrow: 'Live data · SEC EDGAR', desc: 'Search any SEC-registered company for live financial statements, M&A metrics, valuation, filings and deal agreements, straight from the regulator.' },
    in: { eyebrow: 'Live data · NSE India', desc: 'Search any NSE-listed company for live price and market cap, quarterly results, shareholding, exchange filings and M&A disclosures.' },
    'in-private': { eyebrow: 'India · unlisted companies', desc: 'Analyse unlisted Indian companies from their MCA (AOC-4) financial statements and track the ROC filings needed for diligence.' },
  };

  return (
    <PageContainer wide>
      <PageHeader eyebrow={MARKET_COPY[researchMarket].eyebrow} title="Company research" description={MARKET_COPY[researchMarket].desc} />

      <div style={{ marginBottom: 18 }}>
        <Segmented
          value={researchMarket}
          onChange={setResearchMarket}
          layoutId="research-market"
          options={[
            { value: 'us', label: 'United States · listed' },
            { value: 'in', label: 'India · listed (NSE)' },
            { value: 'in-private', label: 'India · unlisted (MCA)' },
          ]}
        />
      </div>

      {researchMarket === 'in' && <IndiaResearch />}
      {researchMarket === 'in-private' && <IndiaPrivate />}
      {researchMarket === 'us' && (
      <>
      <div className="research-search">
        <Search size={18} className="research-search__icon" />
        <input
          ref={inputRef}
          className="input-text"
          placeholder={directory ? 'Search by company name, ticker or CIK (e.g. Salesforce, CRWD, 0000320193)' : dirError ? 'Company directory unavailable' : 'Loading company directory…'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter' && suggestions[active]) {
              choose(suggestions[active]);
            }
          }}
          disabled={!directory && !dirError}
          id="input-company-research"
        />
        {!directory && !dirError && <span className="spinner research-search__spin" />}
        <AnimatePresence>
          {focused && suggestions.length > 0 && (
            <motion.div className="research-suggest" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
              {suggestions.map((c, i) => (
                <button key={c.cik} className={`research-suggest__item${i === active ? ' is-active' : ''}`} onMouseDown={() => choose(c)} onMouseEnter={() => setActive(i)}>
                  <span className="research-suggest__ticker">{c.ticker}</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>CIK {c.cik}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {dirError && (
        <div className="inline-error" style={{ marginTop: 10 }}>
          <AlertTriangle size={14} /> {dirError} <ProxyHelp />
        </div>
      )}
      {query.trim().length > 1 && directory && suggestions.length === 0 && <PrivateCompanyNotice name={query.trim()} />}

      {researchCik ? <CompanyWorkspace key={researchCik} cik={researchCik} /> : <ResearchIntro />}
      </>
      )}
    </PageContainer>
  );
};

const ProxyHelp: React.FC = () => (
  <span style={{ color: 'var(--text-muted)' }}>
    The app reaches the SEC through the <code>/api/sec</code> proxy. Run it with <code>npm run dev</code> / <code>npm run preview</code>, Docker, or the Lambda proxy (see README).
  </span>
);

const ResearchIntro: React.FC = () => (
  <div className="research-intro">
    {[
      { icon: <LineChart size={18} />, title: 'Financial statements', body: 'Five years of income statement, balance sheet and cash flow from XBRL filings, with margins, growth, leverage and Rule of 40.' },
      { icon: <Calculator size={18} />, title: 'Valuation & offer maths', body: 'Market cap, enterprise value and trading multiples, plus implied offer price and multiples at any control premium.' },
      { icon: <FolderOpen size={18} />, title: 'Diligence document pack', body: 'Annual and quarterly reports, proxies, material 8-Ks, ownership filings and exhibits, with a one-click download index.' },
      { icon: <Handshake size={18} />, title: 'Deal history', body: 'Merger, stock and asset purchase agreements the company has filed, linked to the original documents.' },
    ].map((f) => (
      <div key={f.title} className="glass-panel" style={{ padding: 20 }}>
        <span className="panel__icon" style={{ marginBottom: 14 }}>{f.icon}</span>
        <div style={{ fontWeight: 600, color: '#fff' }}>{f.title}</div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.55 }}>{f.body}</p>
      </div>
    ))}
  </div>
);

const PrivateCompanyNotice: React.FC<{ name: string }> = ({ name }) => {
  const { addTarget, showToast } = useDealflow();
  return (
    <div className="notice">
      <Info size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ color: '#fff', fontWeight: 550 }}>No SEC filer matches “{name}”</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
          Private companies do not publish financial statements. Verified private-company data needs a licensed provider (e.g. PitchBook, Capital IQ, Crunchbase), or the target's own data room. You can create an estimated profile in the meantime.
        </div>
      </div>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => {
          const t = generateCompanyWithAi(name);
          addTarget({ ...t, tagline: `Estimated profile — not verified. ${t.tagline}` });
          showToast('info', 'Estimated profile added', `${t.name} was added with modelled, unverified figures.`);
        }}
      >
        <Sparkles size={14} /> Create estimated profile
      </button>
    </div>
  );
};

/* ======================================================================== */

const CompanyWorkspace: React.FC<{ cik: string }> = ({ cik }) => {
  const { addTarget, showToast, setCurrentView, targets } = useDealflow();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [fin, setFin] = useState<FinancialStatements | null>(null);
  const [error, setError] = useState('');
  const [finError, setFinError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setProfile(null);
    setFin(null);
    setError('');
    setFinError('');
    getCompanyProfile(cik)
      .then((p) => alive && setProfile(p))
      .catch((e: Error) => alive && setError(e.message));
    getCompanyFacts(cik)
      .then((f) => alive && setFin(buildStatements(f)))
      .catch((e: SecError) => alive && setFinError(e.status === 404 ? 'This company has no structured (XBRL) financial data on EDGAR. Use its filings below.' : e.message));
    return () => {
      alive = false;
    };
  }, [cik, reloadKey]);

  if (error)
    return (
      <div style={{ marginTop: 24 }}>
        <EmptyState
          icon={<AlertTriangle size={22} />}
          title="Could not load this company"
          description={error}
          action={
            <button className="btn btn-secondary" onClick={() => setReloadKey((k) => k + 1)}>
              <RefreshCw size={14} /> Try again
            </button>
          }
        />
      </div>
    );
  if (!profile) return <WorkspaceSkeleton />;

  const ticker = profile.tickers[0] ?? '';
  const latest = fin?.annual[0];
  const alreadyAdded = targets.some((t) => t.name.toLowerCase() === profile.name.toLowerCase());

  const addToUniverse = () => {
    const base = generateCompanyWithAi(profile.name);
    const toM = (n?: number) => (n === undefined ? undefined : n / 1e6);
    const v = latest?.values ?? {};
    const d = latest?.derived ?? {};
    const rev = toM(v.revenue) ?? base.financials.arr;
    const evM = toM((fin?.latestBalance.totalDebt ?? 0) - (fin?.latestBalance.cash ?? 0)) ?? 0;
    addTarget({
      ...base,
      name: profile.name,
      ticker: ticker || undefined,
      tagline: `${profile.sicDescription || 'Public company'} · financials from SEC EDGAR (${latest?.fiscalYear ?? 'latest'})`,
      headquarters: { ...base.headquarters, city: profile.businessAddress.split(',')[1]?.trim() || base.headquarters.city },
      ownership: 'Public (Listed)',
      financials: {
        ...base.financials,
        arr: rev,
        revenueLTM: rev,
        revenueGrowthYoY: d.revenueGrowth ?? base.financials.revenueGrowthYoY,
        grossMargin: d.grossMargin ?? base.financials.grossMargin,
        ebitdaLTM: toM(d.ebitda) ?? base.financials.ebitdaLTM,
        ebitdaMargin: d.ebitdaMargin ?? base.financials.ebitdaMargin,
        fcfLTM: toM(d.fcf) ?? base.financials.fcfLTM,
        ruleOf40: d.ruleOf40 ?? base.financials.ruleOf40,
      },
      valuation: { ...base.valuation, targetEnterpriseValue: Math.max(base.valuation.targetEnterpriseValue, evM) },
      historicalFinancials: (fin?.annual ?? [])
        .slice()
        .reverse()
        .map((p) => ({
          year: p.fiscalYear,
          revenue: toM(p.values.revenue) ?? 0,
          ebitda: toM(p.derived.ebitda) ?? 0,
          grossProfit: toM(p.derived.grossProfit) ?? 0,
          fcf: toM(p.derived.fcf) ?? 0,
        })),
    });
    showToast('success', 'Added to target universe', `${profile.name} added with reported SEC financials. Strategic fit scores are modelled.`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ marginTop: 24 }}>
      {/* Company header */}
      <div className="glass-panel research-head" data-no-reveal>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
          <span className="tcard__logo" style={{ width: 54, height: 54, borderRadius: 14, background: 'linear-gradient(140deg, #6d78f5, #b48cff 130%)' }}>
            {(ticker || profile.name).slice(0, 2).toUpperCase()}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 650 }}>{profile.name}</h2>
              {profile.tickers.map((t, i) => (
                <span key={t} className="badge badge-cyan font-mono">{profile.exchanges[i] ? `${profile.exchanges[i]}: ` : ''}{t}</span>
              ))}
            </div>
            <div className="research-head__meta">
              {profile.sicDescription && <span>{profile.sicDescription}</span>}
              {profile.stateOfIncorporation && <span>Incorporated in {profile.stateOfIncorporation}</span>}
              {profile.fiscalYearEnd && <span>FY ends {profile.fiscalYearEnd.slice(0, 2)}/{profile.fiscalYearEnd.slice(2)}</span>}
              <span className="font-mono">CIK {profile.cik}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border-subtle)' }} href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${profile.cik}`} target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> EDGAR
          </a>
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('documents')}>
            <FileText size={14} /> Deal documents
          </button>
          <button className="btn btn-primary btn-sm" onClick={addToUniverse} disabled={alreadyAdded}>
            <Plus size={14} /> {alreadyAdded ? 'In target universe' : 'Add to targets'}
          </button>
        </div>
      </div>

      <div style={{ margin: '18px 0' }}>
        <Segmented
          value={tab}
          onChange={setTab}
          layoutId="research-tabs"
          options={[
            { value: 'overview', label: 'Overview', icon: <Building2 size={15} /> },
            { value: 'statements', label: 'Financial statements', icon: <LineChart size={15} /> },
            { value: 'valuation', label: 'Valuation', icon: <Calculator size={15} /> },
            { value: 'filings', label: 'Filings & documents', icon: <FolderOpen size={15} />, count: profile.filings.length },
            { value: 'deals', label: 'Deal history', icon: <Handshake size={15} /> },
          ]}
        />
      </div>

      <div key={tab} className="tab-panel">
        {tab === 'overview' && <OverviewTab profile={profile} fin={fin} finError={finError} />}
        {tab === 'statements' && <StatementsTab profile={profile} fin={fin} finError={finError} />}
        {tab === 'valuation' && <ValuationTab ticker={ticker} fin={fin} finError={finError} />}
        {tab === 'filings' && <FilingsTab profile={profile} fin={fin} />}
        {tab === 'deals' && <DealsTab profile={profile} />}
      </div>

      <div className="source-note">
        <Database size={13} /> Source: U.S. SEC EDGAR (submissions and XBRL company facts), retrieved live. Figures are as reported by the company; derived metrics are calculated by AURA.
      </div>
    </motion.div>
  );
};

const WorkspaceSkeleton: React.FC = () => (
  <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div className="skeleton" style={{ height: 96 }} />
    <div className="skeleton" style={{ height: 40, width: 520, maxWidth: '100%' }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 92 }} />
      ))}
    </div>
    <div className="skeleton" style={{ height: 260 }} />
  </div>
);

const FinUnavailable: React.FC<{ msg: string }> = ({ msg }) => (
  <EmptyState icon={<AlertTriangle size={22} />} title="Financial data unavailable" description={msg} />
);

/* ---------- Overview ---------- */
const OverviewTab: React.FC<{ profile: CompanyProfile; fin: FinancialStatements | null; finError: string }> = ({ profile, fin, finError }) => {
  const signals = useMemo(() => maSignals(profile), [profile]);
  if (finError && !fin)
    return (
      <>
        <FinUnavailable msg={finError} />
        <SignalsPanel signals={signals} />
      </>
    );
  if (!fin) return <WorkspaceSkeleton />;
  const p = fin.annual[0];
  const ccy = fin.currency;
  if (!p) return <FinUnavailable msg="No annual financial statements were found in this company's XBRL data." />;
  const years = fin.annual.slice().reverse();

  const tiles = [
    { label: `Revenue · ${p.fiscalYear}`, value: fmtMoney(p.values.revenue, ccy), hint: p.derived.revenueGrowth !== undefined ? `${fmtPct(p.derived.revenueGrowth)} YoY` : undefined, tone: (p.derived.revenueGrowth ?? 0) >= 0 ? 'pos' : 'neg' },
    { label: 'EBITDA', value: fmtMoney(p.derived.ebitda, ccy), hint: p.derived.ebitdaMargin !== undefined ? `${fmtPct(p.derived.ebitdaMargin)} margin` : 'D&A not reported' },
    { label: 'Net income', value: fmtMoney(p.values.netIncome, ccy), hint: p.derived.netMargin !== undefined ? `${fmtPct(p.derived.netMargin)} margin` : undefined },
    { label: 'Free cash flow', value: fmtMoney(p.derived.fcf, ccy), hint: p.derived.fcfMargin !== undefined ? `${fmtPct(p.derived.fcfMargin)} of revenue` : undefined },
    { label: 'Cash & equivalents', value: fmtMoney(fin.latestBalance.cash, ccy), hint: fin.latestBalance.asOf ? `as of ${fin.latestBalance.asOf}` : undefined },
    { label: 'Net debt', value: fmtMoney(p.derived.netDebt, ccy), hint: p.derived.debtToEbitda !== undefined ? `${fmtX(p.derived.debtToEbitda)} EBITDA` : undefined },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="research-tiles">
        {tiles.map((t) => (
          <div key={t.label} className="glass-panel" style={{ padding: 16 }} data-no-reveal>
            <div className="stat__label">{t.label}</div>
            <div className="font-mono" style={{ fontSize: '1.35rem', fontWeight: 600, color: '#fff', letterSpacing: '-0.04em', marginTop: 4 }}>{t.value}</div>
            {t.hint && <div style={{ fontSize: '0.74rem', marginTop: 2, color: t.tone === 'pos' ? 'var(--emerald)' : t.tone === 'neg' ? 'var(--rose)' : 'var(--text-subtle)' }}>{t.hint}</div>}
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <Panel title="Revenue, EBITDA and free cash flow" subtitle={`Annual, ${ccy}`} icon={<LineChart size={16} />}>
          <FinancialBars
            years={years.map((y) => y.fiscalYear)}
            format={(n) => fmtMoney(n, ccy)}
            series={[
              { name: 'Revenue', values: years.map((y) => y.values.revenue) },
              { name: 'EBITDA', values: years.map((y) => y.derived.ebitda) },
              { name: 'Free cash flow', values: years.map((y) => y.derived.fcf) },
            ]}
          />
        </Panel>
        <Panel title="M&A quality checks" subtitle={`Latest fiscal year (${p.fiscalYear})`} icon={<Landmark size={16} />}>
          <div className="check-grid">
            <QualityRow label="Revenue growth" value={fmtPct(p.derived.revenueGrowth)} ok={(p.derived.revenueGrowth ?? -1) > 10} warn={(p.derived.revenueGrowth ?? -1) < 0} />
            <QualityRow label="Gross margin" value={fmtPct(p.derived.grossMargin)} ok={(p.derived.grossMargin ?? 0) > 60} warn={(p.derived.grossMargin ?? 100) < 30} />
            <QualityRow label="Rule of 40 (growth + FCF margin)" value={p.derived.ruleOf40 === undefined ? '—' : p.derived.ruleOf40.toFixed(0)} ok={(p.derived.ruleOf40 ?? 0) >= 40} warn={(p.derived.ruleOf40 ?? 40) < 20} />
            <QualityRow label="Net debt / EBITDA" value={fmtX(p.derived.debtToEbitda)} ok={(p.derived.debtToEbitda ?? 99) < 2} warn={(p.derived.debtToEbitda ?? 0) > 4} />
            <QualityRow label="Interest coverage" value={fmtX(p.derived.interestCoverage)} ok={(p.derived.interestCoverage ?? 0) > 6} warn={p.derived.interestCoverage !== undefined && p.derived.interestCoverage < 2} />
            <QualityRow label="Current ratio" value={fmtX(p.derived.currentRatio)} ok={(p.derived.currentRatio ?? 0) > 1.5} warn={p.derived.currentRatio !== undefined && p.derived.currentRatio < 1} />
            <QualityRow label="Goodwill + intangibles / assets" value={fmtPct((((p.values.goodwill ?? 0) + (p.values.intangibles ?? 0)) / (p.values.totalAssets || NaN)) * 100)} warn={((p.values.goodwill ?? 0) + (p.values.intangibles ?? 0)) / (p.values.totalAssets || Infinity) > 0.5} />
            <QualityRow label="Stock-based comp / revenue" value={fmtPct(((p.values.sbc ?? NaN) / (p.values.revenue ?? NaN)) * 100)} warn={(p.values.sbc ?? 0) / (p.values.revenue || Infinity) > 0.15} />
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: 12 }}>
            Data coverage {Math.round(fin.coverage * 100)}% of core line items. Thresholds are general screening guides, not sector benchmarks.
          </div>
        </Panel>
      </div>

      <SignalsPanel signals={signals} />
    </div>
  );
};

const QualityRow: React.FC<{ label: string; value: string; ok?: boolean; warn?: boolean }> = ({ label, value, ok, warn }) => (
  <div className="check-grid__row">
    <span style={{ color: 'var(--text-soft)' }}>{label}</span>
    <span className="font-mono" style={{ color: value === '—' ? 'var(--text-subtle)' : ok ? 'var(--emerald)' : warn ? 'var(--amber)' : '#fff' }}>{value}</span>
  </div>
);

interface Signal {
  tone: string;
  label: string;
  detail: string;
  date: string;
  url: string;
}

function maSignals(p: CompanyProfile): Signal[] {
  const since = new Date(Date.now() - 2 * 365 * 86_400_000).toISOString().slice(0, 10);
  const out: Signal[] = [];
  for (const f of p.filings) {
    if (f.filed < since) break;
    if (/^(DEFM14A|PREM14A|DEFM14C)/.test(f.form)) out.push({ tone: 'var(--rose)', label: 'Merger vote', detail: `${f.form}: merger proxy filed`, date: f.filed, url: f.url });
    else if (/^(SC TO-T|SC 14D9)/.test(f.form)) out.push({ tone: 'var(--rose)', label: 'Tender offer', detail: `${f.form} filed`, date: f.filed, url: f.url });
    else if (/^(S-4|F-4)/.test(f.form)) out.push({ tone: 'var(--amber)', label: 'Stock deal registration', detail: `${f.form} filed`, date: f.filed, url: f.url });
    else if (/^(SC 13D|SCHEDULE 13D)/.test(f.form)) out.push({ tone: 'var(--violet)', label: 'Activist / control stake', detail: `${f.form}: holder of 5%+ with possible control intent`, date: f.filed, url: f.url });
    else if (f.form.startsWith('8-K')) {
      const rel = f.items.filter((i) => MA_RELEVANT_ITEMS.has(i));
      if (rel.length) out.push({ tone: rel.includes('2.01') || rel.includes('5.01') ? 'var(--rose)' : 'var(--accent)', label: '8-K material event', detail: rel.map((i) => `${i} ${ITEM_LABELS[i]}`).join(' · '), date: f.filed, url: f.url });
    }
  }
  return out.slice(0, 12);
}

const SignalsPanel: React.FC<{ signals: Signal[] }> = ({ signals }) => (
  <Panel title="M&A signals in filings" subtitle="Deal-relevant filings in the last 24 months" icon={<AlertTriangle size={16} />}>
    {signals.length === 0 ? (
      <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>No merger, tender offer, activist or material-agreement filings in the last 24 months.</div>
    ) : (
      <div className="timeline">
        {signals.map((s, i) => (
          <a key={i} href={s.url} target="_blank" rel="noreferrer" className="timeline__item lift-row" style={{ textDecoration: 'none' }}>
            <span className="timeline__dot" style={{ background: s.tone }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: '0.74rem', color: s.tone, fontWeight: 600 }}>{s.label}</span>
                <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{s.date}</span>
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-soft)', marginTop: 2 }}>{s.detail}</div>
            </div>
          </a>
        ))}
      </div>
    )}
  </Panel>
);

/* ---------- Statements ---------- */
type Row = { label: string; get: (p: FinancialStatements['annual'][number]) => number | undefined; kind?: 'money' | 'pct' | 'x' | 'eps'; strong?: boolean };

const STATEMENTS: { title: string; rows: Row[] }[] = [
  {
    title: 'Income statement',
    rows: [
      { label: 'Revenue', get: (p) => p.values.revenue, strong: true },
      { label: 'Cost of revenue', get: (p) => p.values.costOfRevenue },
      { label: 'Gross profit', get: (p) => p.derived.grossProfit, strong: true },
      { label: 'Research & development', get: (p) => p.values.rnd },
      { label: 'Selling, general & admin', get: (p) => p.values.sga },
      { label: 'Operating income', get: (p) => p.values.operatingIncome, strong: true },
      { label: 'Depreciation & amortisation', get: (p) => p.values.da },
      { label: 'EBITDA', get: (p) => p.derived.ebitda, strong: true },
      { label: 'Interest expense', get: (p) => p.values.interestExpense },
      { label: 'Pre-tax income', get: (p) => p.values.pretaxIncome },
      { label: 'Income tax', get: (p) => p.values.incomeTax },
      { label: 'Net income', get: (p) => p.values.netIncome, strong: true },
      { label: 'Diluted EPS', get: (p) => p.values.epsDiluted, kind: 'eps' },
    ],
  },
  {
    title: 'Balance sheet',
    rows: [
      { label: 'Cash & equivalents', get: (p) => p.values.cash },
      { label: 'Short-term investments', get: (p) => p.values.shortTermInvestments },
      { label: 'Receivables', get: (p) => p.values.receivables },
      { label: 'Inventory', get: (p) => p.values.inventory },
      { label: 'Total current assets', get: (p) => p.values.currentAssets },
      { label: 'Property, plant & equipment', get: (p) => p.values.ppe },
      { label: 'Goodwill', get: (p) => p.values.goodwill },
      { label: 'Intangible assets', get: (p) => p.values.intangibles },
      { label: 'Total assets', get: (p) => p.values.totalAssets, strong: true },
      { label: 'Total current liabilities', get: (p) => p.values.currentLiabilities },
      { label: 'Total debt', get: (p) => p.derived.totalDebt },
      { label: 'Operating lease liabilities', get: (p) => p.values.operatingLeaseLiabilities },
      { label: 'Total liabilities', get: (p) => p.values.totalLiabilities, strong: true },
      { label: "Shareholders' equity", get: (p) => p.values.equity, strong: true },
    ],
  },
  {
    title: 'Cash flow',
    rows: [
      { label: 'Operating cash flow', get: (p) => p.values.operatingCashFlow, strong: true },
      { label: 'Capital expenditure', get: (p) => (p.values.capex === undefined ? undefined : -Math.abs(p.values.capex)) },
      { label: 'Free cash flow', get: (p) => p.derived.fcf, strong: true },
      { label: 'Stock-based compensation', get: (p) => p.values.sbc },
      { label: 'Acquisitions (net of cash)', get: (p) => (p.values.acquisitionsPaid === undefined ? undefined : -Math.abs(p.values.acquisitionsPaid)) },
      { label: 'Dividends paid', get: (p) => (p.values.dividendsPaid === undefined ? undefined : -Math.abs(p.values.dividendsPaid)) },
      { label: 'Share repurchases', get: (p) => (p.values.buybacks === undefined ? undefined : -Math.abs(p.values.buybacks)) },
    ],
  },
  {
    title: 'Ratios',
    rows: [
      { label: 'Revenue growth', get: (p) => p.derived.revenueGrowth, kind: 'pct' },
      { label: 'Gross margin', get: (p) => p.derived.grossMargin, kind: 'pct' },
      { label: 'Operating margin', get: (p) => p.derived.operatingMargin, kind: 'pct' },
      { label: 'EBITDA margin', get: (p) => p.derived.ebitdaMargin, kind: 'pct' },
      { label: 'Net margin', get: (p) => p.derived.netMargin, kind: 'pct' },
      { label: 'FCF margin', get: (p) => p.derived.fcfMargin, kind: 'pct' },
      { label: 'Return on equity', get: (p) => p.derived.roe, kind: 'pct' },
      { label: 'Effective tax rate', get: (p) => p.derived.effectiveTaxRate, kind: 'pct' },
      { label: 'Net debt / EBITDA', get: (p) => p.derived.debtToEbitda, kind: 'x' },
      { label: 'Interest coverage', get: (p) => p.derived.interestCoverage, kind: 'x' },
      { label: 'Current ratio', get: (p) => p.derived.currentRatio, kind: 'x' },
    ],
  },
];

function statementsCsv(name: string, fin: FinancialStatements): string {
  const years = fin.annual;
  const lines = [[`${name} (${fin.currency}, as reported; source SEC EDGAR)`], ['Line item', ...years.map((y) => `${y.fiscalYear} (${y.periodEnd})`)]];
  STATEMENTS.forEach((s) => {
    lines.push([s.title]);
    s.rows.forEach((r) => lines.push([r.label, ...years.map((y) => (r.get(y) === undefined ? '' : String(Number(r.get(y)!.toFixed(4)))))]));
  });
  return lines.map((l) => l.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')).join('\n');
}

const StatementsTab: React.FC<{ profile: CompanyProfile; fin: FinancialStatements | null; finError: string }> = ({ profile, fin, finError }) => {
  const { showToast } = useDealflow();
  if (finError && !fin) return <FinUnavailable msg={finError} />;
  if (!fin) return <WorkspaceSkeleton />;
  const years = fin.annual;
  const fmt = (r: Row, v?: number) => (r.kind === 'pct' ? fmtPct(v) : r.kind === 'x' ? fmtX(v) : r.kind === 'eps' ? (v === undefined ? '—' : `${SYMBOL[fin.currency] ?? ''}${v.toFixed(2)}`) : fmtMoney(v, fin.currency));
  return (
    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }} data-no-reveal>
      <div className="legal-toolbar">
        <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Annual figures as reported in 10-K / 20-F filings · {fin.currency}
        </div>
        <button
          className="btn btn-secondary btn-sm"
          style={{ marginLeft: 'auto' }}
          onClick={() => {
            downloadTextFile(statementsCsv(profile.name, fin), `${(profile.tickers[0] || profile.cik)}_financials.csv`, 'text/csv');
            showToast('success', 'Financials exported', 'CSV with all statements and ratios downloaded.');
          }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table fin-table">
          <thead>
            <tr>
              <th>{profile.name}</th>
              {years.map((y) => (
                <th key={y.periodEnd} className="num">
                  {y.fiscalYear}
                  <div style={{ fontWeight: 400, fontSize: '0.66rem' }}>{y.periodEnd}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STATEMENTS.map((s) => (
              <React.Fragment key={s.title}>
                <tr className="group-row">
                  <td colSpan={years.length + 1}>{s.title}</td>
                </tr>
                {s.rows.map((r) => (
                  <tr key={r.label} className={r.strong ? 'is-strong' : ''}>
                    <td>{r.label}</td>
                    {years.map((y) => {
                      const v = r.get(y);
                      return (
                        <td key={y.periodEnd} className="num" style={{ color: v === undefined ? 'var(--text-subtle)' : v < 0 ? 'var(--rose)' : undefined }}>
                          {fmt(r, v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------- Valuation ---------- */
const ValuationTab: React.FC<{ ticker: string; fin: FinancialStatements | null; finError: string }> = ({ ticker, fin, finError }) => {
  const [key, setKey] = useState(getMarketKey());
  const [keyDraft, setKeyDraft] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [qErr, setQErr] = useState('');
  const [manual, setManual] = useState('');
  const [premium, setPremium] = useState(30);

  useEffect(() => {
    if (!key || !ticker) return;
    setQErr('');
    getQuote(ticker)
      .then(setQuote)
      .catch((e: Error) => setQErr(e.message));
  }, [key, ticker]);

  if (finError && !fin) return <FinUnavailable msg={finError} />;
  if (!fin) return <WorkspaceSkeleton />;
  const p = fin.annual[0];
  const ccy = fin.currency;
  const price = quote?.price ?? (manual ? Number(manual) : undefined);
  const shares = fin.latestBalance.sharesOutstanding;
  const debt = fin.latestBalance.totalDebt ?? p?.derived.totalDebt ?? 0;
  const cash = fin.latestBalance.cash ?? p?.values.cash ?? 0;
  const mcap = price && shares ? price * shares : undefined;
  const ev = mcap !== undefined ? mcap + debt - cash : undefined;
  const offerPrice = price ? price * (1 + premium / 100) : undefined;
  const offerEquity = offerPrice && shares ? offerPrice * shares : undefined;
  const offerEv = offerEquity !== undefined ? offerEquity + debt - cash : undefined;
  const div = (a?: number, b?: number) => (a === undefined || !b ? undefined : a / b);

  const multiples = [
    { label: 'EV / Revenue', now: div(ev, p?.values.revenue), offer: div(offerEv, p?.values.revenue) },
    { label: 'EV / EBITDA', now: p?.derived.ebitda && p.derived.ebitda > 0 ? div(ev, p.derived.ebitda) : undefined, offer: p?.derived.ebitda && p.derived.ebitda > 0 ? div(offerEv, p.derived.ebitda) : undefined },
    { label: 'Price / Earnings', now: p?.values.netIncome && p.values.netIncome > 0 ? div(mcap, p.values.netIncome) : undefined, offer: p?.values.netIncome && p.values.netIncome > 0 ? div(offerEquity, p.values.netIncome) : undefined },
    { label: 'EV / Free cash flow', now: p?.derived.fcf && p.derived.fcf > 0 ? div(ev, p.derived.fcf) : undefined, offer: p?.derived.fcf && p.derived.fcf > 0 ? div(offerEv, p.derived.fcf) : undefined },
  ];

  return (
    <div className="dash-grid">
      <Panel title="Market value" subtitle={quote ? `Live quote · ${quote.source} · ${quote.asOf.toLocaleString()}` : 'Enter a share price or connect live market data'} icon={<Calculator size={16} />}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          <div className="surface-inset" style={{ padding: 14 }}>
            <div className="stat__label">Share price {ticker && `(${ticker})`}</div>
            {quote ? (
              <div className="font-mono" style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 600 }}>
                {SYMBOL.USD}{quote.price.toFixed(2)}{' '}
                <span style={{ fontSize: '0.8rem', color: quote.change >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>{quote.changePct >= 0 ? '+' : ''}{quote.changePct.toFixed(2)}%</span>
              </div>
            ) : (
              <input className="input-text font-mono" style={{ marginTop: 6 }} type="number" min="0" step="0.01" placeholder="e.g. 142.50" value={manual} onChange={(e) => setManual(e.target.value)} aria-label="Share price" />
            )}
          </div>
          <div className="surface-inset" style={{ padding: 14 }}>
            <div className="stat__label">Shares outstanding</div>
            <div className="font-mono" style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 600 }}>{fmtNum(shares)}</div>
            <div className="stat__hint">From latest SEC cover page</div>
          </div>
        </div>
        <div className="val-bridge">
          <div><span>Market capitalisation</span><strong>{fmtMoney(mcap, ccy)}</strong></div>
          <div><span>+ Total debt</span><strong>{fmtMoney(debt, ccy)}</strong></div>
          <div><span>− Cash & equivalents</span><strong>{fmtMoney(cash, ccy)}</strong></div>
          <div className="is-total"><span>Enterprise value</span><strong>{fmtMoney(ev, ccy)}</strong></div>
        </div>
        {qErr && <div className="inline-error"><AlertTriangle size={14} /> {qErr}</div>}
        <div className="key-box">
          <KeyRound size={14} color="var(--text-subtle)" />
          {key ? (
            <>
              <span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Live prices on (Finnhub key saved in this browser)</span>
              <button className="btn btn-ghost btn-sm" onClick={() => { setMarketKey(''); setKey(''); setQuote(null); }}>Remove key</button>
            </>
          ) : (
            <>
              <input className="input-text" style={{ height: 32, fontSize: '0.8rem' }} placeholder="Finnhub API key for live prices (free at finnhub.io)" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} />
              <button className="btn btn-secondary btn-sm" onClick={() => { setMarketKey(keyDraft); setKey(keyDraft.trim()); }} disabled={!keyDraft.trim()}>Save</button>
            </>
          )}
        </div>
        {ccy !== 'USD' && <div className="inline-error" style={{ color: 'var(--amber)' }}><Info size={14} /> Financials are reported in {ccy}. Enter the share price in {ccy} for consistent multiples.</div>}
      </Panel>

      <Panel title="Offer analysis" subtitle="Implied price and multiples at a control premium" icon={<Handshake size={16} />}>
        <div className="range-field">
          <div className="range-field__head">
            <span>Control premium</span>
            <span className="range-field__value">{premium}%</span>
          </div>
          <input type="range" className="range-slider is-filled" min={0} max={100} step={5} value={premium} style={{ ['--fill' as string]: `${premium}%` }} onChange={(e) => setPremium(Number(e.target.value))} aria-label="Control premium" />
        </div>
        <div className="val-bridge" style={{ marginTop: 16 }}>
          <div><span>Offer price per share</span><strong>{offerPrice ? `${SYMBOL[ccy] ?? ''}${offerPrice.toFixed(2)}` : '—'}</strong></div>
          <div><span>Equity purchase price</span><strong>{fmtMoney(offerEquity, ccy)}</strong></div>
          <div className="is-total"><span>Implied enterprise value</span><strong>{fmtMoney(offerEv, ccy)}</strong></div>
        </div>
        <table className="data-table" style={{ marginTop: 14 }}>
          <thead>
            <tr>
              <th>Multiple ({p?.fiscalYear})</th>
              <th className="num">Current</th>
              <th className="num">At offer</th>
            </tr>
          </thead>
          <tbody>
            {multiples.map((m) => (
              <tr key={m.label}>
                <td>{m.label}</td>
                <td className="num">{fmtX(m.now)}</td>
                <td className="num" style={{ color: '#fff' }}>{fmtX(m.offer)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!price && <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: 10 }}>Enter a share price to calculate the offer.</div>}
      </Panel>
    </div>
  );
};

/* ---------- Filings ---------- */
const CATEGORIES: (FilingCategory | 'All')[] = ['All', 'Financial reports', 'Deal & merger', 'Material events', 'Ownership & control', 'Governance', 'Capital raising'];

function documentPack(profile: CompanyProfile): { title: string; items: Filing[] }[] {
  const f = profile.filings;
  const since = new Date(Date.now() - 3 * 365 * 86_400_000).toISOString().slice(0, 10);
  return [
    { title: 'Annual reports (last 3)', items: f.filter((x) => /^(10-K|20-F|40-F)$/.test(x.form)).slice(0, 3) },
    { title: 'Quarterly reports (last 4)', items: f.filter((x) => /^(10-Q|6-K)$/.test(x.form)).slice(0, 4) },
    { title: 'Latest proxy statement (governance, executive pay, related parties)', items: f.filter((x) => /^DEF 14A$/.test(x.form)).slice(0, 1) },
    { title: 'Material 8-K events (last 3 years)', items: f.filter((x) => x.form.startsWith('8-K') && x.filed >= since && x.items.some((i) => MA_RELEVANT_ITEMS.has(i))) },
    { title: 'Merger, tender offer and registration filings', items: f.filter((x) => categorizeForm(x.form) === 'Deal & merger').slice(0, 20) },
    { title: 'Beneficial ownership (13D / 13G)', items: f.filter((x) => /13D|13G/.test(x.form)).slice(0, 15) },
    { title: 'Amendments and restatements', items: f.filter((x) => /^(10-K\/A|10-Q\/A|8-K\/A)$/.test(x.form) && x.filed >= since) },
  ];
}

function packMarkdown(profile: CompanyProfile): string {
  const sections = documentPack(profile)
    .map((s) => `## ${s.title}\n\n${s.items.length ? s.items.map((x) => `- **${x.form}** · filed ${x.filed}${x.reportDate ? ` · period ${x.reportDate}` : ''}${x.items.length ? ` · items ${x.items.join(', ')}` : ''}\n  - Document: ${x.url}\n  - Filing index (all exhibits): ${x.indexUrl}`).join('\n') : '_None filed in the period._'}`)
    .join('\n\n');
  return `# Financial diligence document pack: ${profile.name}

CIK ${profile.cik} · ${profile.tickers.join(', ')} · ${profile.sicDescription}
Generated ${new Date().toISOString().slice(0, 10)} from SEC EDGAR.

Structured financial statements (XBRL): https://data.sec.gov/api/xbrl/companyfacts/CIK${profile.cik}.json

${sections}
`;
}

const FilingsTab: React.FC<{ profile: CompanyProfile; fin: FinancialStatements | null }> = ({ profile, fin }) => {
  const { showToast } = useDealflow();
  const [cat, setCat] = useState<FilingCategory | 'All'>('All');
  const [limit, setLimit] = useState(40);
  const list = profile.filings.filter((f) => cat === 'All' || categorizeForm(f.form) === cat);
  const pack = documentPack(profile);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Panel
        title="Diligence document pack"
        subtitle="The core SEC documents a buyer reviews before an offer"
        icon={<FolderOpen size={16} />}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {fin && (
              <button className="btn btn-secondary btn-sm" onClick={() => downloadTextFile(statementsCsv(profile.name, fin), `${profile.tickers[0] || profile.cik}_financials.csv`, 'text/csv')}>
                <Download size={14} /> Financials CSV
              </button>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                downloadTextFile(packMarkdown(profile), `${profile.tickers[0] || profile.cik}_diligence_pack.md`, 'text/markdown');
                showToast('success', 'Document pack downloaded', 'Index with direct links to every document and its exhibits.');
              }}
            >
              <Download size={14} /> Download pack index
            </button>
          </div>
        }
      >
        <div className="pack-grid">
          {pack.map((s) => (
            <div key={s.title} className="pack-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>{s.title}</span>
                <span className={`badge ${s.items.length ? 'badge-emerald' : 'badge-gray'}`}>{s.items.length}</span>
              </div>
              {s.items.slice(0, 3).map((x) => (
                <a key={x.accession} href={x.url} target="_blank" rel="noreferrer" className="pack-link">
                  <FileText size={12} /> {x.form} · {x.filed}
                </a>
              ))}
            </div>
          ))}
        </div>
      </Panel>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }} data-no-reveal>
        <div className="legal-toolbar">
          <Segmented value={cat} onChange={(v) => { setCat(v); setLimit(40); }} layoutId="filing-cats" size="sm" options={CATEGORIES.map((c) => ({ value: c, label: c === 'All' ? 'All filings' : c, count: c === 'All' ? profile.filings.length : profile.filings.filter((f) => categorizeForm(f.form) === c).length }))} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Form</th>
                <th>Filed</th>
                <th>Period</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Links</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, limit).map((f) => (
                <tr key={f.accession + f.primaryDoc}>
                  <td><span className="badge badge-gray font-mono">{f.form}</span></td>
                  <td className="font-mono" style={{ fontSize: '0.8rem' }}>{f.filed}</td>
                  <td className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>{f.reportDate || '—'}</td>
                  <td style={{ whiteSpace: 'normal', minWidth: 260 }}>
                    <div style={{ color: 'var(--text-soft)' }}>{f.description || categorizeForm(f.form)}</div>
                    {f.items.length > 0 && <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: 2 }}>{f.items.map((i) => `${i} ${ITEM_LABELS[i] ?? ''}`).join(' · ')}</div>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <a className="btn btn-ghost btn-sm" href={f.url} target="_blank" rel="noreferrer">Document</a>
                    <a className="btn btn-ghost btn-sm" href={f.indexUrl} target="_blank" rel="noreferrer">Exhibits</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length > limit && (
          <div style={{ padding: 12, textAlign: 'center', borderTop: '1px solid var(--border-subtle)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setLimit((l) => l + 40)}>Show more ({list.length - limit} remaining)</button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- Deal history ---------- */
const DealsTab: React.FC<{ profile: CompanyProfile }> = ({ profile }) => {
  const [hits, setHits] = useState<FtsHit[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    findDealAgreements(profile.cik)
      .then((r) => setHits(r.hits))
      .catch((e: Error) => setErr(e.message));
  }, [profile.cik]);

  if (err) return <EmptyState icon={<AlertTriangle size={22} />} title="Could not search deal agreements" description={err} />;
  if (!hits) return <div className="skeleton" style={{ height: 240 }} />;
  if (!hits.length) return <EmptyState icon={<Handshake size={22} />} title="No deal agreements found" description="EDGAR full-text search found no merger, stock or asset purchase agreements filed by this company since 2001." />;

  return (
    <Panel title="Deal agreements on file" subtitle="Merger, stock purchase and asset purchase agreements found in this company's filings" icon={<Handshake size={16} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {hits.slice(0, 40).map((h) => (
          <a key={h.accession + h.fileName} href={h.url} target="_blank" rel="noreferrer" className="milestone lift-row" style={{ textDecoration: 'none' }}>
            <span className="doc-icon"><FileText size={14} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 550 }}>{h.description || h.fileName}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>{h.form} · filed {h.filed} · {h.fileName}</div>
            </div>
            <ExternalLink size={14} color="var(--text-subtle)" />
          </a>
        ))}
      </div>
    </Panel>
  );
};
