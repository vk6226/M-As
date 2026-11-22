/* ==========================================================================
   SEC EDGAR client
   --------------------------------------------------------------------------
   All requests go through a same-origin proxy (/api/sec/*) because the SEC
   APIs do not send CORS headers and require a descriptive User-Agent, which
   browsers are not allowed to set. The proxy is configured in:
     - vite.config.ts           (local dev + `vite preview`)
     - nginx.conf               (Docker / self-hosted)
     - lambda/sec_proxy.mjs     (AWS Lambda behind CloudFront)
   SEC fair-access policy: at most 10 requests per second. We stay below that.
   ========================================================================== */

const BASE = (import.meta.env?.VITE_SEC_PROXY_BASE as string | undefined) ?? '/api/sec';

export class SecError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

/* ---------- Rate-limited, cached fetch ---------- */
const MAX_PER_SECOND = 8;
const stamps: number[] = [];
const memCache = new Map<string, { at: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

async function throttle() {
  for (;;) {
    const now = Date.now();
    while (stamps.length && now - stamps[0] > 1000) stamps.shift();
    if (stamps.length < MAX_PER_SECOND) {
      stamps.push(now);
      return;
    }
    await new Promise((r) => setTimeout(r, 1000 - (now - stamps[0]) + 5));
  }
}

async function getJson<T>(path: string, ttlMs = 10 * 60 * 1000): Promise<T> {
  const cached = memCache.get(path);
  if (cached && Date.now() - cached.at < ttlMs) return cached.data as T;
  const pending = inflight.get(path);
  if (pending) return pending as Promise<T>;

  const p = (async () => {
    await throttle();
    let res: Response;
    try {
      res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } });
    } catch {
      throw new SecError('Could not reach the SEC data service. Check your connection or the /api/sec proxy.');
    }
    if (res.status === 404) throw new SecError('Not found in SEC EDGAR.', 404);
    if (res.status === 429 || res.status === 403) throw new SecError('The SEC is rate-limiting requests. Wait a few seconds and try again.', res.status);
    if (!res.ok) throw new SecError(`SEC request failed (${res.status}).`, res.status);
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('json')) throw new SecError('The SEC proxy is not configured: received a non-JSON response.');
    const data = (await res.json()) as T;
    memCache.set(path, { at: Date.now(), data });
    return data;
  })();
  inflight.set(path, p);
  try {
    return await p;
  } finally {
    inflight.delete(path);
  }
}

export const padCik = (cik: string | number) => String(cik).replace(/\D/g, '').padStart(10, '0');
const stripCik = (cik: string | number) => String(Number(String(cik).replace(/\D/g, '')));

/* ---------- Company directory (ticker / name search) ---------- */
export interface CompanyRef {
  cik: string; // 10-digit
  ticker: string;
  name: string;
}

let directory: CompanyRef[] | null = null;
let directoryPromise: Promise<CompanyRef[]> | null = null;

export async function loadDirectory(): Promise<CompanyRef[]> {
  if (directory) return directory;
  if (!directoryPromise) {
    directoryPromise = getJson<Record<string, { cik_str: number; ticker: string; title: string }>>('/www/files/company_tickers.json', 24 * 3600 * 1000)
      .then((raw) => {
        directory = Object.values(raw).map((r) => ({ cik: padCik(r.cik_str), ticker: r.ticker, name: r.title }));
        return directory;
      })
      .catch((e) => {
        directoryPromise = null;
        throw e;
      });
  }
  return directoryPromise;
}

export function searchDirectory(list: CompanyRef[], query: string, limit = 8): CompanyRef[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  if (/^\d{1,10}$/.test(q)) {
    const cik = padCik(q);
    return list.filter((c) => c.cik === cik).slice(0, limit);
  }
  const scored: { c: CompanyRef; s: number }[] = [];
  for (const c of list) {
    const t = c.ticker.toLowerCase();
    const n = c.name.toLowerCase();
    let s = 0;
    if (t === q) s = 100;
    else if (n === q) s = 95;
    else if (t.startsWith(q)) s = 80 - t.length;
    else if (n.startsWith(q)) s = 70;
    else if (n.split(/[\s,.-]+/).some((w) => w.startsWith(q))) s = 50;
    else if (n.includes(q)) s = 30;
    if (s) scored.push({ c, s });
  }
  // One row per CIK (companies can have several share classes)
  const seen = new Set<string>();
  return scored
    .sort((a, b) => b.s - a.s)
    .filter(({ c }) => (seen.has(c.cik) ? false : (seen.add(c.cik), true)))
    .slice(0, limit)
    .map((x) => x.c);
}

/* ---------- Submissions (profile + filing history) ---------- */
export interface Filing {
  accession: string;
  form: string;
  filed: string;
  reportDate: string;
  primaryDoc: string;
  description: string;
  items: string[];
  url: string;
  indexUrl: string;
}

export interface CompanyProfile {
  cik: string;
  name: string;
  tickers: string[];
  exchanges: string[];
  sic: string;
  sicDescription: string;
  stateOfIncorporation: string;
  fiscalYearEnd: string;
  entityType: string;
  category: string;
  website: string;
  phone: string;
  businessAddress: string;
  formerNames: string[];
  filings: Filing[];
}

interface SubmissionsResponse {
  cik: string;
  name: string;
  tickers?: string[];
  exchanges?: string[];
  sic?: string;
  sicDescription?: string;
  stateOfIncorporation?: string;
  fiscalYearEnd?: string;
  entityType?: string;
  category?: string;
  website?: string;
  phone?: string;
  addresses?: { business?: { street1?: string; city?: string; stateOrCountry?: string; zipCode?: string } };
  formerNames?: { name: string }[];
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      form: string[];
      primaryDocument: string[];
      primaryDocDescription: string[];
      items: string[];
    };
  };
}

export const filingUrl = (cik: string, accession: string, doc: string) =>
  `https://www.sec.gov/Archives/edgar/data/${stripCik(cik)}/${accession.replace(/-/g, '')}/${doc}`;
export const filingIndexUrl = (cik: string, accession: string) =>
  `https://www.sec.gov/Archives/edgar/data/${stripCik(cik)}/${accession.replace(/-/g, '')}/${accession}-index.htm`;

export async function getCompanyProfile(cik: string): Promise<CompanyProfile> {
  const s = await getJson<SubmissionsResponse>(`/data/submissions/CIK${padCik(cik)}.json`);
  const r = s.filings.recent;
  const filings: Filing[] = r.accessionNumber.map((acc, i) => ({
    accession: acc,
    form: r.form[i],
    filed: r.filingDate[i],
    reportDate: r.reportDate?.[i] ?? '',
    primaryDoc: r.primaryDocument[i],
    description: r.primaryDocDescription?.[i] ?? '',
    items: (r.items?.[i] ?? '').split(',').map((x) => x.trim()).filter(Boolean),
    url: filingUrl(s.cik, acc, r.primaryDocument[i]),
    indexUrl: filingIndexUrl(s.cik, acc),
  }));
  const a = s.addresses?.business;
  return {
    cik: padCik(s.cik),
    name: s.name,
    tickers: s.tickers ?? [],
    exchanges: s.exchanges ?? [],
    sic: s.sic ?? '',
    sicDescription: s.sicDescription ?? '',
    stateOfIncorporation: s.stateOfIncorporation ?? '',
    fiscalYearEnd: s.fiscalYearEnd ?? '',
    entityType: s.entityType ?? '',
    category: s.category ?? '',
    website: s.website ?? '',
    phone: s.phone ?? '',
    businessAddress: a ? [a.street1, a.city, a.stateOrCountry, a.zipCode].filter(Boolean).join(', ') : '',
    formerNames: (s.formerNames ?? []).map((f) => f.name),
    filings,
  };
}

/* ---------- Filing categories relevant to M&A ---------- */
export type FilingCategory = 'Financial reports' | 'Deal & merger' | 'Ownership & control' | 'Material events' | 'Governance' | 'Capital raising' | 'Other';

const FORM_CATEGORY: [RegExp, FilingCategory][] = [
  [/^(10-K|10-Q|20-F|40-F|6-K|10-KT|10-QT|11-K|ARS|NT 10-K|NT 10-Q)(\/A)?$/, 'Financial reports'],
  [/^(DEFM14A|PREM14A|DEFM14C|PREM14C|S-4|S-4\/A|F-4|F-4\/A|425|SC TO-T|SC TO-I|SC TO-C|SC 14D9|SC 14D9-C|SC 13E3|SC 14F1|DEFA14A|DEFR14A|S-4MEF|F-4MEF)(\/A)?$/, 'Deal & merger'],
  [/^(SC 13D|SC 13G|SCHEDULE 13D|SCHEDULE 13G|3|4|5|13F-HR|144)(\/A)?$/, 'Ownership & control'],
  [/^8-K(\/A)?$/, 'Material events'],
  [/^(DEF 14A|PRE 14A|DEF 14C|PRE 14C|DEFR14A)(\/A)?$/, 'Governance'],
  [/^(S-1|S-3|S-8|F-1|F-3|424B\d|FWP|S-1MEF|S-3ASR|D)(\/A)?$/, 'Capital raising'],
];

export const categorizeForm = (form: string): FilingCategory => FORM_CATEGORY.find(([re]) => re.test(form))?.[1] ?? 'Other';

/** 8-K items that matter for M&A diligence. */
export const ITEM_LABELS: Record<string, string> = {
  '1.01': 'Entry into a material agreement',
  '1.02': 'Termination of a material agreement',
  '1.03': 'Bankruptcy or receivership',
  '2.01': 'Completion of acquisition or disposition',
  '2.03': 'New financial obligation',
  '2.04': 'Acceleration of an obligation',
  '2.05': 'Exit or restructuring costs',
  '2.06': 'Material impairment',
  '3.01': 'Delisting notice',
  '3.03': 'Change to security-holder rights',
  '4.01': 'Change of auditor',
  '4.02': 'Non-reliance on prior financials',
  '5.01': 'Change in control',
  '5.02': 'Director or officer change',
  '5.03': 'Charter or bylaw amendment',
  '5.07': 'Shareholder vote results',
  '7.01': 'Regulation FD disclosure',
  '8.01': 'Other events',
  '9.01': 'Financial statements and exhibits',
};

export const MA_RELEVANT_ITEMS = new Set(['1.01', '1.02', '1.03', '2.01', '2.03', '2.04', '2.05', '2.06', '3.01', '4.01', '4.02', '5.01']);

/* ---------- XBRL financial statements ---------- */
interface FactPoint {
  start?: string;
  end: string;
  val: number;
  accn: string;
  fy?: number;
  fp?: string;
  form: string;
  filed: string;
  frame?: string;
}
interface Concept {
  label?: string;
  units: Record<string, FactPoint[]>;
}
export interface CompanyFacts {
  cik: number;
  entityName: string;
  facts: Record<string, Record<string, Concept>>;
}

export async function getCompanyFacts(cik: string): Promise<CompanyFacts> {
  return getJson<CompanyFacts>(`/data/api/xbrl/companyfacts/CIK${padCik(cik)}.json`, 30 * 60 * 1000);
}

type MetricKey =
  | 'revenue'
  | 'costOfRevenue'
  | 'grossProfit'
  | 'rnd'
  | 'sga'
  | 'operatingIncome'
  | 'interestExpense'
  | 'pretaxIncome'
  | 'incomeTax'
  | 'netIncome'
  | 'epsDiluted'
  | 'da'
  | 'sbc'
  | 'operatingCashFlow'
  | 'capex'
  | 'acquisitionsPaid'
  | 'dividendsPaid'
  | 'buybacks'
  | 'cash'
  | 'shortTermInvestments'
  | 'receivables'
  | 'inventory'
  | 'currentAssets'
  | 'ppe'
  | 'goodwill'
  | 'intangibles'
  | 'totalAssets'
  | 'currentLiabilities'
  | 'longTermDebt'
  | 'currentDebt'
  | 'operatingLeaseLiabilities'
  | 'totalLiabilities'
  | 'equity'
  | 'sharesOutstanding'
  | 'dilutedShares';

/** Concept fallbacks, in priority order. `ns:Concept`. */
const CONCEPTS: Record<MetricKey, { kind: 'duration' | 'instant'; unit: string; names: string[] }> = {
  revenue: { kind: 'duration', unit: 'USD', names: ['us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax', 'us-gaap:Revenues', 'us-gaap:SalesRevenueNet', 'us-gaap:RevenueFromContractWithCustomerIncludingAssessedTax', 'us-gaap:RevenuesNetOfInterestExpense', 'ifrs-full:Revenue'] },
  costOfRevenue: { kind: 'duration', unit: 'USD', names: ['us-gaap:CostOfRevenue', 'us-gaap:CostOfGoodsAndServicesSold', 'us-gaap:CostOfGoodsSold', 'ifrs-full:CostOfSales'] },
  grossProfit: { kind: 'duration', unit: 'USD', names: ['us-gaap:GrossProfit', 'ifrs-full:GrossProfit'] },
  rnd: { kind: 'duration', unit: 'USD', names: ['us-gaap:ResearchAndDevelopmentExpense', 'us-gaap:ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost', 'ifrs-full:ResearchAndDevelopmentExpense'] },
  sga: { kind: 'duration', unit: 'USD', names: ['us-gaap:SellingGeneralAndAdministrativeExpense', 'ifrs-full:SellingGeneralAndAdministrativeExpense'] },
  operatingIncome: { kind: 'duration', unit: 'USD', names: ['us-gaap:OperatingIncomeLoss', 'ifrs-full:ProfitLossFromOperatingActivities'] },
  interestExpense: { kind: 'duration', unit: 'USD', names: ['us-gaap:InterestExpense', 'us-gaap:InterestExpenseNonoperating', 'us-gaap:InterestExpenseDebt', 'ifrs-full:FinanceCosts'] },
  pretaxIncome: { kind: 'duration', unit: 'USD', names: ['us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest', 'us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments', 'ifrs-full:ProfitLossBeforeTax'] },
  incomeTax: { kind: 'duration', unit: 'USD', names: ['us-gaap:IncomeTaxExpenseBenefit', 'ifrs-full:IncomeTaxExpenseContinuingOperations'] },
  netIncome: { kind: 'duration', unit: 'USD', names: ['us-gaap:NetIncomeLoss', 'us-gaap:ProfitLoss', 'us-gaap:NetIncomeLossAvailableToCommonStockholdersBasic', 'ifrs-full:ProfitLossAttributableToOwnersOfParent', 'ifrs-full:ProfitLoss'] },
  epsDiluted: { kind: 'duration', unit: 'USD/shares', names: ['us-gaap:EarningsPerShareDiluted', 'us-gaap:EarningsPerShareBasicAndDiluted', 'ifrs-full:DilutedEarningsLossPerShare'] },
  da: { kind: 'duration', unit: 'USD', names: ['us-gaap:DepreciationDepletionAndAmortization', 'us-gaap:DepreciationAmortizationAndAccretionNet', 'us-gaap:DepreciationAndAmortization', 'us-gaap:Depreciation', 'ifrs-full:DepreciationAndAmortisationExpense'] },
  sbc: { kind: 'duration', unit: 'USD', names: ['us-gaap:ShareBasedCompensation', 'us-gaap:AllocatedShareBasedCompensationExpense'] },
  operatingCashFlow: { kind: 'duration', unit: 'USD', names: ['us-gaap:NetCashProvidedByUsedInOperatingActivities', 'us-gaap:NetCashProvidedByUsedInOperatingActivitiesContinuingOperations', 'ifrs-full:CashFlowsFromUsedInOperatingActivities'] },
  capex: { kind: 'duration', unit: 'USD', names: ['us-gaap:PaymentsToAcquirePropertyPlantAndEquipment', 'us-gaap:PaymentsToAcquireProductiveAssets', 'ifrs-full:PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities'] },
  acquisitionsPaid: { kind: 'duration', unit: 'USD', names: ['us-gaap:PaymentsToAcquireBusinessesNetOfCashAcquired', 'us-gaap:PaymentsToAcquireBusinessesGross'] },
  dividendsPaid: { kind: 'duration', unit: 'USD', names: ['us-gaap:PaymentsOfDividends', 'us-gaap:PaymentsOfDividendsCommonStock', 'ifrs-full:DividendsPaidClassifiedAsFinancingActivities'] },
  buybacks: { kind: 'duration', unit: 'USD', names: ['us-gaap:PaymentsForRepurchaseOfCommonStock'] },
  cash: { kind: 'instant', unit: 'USD', names: ['us-gaap:CashAndCashEquivalentsAtCarryingValue', 'us-gaap:CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents', 'us-gaap:Cash', 'ifrs-full:CashAndCashEquivalents'] },
  shortTermInvestments: { kind: 'instant', unit: 'USD', names: ['us-gaap:ShortTermInvestments', 'us-gaap:MarketableSecuritiesCurrent', 'us-gaap:AvailableForSaleSecuritiesDebtSecuritiesCurrent'] },
  receivables: { kind: 'instant', unit: 'USD', names: ['us-gaap:AccountsReceivableNetCurrent', 'us-gaap:ReceivablesNetCurrent', 'ifrs-full:TradeAndOtherCurrentReceivables'] },
  inventory: { kind: 'instant', unit: 'USD', names: ['us-gaap:InventoryNet', 'ifrs-full:Inventories'] },
  currentAssets: { kind: 'instant', unit: 'USD', names: ['us-gaap:AssetsCurrent', 'ifrs-full:CurrentAssets'] },
  ppe: { kind: 'instant', unit: 'USD', names: ['us-gaap:PropertyPlantAndEquipmentNet', 'ifrs-full:PropertyPlantAndEquipment'] },
  goodwill: { kind: 'instant', unit: 'USD', names: ['us-gaap:Goodwill', 'ifrs-full:Goodwill'] },
  intangibles: { kind: 'instant', unit: 'USD', names: ['us-gaap:IntangibleAssetsNetExcludingGoodwill', 'us-gaap:FiniteLivedIntangibleAssetsNet', 'ifrs-full:IntangibleAssetsOtherThanGoodwill'] },
  totalAssets: { kind: 'instant', unit: 'USD', names: ['us-gaap:Assets', 'ifrs-full:Assets'] },
  currentLiabilities: { kind: 'instant', unit: 'USD', names: ['us-gaap:LiabilitiesCurrent', 'ifrs-full:CurrentLiabilities'] },
  longTermDebt: { kind: 'instant', unit: 'USD', names: ['us-gaap:LongTermDebtNoncurrent', 'us-gaap:LongTermDebt', 'us-gaap:LongTermDebtAndCapitalLeaseObligations', 'us-gaap:SeniorNotes', 'ifrs-full:NoncurrentPortionOfNoncurrentBorrowings', 'ifrs-full:Borrowings'] },
  currentDebt: { kind: 'instant', unit: 'USD', names: ['us-gaap:LongTermDebtCurrent', 'us-gaap:DebtCurrent', 'us-gaap:ShortTermBorrowings', 'us-gaap:CommercialPaper', 'ifrs-full:CurrentPortionOfNoncurrentBorrowings', 'ifrs-full:ShorttermBorrowings'] },
  operatingLeaseLiabilities: { kind: 'instant', unit: 'USD', names: ['us-gaap:OperatingLeaseLiability', 'us-gaap:OperatingLeaseLiabilityNoncurrent'] },
  totalLiabilities: { kind: 'instant', unit: 'USD', names: ['us-gaap:Liabilities', 'ifrs-full:Liabilities'] },
  equity: { kind: 'instant', unit: 'USD', names: ['us-gaap:StockholdersEquity', 'us-gaap:StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest', 'ifrs-full:EquityAttributableToOwnersOfParent', 'ifrs-full:Equity'] },
  sharesOutstanding: { kind: 'instant', unit: 'shares', names: ['dei:EntityCommonStockSharesOutstanding', 'us-gaap:CommonStockSharesOutstanding'] },
  dilutedShares: { kind: 'duration', unit: 'shares', names: ['us-gaap:WeightedAverageNumberOfDilutedSharesOutstanding', 'ifrs-full:WeightedAverageNumberOfSharesOutstandingBasicAndDiluted'] },
};

const ANNUAL_FORMS = /^(10-K|10-KT|20-F|40-F)(\/A)?$/;
const days = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86_400_000;

function unitPoints(concept: Concept, unit: string): FactPoint[] {
  if (concept.units[unit]) return concept.units[unit];
  // Foreign filers report in their own currency (EUR, JPY, INR...). Take the first currency-like unit.
  if (unit === 'USD') {
    const k = Object.keys(concept.units).find((u) => /^[A-Z]{3}$/.test(u));
    if (k) return concept.units[k];
  }
  if (unit === 'USD/shares') {
    const k = Object.keys(concept.units).find((u) => /^[A-Z]{3}\/shares$/.test(u));
    if (k) return concept.units[k];
  }
  return [];
}

function currencyOf(facts: CompanyFacts): string {
  for (const ns of ['us-gaap', 'ifrs-full']) {
    const c = facts.facts[ns];
    if (!c) continue;
    for (const name of ['Revenues', 'Revenue', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'Assets', 'NetIncomeLoss', 'ProfitLoss']) {
      const units = c[name]?.units;
      if (units) {
        const k = Object.keys(units).find((u) => /^[A-Z]{3}$/.test(u));
        if (k) return k;
      }
    }
  }
  return 'USD';
}

/** Annual series keyed by fiscal period end date, newest first. Later filings (restatements) win. */
function annualSeries(facts: CompanyFacts, key: MetricKey): Map<string, number> {
  const spec = CONCEPTS[key];
  const out = new Map<string, number>();
  // Higher-priority tags win for a given period; lower-priority tags only fill gaps
  // (companies often switch tags, e.g. Revenues -> RevenueFromContractWithCustomer... in 2018).
  for (const full of spec.names) {
    const [ns, name] = full.split(':');
    const concept = facts.facts[ns]?.[name];
    if (!concept) continue;
    const local = new Map<string, { val: number; filed: string }>();
    for (const p of unitPoints(concept, spec.unit)) {
      if (!ANNUAL_FORMS.test(p.form)) continue;
      if (spec.kind === 'duration') {
        if (!p.start) continue;
        const d = days(p.start, p.end);
        if (d < 330 || d > 400) continue;
      } else if (p.start) continue;
      const prev = local.get(p.end);
      if (!prev || p.filed > prev.filed) local.set(p.end, { val: p.val, filed: p.filed });
    }
    for (const [end, v] of local) {
      const clash = [...out.keys()].some((k) => Math.abs(days(k, end)) <= 10);
      if (!clash) out.set(end, v.val);
    }
  }
  return new Map([...out.entries()].sort((a, b) => b[0].localeCompare(a[0])));
}

/** Latest instant value from any form (10-Q included), for up-to-date balance sheet items. */
function latestInstant(facts: CompanyFacts, key: MetricKey): { val: number; end: string } | null {
  const spec = CONCEPTS[key];
  let best: { val: number; end: string; filed: string } | null = null;
  for (const full of spec.names) {
    const [ns, name] = full.split(':');
    const concept = facts.facts[ns]?.[name];
    if (!concept) continue;
    for (const p of unitPoints(concept, spec.unit)) {
      if (p.start) continue;
      if (!best || p.end > best.end || (p.end === best.end && p.filed > best.filed)) best = { val: p.val, end: p.end, filed: p.filed };
    }
    if (best) break;
  }
  return best ? { val: best.val, end: best.end } : null;
}

export interface AnnualPeriod {
  periodEnd: string;
  fiscalYear: string;
  values: Partial<Record<MetricKey, number>>;
  derived: {
    grossProfit?: number;
    ebitda?: number;
    fcf?: number;
    totalDebt?: number;
    netDebt?: number;
    revenueGrowth?: number;
    grossMargin?: number;
    operatingMargin?: number;
    ebitdaMargin?: number;
    netMargin?: number;
    fcfMargin?: number;
    roe?: number;
    currentRatio?: number;
    debtToEbitda?: number;
    interestCoverage?: number;
    ruleOf40?: number;
    effectiveTaxRate?: number;
  };
}

export interface FinancialStatements {
  currency: string;
  entityName: string;
  annual: AnnualPeriod[]; // newest first
  latestBalance: { asOf: string; cash?: number; totalDebt?: number; sharesOutstanding?: number; equity?: number };
  coverage: number; // 0..1 share of core metrics found
}

const safeDiv = (a?: number, b?: number) => (a === undefined || b === undefined || b === 0 ? undefined : a / b);

export function buildStatements(facts: CompanyFacts, years = 5): FinancialStatements {
  const keys = Object.keys(CONCEPTS) as MetricKey[];
  const series = Object.fromEntries(keys.map((k) => [k, annualSeries(facts, k)])) as Record<MetricKey, Map<string, number>>;

  // Period ends come from revenue, falling back to net income or assets.
  const anchor = [series.revenue, series.netIncome, series.totalAssets].find((m) => m.size > 0) ?? new Map();
  const ends = [...anchor.keys()].slice(0, years + 1);

  const pick = (m: Map<string, number>, end: string): number | undefined => {
    if (m.has(end)) return m.get(end);
    // Tolerate a few days' difference in period-end dates between tags.
    for (const [k, v] of m) if (Math.abs(days(k, end)) <= 10) return v;
    return undefined;
  };

  const periods: AnnualPeriod[] = ends.map((end) => {
    const values: AnnualPeriod['values'] = {};
    keys.forEach((k) => {
      const v = pick(series[k], end);
      if (v !== undefined) values[k] = v;
    });
    return { periodEnd: end, fiscalYear: `FY${end.slice(0, 4)}`, values, derived: {} };
  });

  periods.forEach((p, i) => {
    const v = p.values;
    const gp = v.grossProfit ?? (v.revenue !== undefined && v.costOfRevenue !== undefined ? v.revenue - v.costOfRevenue : undefined);
    const ebitda = v.operatingIncome !== undefined && v.da !== undefined ? v.operatingIncome + v.da : undefined;
    const fcf = v.operatingCashFlow !== undefined ? v.operatingCashFlow - Math.abs(v.capex ?? 0) : undefined;
    const debt = v.longTermDebt !== undefined || v.currentDebt !== undefined ? (v.longTermDebt ?? 0) + (v.currentDebt ?? 0) : undefined;
    const liquid = v.cash !== undefined ? v.cash + (v.shortTermInvestments ?? 0) : undefined;
    const netDebt = debt !== undefined && liquid !== undefined ? debt - liquid : undefined;
    const prev = periods[i + 1]?.values.revenue;
    const growth = v.revenue !== undefined && prev ? ((v.revenue - prev) / Math.abs(prev)) * 100 : undefined;
    const fcfMargin = safeDiv(fcf, v.revenue);
    p.derived = {
      grossProfit: gp,
      ebitda,
      fcf,
      totalDebt: debt,
      netDebt,
      revenueGrowth: growth,
      grossMargin: (safeDiv(gp, v.revenue) ?? NaN) * 100 || undefined,
      operatingMargin: (safeDiv(v.operatingIncome, v.revenue) ?? NaN) * 100 || undefined,
      ebitdaMargin: (safeDiv(ebitda, v.revenue) ?? NaN) * 100 || undefined,
      netMargin: (safeDiv(v.netIncome, v.revenue) ?? NaN) * 100 || undefined,
      fcfMargin: fcfMargin !== undefined ? fcfMargin * 100 : undefined,
      roe: (safeDiv(v.netIncome, v.equity) ?? NaN) * 100 || undefined,
      currentRatio: safeDiv(v.currentAssets, v.currentLiabilities),
      // Net debt / EBITDA (negative = net cash). Falls back to gross debt when cash is not reported.
      debtToEbitda: ebitda && ebitda > 0 ? safeDiv(netDebt ?? debt, ebitda) : undefined,
      interestCoverage: v.interestExpense ? safeDiv(v.operatingIncome, Math.abs(v.interestExpense)) : undefined,
      ruleOf40: growth !== undefined && fcfMargin !== undefined ? growth + fcfMargin * 100 : undefined,
      effectiveTaxRate: (safeDiv(v.incomeTax, v.pretaxIncome) ?? NaN) * 100 || undefined,
    };
  });

  const cash = latestInstant(facts, 'cash');
  const lt = latestInstant(facts, 'longTermDebt');
  const ct = latestInstant(facts, 'currentDebt');
  const sh = latestInstant(facts, 'sharesOutstanding');
  const eq = latestInstant(facts, 'equity');

  const core: MetricKey[] = ['revenue', 'operatingIncome', 'netIncome', 'operatingCashFlow', 'totalAssets', 'cash', 'equity'];
  const latest = periods[0]?.values ?? {};
  const coverage = core.filter((k) => latest[k] !== undefined).length / core.length;

  return {
    currency: currencyOf(facts),
    entityName: facts.entityName,
    annual: periods.slice(0, years),
    latestBalance: {
      asOf: [cash?.end, lt?.end, sh?.end].filter(Boolean).sort().pop() ?? '',
      cash: cash?.val,
      totalDebt: lt || ct ? (lt?.val ?? 0) + (ct?.val ?? 0) : undefined,
      sharesOutstanding: sh?.val,
      equity: eq?.val,
    },
    coverage,
  };
}

/* ---------- Full-text search (merger agreements, M&A activity) ---------- */
export interface FtsHit {
  accession: string;
  form: string;
  filed: string;
  cik: string;
  companyName: string;
  ticker: string;
  location: string;
  incState: string;
  sic: string;
  items: string[];
  fileName: string;
  description: string;
  url: string;
  indexUrl: string;
}

interface FtsResponse {
  hits: {
    total: { value: number };
    hits: {
      _id: string;
      _source: {
        ciks: string[];
        display_names: string[];
        form: string;
        root_forms?: string[];
        file_date: string;
        adsh: string;
        biz_locations?: string[];
        inc_states?: string[];
        sics?: string[];
        items?: string[];
        file_description?: string | null;
        file_type?: string;
      };
    }[];
  };
}

/** "Acme Corp  (ACME, ACMW)  (CIK 0000123456)" -> name + first ticker */
export function parseDisplayName(dn: string): { name: string; ticker: string } {
  const name = dn.replace(/\s*\(CIK[^)]*\)\s*$/, '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  const m = dn.match(/\(([A-Z0-9.\-, ]+)\)\s*\(CIK/);
  const ticker = m ? m[1].split(',')[0].trim() : '';
  return { name, ticker };
}

export interface FtsQuery {
  q?: string;
  forms?: string[];
  ciks?: string[];
  startdt?: string;
  enddt?: string;
  from?: number;
}

export async function fullTextSearch(query: FtsQuery): Promise<{ total: number; hits: FtsHit[] }> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.forms?.length) params.set('forms', query.forms.join(','));
  if (query.ciks?.length) params.set('ciks', query.ciks.map(padCik).join(','));
  if (query.startdt || query.enddt) {
    params.set('dateRange', 'custom');
    if (query.startdt) params.set('startdt', query.startdt);
    if (query.enddt) params.set('enddt', query.enddt);
  }
  if (query.from) params.set('from', String(query.from));
  const res = await getJson<FtsResponse>(`/efts/LATEST/search-index?${params.toString()}`, 5 * 60 * 1000);
  const hits: FtsHit[] = res.hits.hits.map((h) => {
    const s = h._source;
    const [, fileName = ''] = h._id.split(':');
    const cik = s.ciks?.[0] ?? '';
    const { name, ticker } = parseDisplayName(s.display_names?.[0] ?? '');
    return {
      accession: s.adsh,
      form: s.form,
      filed: s.file_date,
      cik: padCik(cik),
      companyName: name,
      ticker,
      location: s.biz_locations?.[0] ?? '',
      incState: s.inc_states?.[0] ?? '',
      sic: s.sics?.[0] ?? '',
      items: s.items ?? [],
      fileName,
      description: s.file_description ?? s.file_type ?? '',
      url: cik ? filingUrl(cik, s.adsh, fileName) : '',
      indexUrl: cik ? filingIndexUrl(cik, s.adsh) : '',
    };
  });
  return { total: res.hits.total?.value ?? hits.length, hits };
}

/** Executed merger / purchase agreements filed by (or about) a company. */
export function findDealAgreements(cik: string) {
  return fullTextSearch({
    q: '"agreement and plan of merger" OR "stock purchase agreement" OR "asset purchase agreement" OR "share purchase agreement"',
    ciks: [cik],
    forms: ['8-K', '8-K/A', 'DEFM14A', 'PREM14A', 'S-4', 'S-4/A', 'F-4', '10-K', '10-Q', 'SC TO-T', 'SC 14D9'],
  });
}

export const isoDaysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
