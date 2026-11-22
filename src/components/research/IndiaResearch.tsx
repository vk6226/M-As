import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search,
  Building2,
  LineChart,
  Calculator,
  FolderOpen,
  Users,
  Megaphone,
  AlertTriangle,
  RefreshCw,
  Download,
  ExternalLink,
  FileText,
  Plus,
  Landmark,
  Info,
  Database,
} from 'lucide-react';
import { useDealflow } from '../../context/DealflowContext';
import { Panel, Segmented, EmptyState } from '../ui/primitives';
import {
  searchNse,
  getNseProfile,
  getNseResults,
  getNseShareholding,
  getNseAnnouncements,
  getNseResultFilings,
  getNseAnnualReports,
  getNseBoardMeetings,
  fmtInr,
  type NseRef,
  type NseProfile,
  type NseResults,
  type NseShareholding,
  type NseAnnouncement,
  type NseQuarter,
  type IndiaDealCategory,
} from '../../services/nse';
import { FinancialBars } from './FinancialBars';
import { downloadTextFile } from '../../utils/exportUtils';
import { generateCompanyWithAi } from '../../utils/aiCompanyGenerator';

const pct = (n?: number) => (n === undefined || Number.isNaN(n) ? '—' : `${n.toFixed(1)}%`);
const x = (n?: number) => (n === undefined || !Number.isFinite(n) ? '—' : `${n.toFixed(1)}x`);
const qLabel = (to: string) => {
  const d = new Date(to);
  const m = d.getMonth();
  const fy = m >= 3 ? d.getFullYear() + 1 : d.getFullYear();
  const q = m >= 3 && m <= 5 ? 1 : m >= 6 && m <= 8 ? 2 : m >= 9 ? 3 : 4;
  return `Q${q} FY${String(fy).slice(2)}`;
};

type Tab = 'overview' | 'results' | 'valuation' | 'shareholding' | 'filings' | 'deals';

export const IndiaResearch: React.FC = () => {
  const { researchSymbol, openIndiaResearch } = useDealflow();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<NseRef[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = query.trim();
    if (t.length < 2) {
      setSuggestions([]);
      return;
    }
    let alive = true;
    const id = setTimeout(() => {
      setSearching(true);
      searchNse(t)
        .then((r) => {
          if (!alive) return;
          setSuggestions(r);
          setSearchError('');
          setActive(0);
        })
        .catch((e: Error) => alive && setSearchError(e.message))
        .finally(() => alive && setSearching(false));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [query]);

  const choose = (s: NseRef) => {
    setQuery('');
    setFocused(false);
    inputRef.current?.blur();
    openIndiaResearch(s.symbol);
  };

  return (
    <>
      <div className="research-search">
        <Search size={18} className="research-search__icon" />
        <input
          ref={inputRef}
          className="input-text"
          placeholder="Search NSE-listed companies by name or symbol (e.g. Infosys, TATAMOTORS, HDFCBANK)"
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
            } else if (e.key === 'Enter') {
              if (suggestions[active]) choose(suggestions[active]);
              else if (/^[A-Za-z0-9&-]{2,20}$/.test(query.trim())) openIndiaResearch(query.trim().toUpperCase());
            }
          }}
          id="input-india-research"
        />
        {searching && <span className="spinner research-search__spin" />}
        <AnimatePresence>
          {focused && suggestions.length > 0 && (
            <motion.div className="research-suggest" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
              {suggestions.map((s, i) => (
                <button key={s.symbol} className={`research-suggest__item${i === active ? ' is-active' : ''}`} onMouseDown={() => choose(s)} onMouseEnter={() => setActive(i)}>
                  <span className="research-suggest__ticker">{s.symbol}</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                  <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>NSE · {s.series}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {searchError && (
        <div className="inline-error">
          <AlertTriangle size={14} /> {searchError}
        </div>
      )}

      {researchSymbol ? (
        <IndiaWorkspace key={researchSymbol} symbol={researchSymbol} />
      ) : (
        <div className="research-intro">
          {[
            { icon: <LineChart size={18} />, title: 'Quarterly results', body: 'Revenue, EBITDA, profit and EPS for the latest quarters from exchange filings, with trailing-twelve-month totals.' },
            { icon: <Calculator size={18} />, title: 'Valuation & open offer', body: 'Live NSE price and market cap, offer premium maths, and the minimum 26% open-offer size under SEBI SAST.' },
            { icon: <Users size={18} />, title: 'Shareholding pattern', body: 'Promoter and public holdings by quarter: who you need to buy from, and when takeover thresholds bite.' },
            { icon: <Megaphone size={18} />, title: 'Filings & M&A disclosures', body: 'Annual reports, results filings, board meetings and Regulation 30 disclosures on acquisitions, schemes and open offers.' },
          ].map((f) => (
            <div key={f.title} className="glass-panel" style={{ padding: 20 }}>
              <span className="panel__icon" style={{ marginBottom: 14 }}>{f.icon}</span>
              <div style={{ fontWeight: 600, color: '#fff' }}>{f.title}</div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.55 }}>{f.body}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/* ======================================================================== */

const twoYearsAgo = () => new Date(Date.now() - 730 * 86_400_000);

const IndiaWorkspace: React.FC<{ symbol: string }> = ({ symbol }) => {
  const { addTarget, showToast, targets, setCurrentView } = useDealflow();
  const [profile, setProfile] = useState<NseProfile | null>(null);
  const [results, setResults] = useState<NseResults | null>(null);
  const [holding, setHolding] = useState<NseShareholding[] | null>(null);
  const [anns, setAnns] = useState<NseAnnouncement[] | null>(null);
  const [error, setError] = useState('');
  const [partial, setPartial] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>('overview');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    setProfile(null);
    setError('');
    setPartial([]);
    const miss = (what: string) => () => alive && setPartial((p) => [...p, what]);
    getNseProfile(symbol)
      .then((p) => alive && setProfile(p))
      .catch((e: Error) => alive && setError(e.message));
    getNseResults(symbol).then((r) => alive && setResults(r)).catch(miss('quarterly results'));
    getNseShareholding(symbol).then((r) => alive && setHolding(r)).catch(miss('shareholding'));
    getNseAnnouncements({ symbol, from: twoYearsAgo(), to: new Date() }).then((r) => alive && setAnns(r)).catch(miss('announcements'));
    return () => {
      alive = false;
    };
  }, [symbol, reload]);

  if (error)
    return (
      <div style={{ marginTop: 24 }}>
        <EmptyState
          icon={<AlertTriangle size={22} />}
          title={`Could not load ${symbol}`}
          description={error}
          action={
            <button className="btn btn-secondary" onClick={() => setReload((r) => r + 1)}>
              <RefreshCw size={14} /> Try again
            </button>
          }
        />
      </div>
    );
  if (!profile) return <div className="skeleton" style={{ height: 320, marginTop: 24 }} />;

  const latest = results?.quarters[0];
  const promoter = holding?.[0]?.promoter;
  const added = targets.some((t) => t.name.toLowerCase() === profile.name.toLowerCase());
  const maAnns = (anns ?? []).filter((a) => a.category);

  const addToUniverse = () => {
    const base = generateCompanyWithAi(profile.name);
    const toM = (n?: number) => (n === undefined ? undefined : n / 1e6 / 83); // ₹ → US$ M for the shared universe (approx. FX)
    const ttm = results?.ttm;
    addTarget({
      ...base,
      name: profile.name,
      ticker: profile.symbol,
      tagline: `${profile.industry || profile.sector} · NSE: ${profile.symbol} · results from NSE filings`,
      headquarters: { ...base.headquarters, country: 'India', region: 'APAC' },
      ownership: 'Public (Listed)',
      financials: {
        ...base.financials,
        arr: toM(ttm?.revenue) ?? base.financials.arr,
        revenueLTM: toM(ttm?.revenue) ?? base.financials.revenueLTM,
        revenueGrowthYoY: results?.yoyRevenueGrowth ?? base.financials.revenueGrowthYoY,
        ebitdaLTM: toM(ttm?.ebitda) ?? base.financials.ebitdaLTM,
        ebitdaMargin: ttm?.ebitda && ttm.revenue ? (ttm.ebitda / ttm.revenue) * 100 : base.financials.ebitdaMargin,
      },
      valuation: { ...base.valuation, targetEnterpriseValue: toM(profile.marketCap) ?? base.valuation.targetEnterpriseValue },
    });
    showToast('success', 'Added to target universe', `${profile.name} added with NSE-reported figures (converted to US$ at ~₹83). Strategic fit scores are modelled.`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ marginTop: 24 }}>
      <div className="glass-panel research-head" data-no-reveal>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
          <span className="tcard__logo" style={{ width: 54, height: 54, borderRadius: 14, background: 'linear-gradient(140deg, #f59e0b, #0d9488 140%)' }}>
            {profile.symbol.slice(0, 2)}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 650 }}>{profile.name}</h2>
              <span className="badge badge-cyan font-mono">NSE: {profile.symbol}</span>
              {profile.status && profile.status !== 'Listed' && <span className="badge badge-amber">{profile.status}</span>}
            </div>
            <div className="research-head__meta">
              {profile.industry && <span>{profile.basicIndustry || profile.industry}</span>}
              {profile.sector && <span>{profile.sector}</span>}
              {profile.listingDate && <span>Listed {profile.listingDate}</span>}
              <span className="font-mono">ISIN {profile.isin}</span>
              {profile.indices.length > 0 && <span>{profile.indices.includes('NIFTY 50') ? 'Nifty 50 constituent' : `${profile.indices.length} NSE indices`}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border-subtle)' }} href={`https://www.nseindia.in/get-quotes/equity?symbol=${encodeURIComponent(profile.symbol)}`} target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> NSE
          </a>
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('documents')}>
            <FileText size={14} /> Deal documents
          </button>
          <button className="btn btn-primary btn-sm" onClick={addToUniverse} disabled={added}>
            <Plus size={14} /> {added ? 'In target universe' : 'Add to targets'}
          </button>
        </div>
      </div>

      {partial.length > 0 && (
        <div className="inline-error" style={{ color: 'var(--amber)' }}>
          <AlertTriangle size={14} /> Some data could not be loaded from NSE: {partial.join(', ')}.
        </div>
      )}

      <div style={{ margin: '18px 0' }}>
        <Segmented
          value={tab}
          onChange={setTab}
          layoutId="india-tabs"
          options={[
            { value: 'overview', label: 'Overview', icon: <Building2 size={15} /> },
            { value: 'results', label: 'Quarterly results', icon: <LineChart size={15} /> },
            { value: 'valuation', label: 'Valuation & open offer', icon: <Calculator size={15} /> },
            { value: 'shareholding', label: 'Shareholding', icon: <Users size={15} /> },
            { value: 'filings', label: 'Filings & documents', icon: <FolderOpen size={15} /> },
            { value: 'deals', label: 'M&A disclosures', icon: <Megaphone size={15} />, count: anns ? maAnns.length : undefined },
          ]}
        />
      </div>

      <div key={tab} className="tab-panel">
        {tab === 'overview' && <OverviewTab profile={profile} results={results} promoter={promoter} anns={maAnns} />}
        {tab === 'results' && <ResultsTab profile={profile} results={results} />}
        {tab === 'valuation' && <ValuationTab profile={profile} results={results} />}
        {tab === 'shareholding' && <ShareholdingTab holding={holding} />}
        {tab === 'filings' && <FilingsTab profile={profile} anns={anns} />}
        {tab === 'deals' && <DisclosuresTab anns={anns} />}
      </div>

      <div className="source-note">
        <Database size={13} /> Source: National Stock Exchange of India (quote, results comparison, shareholding pattern, corporate announcements), retrieved live. Results are as filed by the company with the exchange (₹; standalone or consolidated as filed). EBITDA and TTM figures are calculated by AURA.
      </div>
    </motion.div>
  );
};

/* ---------- Overview ---------- */
const OverviewTab: React.FC<{ profile: NseProfile; results: NseResults | null; promoter?: number; anns: NseAnnouncement[] }> = ({ profile, results, promoter, anns }) => {
  const q = results?.quarters ?? [];
  const latest = q[0];
  const ttm = results?.ttm;
  const tiles = [
    { label: 'Market capitalisation', value: fmtInr(profile.marketCap), hint: profile.freeFloatMarketCap ? `Free float ${fmtInr(profile.freeFloatMarketCap)}` : undefined },
    { label: 'Share price', value: profile.price ? `₹${profile.price.toLocaleString('en-IN')}` : '—', hint: profile.changePct !== undefined ? `${profile.changePct >= 0 ? '+' : ''}${profile.changePct.toFixed(2)}% today` : undefined, tone: (profile.changePct ?? 0) >= 0 ? 'pos' : 'neg' },
    { label: 'Revenue (TTM)', value: fmtInr(ttm?.revenue), hint: results?.yoyRevenueGrowth !== undefined ? `${pct(results.yoyRevenueGrowth)} YoY (latest quarter)` : undefined },
    { label: 'EBITDA (TTM)', value: fmtInr(ttm?.ebitda), hint: ttm?.ebitda && ttm.revenue ? `${pct((ttm.ebitda / ttm.revenue) * 100)} margin` : results?.bank ? 'Not meaningful for banks' : undefined },
    { label: 'Net profit (TTM)', value: fmtInr(ttm?.netProfit), hint: ttm?.eps !== undefined ? `EPS ₹${ttm.eps.toFixed(2)}` : undefined },
    { label: 'P/E', value: x(profile.pe), hint: profile.sectorPe ? `Sector ${x(profile.sectorPe)}` : undefined },
  ];
  const chartQ = q.slice(0, 6).reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="research-tiles">
        {tiles.map((t) => (
          <div key={t.label} className="glass-panel" style={{ padding: 16 }} data-no-reveal>
            <div className="stat__label">{t.label}</div>
            <div className="font-mono" style={{ fontSize: '1.3rem', fontWeight: 600, color: '#fff', letterSpacing: '-0.04em', marginTop: 4 }}>{t.value}</div>
            {t.hint && <div style={{ fontSize: '0.74rem', marginTop: 2, color: t.tone === 'pos' ? 'var(--emerald)' : t.tone === 'neg' ? 'var(--rose)' : 'var(--text-subtle)' }}>{t.hint}</div>}
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <Panel title="Quarterly revenue, EBITDA and net profit" subtitle="As filed with NSE, ₹" icon={<LineChart size={16} />}>
          {chartQ.length ? (
            <FinancialBars
              years={chartQ.map((r) => qLabel(r.to))}
              format={fmtInr}
              series={[
                { name: 'Revenue', values: chartQ.map((r) => r.revenue) },
                { name: 'EBITDA', values: chartQ.map((r) => r.ebitda) },
                { name: 'Net profit', values: chartQ.map((r) => r.netProfit) },
              ]}
            />
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>{results ? 'No quarterly results available.' : 'Loading results…'}</div>
          )}
        </Panel>
        <Panel title="M&A checks" subtitle={latest ? `Latest quarter ${qLabel(latest.to)}` : 'Latest available data'} icon={<Landmark size={16} />}>
          <div className="check-grid">
            <Row label="Revenue growth (YoY)" value={pct(results?.yoyRevenueGrowth)} ok={(results?.yoyRevenueGrowth ?? -1) > 12} warn={(results?.yoyRevenueGrowth ?? 0) < 0} />
            <Row label="EBITDA margin" value={pct(latest?.ebitdaMargin)} ok={(latest?.ebitdaMargin ?? 0) > 20} warn={latest?.ebitdaMargin !== undefined && latest.ebitdaMargin < 8} />
            <Row label="Net margin" value={pct(latest?.netMargin)} ok={(latest?.netMargin ?? 0) > 12} warn={latest?.netMargin !== undefined && latest.netMargin < 0} />
            <Row label="Debt / equity" value={x(latest?.debtEquity)} ok={latest?.debtEquity !== undefined && latest.debtEquity < 0.5} warn={(latest?.debtEquity ?? 0) > 1.5} />
            <Row label="Interest service coverage" value={x(latest?.interestCoverage)} ok={(latest?.interestCoverage ?? 0) > 5} warn={latest?.interestCoverage !== undefined && latest.interestCoverage < 2} />
            <Row label="Promoter holding" value={pct(promoter)} warn={(promoter ?? 0) > 75} />
            <Row label="Shares a buyer can reach before an open offer" value={promoter !== undefined ? '< 25%' : '—'} />
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: 12, lineHeight: 1.5 }}>
            Acquiring 25% or more of voting rights, or control, triggers a mandatory open offer for at least 26% more under SEBI SAST Regulations 3–4 and 7. Promoter holdings above 75% must be brought down to meet minimum public shareholding.
          </div>
        </Panel>
      </div>

      <Panel title="M&A disclosures in the last 24 months" subtitle="Regulation 30 announcements classified by AURA" icon={<Megaphone size={16} />}>
        <AnnouncementList anns={anns.slice(0, 8)} empty="No acquisition, scheme, open-offer, divestment or insolvency disclosures in the last 24 months." />
      </Panel>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; ok?: boolean; warn?: boolean }> = ({ label, value, ok, warn }) => (
  <div className="check-grid__row">
    <span style={{ color: 'var(--text-soft)' }}>{label}</span>
    <span className="font-mono" style={{ color: value === '—' ? 'var(--text-subtle)' : ok ? 'var(--emerald)' : warn ? 'var(--amber)' : '#fff' }}>{value}</span>
  </div>
);

const CATEGORY_TONE: Record<IndiaDealCategory, string> = {
  Acquisition: 'var(--accent)',
  'Merger / scheme': 'var(--violet)',
  'Open offer / takeover': 'var(--rose)',
  Divestment: 'var(--amber)',
  Demerger: 'var(--amber)',
  Insolvency: 'var(--rose)',
  Delisting: 'var(--rose)',
  Fundraise: 'var(--emerald)',
};

export const AnnouncementList: React.FC<{ anns: NseAnnouncement[]; empty: string; showCompany?: boolean; onOpen?: (symbol: string) => void }> = ({ anns, empty, showCompany, onOpen }) =>
  anns.length === 0 ? (
    <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>{empty}</div>
  ) : (
    <div className="timeline">
      {anns.map((a, i) => (
        <div key={i} className="timeline__item lift-row">
          <span className="timeline__dot" style={{ background: a.category ? CATEGORY_TONE[a.category] : 'var(--text-subtle)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: a.category ? CATEGORY_TONE[a.category] : 'var(--text-muted)' }}>
                {a.category ?? a.subject}
                {showCompany && (
                  <button className="link-btn" onClick={() => onOpen?.(a.symbol)}>
                    {' '}· {a.company} ({a.symbol})
                  </button>
                )}
              </span>
              <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{a.date}</span>
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-soft)', marginTop: 2, lineHeight: 1.5 }}>{a.text || a.subject}</div>
            {a.url && (
              <a href={a.url} target="_blank" rel="noreferrer" className="pack-link" style={{ marginTop: 4 }}>
                <FileText size={12} /> Filing document
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );

/* ---------- Results ---------- */
const RESULT_ROWS: { label: string; get: (q: NseQuarter) => number | undefined; kind?: 'pct' | 'eps' | 'x'; strong?: boolean }[] = [
  { label: 'Revenue from operations', get: (q) => q.revenue, strong: true },
  { label: 'Other income', get: (q) => q.otherIncome },
  { label: 'Total income', get: (q) => q.totalIncome },
  { label: 'Materials & traded goods', get: (q) => q.materials },
  { label: 'Employee benefits', get: (q) => q.employeeCost },
  { label: 'Other expenses', get: (q) => q.otherExpenses },
  { label: 'EBITDA', get: (q) => q.ebitda, strong: true },
  { label: 'Depreciation & amortisation', get: (q) => q.depreciation },
  { label: 'Finance costs', get: (q) => q.financeCost },
  { label: 'Exceptional items', get: (q) => q.exceptional },
  { label: 'Profit before tax', get: (q) => q.profitBeforeTax, strong: true },
  { label: 'Tax', get: (q) => q.tax },
  { label: 'Net profit', get: (q) => q.netProfit, strong: true },
  { label: 'Diluted EPS (₹)', get: (q) => q.epsDiluted ?? q.epsBasic, kind: 'eps' },
  { label: 'EBITDA margin', get: (q) => q.ebitdaMargin, kind: 'pct' },
  { label: 'Net margin', get: (q) => q.netMargin, kind: 'pct' },
  { label: 'Debt / equity', get: (q) => q.debtEquity, kind: 'x' },
  { label: 'Interest service coverage', get: (q) => q.interestCoverage, kind: 'x' },
  { label: 'Paid-up equity capital', get: (q) => q.paidUpCapital },
];

function resultsCsv(p: NseProfile, r: NseResults) {
  const head = ['Line item (₹)', ...r.quarters.map((q) => `${qLabel(q.to)} (${q.to})`)];
  const rows = RESULT_ROWS.map((row) => [row.label, ...r.quarters.map((q) => (row.get(q) === undefined ? '' : String(Number(row.get(q)!.toFixed(2)))))]);
  return [[`${p.name} (NSE: ${p.symbol}) quarterly results, rupees; source NSE`], head, ...rows].map((l) => l.map((c) => (/[",]/.test(c) ? `"${c}"` : c)).join(',')).join('\n');
}

const ResultsTab: React.FC<{ profile: NseProfile; results: NseResults | null }> = ({ profile, results }) => {
  const { showToast } = useDealflow();
  if (!results) return <div className="skeleton" style={{ height: 300 }} />;
  if (!results.quarters.length) return <EmptyState icon={<Info size={22} />} title="No results on file" description="NSE returned no quarterly results for this company." />;
  const fmt = (k: string | undefined, v?: number) => (k === 'pct' ? pct(v) : k === 'x' ? x(v) : k === 'eps' ? (v === undefined ? '—' : `₹${v.toFixed(2)}`) : fmtInr(v));
  return (
    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }} data-no-reveal>
      <div className="legal-toolbar">
        <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Quarterly results as filed with NSE (Regulation 33) · {results.bank ? 'bank format' : 'Ind AS format'}
          {results.ttm && <> · TTM to {results.ttm.periodEnd}</>}
        </div>
        <button
          className="btn btn-secondary btn-sm"
          style={{ marginLeft: 'auto' }}
          onClick={() => {
            downloadTextFile(resultsCsv(profile, results), `${profile.symbol}_quarterly_results.csv`, 'text/csv');
            showToast('success', 'Results exported', 'CSV downloaded.');
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
              {results.quarters.map((q) => (
                <th key={q.to} className="num">
                  {qLabel(q.to)}
                  <div style={{ fontWeight: 400, fontSize: '0.66rem' }}>{q.audited ? 'Audited' : 'Unaudited'}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RESULT_ROWS.map((row) => (
              <tr key={row.label} className={row.strong ? 'is-strong' : ''}>
                <td>{row.label}</td>
                {results.quarters.map((q) => {
                  const v = row.get(q);
                  return (
                    <td key={q.to} className="num" style={{ color: v === undefined ? 'var(--text-subtle)' : v < 0 ? 'var(--rose)' : undefined }}>
                      {fmt(row.kind, v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------- Valuation & open offer ---------- */
const ValuationTab: React.FC<{ profile: NseProfile; results: NseResults | null }> = ({ profile, results }) => {
  const [premium, setPremium] = useState(25);
  const [netDebtCr, setNetDebtCr] = useState('');
  const [stake, setStake] = useState(51);
  const price = profile.price;
  const shares = profile.issuedShares;
  const mcap = profile.marketCap ?? (price && shares ? price * shares : undefined);
  const netDebt = netDebtCr ? Number(netDebtCr) * 1e7 : undefined;
  const ev = mcap !== undefined ? mcap + (netDebt ?? 0) : undefined;
  const offer = price ? price * (1 + premium / 100) : undefined;
  const equityAtOffer = offer && shares ? offer * shares : undefined;
  const evAtOffer = equityAtOffer !== undefined ? equityAtOffer + (netDebt ?? 0) : undefined;
  const ttm = results?.ttm;
  const div = (a?: number, b?: number) => (a === undefined || !b || b <= 0 ? undefined : a / b);
  const stakeCost = offer && shares ? (offer * shares * stake) / 100 : undefined;
  const openOfferCost = offer && shares ? offer * shares * 0.26 : undefined;
  const triggers = stake >= 25;

  return (
    <div className="dash-grid">
      <Panel title="Market value" subtitle={profile.updatedAt ? `Live NSE price · ${profile.updatedAt}` : 'Live NSE price'} icon={<Calculator size={16} />}>
        <div className="val-bridge" style={{ marginTop: 0 }}>
          <div><span>Share price</span><strong>{price ? `₹${price.toLocaleString('en-IN')}` : '—'}</strong></div>
          <div><span>Shares issued</span><strong>{shares ? shares.toLocaleString('en-IN') : '—'}</strong></div>
          <div><span>Market capitalisation</span><strong>{fmtInr(mcap)}</strong></div>
          <div><span>+ Net debt (enter from latest balance sheet)</span><strong>{netDebt !== undefined ? fmtInr(netDebt) : '—'}</strong></div>
          <div className="is-total"><span>Enterprise value</span><strong>{fmtInr(ev)}</strong></div>
        </div>
        <label className="field" style={{ marginTop: 12 }}>
          <span>Net debt (₹ crore, negative for net cash)</span>
          <input className="input-text font-mono" type="number" value={netDebtCr} onChange={(e) => setNetDebtCr(e.target.value)} placeholder="e.g. 1250 or -300" />
        </label>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: 8 }}>
          Quarterly results don't include the balance sheet. Take borrowings and cash from the latest half-yearly or annual filing in Filings &amp; documents.
        </div>
      </Panel>

      <Panel title="Offer and open-offer analysis" subtitle="SEBI (SAST) Regulations, 2011" icon={<Landmark size={16} />}>
        <div className="range-field">
          <div className="range-field__head">
            <span>Premium to current price</span>
            <span className="range-field__value">{premium}%</span>
          </div>
          <input type="range" className="range-slider is-filled" min={0} max={80} step={5} value={premium} style={{ ['--fill' as string]: `${(premium / 80) * 100}%` }} onChange={(e) => setPremium(Number(e.target.value))} aria-label="Premium" />
        </div>
        <div className="range-field" style={{ marginTop: 16 }}>
          <div className="range-field__head">
            <span>Stake acquired from sellers (SPA)</span>
            <span className="range-field__value">{stake}%</span>
          </div>
          <input type="range" className="range-slider is-filled" min={5} max={75} step={1} value={stake} style={{ ['--fill' as string]: `${((stake - 5) / 70) * 100}%` }} onChange={(e) => setStake(Number(e.target.value))} aria-label="Stake" />
        </div>
        <div className="val-bridge" style={{ marginTop: 16 }}>
          <div><span>Offer price per share</span><strong>{offer ? `₹${offer.toFixed(2)}` : '—'}</strong></div>
          <div><span>Cost of {stake}% stake</span><strong>{fmtInr(stakeCost)}</strong></div>
          <div><span>Mandatory open offer (26%)</span><strong style={{ color: triggers ? '#fff' : 'var(--text-subtle)' }}>{triggers ? fmtInr(openOfferCost) : 'Not triggered'}</strong></div>
          <div className="is-total"><span>Maximum outlay if fully tendered</span><strong>{fmtInr(stakeCost !== undefined ? stakeCost + (triggers ? openOfferCost ?? 0 : 0) : undefined)}</strong></div>
        </div>
        <table className="data-table" style={{ marginTop: 14 }}>
          <thead>
            <tr>
              <th>Multiple (TTM)</th>
              <th className="num">Current</th>
              <th className="num">At offer</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>EV / Revenue</td><td className="num">{x(div(ev, ttm?.revenue))}</td><td className="num" style={{ color: '#fff' }}>{x(div(evAtOffer, ttm?.revenue))}</td></tr>
            <tr><td>EV / EBITDA</td><td className="num">{x(div(ev, ttm?.ebitda))}</td><td className="num" style={{ color: '#fff' }}>{x(div(evAtOffer, ttm?.ebitda))}</td></tr>
            <tr><td>Price / Earnings</td><td className="num">{x(div(mcap, ttm?.netProfit))}</td><td className="num" style={{ color: '#fff' }}>{x(div(equityAtOffer, ttm?.netProfit))}</td></tr>
          </tbody>
        </table>
        <div className="legal-disclaimer" style={{ marginTop: 14 }}>
          {triggers
            ? 'Acquiring 25% or more triggers a mandatory open offer for at least 26% of the total shares (Regs. 3, 4 and 7). The offer price must be at least the highest of the negotiated price, the volume-weighted average price paid in the prior 52 weeks, the highest price paid in the prior 26 weeks, and the 60-trading-day VWAP (Reg. 8). An escrow must be funded before the detailed public statement (Reg. 17).'
            : 'Below 25%, no open offer is triggered, but acquisitions of 5% or more, and every 2% change thereafter, must be disclosed under Regulation 29.'}
        </div>
      </Panel>
    </div>
  );
};

/* ---------- Shareholding ---------- */
const ShareholdingTab: React.FC<{ holding: NseShareholding[] | null }> = ({ holding }) => {
  if (!holding) return <div className="skeleton" style={{ height: 240 }} />;
  if (!holding.length) return <EmptyState icon={<Info size={22} />} title="No shareholding data" description="NSE returned no shareholding pattern filings for this company." />;
  const rows = holding.slice(0, 12);
  return (
    <Panel title="Shareholding pattern" subtitle="Quarterly filings under Regulation 31 of SEBI LODR" icon={<Users size={16} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((h) => (
          <div key={h.date} className="holding-row">
            <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: 92 }}>{h.date}</span>
            <div className="holding-bar">
              <motion.span style={{ background: '#6d78f5' }} initial={{ width: 0 }} animate={{ width: `${h.promoter ?? 0}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
              <motion.span style={{ background: '#0d9488' }} initial={{ width: 0 }} animate={{ width: `${h.public ?? 0}%` }} transition={{ duration: 0.9, delay: 0.05, ease: [0.16, 1, 0.3, 1] }} />
            </div>
            <span className="font-mono" style={{ fontSize: '0.78rem', width: 150, textAlign: 'right', color: 'var(--text-soft)' }}>
              {pct(h.promoter)} / {pct(h.public)}
            </span>
            {h.xbrl && (
              <a className="icon-btn" style={{ width: 28, height: 28 }} href={h.xbrl} target="_blank" rel="noreferrer" title="XBRL filing">
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        ))}
      </div>
      <div className="fbars__legend" style={{ marginTop: 14 }}>
        <span><i style={{ background: '#6d78f5' }} /> Promoter & promoter group</span>
        <span><i style={{ background: '#0d9488' }} /> Public</span>
      </div>
    </Panel>
  );
};

/* ---------- Filings & documents ---------- */
const FilingsTab: React.FC<{ profile: NseProfile; anns: NseAnnouncement[] | null }> = ({ profile, anns }) => {
  const { showToast } = useDealflow();
  const [results, setResults] = useState<Awaited<ReturnType<typeof getNseResultFilings>> | null>(null);
  const [reports, setReports] = useState<Awaited<ReturnType<typeof getNseAnnualReports>> | null>(null);
  const [meetings, setMeetings] = useState<Awaited<ReturnType<typeof getNseBoardMeetings>> | null>(null);
  const [errs, setErrs] = useState<string[]>([]);

  useEffect(() => {
    const miss = (w: string) => () => setErrs((e) => [...e, w]);
    getNseResultFilings(profile.symbol).then(setResults).catch(miss('results filings'));
    getNseAnnualReports(profile.symbol).then(setReports).catch(miss('annual reports'));
    getNseBoardMeetings(profile.symbol).then(setMeetings).catch(miss('board meetings'));
  }, [profile.symbol]);

  const sections = useMemo(
    () => [
      { title: 'Annual reports', items: (reports ?? []).slice(0, 5).map((r) => ({ label: `Annual report FY${r.toYear}`, date: r.filed || r.toYear, url: r.url })) },
      { title: 'Financial results (Reg. 33)', items: (results ?? []).slice(0, 8).map((r) => ({ label: `${r.period} · ${r.consolidated || ''} ${r.audited || ''}`.trim(), date: r.periodEnd, url: r.pdf || r.xbrl })) },
      { title: 'M&A disclosures (Reg. 30)', items: (anns ?? []).filter((a) => a.category).slice(0, 10).map((a) => ({ label: `${a.category}: ${a.subject}`, date: a.date, url: a.url })) },
      { title: 'Board meetings', items: (meetings ?? []).slice(0, 6).map((m) => ({ label: m.subject, date: m.date, url: m.url })) },
    ],
    [reports, results, anns, meetings]
  );

  const packIndex = () =>
    `# Diligence document pack: ${profile.name} (NSE: ${profile.symbol})

ISIN ${profile.isin} · ${profile.industry} · generated ${new Date().toISOString().slice(0, 10)} from NSE.

${sections.map((s) => `## ${s.title}\n\n${s.items.length ? s.items.map((i) => `- ${i.date} · ${i.label}${i.url ? `\n  - ${i.url}` : ''}`).join('\n') : '_None available._'}`).join('\n\n')}

## Also obtain for Indian diligence
- MCA filings (via the MCA V3 portal, by CIN): AOC-4 financial statements, MGT-7 annual return, CHG-1/CHG-9 charges, DIR-12 director changes, PAS-3 allotments.
- Shareholding pattern XBRL (Reg. 31) and SAST disclosures (Regs. 29 and 31) from the exchange.
- Credit rating rationales, statutory auditor reports and secretarial audit report (MR-3).
`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {errs.length > 0 && (
        <div className="inline-error" style={{ color: 'var(--amber)' }}>
          <AlertTriangle size={14} /> Could not load: {errs.join(', ')}.
        </div>
      )}
      <Panel
        title="Diligence document pack"
        subtitle="Exchange filings a buyer reviews before an offer"
        icon={<FolderOpen size={16} />}
        actions={
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              downloadTextFile(packIndex(), `${profile.symbol}_diligence_pack.md`, 'text/markdown');
              showToast('success', 'Document pack downloaded', 'Index with direct links to each filing.');
            }}
          >
            <Download size={14} /> Download pack index
          </button>
        }
      >
        <div className="pack-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {sections.map((s) => (
            <div key={s.title} className="pack-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: '0.84rem', color: '#fff', fontWeight: 550 }}>{s.title}</span>
                <span className={`badge ${s.items.length ? 'badge-emerald' : 'badge-gray'}`}>{s.items.length}</span>
              </div>
              {s.items.length === 0 && <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)' }}>Loading or none available</span>}
              {s.items.map((i, k) =>
                i.url ? (
                  <a key={k} href={i.url} target="_blank" rel="noreferrer" className="pack-link" style={{ fontFamily: 'var(--font-sans)' }}>
                    <FileText size={12} /> <span className="font-mono">{i.date}</span> {i.label}
                  </a>
                ) : (
                  <span key={k} style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{i.date} {i.label}</span>
                )
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};

/* ---------- Disclosures ---------- */
const DisclosuresTab: React.FC<{ anns: NseAnnouncement[] | null }> = ({ anns }) => {
  const [onlyMa, setOnlyMa] = useState<'ma' | 'all'>('ma');
  if (!anns) return <div className="skeleton" style={{ height: 240 }} />;
  const list = onlyMa === 'ma' ? anns.filter((a) => a.category) : anns;
  return (
    <Panel
      title="Corporate announcements"
      subtitle="Last 24 months, from NSE"
      icon={<Megaphone size={16} />}
      actions={<Segmented value={onlyMa} onChange={setOnlyMa} layoutId="ann-filter" size="sm" options={[{ value: 'ma', label: 'M&A only', count: anns.filter((a) => a.category).length }, { value: 'all', label: 'All', count: anns.length }]} />}
    >
      <AnnouncementList anns={list.slice(0, 60)} empty="No announcements in this view." />
    </Panel>
  );
};
