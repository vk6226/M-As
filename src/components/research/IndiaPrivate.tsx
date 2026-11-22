import React, { useMemo, useRef, useState } from 'react';
import { Upload, Download, FileSpreadsheet, ExternalLink, Plus, AlertTriangle, ClipboardList, LineChart } from 'lucide-react';
import { useDealflow } from '../../context/DealflowContext';
import { Panel, EmptyState } from '../ui/primitives';
import { fmtInr } from '../../services/nse';
import { FinancialBars } from './FinancialBars';
import { downloadTextFile } from '../../utils/exportUtils';
import { generateCompanyWithAi } from '../../utils/aiCompanyGenerator';

/* Line items follow Schedule III of the Companies Act, 2013 (as filed in AOC-4). */
const ITEMS = [
  { key: 'revenue', label: 'Revenue from operations' },
  { key: 'otherIncome', label: 'Other income' },
  { key: 'totalExpenses', label: 'Total expenses' },
  { key: 'financeCost', label: 'Finance costs' },
  { key: 'depreciation', label: 'Depreciation and amortisation' },
  { key: 'pbt', label: 'Profit before tax' },
  { key: 'tax', label: 'Tax expense' },
  { key: 'pat', label: 'Profit after tax' },
  { key: 'netWorth', label: 'Total equity (net worth)' },
  { key: 'borrowings', label: 'Total borrowings' },
  { key: 'cash', label: 'Cash and cash equivalents' },
  { key: 'totalAssets', label: 'Total assets' },
  { key: 'ocf', label: 'Net cash from operating activities' },
  { key: 'capex', label: 'Purchase of property, plant and equipment' },
] as const;
type ItemKey = (typeof ITEMS)[number]['key'];

interface Year {
  label: string;
  v: Partial<Record<ItemKey, number>>;
}

const TEMPLATE = ['Line item (₹ lakh),FY2024,FY2025,FY2026', ...ITEMS.map((i) => `${i.label},,,`)].join('\n');

/** Parses the template CSV. Values are in ₹ lakh, like most AOC-4 statements; converted to rupees. */
export function parsePrivateCsv(text: string): { years: Year[]; errors: string[] } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const errors: string[] = [];
  if (lines.length < 2) return { years: [], errors: ['The file is empty.'] };
  const split = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') quoted = false;
        else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',') {
        out.push(cur.trim());
        cur = '';
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  const head = split(lines[0]);
  const years: Year[] = head.slice(1).filter(Boolean).map((label) => ({ label, v: {} }));
  if (!years.length) errors.push('No year columns found in the header row.');
  for (const line of lines.slice(1)) {
    const cells = split(line);
    const item = ITEMS.find((i) => i.label.toLowerCase() === cells[0]?.toLowerCase());
    if (!item) continue;
    years.forEach((y, i) => {
      const raw = (cells[i + 1] ?? '').replace(/[,\s₹]/g, '').replace(/^\((.*)\)$/, '-$1');
      if (raw === '') return;
      const n = Number(raw);
      if (Number.isFinite(n)) y.v[item.key] = n * 100_000;
      else errors.push(`${item.label} / ${y.label}: "${cells[i + 1]}" is not a number.`);
    });
  }
  if (years.every((y) => y.v.revenue === undefined)) errors.push('Revenue from operations is missing.');
  return { years, errors };
}

const MCA_DOCS = [
  ['Master data (CIN, status, capital, directors)', 'Company and LLP master data on the MCA V3 portal'],
  ['AOC-4 / AOC-4 XBRL', 'Audited financial statements, auditor and board reports, for each year'],
  ['MGT-7 / MGT-7A', 'Annual return: shareholding, directors, meetings and remuneration'],
  ['CHG-1, CHG-4, CHG-9 and the index of charges', 'Secured lenders and charges over assets that must be released at closing'],
  ['PAS-3 and SH-7', 'Share allotments and changes in authorised capital (verifies the cap table)'],
  ['DIR-12 and DIR-3 KYC', 'Director appointments, resignations and KYC status'],
  ['MGT-14', 'Special resolutions and board resolutions filed with the ROC'],
  ['INC-22 and INC-20A', 'Registered office and commencement of business declarations'],
  ['ADT-1', 'Statutory auditor appointment'],
  ['BEN-2 / MGT-6', 'Significant beneficial owners'],
  ['MSME-1 and DPT-3', 'Dues to MSMEs and outstanding deposits / exempted loans'],
];

export const IndiaPrivate: React.FC = () => {
  const { addTarget, showToast } = useDealflow();
  const [name, setName] = useState('');
  const [cin, setCin] = useState('');
  const [years, setYears] = useState<Year[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cinValid = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test(cin.trim().toUpperCase());

  const onFile = async (f: File) => {
    const { years: ys, errors: es } = parsePrivateCsv(await f.text());
    setErrors(es);
    setYears(ys.length ? ys : null);
    if (ys.length && !es.length) showToast('success', 'Financials imported', `${ys.length} years loaded from ${f.name}.`);
  };

  const derived = useMemo(
    () =>
      (years ?? []).map((y, i, arr) => {
        const v = y.v;
        const ebitda = v.pbt !== undefined ? v.pbt + (v.financeCost ?? 0) + (v.depreciation ?? 0) - (v.otherIncome ?? 0) : undefined;
        const prev = arr[i - 1]?.v.revenue;
        return {
          ...y,
          ebitda,
          growth: v.revenue !== undefined && prev ? ((v.revenue - prev) / Math.abs(prev)) * 100 : undefined,
          ebitdaMargin: ebitda !== undefined && v.revenue ? (ebitda / v.revenue) * 100 : undefined,
          patMargin: v.pat !== undefined && v.revenue ? (v.pat / v.revenue) * 100 : undefined,
          netDebt: v.borrowings !== undefined ? v.borrowings - (v.cash ?? 0) : undefined,
          debtEquity: v.borrowings !== undefined && v.netWorth ? v.borrowings / v.netWorth : undefined,
          roe: v.pat !== undefined && v.netWorth ? (v.pat / v.netWorth) * 100 : undefined,
          fcf: v.ocf !== undefined ? v.ocf - Math.abs(v.capex ?? 0) : undefined,
        };
      }),
    [years]
  );
  const latest = derived[derived.length - 1];
  const pct = (n?: number) => (n === undefined ? '—' : `${n.toFixed(1)}%`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
      <div className="notice" style={{ marginTop: 0 }}>
        <AlertTriangle size={16} color="var(--amber)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: '0.84rem', color: 'var(--text-soft)', lineHeight: 1.55 }}>
          Unlisted Indian companies file financial statements with the Ministry of Corporate Affairs (MCA), which has no free public API. Download the AOC-4 statements from the MCA V3 portal (or a licensed provider such as Tofler, Probe42 or CMIE Prowess), or use the target's data room. Then import them here in the template format.
        </div>
      </div>

      <div className="dash-grid" style={{ alignItems: 'start' }}>
        <Panel title="Company" subtitle="Identify the target by its Corporate Identification Number" icon={<FileSpreadsheet size={16} />}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="field">
              <span>Company name</span>
              <input className="input-text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Example Technologies Private Limited" />
            </label>
            <label className="field">
              <span>CIN {cin && (cinValid ? <span style={{ color: 'var(--emerald)' }}>· valid format</span> : <span style={{ color: 'var(--amber)' }}>· check format</span>)}</span>
              <input className="input-text font-mono" value={cin} onChange={(e) => setCin(e.target.value.toUpperCase())} placeholder="U72200KA2015PTC012345" maxLength={21} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            <a className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border-subtle)' }} href="https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html" target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> MCA master data
            </a>
            <button className="btn btn-secondary btn-sm" onClick={() => downloadTextFile(TEMPLATE, 'AURA_private_company_financials_template.csv', 'text/csv')}>
              <Download size={14} /> Download template
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Import financials CSV
            </button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </div>
          {errors.length > 0 && (
            <div className="inline-error">
              <AlertTriangle size={14} />
              <span>{errors.slice(0, 4).join(' ')}</span>
            </div>
          )}
        </Panel>

        <Panel title="MCA documents to obtain" subtitle="Core ROC filings for diligence on an unlisted Indian company" icon={<ClipboardList size={16} />}>
          <div className="check-grid">
            {MCA_DOCS.map(([doc, why]) => (
              <div key={doc} className="check-grid__row" style={{ flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#fff', fontSize: '0.84rem' }}>{doc}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{why}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {!years ? (
        <EmptyState icon={<FileSpreadsheet size={22} />} title="No financials imported yet" description="Download the template, fill in the AOC-4 figures in ₹ lakh, and import it to see the analysis." />
      ) : (
        <>
          <div className="research-tiles">
            {[
              { l: `Revenue · ${latest?.label}`, v: fmtInr(latest?.v.revenue), h: latest?.growth !== undefined ? `${pct(latest.growth)} YoY` : undefined },
              { l: 'EBITDA', v: fmtInr(latest?.ebitda), h: `${pct(latest?.ebitdaMargin)} margin` },
              { l: 'Profit after tax', v: fmtInr(latest?.v.pat), h: `${pct(latest?.patMargin)} margin` },
              { l: 'Net worth', v: fmtInr(latest?.v.netWorth), h: latest?.roe !== undefined ? `ROE ${pct(latest.roe)}` : undefined },
              { l: 'Net debt', v: fmtInr(latest?.netDebt), h: latest?.debtEquity !== undefined ? `D/E ${latest.debtEquity.toFixed(2)}x` : undefined },
              { l: 'Free cash flow', v: fmtInr(latest?.fcf), h: 'OCF less capex' },
            ].map((t) => (
              <div key={t.l} className="glass-panel" style={{ padding: 16 }} data-no-reveal>
                <div className="stat__label">{t.l}</div>
                <div className="font-mono" style={{ fontSize: '1.3rem', fontWeight: 600, color: '#fff', marginTop: 4 }}>{t.v}</div>
                {t.h && <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: 2 }}>{t.h}</div>}
              </div>
            ))}
          </div>
          <div className="dash-grid">
            <Panel title="Revenue, EBITDA and profit" subtitle="From imported AOC-4 figures" icon={<LineChart size={16} />}>
              <FinancialBars
                years={derived.map((d) => d.label)}
                format={fmtInr}
                series={[
                  { name: 'Revenue', values: derived.map((d) => d.v.revenue) },
                  { name: 'EBITDA', values: derived.map((d) => d.ebitda) },
                  { name: 'Profit after tax', values: derived.map((d) => d.v.pat) },
                ]}
              />
            </Panel>
            <Panel
              title="Statement"
              subtitle={cin ? `CIN ${cin}` : 'Imported figures'}
              icon={<FileSpreadsheet size={16} />}
              actions={
                <button
                  className="btn btn-primary btn-sm"
                  disabled={!name.trim()}
                  title={name.trim() ? undefined : 'Enter the company name first'}
                  onClick={() => {
                    const base = generateCompanyWithAi(name.trim());
                    const toM = (n?: number) => (n === undefined ? undefined : n / 1e6 / 83);
                    addTarget({
                      ...base,
                      name: name.trim(),
                      tagline: `Unlisted Indian company${cin ? ` · CIN ${cin}` : ''} · financials imported from AOC-4`,
                      headquarters: { ...base.headquarters, country: 'India', region: 'APAC' },
                      financials: { ...base.financials, arr: toM(latest?.v.revenue) ?? base.financials.arr, revenueLTM: toM(latest?.v.revenue) ?? base.financials.revenueLTM, revenueGrowthYoY: latest?.growth ?? base.financials.revenueGrowthYoY, ebitdaLTM: toM(latest?.ebitda) ?? base.financials.ebitdaLTM, ebitdaMargin: latest?.ebitdaMargin ?? base.financials.ebitdaMargin },
                    });
                    showToast('success', 'Added to target universe', `${name.trim()} added with imported financials.`);
                  }}
                >
                  <Plus size={14} /> Add to targets
                </button>
              }
            >
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>₹</th>
                      {derived.map((d) => (
                        <th key={d.label} className="num">{d.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ITEMS.map((i) => (
                      <tr key={i.key}>
                        <td>{i.label}</td>
                        {derived.map((d) => (
                          <td key={d.label} className="num">{fmtInr(d.v[i.key])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
};
