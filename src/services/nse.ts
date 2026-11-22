/* ==========================================================================
   NSE India client (listed Indian companies)
   --------------------------------------------------------------------------
   Talks to the same-origin proxy /api/nse/*, which holds the NSE cookie
   session (see server/upstreams.mjs). Response shapes follow NSE's public
   website APIs as used by the maintained open-source clients NseIndiaApi and
   jugaad-data.

   Units: NSE results are reported in ₹ lakhs. Everything is converted to
   rupees here, so formatting is consistent across the app.
   ========================================================================== */

const BASE = (import.meta.env?.VITE_NSE_PROXY_BASE as string | undefined) ?? '/api/nse';
const LAKH = 100_000;

export class NseError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

const cache = new Map<string, { at: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
let lastCall = 0;

async function getJson<T>(path: string, ttlMs = 5 * 60 * 1000): Promise<T> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;
  const pending = inflight.get(path);
  if (pending) return pending as Promise<T>;
  const p = (async () => {
    // NSE is sensitive to bursts: keep to ~3 requests per second.
    const wait = Math.max(0, lastCall + 340 - Date.now());
    lastCall = Date.now() + wait;
    if (wait) await new Promise((r) => setTimeout(r, wait));
    let res: Response;
    try {
      res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } });
    } catch {
      throw new NseError('Could not reach the NSE data service. Check your connection or the /api/nse proxy.');
    }
    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('json')) throw new NseError('The NSE proxy is not configured: received a non-JSON response.');
    const data = await res.json();
    if (!res.ok) throw new NseError((data as { error?: string })?.error ?? `NSE request failed (${res.status}).`, res.status);
    cache.set(path, { at: Date.now(), data });
    return data as T;
  })();
  inflight.set(path, p);
  try {
    return await p;
  } finally {
    inflight.delete(path);
  }
}

const q = (params: Record<string, string | number | undefined>) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][]).toString();

/** dd-mm-yyyy, as NSE expects for date filters. */
export const nseDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;

const MONTHS: Record<string, number> = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
/** Parses "31-DEC-2024", "31-Dec-2024" and "18-Oct-2023 22:11:42" to ISO yyyy-mm-dd. */
export function parseNseDate(s?: string | null): string {
  if (!s) return '';
  const m = s.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
  if (!m) return '';
  const mon = MONTHS[m[2].toUpperCase()];
  if (mon === undefined) return '';
  return `${m[3]}-${String(mon + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

const num = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === '' || v === '-') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
};
const lakhs = (v: unknown) => {
  const n = num(v);
  return n === undefined ? undefined : n * LAKH;
};

/* ---------- Search ---------- */
export interface NseRef {
  symbol: string;
  name: string;
  series: string;
}

export async function searchNse(text: string): Promise<NseRef[]> {
  const t = text.trim();
  if (t.length < 2) return [];
  const r = await getJson<{ data?: { symbol: string; companyName: string; series?: string; segment?: string }[] }>(`/NextApi/globalSearch/equity?${q({ symbol: t })}`, 60 * 60 * 1000);
  const seen = new Set<string>();
  return (r.data ?? [])
    .filter((d) => d.symbol && (!d.segment || d.segment.includes('equity')))
    .filter((d) => (seen.has(d.symbol) ? false : (seen.add(d.symbol), true)))
    .slice(0, 8)
    .map((d) => ({ symbol: d.symbol, name: d.companyName, series: d.series ?? 'EQ' }));
}

/* ---------- Quote & profile ---------- */
export interface NseProfile {
  symbol: string;
  name: string;
  isin: string;
  series: string;
  status: string;
  listingDate: string;
  sector: string;
  industry: string;
  basicIndustry: string;
  indices: string[];
  faceValue?: number;
  issuedShares?: number;
  marketCap?: number;
  freeFloatMarketCap?: number;
  price?: number;
  change?: number;
  changePct?: number;
  yearHigh?: number;
  yearLow?: number;
  pe?: number;
  sectorPe?: number;
  updatedAt: string;
}

interface QuoteResponse {
  metaData: { companyName: string; isinCode: string; symbol: string; series: string; change?: number; pChange?: number; previousClose?: number };
  tradeInfo: { lastPrice?: number; issuedSize?: number; ffmc?: number; faceValue?: number; totalMarketCap?: number };
  priceInfo?: { yearHigh?: number; yearLow?: number };
  secInfo?: { secStatus?: string; listingDate?: string; pdSymbolPe?: string; pdSectorPe?: string; basicIndustry?: string; macro?: string; sector?: string; industryInfo?: string; indexList?: string[] };
  orderBook?: { lastPrice?: number };
  lastUpdateTime?: string;
}

export function mapQuote(r: QuoteResponse): NseProfile {
  const s = r.secInfo ?? {};
  return {
    symbol: r.metaData.symbol,
    name: r.metaData.companyName,
    isin: r.metaData.isinCode,
    series: r.metaData.series,
    status: s.secStatus ?? '',
    listingDate: parseNseDate(s.listingDate),
    sector: s.sector ?? s.macro ?? '',
    industry: s.industryInfo ?? '',
    basicIndustry: s.basicIndustry ?? '',
    indices: s.indexList ?? [],
    faceValue: num(r.tradeInfo.faceValue),
    issuedShares: num(r.tradeInfo.issuedSize),
    marketCap: num(r.tradeInfo.totalMarketCap),
    freeFloatMarketCap: num(r.tradeInfo.ffmc),
    price: num(r.tradeInfo.lastPrice) ?? num(r.orderBook?.lastPrice),
    change: num(r.metaData.change),
    changePct: num(r.metaData.pChange),
    yearHigh: num(r.priceInfo?.yearHigh),
    yearLow: num(r.priceInfo?.yearLow),
    pe: num(s.pdSymbolPe),
    sectorPe: num(s.pdSectorPe),
    updatedAt: r.lastUpdateTime ?? '',
  };
}

export async function getNseProfile(symbol: string, series = 'EQ'): Promise<NseProfile> {
  const r = await getJson<{ equityResponse?: QuoteResponse[] }>(
    `/NextApi/apiClient/GetQuoteApi?${q({ functionName: 'getSymbolData', marketType: 'N', series, symbol: symbol.toUpperCase() })}`,
    60 * 1000
  );
  const first = r.equityResponse?.[0];
  if (!first?.metaData) throw new NseError(`No NSE quote found for ${symbol}.`, 404);
  return mapQuote(first);
}

/* ---------- Quarterly results ---------- */
export interface NseQuarter {
  from: string;
  to: string;
  audited: boolean;
  revenue?: number; // revenue from operations (non-banks) or interest earned (banks)
  otherIncome?: number;
  totalIncome?: number;
  materials?: number;
  employeeCost?: number;
  otherExpenses?: number;
  totalExpenses?: number;
  depreciation?: number;
  financeCost?: number;
  exceptional?: number;
  profitBeforeTax?: number;
  tax?: number;
  netProfit?: number;
  epsBasic?: number;
  epsDiluted?: number;
  paidUpCapital?: number;
  faceValue?: number;
  debtEquity?: number;
  interestCoverage?: number;
  ebitda?: number;
  ebitdaMargin?: number;
  netMargin?: number;
}

type ResRow = Record<string, string | null>;

export function mapResultRow(r: ResRow, bank: boolean): NseQuarter {
  const revenue = bank ? lakhs(r.re_int_earned) ?? lakhs(r.re_total_inc) : lakhs(r.re_net_sale) ?? lakhs(r.re_total_inc);
  const otherIncome = lakhs(r.re_oth_inc_new) ?? lakhs(r.re_oth_inc);
  const pbt = lakhs(r.re_pro_loss_bef_tax);
  const fin = lakhs(r.re_int_new) ?? lakhs(r.re_int_expd);
  const dep = lakhs(r.re_depr_und_exp);
  const exceptional = lakhs(r.re_excepn_items_new) ?? lakhs(r.re_excepn_items);
  const materials = [lakhs(r.re_rawmat_consump), lakhs(r.re_pur_trd_goods), lakhs(r.re_inc_dre_sttr)].reduce<number | undefined>((a, b) => (b === undefined ? a : (a ?? 0) + b), undefined);
  // Operating EBITDA = PBT + finance costs + depreciation − other income − exceptional items (not meaningful for banks).
  const ebitda = !bank && pbt !== undefined && dep !== undefined ? pbt + (fin ?? 0) + dep - (otherIncome ?? 0) - (exceptional ?? 0) : undefined;
  const net = lakhs(r.re_net_profit) ?? lakhs(r.re_con_pro_loss) ?? lakhs(r.re_proloss_ord_act);
  return {
    from: parseNseDate(r.re_from_dt),
    to: parseNseDate(r.re_to_dt),
    audited: (r.re_res_type ?? '').toUpperCase() === 'A',
    revenue,
    otherIncome,
    totalIncome: lakhs(r.re_total_inc),
    materials,
    employeeCost: lakhs(r.re_staff_cost),
    otherExpenses: lakhs(r.re_oth_exp),
    totalExpenses: lakhs(r.re_oth_tot_exp),
    depreciation: dep,
    financeCost: fin,
    exceptional,
    profitBeforeTax: pbt,
    tax: lakhs(r.re_tax),
    netProfit: net,
    epsBasic: num(r.re_basic_eps_for_cont_dic_opr) ?? num(r.re_basic_eps),
    epsDiluted: num(r.re_dilut_eps_for_cont_dic_opr) ?? num(r.re_diluted_eps),
    paidUpCapital: lakhs(r.re_pdup),
    faceValue: num(r.re_face_val),
    debtEquity: num(r.re_debt_eqt_rat),
    interestCoverage: num(r.re_int_ser_cov),
    ebitda,
    ebitdaMargin: ebitda !== undefined && revenue ? (ebitda / revenue) * 100 : undefined,
    netMargin: net !== undefined && revenue ? (net / revenue) * 100 : undefined,
  };
}

export interface NseResults {
  bank: boolean;
  quarters: NseQuarter[]; // newest first
  ttm?: { revenue?: number; ebitda?: number; netProfit?: number; eps?: number; periodEnd: string };
  yoyRevenueGrowth?: number; // latest quarter vs same quarter a year earlier
}

export function buildResults(raw: { resCmpData?: ResRow[]; bankNonBnking?: string }): NseResults {
  const bank = (raw.bankNonBnking ?? '').toUpperCase() === 'B' || (raw.resCmpData ?? []).some((r) => num(r.re_int_earned) !== undefined);
  const quarters = (raw.resCmpData ?? [])
    .map((r) => mapResultRow(r, bank))
    .filter((x) => x.to)
    .sort((a, b) => b.to.localeCompare(a.to));
  // Keep one row per period (latest filing wins, which the sort above keeps first).
  const unique = quarters.filter((x, i, arr) => arr.findIndex((y) => y.to === x.to) === i);
  const last4 = unique.slice(0, 4);
  const sum = (k: keyof NseQuarter) => (last4.length === 4 && last4.every((x) => typeof x[k] === 'number') ? last4.reduce((a, x) => a + (x[k] as number), 0) : undefined);
  const yearAgo = unique.find((x) => {
    if (!unique[0]) return false;
    const d = (Date.parse(unique[0].to) - Date.parse(x.to)) / 86_400_000;
    return d > 350 && d < 380;
  });
  return {
    bank,
    quarters: unique,
    ttm: last4.length === 4 ? { revenue: sum('revenue'), ebitda: sum('ebitda'), netProfit: sum('netProfit'), eps: sum('epsDiluted') ?? sum('epsBasic'), periodEnd: last4[0].to } : undefined,
    yoyRevenueGrowth: yearAgo?.revenue && unique[0].revenue !== undefined ? ((unique[0].revenue - yearAgo.revenue) / Math.abs(yearAgo.revenue)) * 100 : undefined,
  };
}

export async function getNseResults(symbol: string): Promise<NseResults> {
  return buildResults(await getJson(`/results-comparision?${q({ symbol: symbol.toUpperCase() })}`, 30 * 60 * 1000));
}

/* ---------- Shareholding ---------- */
export interface NseShareholding {
  date: string;
  promoter?: number;
  public?: number;
  employeeTrusts?: number;
  xbrl: string;
}

export async function getNseShareholding(symbol: string): Promise<NseShareholding[]> {
  const r = await getJson<Record<string, string | null>[]>(`/corporate-share-holdings-master?${q({ index: 'equities', symbol: symbol.toUpperCase() })}`, 60 * 60 * 1000);
  return (Array.isArray(r) ? r : []).map((x) => ({
    date: parseNseDate(x.date),
    promoter: num(x.pr_and_prgrp),
    public: num(x.public_val),
    employeeTrusts: num(x.employeeTrusts),
    xbrl: x.xbrl ?? '',
  }));
}

/* ---------- Announcements, filings, reports ---------- */
export type IndiaDealCategory = 'Acquisition' | 'Merger / scheme' | 'Open offer / takeover' | 'Divestment' | 'Demerger' | 'Insolvency' | 'Delisting' | 'Fundraise';

const CATEGORY_RULES: [IndiaDealCategory, RegExp][] = [
  ['Open offer / takeover', /open offer|takeover|substantial acquisition|SAST|regulation 29|regulation 31\(1\)|letter of offer|detailed public statement/i],
  ['Demerger', /demerger|de-merger/i],
  ['Merger / scheme', /scheme of (arrangement|amalgamation)|amalgamation|merger|composite scheme|NCLT/i],
  ['Delisting', /delisting|delist/i],
  ['Insolvency', /insolvency|resolution plan|IBC|CIRP|liquidation/i],
  ['Divestment', /divest|disinvest|sale of (stake|shares|undertaking|business|division)|slump sale|business transfer|disposal/i],
  ['Acquisition', /acquisition|acquire|acquired|strategic investment|stake purchase|share purchase agreement|investment in/i],
  ['Fundraise', /preferential issue|qualified institutions placement|QIP|rights issue/i],
];

export function classifyAnnouncement(desc: string, text: string): IndiaDealCategory | null {
  const hay = `${desc} ${text}`;
  for (const [cat, re] of CATEGORY_RULES) if (re.test(hay)) return cat;
  return null;
}

export interface NseAnnouncement {
  symbol: string;
  company: string;
  industry: string;
  subject: string;
  text: string;
  date: string; // ISO date
  time: string; // original timestamp
  url: string;
  category: IndiaDealCategory | null;
}

type AnnRow = { symbol: string; sm_name: string; smIndustry?: string | null; desc: string; attchmntText?: string | null; an_dt?: string; sort_date?: string; attchmntFile?: string | null };

export const mapAnnouncement = (a: AnnRow): NseAnnouncement => ({
  symbol: a.symbol,
  company: a.sm_name,
  industry: a.smIndustry ?? '',
  subject: a.desc,
  text: a.attchmntText ?? '',
  date: a.sort_date?.slice(0, 10) || parseNseDate(a.an_dt),
  time: a.an_dt ?? '',
  url: a.attchmntFile ?? '',
  category: classifyAnnouncement(a.desc, a.attchmntText ?? ''),
});

export async function getNseAnnouncements(opts: { symbol?: string; from?: Date; to?: Date }): Promise<NseAnnouncement[]> {
  const params = q({
    index: 'equities',
    symbol: opts.symbol?.toUpperCase(),
    from_date: opts.from ? nseDate(opts.from) : undefined,
    to_date: opts.to ? nseDate(opts.to) : undefined,
  });
  const r = await getJson<AnnRow[]>(`/corporate-announcements?${params}`, 5 * 60 * 1000);
  return (Array.isArray(r) ? r : []).map(mapAnnouncement);
}

export interface NseResultFiling {
  period: string;
  periodEnd: string;
  audited: string;
  consolidated: string;
  filed: string;
  xbrl: string;
  pdf: string;
  label: string;
}

export async function getNseResultFilings(symbol: string): Promise<NseResultFiling[]> {
  const sym = symbol.toUpperCase();
  const [legacy, integrated] = await Promise.allSettled([
    getJson<Record<string, string | null>[]>(`/corporates-financial-results?${q({ index: 'equities', symbol: sym, period: 'Quarterly' })}`, 60 * 60 * 1000),
    getJson<{ data?: Record<string, string | null>[] }>(`/integrated-filing-results?${q({ index: 'equities', symbol: sym, type: 'Integrated Filing- Financials', page: 1, size: 20, period_ended: 'all' })}`, 60 * 60 * 1000),
  ]);
  const out: NseResultFiling[] = [];
  if (integrated.status === 'fulfilled')
    for (const x of integrated.value.data ?? [])
      out.push({
        period: x.type_Sub ?? 'Financial results',
        periodEnd: parseNseDate(x.qe_Date),
        audited: x.audited ?? '',
        consolidated: x.consolidated ?? '',
        filed: parseNseDate(x.broadcast_Date ?? x.creation_Date),
        xbrl: x.xbrl ?? '',
        pdf: x.pdf_attach ?? x.ixbrl ?? '',
        label: 'Integrated filing',
      });
  if (legacy.status === 'fulfilled' && Array.isArray(legacy.value))
    for (const x of legacy.value)
      out.push({
        period: x.relatingTo ?? x.period ?? '',
        periodEnd: parseNseDate(x.toDate),
        audited: x.audited ?? '',
        consolidated: x.consolidated ?? '',
        filed: parseNseDate(x.filingDate ?? x.broadCastDate),
        xbrl: x.xbrl ?? '',
        pdf: '',
        label: 'Financial results',
      });
  if (legacy.status === 'rejected' && integrated.status === 'rejected') throw legacy.reason;
  return out.sort((a, b) => b.periodEnd.localeCompare(a.periodEnd) || b.filed.localeCompare(a.filed));
}

export interface NseAnnualReport {
  fromYear: string;
  toYear: string;
  url: string;
  filed: string;
}

export async function getNseAnnualReports(symbol: string): Promise<NseAnnualReport[]> {
  const r = await getJson<{ data?: { fromYr: string; toYr: string; fileName: string; broadcast_dttm?: string }[] }>(`/annual-reports?${q({ index: 'equities', symbol: symbol.toUpperCase() })}`, 24 * 3600 * 1000);
  return (r.data ?? []).map((x) => ({ fromYear: x.fromYr, toYear: x.toYr, url: x.fileName, filed: parseNseDate(x.broadcast_dttm) })).sort((a, b) => b.toYear.localeCompare(a.toYear));
}

export interface NseBoardMeeting {
  date: string;
  purpose: string;
  subject: string;
  url: string;
}

export async function getNseBoardMeetings(symbol: string): Promise<NseBoardMeeting[]> {
  const r = await getJson<{ bm_date: string; bm_purpose: string; bm_desc: string; attachment?: string | null }[]>(`/corporate-board-meetings?${q({ index: 'equities', symbol: symbol.toUpperCase() })}`, 60 * 60 * 1000);
  return (Array.isArray(r) ? r : []).map((x) => ({ date: parseNseDate(x.bm_date), purpose: x.bm_purpose, subject: x.bm_desc, url: x.attachment ?? '' }));
}

/* ---------- Formatting (₹ lakh / crore) ---------- */
export function fmtInr(n?: number): string {
  if (n === undefined || Number.isNaN(n)) return '—';
  const sign = n < 0 ? '−' : '';
  const a = Math.abs(n);
  if (a >= 1e12) return `${sign}₹${(a / 1e12).toFixed(2)}L Cr`;
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toLocaleString('en-IN', { maximumFractionDigits: a >= 1e10 ? 0 : 1 })} Cr`;
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(1)} L`;
  return `${sign}₹${a.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}
