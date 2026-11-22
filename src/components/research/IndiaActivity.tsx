import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowUpRight, ExternalLink, Info, RefreshCw } from 'lucide-react';
import { useDealflow } from '../../context/DealflowContext';
import { EmptyState, Segmented } from '../ui/primitives';
import { fmtInr, getNseAnnouncements, getNseProfile, getNseResults, type IndiaDealCategory, type NseAnnouncement } from '../../services/nse';

const CATS: (IndiaDealCategory | 'All')[] = ['All', 'Acquisition', 'Merger / scheme', 'Open offer / takeover', 'Divestment', 'Demerger', 'Insolvency', 'Delisting'];

interface Snap {
  status: 'loading' | 'ok' | 'none';
  marketCap?: number;
  revenue?: number;
  profit?: number;
  industry?: string;
}

export const IndiaActivity: React.FC<{ days: number; reload: number }> = ({ days, reload }) => {
  const { openIndiaResearch } = useDealflow();
  const [cat, setCat] = useState<IndiaDealCategory | 'All'>('All');
  const [rows, setRows] = useState<NseAnnouncement[] | null>(null);
  const [error, setError] = useState('');
  const [snaps, setSnaps] = useState<Record<string, Snap>>({});
  const queued = useRef(new Set<string>());

  useEffect(() => {
    let alive = true;
    setRows(null);
    setError('');
    const to = new Date();
    const from = new Date(Date.now() - days * 86_400_000);
    getNseAnnouncements({ from, to })
      .then((r) => alive && setRows(r.filter((a) => a.category && a.category !== 'Fundraise').sort((a, b) => b.time.localeCompare(a.time) || b.date.localeCompare(a.date))))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [days, reload]);

  const visible = useMemo(() => (rows ?? []).filter((r) => cat === 'All' || r.category === cat), [rows, cat]);
  const symbols = useMemo(() => [...new Set(visible.map((r) => r.symbol))].slice(0, 20), [visible]);

  useEffect(() => {
    let cancelled = false;
    const todo = symbols.filter((s) => !queued.current.has(s));
    (async () => {
      for (const s of todo) {
        if (cancelled) break;
        queued.current.add(s);
        setSnaps((m) => ({ ...m, [s]: { status: 'loading' } }));
        const [p, r] = await Promise.allSettled([getNseProfile(s), getNseResults(s)]);
        if (cancelled) break;
        setSnaps((m) => ({
          ...m,
          [s]:
            p.status === 'fulfilled' || r.status === 'fulfilled'
              ? {
                  status: 'ok',
                  marketCap: p.status === 'fulfilled' ? p.value.marketCap : undefined,
                  industry: p.status === 'fulfilled' ? p.value.industry : undefined,
                  revenue: r.status === 'fulfilled' ? r.value.ttm?.revenue : undefined,
                  profit: r.status === 'fulfilled' ? r.value.ttm?.netProfit : undefined,
                }
              : { status: 'none' },
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbols]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: rows?.length ?? 0 };
    (rows ?? []).forEach((r) => r.category && (c[r.category] = (c[r.category] ?? 0) + 1));
    return c;
  }, [rows]);

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <Segmented value={cat} onChange={setCat} layoutId="india-activity-cat" size="sm" options={CATS.map((c) => ({ value: c, label: c === 'All' ? 'All M&A' : c, count: rows ? counts[c] ?? 0 : undefined }))} />
      </div>
      {error ? (
        <EmptyState icon={<AlertTriangle size={22} />} title="Could not load NSE announcements" description={error} />
      ) : !rows ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 54 }} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState icon={<Info size={22} />} title="No M&A disclosures in this period" description="Try a longer date range or another category." />
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }} data-no-reveal>
          <div className="legal-toolbar" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <strong className="font-mono" style={{ color: '#fff' }}>{visible.length}</strong> disclosures by NSE-listed companies
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Type</th>
                  <th>Disclosure</th>
                  <th>Date</th>
                  <th className="num">Market cap</th>
                  <th className="num">Revenue (TTM)</th>
                  <th className="num">Profit (TTM)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.slice(0, 100).map((r, i) => {
                  const s = snaps[r.symbol];
                  const cell = (v?: number) => (!s || s.status === 'loading' ? <span className="skeleton" style={{ display: 'inline-block', width: 56, height: 12 }} /> : fmtInr(v));
                  return (
                    <tr key={`${r.symbol}-${r.time}-${i}`} style={{ cursor: 'pointer' }} onClick={() => openIndiaResearch(r.symbol)}>
                      <td>
                        <div style={{ color: '#fff', fontWeight: 550 }}>{r.company}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                          <span className="font-mono" style={{ color: '#aab1ff' }}>{r.symbol}</span> · {s?.industry || r.industry}
                        </div>
                      </td>
                      <td><span className="badge badge-gray">{r.category}</span></td>
                      <td style={{ whiteSpace: 'normal', minWidth: 300, maxWidth: 460, fontSize: '0.8rem', color: 'var(--text-soft)' }}>{r.text || r.subject}</td>
                      <td className="font-mono" style={{ fontSize: '0.8rem' }}>{r.date}</td>
                      <td className="num">{cell(s?.marketCap)}</td>
                      <td className="num">{cell(s?.revenue)}</td>
                      <td className="num">{cell(s?.profit)}</td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        {r.url && (
                          <a className="icon-btn" style={{ width: 30, height: 30, display: 'inline-grid' }} href={r.url} target="_blank" rel="noreferrer" title="Open filing">
                            <ExternalLink size={14} />
                          </a>
                        )}{' '}
                        <button className="icon-btn" style={{ width: 30, height: 30, display: 'inline-grid' }} onClick={() => openIndiaResearch(r.symbol)} title="Open company research">
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
        <RefreshCw size={13} /> Source: NSE corporate announcements (SEBI LODR Regulation 30 and SAST disclosures), classified by AURA from the filing subject and summary. Financials load from each company's NSE quote and latest four quarterly results.
      </div>
    </>
  );
};
