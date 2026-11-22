import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, ExternalLink, AlertTriangle, RefreshCw, Radio, Info } from 'lucide-react';
import { useDealflow } from '../../context/DealflowContext';
import { PageContainer, PageHeader, Segmented, EmptyState } from '../ui/primitives';
import { fullTextSearch, getCompanyFacts, buildStatements, isoDaysAgo, type FtsHit, type FtsQuery } from '../../services/sec';
import { fmtMoney } from './CompanyResearch';
import { IndiaActivity } from './IndiaActivity';

type FeedId = 'alternatives' | 'definitive' | 'votes' | 'tender' | 'activist' | 'completed';

const FEEDS: { id: FeedId; label: string; description: string; query: (from: string) => FtsQuery; tone: string }[] = [
  {
    id: 'alternatives',
    label: 'Exploring a sale',
    description: 'Companies that announced a review of strategic alternatives (often a sale process) in an 8-K or press release exhibit.',
    tone: 'var(--emerald)',
    query: (startdt) => ({ q: '"strategic alternatives" "sale of the company"', forms: ['8-K'], startdt }),
  },
  {
    id: 'definitive',
    label: 'Signed deals',
    description: '8-K filings announcing a definitive merger agreement.',
    tone: 'var(--accent)',
    query: (startdt) => ({ q: '"agreement and plan of merger"', forms: ['8-K'], startdt }),
  },
  {
    id: 'votes',
    label: 'Merger votes',
    description: 'Merger proxy statements: shareholders are being asked to approve a sale.',
    tone: 'var(--violet)',
    query: (startdt) => ({ forms: ['PREM14A', 'DEFM14A'], startdt }),
  },
  {
    id: 'tender',
    label: 'Tender offers',
    description: 'Third-party tender offers and the target board\'s response.',
    tone: 'var(--amber)',
    query: (startdt) => ({ forms: ['SC TO-T', 'SC 14D9'], startdt }),
  },
  {
    id: 'activist',
    label: 'Activist stakes',
    description: 'Schedule 13D filings: an investor holds 5%+ and may seek to influence or change control.',
    tone: 'var(--rose)',
    query: (startdt) => ({ forms: ['SC 13D', 'SCHEDULE 13D'], startdt }),
  },
  {
    id: 'completed',
    label: 'Completed',
    description: '8-K Item 2.01 filings reporting a completed acquisition or disposition.',
    tone: 'var(--text-muted)',
    query: (startdt) => ({ q: '"completion of acquisition or disposition of assets"', forms: ['8-K'], startdt }),
  },
];

const RANGES = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
] as const;

interface Snapshot {
  revenue?: number;
  growth?: number;
  ebitda?: number;
  netIncome?: number;
  cash?: number;
  ccy: string;
  status: 'loading' | 'ok' | 'none';
}

export const MaActivity: React.FC = () => {
  const { openResearch } = useDealflow();
  const [market, setMarket] = useState<'us' | 'in'>('us');
  const [feed, setFeed] = useState<FeedId>('alternatives');
  const [range, setRange] = useState<(typeof RANGES)[number]['value']>('30');
  const [hits, setHits] = useState<FtsHit[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [snapshots, setSnapshots] = useState<Record<string, Snapshot>>({});
  const queue = useRef<Set<string>>(new Set());

  const def = FEEDS.find((f) => f.id === feed)!;

  useEffect(() => {
    if (market !== 'us') return;
    let alive = true;
    setHits(null);
    setError('');
    fullTextSearch(def.query(isoDaysAgo(Number(range))))
      .then((r) => {
        if (!alive) return;
        // One row per company+filing (exhibits of the same filing collapse).
        const seen = new Set<string>();
        const rows = r.hits.filter((h) => {
          const k = `${h.cik}-${h.accession}`;
          return seen.has(k) ? false : (seen.add(k), true);
        });
        setHits(rows);
        setTotal(r.total);
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [feed, range, reload, def, market]);

  // Lazily load headline financials for each company, a few at a time.
  const companies = useMemo(() => [...new Set((hits ?? []).map((h) => h.cik))], [hits]);
  useEffect(() => {
    let cancelled = false;
    const todo = companies.filter((c) => !snapshots[c] && !queue.current.has(c)).slice(0, 25);
    const run = async (cik: string) => {
      queue.current.add(cik);
      setSnapshots((s) => ({ ...s, [cik]: { ccy: 'USD', status: 'loading' } }));
      try {
        const f = buildStatements(await getCompanyFacts(cik), 2);
        const p = f.annual[0];
        if (cancelled) return;
        setSnapshots((s) => ({
          ...s,
          [cik]: p
            ? { revenue: p.values.revenue, growth: p.derived.revenueGrowth, ebitda: p.derived.ebitda, netIncome: p.values.netIncome, cash: f.latestBalance.cash, ccy: f.currency, status: 'ok' }
            : { ccy: f.currency, status: 'none' },
        }));
      } catch {
        if (!cancelled) setSnapshots((s) => ({ ...s, [cik]: { ccy: 'USD', status: 'none' } }));
      }
    };
    (async () => {
      const workers = 3;
      for (let i = 0; i < todo.length; i += workers) {
        if (cancelled) break;
        await Promise.all(todo.slice(i, i + workers).map(run));
      }
    })();
    return () => {
      cancelled = true;
    };
    // snapshots intentionally omitted: we only enqueue new companies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies]);

  return (
    <PageContainer wide>
      <PageHeader
        eyebrow="Live data · SEC EDGAR · NSE"
        title="M&A activity"
        description="Companies in or near a transaction in the US and India, detected from SEC filings and NSE disclosures as they are published. Select a company for full financials and documents."
        actions={
          <button className="btn btn-secondary" onClick={() => setReload((r) => r + 1)}>
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <Segmented value={market} onChange={setMarket} layoutId="activity-market" options={[{ value: 'us', label: 'United States · SEC' }, { value: 'in', label: 'India · NSE' }]} />
        <Segmented value={range} onChange={setRange} layoutId="activity-range" size="sm" options={RANGES.map((r) => ({ value: r.value, label: r.label }))} />
      </div>

      {market === 'in' ? (
        <IndiaActivity days={Number(range)} reload={reload} />
      ) : (
      <>
      <div style={{ marginBottom: 12 }}>
        <Segmented value={feed} onChange={setFeed} layoutId="activity-feed" options={FEEDS.map((f) => ({ value: f.id, label: f.label }))} />
      </div>

      <div className="notice" style={{ marginBottom: 16 }}>
        <Radio size={16} color={def.tone} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: '0.84rem', color: 'var(--text-soft)' }}>{def.description}</div>
      </div>

      {error ? (
        <EmptyState
          icon={<AlertTriangle size={22} />}
          title="Could not load the activity feed"
          description={error}
          action={<button className="btn btn-secondary" onClick={() => setReload((r) => r + 1)}><RefreshCw size={14} /> Try again</button>}
        />
      ) : !hits ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 54 }} />
          ))}
        </div>
      ) : hits.length === 0 ? (
        <EmptyState icon={<Info size={22} />} title="No filings in this period" description="Try a longer date range or another category." />
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }} data-no-reveal>
          <div className="legal-toolbar" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <strong className="font-mono" style={{ color: '#fff' }}>{total.toLocaleString()}</strong> matching filings · showing the latest {hits.length}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Filing</th>
                  <th>Filed</th>
                  <th className="num">Revenue (FY)</th>
                  <th className="num">Growth</th>
                  <th className="num">EBITDA</th>
                  <th className="num">Net income</th>
                  <th className="num">Cash</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {hits.map((h) => {
                  const s = snapshots[h.cik];
                  const cell = (v?: number) => (s?.status === 'loading' ? <span className="skeleton" style={{ display: 'inline-block', width: 56, height: 12 }} /> : fmtMoney(v, s?.ccy));
                  return (
                    <tr key={`${h.cik}-${h.accession}`} style={{ cursor: 'pointer' }} onClick={() => openResearch(h.cik)}>
                      <td>
                        <div style={{ color: '#fff', fontWeight: 550 }}>{h.companyName || `CIK ${h.cik}`}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                          {h.ticker && <span className="font-mono" style={{ color: '#aab1ff' }}>{h.ticker} · </span>}
                          {h.location}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-gray font-mono" style={{ borderColor: def.tone, color: def.tone }}>{h.form}</span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.8rem' }}>{h.filed}</td>
                      <td className="num">{cell(s?.revenue)}</td>
                      <td className="num" style={{ color: s?.growth === undefined ? undefined : s.growth >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                        {s?.status === 'ok' && s.growth !== undefined ? `${s.growth >= 0 ? '+' : ''}${s.growth.toFixed(0)}%` : s?.status === 'loading' ? '' : '—'}
                      </td>
                      <td className="num">{cell(s?.ebitda)}</td>
                      <td className="num">{cell(s?.netIncome)}</td>
                      <td className="num">{cell(s?.cash)}</td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <a className="icon-btn" style={{ width: 30, height: 30, display: 'inline-grid' }} href={h.url || h.indexUrl} target="_blank" rel="noreferrer" title="Open filing">
                          <ExternalLink size={14} />
                        </a>{' '}
                        <button className="icon-btn" style={{ width: 30, height: 30, display: 'inline-grid' }} onClick={() => openResearch(h.cik)} title="Open company research">
                          <ArrowUpRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="source-note">
        Source: SEC EDGAR full-text search, updated within minutes of filing. Signals indicate filings, not an assessment of whether a company will transact. Financials load from each company's latest annual XBRL data; "—" means not reported in structured form.
      </div>
      </>
      )}
    </PageContainer>
  );
};
