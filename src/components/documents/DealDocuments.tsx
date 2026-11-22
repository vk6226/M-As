import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FileText, Download, Copy, X, Search, ExternalLink, AlertTriangle, CheckCircle2, ChevronDown, Library, FileSignature, Scale } from 'lucide-react';
import { useDealflow } from '../../context/DealflowContext';
import { PageContainer, PageHeader, Panel, Segmented, EmptyState } from '../ui/primitives';
import {
  JURISDICTIONS,
  PHASES,
  STRUCTURES,
  tailorChecklist,
  type ChecklistDoc,
  type DealConfig,
  type Phase,
  type TemplateId,
} from '../../data/maDocumentChecklist';
import { renderTemplate, type DealParties } from '../../data/maTemplates';
import { fullTextSearch, isoDaysAgo, type FtsHit } from '../../services/sec';
import { downloadTextFile } from '../../utils/exportUtils';

export const DOC_STATUSES = ['Not started', 'Requested', 'Drafting', 'In negotiation', 'Agreed', 'Signed', 'Filed', 'Not applicable'] as const;
type DocStatus = (typeof DOC_STATUSES)[number];
const DONE: DocStatus[] = ['Agreed', 'Signed', 'Filed', 'Not applicable'];

const statusTone = (s: DocStatus) =>
  s === 'Signed' || s === 'Filed' || s === 'Agreed' ? 'badge-emerald' : s === 'Not applicable' ? 'badge-gray' : s === 'Not started' ? 'badge-gray' : s === 'In negotiation' ? 'badge-amber' : 'badge-cyan';

interface DealRoom {
  config: DealConfig;
  parties: DealParties;
  statuses: Record<string, DocStatus>;
}

const STORAGE = 'aura_deal_rooms_v1';
const loadRooms = (): Record<string, DealRoom> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE) ?? '{}');
  } catch {
    return {};
  }
};

const TEMPLATE_LABEL: Record<TemplateId, string> = {
  nda: 'NDA',
  loi: 'Letter of intent',
  exclusivity: 'Exclusivity agreement',
  'dd-request': 'DD request list',
  'board-resolution': 'Board resolutions',
  'closing-checklist': 'Closing checklist',
  'disclosure-index': 'Disclosure schedule index',
  'funds-flow': 'Funds flow memo',
};

export const DealDocuments: React.FC = () => {
  const { pipeline, targets, acquirer, showToast } = useDealflow();
  const deals = useMemo(
    () =>
      pipeline
        .map((d) => ({ deal: d, target: targets.find((t) => t.id === d.targetId) }))
        .filter((x): x is { deal: typeof x.deal; target: NonNullable<typeof x.target> } => !!x.target),
    [pipeline, targets]
  );

  const [dealId, setDealId] = useState<string>(() => deals[0]?.deal.id ?? 'custom');
  const [rooms, setRooms] = useState<Record<string, DealRoom>>(loadRooms);
  const [preview, setPreview] = useState<{ title: string; body: string; file: string } | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'all' | 'open' | 'critical'>('all');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(rooms));
    } catch {
      /* ignore */
    }
  }, [rooms]);

  const selected = deals.find((d) => d.deal.id === dealId);
  const room: DealRoom = rooms[dealId] ?? {
    config: {
      structure: 'stock-purchase',
      jurisdiction: selected?.target.headquarters.region === 'APAC' && selected.target.headquarters.country === 'India' ? 'IN' : selected?.target.headquarters.region === 'EMEA' ? 'UK' : 'US',
      targetType: selected?.target.ownership.includes('Public') ? 'public' : 'private',
      crossBorder: false,
      financed: true,
    },
    parties: {
      buyer: acquirer.name,
      target: selected?.target.name ?? 'Target Company',
      seller: selected ? `Shareholders of ${selected.target.name}` : 'Sellers',
      price: selected ? `$${selected.deal.expectedValuationM.toFixed(1)}M` : '',
      codeName: selected?.target.codeName ?? 'Project [NAME]',
    },
    statuses: {},
  };

  const update = (patch: Partial<DealRoom>) => setRooms((r) => ({ ...r, [dealId]: { ...room, ...patch } }));
  const setConfig = (patch: Partial<DealConfig>) => update({ config: { ...room.config, ...patch } });
  const setStatus = (id: string, s: DocStatus) => update({ statuses: { ...room.statuses, [id]: s } });

  const docs = useMemo(() => tailorChecklist(room.config), [room.config]);
  const statusOf = (d: ChecklistDoc): DocStatus => room.statuses[d.id] ?? 'Not started';
  const done = docs.filter((d) => DONE.includes(statusOf(d))).length;
  const criticalOpen = docs.filter((d) => d.critical && !DONE.includes(statusOf(d)));
  const pct = docs.length ? Math.round((done / docs.length) * 100) : 0;

  const visible = docs.filter((d) => (filter === 'open' ? !DONE.includes(statusOf(d)) : filter === 'critical' ? d.critical : true));

  const openTemplate = (id: TemplateId) => {
    const body = renderTemplate(id, room.parties, room.config, docs, room.statuses);
    setPreview({ title: TEMPLATE_LABEL[id], body, file: `${room.parties.codeName.replace(/\s+/g, '_')}_${id}.md` });
  };

  const exportChecklist = () => {
    const body = renderTemplate('closing-checklist', room.parties, room.config, docs, room.statuses);
    downloadTextFile(body, `${room.parties.codeName.replace(/\s+/g, '_')}_document_checklist.md`, 'text/markdown');
    showToast('success', 'Checklist exported', `${docs.length} documents with current status.`);
  };

  return (
    <PageContainer wide>
      <PageHeader
        eyebrow="Legal"
        title="Deal documents"
        description="Every document needed to sign and close, tailored to the deal structure and jurisdiction. Track status and draft first versions from templates."
        actions={
          <button className="btn btn-primary" onClick={exportChecklist}>
            <Download size={15} /> Export checklist
          </button>
        }
      />

      {/* Deal configuration */}
      <Panel title="Transaction set-up" subtitle="Changing these updates the checklist instantly" icon={<FileSignature size={16} />}>
        <div className="docs-config">
          <label className="field">
            <span>Deal</span>
            <select value={dealId} onChange={(e) => setDealId(e.target.value)}>
              {deals.map(({ deal, target }) => (
                <option key={deal.id} value={deal.id}>
                  {target.name} · {target.codeName}
                </option>
              ))}
              <option value="custom">New transaction</option>
            </select>
          </label>
          <label className="field">
            <span>Buyer</span>
            <input className="input-text" value={room.parties.buyer} onChange={(e) => update({ parties: { ...room.parties, buyer: e.target.value } })} />
          </label>
          <label className="field">
            <span>Target</span>
            <input className="input-text" value={room.parties.target} onChange={(e) => update({ parties: { ...room.parties, target: e.target.value } })} />
          </label>
          <label className="field">
            <span>Price / EV</span>
            <input className="input-text" value={room.parties.price} onChange={(e) => update({ parties: { ...room.parties, price: e.target.value } })} placeholder="$100.0M" />
          </label>
          <label className="field">
            <span>Structure</span>
            <select value={room.config.structure} onChange={(e) => setConfig({ structure: e.target.value as DealConfig['structure'] })}>
              {STRUCTURES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Governing jurisdiction</span>
            <select value={room.config.jurisdiction} onChange={(e) => setConfig({ jurisdiction: e.target.value as DealConfig['jurisdiction'] })}>
              {JURISDICTIONS.map((j) => (
                <option key={j.id} value={j.id}>{j.label}</option>
              ))}
            </select>
          </label>
          <div className="field">
            <span>Target</span>
            <Segmented
              value={room.config.targetType}
              onChange={(v) => setConfig({ targetType: v })}
              layoutId="docs-target-type"
              size="sm"
              options={[
                { value: 'private', label: 'Private' },
                { value: 'public', label: 'Listed' },
              ]}
            />
          </div>
          <div className="field" style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <button className={`chip${room.config.crossBorder ? ' is-active' : ''}`} onClick={() => setConfig({ crossBorder: !room.config.crossBorder })}>
              Foreign buyer / cross-border
            </button>
            <button className={`chip${room.config.financed ? ' is-active' : ''}`} onClick={() => setConfig({ financed: !room.config.financed })}>
              Debt-financed
            </button>
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: 12 }}>{STRUCTURES.find((s) => s.id === room.config.structure)?.description}</p>
      </Panel>

      <div className="docs-layout">
        {/* Progress rail */}
        <aside className="docs-rail">
          <div className="glass-panel" style={{ padding: 18 }} data-no-reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="score-ring score-high" style={{ ['--val' as string]: pct, width: 58, height: 58 }}>
                <span>{pct}%</span>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#fff' }}>{done} of {docs.length} complete</div>
                <div style={{ fontSize: '0.76rem', color: criticalOpen.length ? 'var(--amber)' : 'var(--emerald)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  {criticalOpen.length ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                  {criticalOpen.length ? `${criticalOpen.length} critical items open` : 'All critical items done'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
              {PHASES.map((ph) => {
                const inPhase = docs.filter((d) => d.phase === ph);
                if (!inPhase.length) return null;
                const pDone = inPhase.filter((d) => DONE.includes(statusOf(d))).length;
                return (
                  <a key={ph} href={`#phase-${ph.replace(/\s+/g, '-')}`} className="docs-rail__phase">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: pDone === inPhase.length ? 'var(--emerald)' : 'var(--text-soft)' }}>{ph}</span>
                      <span className="font-mono" style={{ color: 'var(--text-subtle)' }}>{pDone}/{inPhase.length}</span>
                    </div>
                    <div className="tcard__bar" style={{ marginTop: 5 }}>
                      <i style={{ width: `${(pDone / inPhase.length) * 100}%`, background: pDone === inPhase.length ? 'var(--emerald)' : undefined }} />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 18, marginTop: 14 }} data-no-reveal>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', marginBottom: 10 }}>Draft from template</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(Object.keys(TEMPLATE_LABEL) as TemplateId[]).map((t) => (
                <button key={t} className="check-row" onClick={() => openTemplate(t)}>
                  <FileText size={14} color="var(--accent)" /> {TEMPLATE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Checklist */}
        <div style={{ minWidth: 0 }}>
          <div className="results-toolbar" style={{ marginTop: 0 }}>
            <div className="results-count">
              <strong>{visible.length}</strong> documents
            </div>
            <Segmented
              value={filter}
              onChange={setFilter}
              layoutId="docs-filter"
              size="sm"
              options={[
                { value: 'all', label: 'All' },
                { value: 'open', label: 'Open', count: docs.length - done },
                { value: 'critical', label: 'Critical', count: docs.filter((d) => d.critical).length },
              ]}
            />
          </div>

          {visible.length === 0 && <EmptyState icon={<CheckCircle2 size={22} />} title="Nothing left here" description="Every document in this view is complete." />}

          {PHASES.map((ph) => {
            const list = visible.filter((d) => d.phase === ph);
            if (!list.length) return null;
            const isCollapsed = collapsed[ph];
            return (
              <section key={ph} id={`phase-${ph.replace(/\s+/g, '-')}`} className="glass-panel docs-phase" data-no-reveal>
                <button className="docs-phase__head" onClick={() => setCollapsed((c) => ({ ...c, [ph]: !c[ph] }))} aria-expanded={!isCollapsed}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{ph}</span>
                  <span className="segmented__count">{list.length}</span>
                  <ChevronDown size={16} style={{ marginLeft: 'auto', transition: 'transform 0.3s', transform: isCollapsed ? 'rotate(-90deg)' : 'none', color: 'var(--text-subtle)' }} />
                </button>
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} style={{ overflow: 'hidden' }}>
                      {list.map((d) => {
                        const st = statusOf(d);
                        return (
                          <div key={d.id} className={`docs-row${DONE.includes(st) ? ' is-done' : ''}`}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span className="docs-row__name">{d.name}</span>
                                {d.critical && <span className="badge badge-amber" style={{ height: 19, fontSize: '0.66rem' }}>Critical</span>}
                                <span className="badge badge-gray" style={{ height: 19, fontSize: '0.66rem' }}>{d.owner}</span>
                              </div>
                              <p className="docs-row__purpose">{d.purpose}</p>
                              {d.references && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                                  {d.references.map((r) => (
                                    <span key={r} className="docs-ref"><Scale size={10} /> {r}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="docs-row__actions">
                              {d.template && (
                                <button className="btn btn-ghost btn-sm" onClick={() => openTemplate(d.template!)} style={{ border: '1px solid var(--border-subtle)' }}>
                                  <FileText size={13} /> Draft
                                </button>
                              )}
                              <select value={st} onChange={(e) => setStatus(d.id, e.target.value as DocStatus)} className={`status-select ${statusTone(st)}`} aria-label={`Status of ${d.name}`}>
                                {DOC_STATUSES.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            );
          })}

          <PrecedentSearch />

          <p className="legal-disclaimer">
            This checklist reflects common market practice and the statutes cited. It is not legal advice. Thresholds, deadlines and filing
            requirements change and depend on the facts of each deal, so confirm every item with qualified counsel in each relevant jurisdiction.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreview(null)}>
            <div className="modal-content" style={{ maxWidth: 860, display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="panel__icon"><FileText size={16} /></span>
                  <div>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{preview.title}</h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>First draft for counsel. Placeholders are in [brackets].</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      navigator.clipboard?.writeText(preview.body).then(
                        () => showToast('success', 'Copied', `${preview.title} copied to clipboard.`),
                        () => showToast('warning', 'Copy failed', 'Your browser blocked clipboard access.')
                      );
                    }}
                  >
                    <Copy size={14} /> Copy
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      downloadTextFile(preview.body, preview.file, 'text/markdown');
                      showToast('success', 'Downloaded', preview.file);
                    }}
                  >
                    <Download size={14} /> Download
                  </button>
                  <button className="icon-btn" onClick={() => setPreview(null)} aria-label="Close">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <pre className="template-preview">{preview.body}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

/* ---------- Precedent agreements from SEC EDGAR ---------- */
const PrecedentSearch: React.FC = () => {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<'merger' | 'spa' | 'apa'>('merger');
  const [hits, setHits] = useState<FtsHit[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const phrase = { merger: '"agreement and plan of merger"', spa: '"stock purchase agreement"', apa: '"asset purchase agreement"' }[kind];

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fullTextSearch({ q: `${phrase}${q.trim() ? ` ${q.trim()}` : ''}`, forms: ['8-K', '8-K/A'], startdt: isoDaysAgo(365 * 3) });
      // Keep exhibits only (the agreement itself), not the 8-K cover.
      const ex = res.hits.filter((h) => /ex-?2|ex-?10|ex2|ex10/i.test(h.fileName) || /EX-2|EX-10/i.test(h.description));
      setHits(ex.length ? ex : res.hits);
      setTotal(res.total);
    } catch (e) {
      setError((e as Error).message);
      setHits(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel
      title="Precedent agreements"
      subtitle="Signed deal agreements filed with the SEC in the last three years. Useful for drafting and benchmarking terms."
      icon={<Library size={16} />}
      style={{ marginTop: 20 }}
    >
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Segmented
          value={kind}
          onChange={setKind}
          layoutId="precedent-kind"
          size="sm"
          options={[
            { value: 'merger', label: 'Merger agreements' },
            { value: 'spa', label: 'Stock purchase' },
            { value: 'apa', label: 'Asset purchase' },
          ]}
        />
        <label className="search-field" style={{ flex: 1, minWidth: 220 }}>
          <Search size={14} />
          <input className="input-text" style={{ height: 34 }} placeholder="Optional keyword: industry, company, clause (e.g. reverse termination fee)" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run()} />
        </label>
        <button className="btn btn-primary btn-sm" style={{ height: 34 }} onClick={run} disabled={loading}>
          {loading ? <span className="spinner" /> : <Search size={14} />} Search EDGAR
        </button>
      </div>
      {error && <div className="inline-error"><AlertTriangle size={14} /> {error}</div>}
      {hits && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: 8 }}>{total.toLocaleString()} matching filings · showing {hits.length}</div>
          {hits.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No agreements found. Try a broader keyword.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {hits.slice(0, 25).map((h) => (
                <a key={`${h.accession}-${h.fileName}`} href={h.url} target="_blank" rel="noreferrer" className="milestone lift-row" style={{ textDecoration: 'none' }}>
                  <span className="doc-icon"><FileText size={14} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 550 }}>{h.companyName}{h.ticker ? ` (${h.ticker})` : ''}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>{h.form} · filed {h.filed} · {h.fileName}</div>
                  </div>
                  <ExternalLink size={14} color="var(--text-subtle)" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
};
