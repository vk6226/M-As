/* ==========================================================================
   M&A transaction document checklist
   --------------------------------------------------------------------------
   Every document typically needed to take a deal from first contact to
   post-closing, tagged by deal structure, target type and jurisdiction so a
   checklist can be tailored to a specific transaction.

   This is a practitioner checklist, not legal advice. Requirements change
   and depend on facts; every deal must be reviewed by qualified counsel in
   each relevant jurisdiction.
   ========================================================================== */

export type DealStructure = 'stock-purchase' | 'asset-purchase' | 'merger' | 'tender-offer' | 'scheme' | 'slump-sale' | 'ibc';
export type Jurisdiction = 'US' | 'UK' | 'EU' | 'IN';
export type TargetType = 'public' | 'private';

export const STRUCTURES: { id: DealStructure; label: string; description: string }[] = [
  { id: 'stock-purchase', label: 'Share / stock purchase', description: 'Buyer acquires the shares of the target from its shareholders. Liabilities stay with the company.' },
  { id: 'asset-purchase', label: 'Asset purchase', description: 'Buyer acquires selected assets and assumes selected liabilities. Common for carve-outs and distressed sales.' },
  { id: 'merger', label: 'Statutory merger', description: 'Target merges with the buyer or a buyer subsidiary (forward or reverse triangular). Needs shareholder approval.' },
  { id: 'tender-offer', label: 'Tender / open offer', description: 'Buyer offers to buy shares directly from public shareholders, often followed by a second-step merger.' },
  { id: 'scheme', label: 'Scheme of arrangement', description: 'Court-approved arrangement binding all shareholders once approved by the statutory majority (UK, India and others).' },
  { id: 'slump-sale', label: 'Slump sale / business transfer (India)', description: 'Transfer of an undertaking as a going concern for a lump-sum price, without values assigned to individual assets. Taxed as a slump sale under Indian income-tax law.' },
  { id: 'ibc', label: 'IBC resolution plan (India)', description: 'Acquisition of a company in the corporate insolvency resolution process through a resolution plan approved by the committee of creditors and the NCLT.' },
];

export const JURISDICTIONS: { id: Jurisdiction; label: string }[] = [
  { id: 'US', label: 'United States' },
  { id: 'UK', label: 'United Kingdom' },
  { id: 'EU', label: 'European Union' },
  { id: 'IN', label: 'India' },
];

export type Phase =
  | 'Preparation'
  | 'Preliminary terms'
  | 'Due diligence'
  | 'Definitive agreements'
  | 'Regulatory approvals'
  | 'Corporate approvals'
  | 'Financing'
  | 'Closing'
  | 'Post-closing';

export const PHASES: Phase[] = [
  'Preparation',
  'Preliminary terms',
  'Due diligence',
  'Definitive agreements',
  'Regulatory approvals',
  'Corporate approvals',
  'Financing',
  'Closing',
  'Post-closing',
];

export type Owner = 'Buyer' | 'Seller' | 'Target' | 'Both parties' | 'Advisers' | 'Lenders';

export type TemplateId = 'nda' | 'loi' | 'exclusivity' | 'dd-request' | 'board-resolution' | 'closing-checklist' | 'disclosure-index' | 'funds-flow';

export interface ChecklistDoc {
  id: string;
  phase: Phase;
  name: string;
  purpose: string;
  owner: Owner;
  critical?: boolean;
  references?: string[];
  template?: TemplateId;
  /** When set, the document only applies if every listed condition matches. */
  when?: {
    structures?: DealStructure[];
    jurisdictions?: Jurisdiction[];
    targetTypes?: TargetType[];
    crossBorder?: boolean;
    financed?: boolean;
  };
}

export const CHECKLIST: ChecklistDoc[] = [
  /* ---------------- Preparation ---------------- */
  { id: 'eng-fa', phase: 'Preparation', name: 'Financial adviser engagement letter', purpose: 'Scope, fees (retainer and success fee), exclusivity and indemnity for the investment bank or M&A adviser.', owner: 'Both parties' },
  { id: 'eng-legal', phase: 'Preparation', name: 'Legal counsel engagement letters', purpose: 'Engagement of deal counsel and any local counsel in each relevant jurisdiction.', owner: 'Both parties' },
  { id: 'nda', phase: 'Preparation', name: 'Non-disclosure agreement (NDA)', purpose: 'Protects confidential information shared in the process, restricts use to evaluating the deal, and usually includes non-solicitation of employees.', owner: 'Both parties', critical: true, template: 'nda' },
  { id: 'standstill', phase: 'Preparation', name: 'Standstill provisions', purpose: 'Stops the buyer acquiring shares or launching a hostile bid for a set period. Usually inside the NDA for listed targets.', owner: 'Target', when: { targetTypes: ['public'] } },
  { id: 'clean-team', phase: 'Preparation', name: 'Clean team agreement', purpose: 'Limits competitively sensitive information (pricing, customers) to a ring-fenced team to avoid gun-jumping and cartel risk.', owner: 'Both parties', references: ['Sherman Act s.1 / HSR gun-jumping', 'Art. 101 TFEU', 'Competition Act 2002 s.3 (India)'] },
  { id: 'teaser', phase: 'Preparation', name: 'Teaser and confidential information memorandum (CIM)', purpose: 'Sell-side marketing documents describing the business, financials and investment case.', owner: 'Seller' },
  { id: 'process-letter', phase: 'Preparation', name: 'Process letter', purpose: 'Sets auction rules, bid deadlines and what bids must contain.', owner: 'Seller' },
  { id: 'ic-memo', phase: 'Preparation', name: 'Investment committee memo / board paper', purpose: 'Internal approval to spend money pursuing the deal: thesis, valuation range, risks and synergies.', owner: 'Buyer' },

  /* ---------------- Preliminary terms ---------------- */
  { id: 'ioi', phase: 'Preliminary terms', name: 'Indication of interest (IOI)', purpose: 'Non-binding first-round bid with a valuation range and key assumptions.', owner: 'Buyer' },
  { id: 'loi', phase: 'Preliminary terms', name: 'Letter of intent / term sheet', purpose: 'Non-binding summary of price, structure, consideration, key conditions and timetable, with binding confidentiality, exclusivity and cost provisions.', owner: 'Both parties', critical: true, template: 'loi' },
  { id: 'exclusivity', phase: 'Preliminary terms', name: 'Exclusivity (no-shop) agreement', purpose: 'Seller agrees not to negotiate with other bidders for a set period while the buyer does diligence.', owner: 'Both parties', template: 'exclusivity', when: { targetTypes: ['private'] } },
  { id: 'rule-2-4', phase: 'Preliminary terms', name: 'Possible offer announcement (Rule 2.4) and put-up-or-shut-up deadline', purpose: 'Required if an approach leaks or is announced. Starts the 28-day deadline to announce a firm offer.', owner: 'Both parties', references: ['UK Takeover Code Rules 2.4 and 2.6'], when: { jurisdictions: ['UK'], targetTypes: ['public'] } },

  /* ---------------- Due diligence ---------------- */
  { id: 'dd-request', phase: 'Due diligence', name: 'Due diligence request list', purpose: 'Itemised list of documents and information the buyer needs, organised by workstream.', owner: 'Buyer', critical: true, template: 'dd-request' },
  { id: 'vdr', phase: 'Due diligence', name: 'Virtual data room index', purpose: 'Indexed record of everything disclosed. Later used to define what the buyer is deemed to know.', owner: 'Seller' },
  { id: 'qoe', phase: 'Due diligence', name: 'Quality of earnings (QoE) report', purpose: 'Accounting review of normalised EBITDA, revenue quality, net working capital peg and debt-like items.', owner: 'Advisers', critical: true },
  { id: 'tax-dd', phase: 'Due diligence', name: 'Tax due diligence report', purpose: 'Historic tax exposures, transfer pricing, tax attributes and structuring (e.g. step-up opportunities).', owner: 'Advisers' },
  { id: 'legal-dd', phase: 'Due diligence', name: 'Legal due diligence report', purpose: 'Corporate records, capitalisation, material contracts, litigation, permits, real estate and compliance findings.', owner: 'Advisers', critical: true },
  { id: 'coc-schedule', phase: 'Due diligence', name: 'Change-of-control and consent schedule', purpose: 'List of contracts with change-of-control, anti-assignment or termination rights triggered by the deal.', owner: 'Advisers' },
  { id: 'cap-table', phase: 'Due diligence', name: 'Capitalisation table and equity award ledger', purpose: 'All shares, options, warrants, convertibles and their treatment in the deal.', owner: 'Target', critical: true, when: { structures: ['stock-purchase', 'merger', 'tender-offer', 'scheme', 'ibc'] } },
  { id: 'ip-dd', phase: 'Due diligence', name: 'Intellectual property review', purpose: 'Ownership and chain of title, registrations, licences in and out, open-source use and invention assignments.', owner: 'Advisers' },
  { id: 'it-dd', phase: 'Due diligence', name: 'IT, cybersecurity and data privacy review', purpose: 'Security posture, past breaches, and compliance with privacy laws such as GDPR, CCPA and the DPDP Act 2023.', owner: 'Advisers' },
  { id: 'hr-dd', phase: 'Due diligence', name: 'Employment and benefits review', purpose: 'Key employee contracts, incentive plans, pensions, change-of-control payments and labour disputes.', owner: 'Advisers' },
  { id: 'commercial-dd', phase: 'Due diligence', name: 'Commercial due diligence', purpose: 'Market, competition, customer concentration and retention, pipeline and pricing analysis.', owner: 'Advisers' },
  { id: 'env-dd', phase: 'Due diligence', name: 'Environmental assessment (Phase I ESA)', purpose: 'Identifies contamination and environmental liabilities on owned or leased sites.', owner: 'Advisers', references: ['ASTM E1527-21 (US)'] },
  { id: 'compliance-dd', phase: 'Due diligence', name: 'Anti-corruption, sanctions and AML review', purpose: 'Exposure under anti-bribery and sanctions regimes, including third-party intermediaries.', owner: 'Advisers', references: ['FCPA (US)', 'UK Bribery Act 2010', 'OFAC / EU / UK sanctions', 'Prevention of Corruption Act 1988 (India)'] },
  { id: 'insurance-dd', phase: 'Due diligence', name: 'Insurance review', purpose: 'Existing policies, claims history and whether coverage survives the change of control.', owner: 'Advisers' },
  { id: 'title-dd', phase: 'Due diligence', name: 'Asset title and lien searches', purpose: 'Confirms the seller owns the transferred assets free of liens (UCC searches in the US, charge register in UK/India).', owner: 'Advisers', when: { structures: ['asset-purchase', 'slump-sale'] } },

  /* ---------------- Definitive agreements ---------------- */
  { id: 'spa', phase: 'Definitive agreements', name: 'Share / stock purchase agreement (SPA)', purpose: 'Price and adjustments, representations and warranties, covenants, conditions, indemnities, termination.', owner: 'Both parties', critical: true, when: { structures: ['stock-purchase'] } },
  { id: 'apa', phase: 'Definitive agreements', name: 'Asset purchase agreement (APA)', purpose: 'Defines purchased and excluded assets, assumed and excluded liabilities, price allocation and indemnities.', owner: 'Both parties', critical: true, when: { structures: ['asset-purchase'] } },
  { id: 'merger-agreement', phase: 'Definitive agreements', name: 'Agreement and plan of merger', purpose: 'Merger mechanics, consideration, treatment of equity awards, deal protections (no-shop, fiduciary out, break fees), conditions.', owner: 'Both parties', critical: true, when: { structures: ['merger'] }, references: ['DGCL s.251 (Delaware)'] },
  { id: 'tender-agreement', phase: 'Definitive agreements', name: 'Tender offer agreement / offer document', purpose: 'Terms of the offer, minimum tender condition and second-step merger mechanics.', owner: 'Buyer', critical: true, when: { structures: ['tender-offer'] }, references: ['Exchange Act Regulation 14D (US)', 'SEBI SAST Regulations 2011 (India)', 'Takeover Code Rule 24 (UK)'] },
  { id: 'scheme-docs', phase: 'Definitive agreements', name: 'Co-operation / implementation agreement and scheme document', purpose: 'Agreement between bidder and target to implement the scheme, plus the scheme circular sent to shareholders.', owner: 'Both parties', critical: true, when: { structures: ['scheme'] }, references: ['Companies Act 2006 Part 26 (UK)', 'Companies Act 2013 ss.230–232 (India)'] },
  { id: 'disclosure-schedules', phase: 'Definitive agreements', name: 'Disclosure schedules / disclosure letter', purpose: 'Seller exceptions to the representations and warranties. Drives indemnity exposure.', owner: 'Seller', critical: true, template: 'disclosure-index' },
  { id: 'escrow', phase: 'Definitive agreements', name: 'Escrow agreement', purpose: 'Holds part of the price with a third-party agent to secure indemnity and adjustment claims.', owner: 'Both parties', when: { targetTypes: ['private'] } },
  { id: 'rwi', phase: 'Definitive agreements', name: 'Representations and warranties insurance policy', purpose: 'Insurance covering breaches of seller warranties, often replacing most of the escrow.', owner: 'Buyer', when: { targetTypes: ['private'] } },
  { id: 'bill-of-sale', phase: 'Definitive agreements', name: 'Bill of sale and assignment and assumption agreement', purpose: 'Transfers title to the purchased assets and the assumed liabilities and contracts.', owner: 'Both parties', when: { structures: ['asset-purchase'] } },
  { id: 'ip-assignment', phase: 'Definitive agreements', name: 'IP assignment agreements', purpose: 'Formal assignment of patents, trademarks, copyrights and domains, in recordable form.', owner: 'Both parties', when: { structures: ['asset-purchase', 'slump-sale'] } },
  { id: 'tsa', phase: 'Definitive agreements', name: 'Transition services agreement (TSA)', purpose: 'Seller keeps providing shared services (IT, payroll, finance) for a period after closing.', owner: 'Both parties', when: { structures: ['asset-purchase', 'stock-purchase', 'slump-sale'] } },
  { id: 'employment', phase: 'Definitive agreements', name: 'Key employee employment and retention agreements', purpose: 'New contracts, retention bonuses and equity grants for leadership and critical staff.', owner: 'Buyer' },
  { id: 'non-compete', phase: 'Definitive agreements', name: 'Restrictive covenant agreements', purpose: 'Non-compete and non-solicit undertakings from selling founders and shareholders, where enforceable.', owner: 'Both parties', when: { targetTypes: ['private'] } },
  { id: 'support', phase: 'Definitive agreements', name: 'Voting / support agreements and irrevocable undertakings', purpose: 'Commitments from major shareholders to vote for, or tender into, the deal.', owner: 'Buyer', when: { targetTypes: ['public'] } },
  { id: 'rollover', phase: 'Definitive agreements', name: 'Equity rollover / contribution agreement', purpose: 'Management or founders reinvest part of their proceeds in the buyer.', owner: 'Both parties' },
  { id: 'earnout', phase: 'Definitive agreements', name: 'Earn-out schedule', purpose: 'Contingent consideration tied to post-closing performance, with accounting definitions and dispute mechanics.', owner: 'Both parties', when: { targetTypes: ['private'] } },
  { id: 'real-estate', phase: 'Definitive agreements', name: 'Lease assignments and landlord consents', purpose: 'Transfer or consent for leased premises.', owner: 'Seller', when: { structures: ['asset-purchase', 'slump-sale'] } },

  /* ---------------- Regulatory approvals ---------------- */
  { id: 'hsr', phase: 'Regulatory approvals', name: 'HSR premerger notification', purpose: 'Filing with the FTC and DOJ when the size-of-transaction threshold (adjusted every year) is met. Closing waits for the waiting period to end.', owner: 'Both parties', critical: true, references: ['Hart-Scott-Rodino Act, 15 U.S.C. §18a', '16 C.F.R. Parts 801–803'], when: { jurisdictions: ['US'] } },
  { id: 'cfius', phase: 'Regulatory approvals', name: 'CFIUS declaration or notice', purpose: 'National-security review of foreign investment in US businesses. Mandatory for some critical technology, infrastructure and sensitive data deals.', owner: 'Buyer', references: ['31 C.F.R. Parts 800–802'], when: { jurisdictions: ['US'], crossBorder: true } },
  { id: 'sec-8k', phase: 'Regulatory approvals', name: 'Form 8-K announcing the definitive agreement', purpose: 'Item 1.01 disclosure, filed within four business days of signing, with the agreement as an exhibit.', owner: 'Target', references: ['Form 8-K Item 1.01'], when: { jurisdictions: ['US'], targetTypes: ['public'] } },
  { id: 'sec-proxy', phase: 'Regulatory approvals', name: 'Merger proxy statement (PREM14A / DEFM14A)', purpose: 'Shareholder disclosure document for the merger vote, reviewed by the SEC.', owner: 'Target', critical: true, references: ['Exchange Act s.14(a), Regulation 14A'], when: { jurisdictions: ['US'], targetTypes: ['public'], structures: ['merger'] } },
  { id: 'sec-s4', phase: 'Regulatory approvals', name: 'Registration statement (Form S-4 / F-4)', purpose: 'Registers buyer shares issued as consideration in a stock or mixed deal.', owner: 'Buyer', references: ['Securities Act of 1933'], when: { jurisdictions: ['US'], targetTypes: ['public'], structures: ['merger', 'tender-offer'] } },
  { id: 'sec-to', phase: 'Regulatory approvals', name: 'Schedule TO and Schedule 14D-9', purpose: 'Tender offer statement by the bidder and the target board\'s recommendation statement.', owner: 'Both parties', critical: true, references: ['Exchange Act Regulations 14D and 14E'], when: { jurisdictions: ['US'], structures: ['tender-offer'] } },
  { id: 'sec-425', phase: 'Regulatory approvals', name: 'Form 425 deal communications', purpose: 'Files press releases, employee FAQs and investor materials about a stock deal.', owner: 'Both parties', references: ['Securities Act Rule 425'], when: { jurisdictions: ['US'], targetTypes: ['public'] } },
  { id: 'uk-cma', phase: 'Regulatory approvals', name: 'CMA merger notice / briefing paper', purpose: 'UK merger control. Notification is voluntary, but the CMA can call in deals that meet its jurisdictional tests.', owner: 'Both parties', references: ['Enterprise Act 2002', 'Digital Markets, Competition and Consumers Act 2024'], when: { jurisdictions: ['UK'] } },
  { id: 'uk-nsi', phase: 'Regulatory approvals', name: 'NSI Act mandatory notification', purpose: 'Mandatory approval for acquisitions of control in 17 sensitive sectors. Closing without approval makes the deal void.', owner: 'Buyer', critical: true, references: ['National Security and Investment Act 2021'], when: { jurisdictions: ['UK'] } },
  { id: 'uk-code', phase: 'Regulatory approvals', name: 'Rule 2.7 firm offer announcement and offer / scheme document', purpose: 'Firm intention to make an offer, with cash confirmation, followed by the offer or scheme document.', owner: 'Both parties', critical: true, references: ['UK Takeover Code Rules 2.7, 24 and 25'], when: { jurisdictions: ['UK'], targetTypes: ['public'] } },
  { id: 'eumr', phase: 'Regulatory approvals', name: 'EU merger notification (Form CO)', purpose: 'Notification to the European Commission for concentrations with an EU dimension. Otherwise national filings may apply.', owner: 'Both parties', critical: true, references: ['Council Regulation (EC) No 139/2004'], when: { jurisdictions: ['EU'] } },
  { id: 'eu-fsr', phase: 'Regulatory approvals', name: 'Foreign Subsidies Regulation notification', purpose: 'Notification for large EU targets where the parties received significant non-EU financial contributions.', owner: 'Both parties', references: ['Regulation (EU) 2022/2560'], when: { jurisdictions: ['EU'] } },
  { id: 'eu-fdi', phase: 'Regulatory approvals', name: 'National foreign direct investment screening filings', purpose: 'Member-state FDI approvals for sensitive sectors, coordinated under the EU screening framework.', owner: 'Buyer', references: ['Regulation (EU) 2019/452'], when: { jurisdictions: ['EU'], crossBorder: true } },
  { id: 'eu-works-council', phase: 'Regulatory approvals', name: 'Works council information and consultation', purpose: 'Employee representatives must be consulted before signing in several member states (e.g. France, Netherlands).', owner: 'Target', when: { jurisdictions: ['EU'] } },
  { id: 'in-cci', phase: 'Regulatory approvals', name: 'CCI combination notice (Form I / Form II)', purpose: 'Approval from the Competition Commission of India when asset/turnover or deal-value thresholds are met. Standstill until approval.', owner: 'Both parties', critical: true, references: ['Competition Act 2002 ss.5–6', 'CCI (Combinations) Regulations 2024'], when: { jurisdictions: ['IN'] } },
  { id: 'in-sast', phase: 'Regulatory approvals', name: 'SEBI SAST open offer (public announcement, DPS, letter of offer)', purpose: 'Mandatory open offer when acquiring 25% or more of the voting rights of, or control over, a listed company.', owner: 'Buyer', critical: true, references: ['SEBI (Substantial Acquisition of Shares and Takeovers) Regulations 2011, Regs. 3–4'], when: { jurisdictions: ['IN'], targetTypes: ['public'] } },
  { id: 'in-lodr', phase: 'Regulatory approvals', name: 'Stock exchange disclosures and observation letter', purpose: 'Disclosure of material events, and stock exchange / SEBI observations on schemes involving listed companies.', owner: 'Target', references: ['SEBI LODR Regulations 2015, Reg. 30 and Reg. 37'], when: { jurisdictions: ['IN'], targetTypes: ['public'] } },
  { id: 'in-nclt', phase: 'Regulatory approvals', name: 'NCLT scheme petition and sanction order', purpose: 'Tribunal-convened meetings and court sanction for a merger or demerger scheme.', owner: 'Target', critical: true, references: ['Companies Act 2013 ss.230–232'], when: { jurisdictions: ['IN'], structures: ['scheme', 'merger'] } },
  { id: 'in-fema', phase: 'Regulatory approvals', name: 'FEMA compliance and Form FC-TRS', purpose: 'Pricing guidelines and reporting for share transfers between residents and non-residents.', owner: 'Both parties', references: ['FEMA (Non-Debt Instruments) Rules 2019'], when: { jurisdictions: ['IN'], crossBorder: true } },
  { id: 'in-pn3', phase: 'Regulatory approvals', name: 'Government approval under Press Note 3 (2020)', purpose: 'Prior approval for investment by entities from countries sharing a land border with India.', owner: 'Buyer', references: ['DPIIT Press Note 3 (2020)'], when: { jurisdictions: ['IN'], crossBorder: true } },
  { id: 'sector-approvals', phase: 'Regulatory approvals', name: 'Sector regulator change-of-control approvals', purpose: 'Approvals from regulators of banking, insurance, telecom, energy, healthcare or defence businesses where applicable.', owner: 'Buyer' },

  /* ---------------- Corporate approvals ---------------- */
  { id: 'board-buyer', phase: 'Corporate approvals', name: 'Buyer board resolutions', purpose: 'Approves the transaction, the definitive agreement, financing and authorised signatories.', owner: 'Buyer', critical: true, template: 'board-resolution' },
  { id: 'board-target', phase: 'Corporate approvals', name: 'Target / seller board resolutions', purpose: 'Approves the sale, declares it advisable and recommends it to shareholders where required.', owner: 'Target', critical: true, template: 'board-resolution' },
  { id: 'fairness', phase: 'Corporate approvals', name: 'Fairness opinion', purpose: 'Independent adviser\'s opinion that the consideration is fair, from a financial point of view, to shareholders.', owner: 'Advisers', when: { targetTypes: ['public'] } },
  { id: 'sh-approval', phase: 'Corporate approvals', name: 'Shareholder approval (meeting minutes or written consent)', purpose: 'Statutory shareholder approval of the merger, scheme or sale of substantially all assets.', owner: 'Target', critical: true, when: { structures: ['merger', 'scheme', 'asset-purchase', 'slump-sale'] } },
  { id: 'consents', phase: 'Corporate approvals', name: 'Third-party consents and waivers', purpose: 'Counterparty consents under contracts with change-of-control or anti-assignment clauses.', owner: 'Seller' },
  { id: 'warn', phase: 'Corporate approvals', name: 'WARN Act notices', purpose: '60-day notice to employees before qualifying plant closings or mass layoffs connected with the deal.', owner: 'Seller', references: ['Worker Adjustment and Retraining Notification Act, 29 U.S.C. §2101'], when: { jurisdictions: ['US'] } },
  { id: 'tupe', phase: 'Corporate approvals', name: 'TUPE information and consultation', purpose: 'Employees transfer automatically on an asset/business transfer. Employee representatives must be informed and consulted.', owner: 'Both parties', references: ['TUPE Regulations 2006'], when: { jurisdictions: ['UK'], structures: ['asset-purchase'] } },

  /* ---------------- Financing ---------------- */
  { id: 'debt-commitment', phase: 'Financing', name: 'Debt commitment letter and fee letter', purpose: 'Lenders\' commitment to fund the acquisition debt, with conditions aligned to the purchase agreement.', owner: 'Lenders', when: { financed: true } },
  { id: 'equity-commitment', phase: 'Financing', name: 'Equity commitment letter and limited guarantee', purpose: 'Sponsor commitment to fund the equity, and guarantee of any reverse termination fee.', owner: 'Buyer', when: { financed: true } },
  { id: 'credit-agreement', phase: 'Financing', name: 'Credit agreement and security documents', purpose: 'Definitive loan documentation, guarantees and security over the combined group\'s assets.', owner: 'Lenders', when: { financed: true } },
  { id: 'cash-confirmation', phase: 'Financing', name: 'Cash confirmation statement', purpose: 'Financial adviser confirms the bidder has the cash to pay the offer in full.', owner: 'Advisers', references: ['UK Takeover Code Rule 24.8'], when: { jurisdictions: ['UK'], targetTypes: ['public'] } },
  { id: 'escrow-open-offer', phase: 'Financing', name: 'Open offer escrow account', purpose: 'Deposit of a percentage of the offer consideration in escrow before the detailed public statement.', owner: 'Buyer', references: ['SEBI SAST Regulations 2011, Reg. 17'], when: { jurisdictions: ['IN'], targetTypes: ['public'] } },
  { id: 'payoff', phase: 'Financing', name: 'Payoff letters and lien releases', purpose: 'Existing lenders confirm amounts due and release security on repayment at closing.', owner: 'Seller' },

  /* ---------------- Closing ---------------- */
  { id: 'closing-checklist', phase: 'Closing', name: 'Closing checklist', purpose: 'Master list of every closing deliverable, signatory and status.', owner: 'Advisers', critical: true, template: 'closing-checklist' },
  { id: 'funds-flow', phase: 'Closing', name: 'Funds flow memorandum', purpose: 'Exact payments at closing: seller proceeds, debt payoff, fees, escrow deposits and wire instructions.', owner: 'Both parties', critical: true, template: 'funds-flow' },
  { id: 'closing-certs', phase: 'Closing', name: 'Officer\'s bring-down and secretary\'s certificates', purpose: 'Confirms representations are still true and conditions are met, and certifies resolutions and incumbency.', owner: 'Both parties' },
  { id: 'good-standing', phase: 'Closing', name: 'Good standing certificates', purpose: 'Official confirmation that each entity exists and is in good standing.', owner: 'Both parties', when: { jurisdictions: ['US'] } },
  { id: 'share-transfer', phase: 'Closing', name: 'Share transfer instruments', purpose: 'Stock powers or share transfer forms (e.g. SH-4 in India, stock transfer form in the UK) and updated registers.', owner: 'Seller', when: { structures: ['stock-purchase'] } },
  { id: 'cert-merger', phase: 'Closing', name: 'Certificate of merger', purpose: 'Filed with the state (or registrar) to make the merger effective.', owner: 'Target', references: ['DGCL s.251(c)'], when: { structures: ['merger', 'tender-offer'], jurisdictions: ['US'] } },
  { id: 'resignations', phase: 'Closing', name: 'Director and officer resignations', purpose: 'Resignations of outgoing directors and officers effective at closing.', owner: 'Target' },
  { id: 'press', phase: 'Closing', name: 'Announcement press release and communications plan', purpose: 'Agreed public, customer and employee communications.', owner: 'Both parties' },

  /* ---------------- Post-closing ---------------- */
  { id: 'closing-statement', phase: 'Post-closing', name: 'Closing statement and price adjustment', purpose: 'Final net working capital, cash and debt calculation against the agreed peg, and any true-up payment.', owner: 'Buyer', when: { targetTypes: ['private'] } },
  { id: 'sec-201', phase: 'Post-closing', name: 'Form 8-K Item 2.01 and pro forma financials', purpose: 'Completion of the acquisition, with target financial statements and pro forma information under Item 9.01 where significant.', owner: 'Buyer', references: ['Regulation S-X Rules 3-05 and Article 11'], when: { jurisdictions: ['US'] } },
  { id: 'delist', phase: 'Post-closing', name: 'Delisting and deregistration (Form 25 / Form 15)', purpose: 'Removes the target\'s shares from the exchange and ends its SEC reporting obligations.', owner: 'Target', when: { jurisdictions: ['US'], targetTypes: ['public'] } },
  { id: 'ppa', phase: 'Post-closing', name: 'Purchase price allocation', purpose: 'Allocation of price to identifiable assets and goodwill for accounting (ASC 805 / IFRS 3) and tax (e.g. IRS Form 8594 for asset deals).', owner: 'Buyer' },
  { id: 'integration', phase: 'Post-closing', name: '100-day integration plan', purpose: 'Owners, milestones and synergy tracking for combining the businesses.', owner: 'Buyer' },
  { id: 'indemnity-claims', phase: 'Post-closing', name: 'Indemnity / warranty claim notices', purpose: 'Formal notices for breaches discovered after closing, within the survival periods.', owner: 'Buyer', when: { targetTypes: ['private'] } },
  { id: 'in-post', phase: 'Post-closing', name: 'Post-closing filings with ROC, RBI and stock exchanges', purpose: 'Updated statutory registers and filings (e.g. Form INC-28 for the NCLT order, FC-TRS within 60 days).', owner: 'Target', when: { jurisdictions: ['IN'] } },

  /* ---------------- India-specific ---------------- */
  { id: 'in-pit', phase: 'Preparation', name: 'Board approval and confidentiality for sharing UPSI in diligence', purpose: 'A listed target may share unpublished price-sensitive information for a transaction only with board approval, a confidentiality agreement and a trading restriction on the recipient.', owner: 'Target', critical: true, references: ['SEBI (Prohibition of Insider Trading) Regulations 2015, Reg. 3(4)'], when: { jurisdictions: ['IN'], targetTypes: ['public'] } },
  { id: 'in-dd-mca', phase: 'Due diligence', name: 'MCA / ROC filings review', purpose: 'AOC-4 financial statements, MGT-7 annual returns, charge filings (CHG-1/CHG-9), allotments (PAS-3), director changes (DIR-12) and significant beneficial ownership (BEN-2) from the MCA portal.', owner: 'Advisers', critical: true, references: ['Companies Act 2013'], when: { jurisdictions: ['IN'] } },
  { id: 'in-dd-tax', phase: 'Due diligence', name: 'Indian tax structuring memo', purpose: 'Capital gains and withholding on the price, carry-forward of losses after a change in shareholding, tax neutrality of amalgamations and demergers, slump-sale computation, and the need for a tax clearance on asset transfers during pending tax proceedings.', owner: 'Advisers', critical: true, references: ['Income-tax Act, 2025 (successor to the 1961 Act from 1 April 2026; confirm current section numbers)'], when: { jurisdictions: ['IN'] } },
  { id: 'in-dd-labour', phase: 'Due diligence', name: 'Labour code and employee transfer review', purpose: 'Continuity of service, retrenchment compensation on transfer of an undertaking, gratuity and provident fund liabilities, and standing orders.', owner: 'Advisers', references: ['Industrial Relations Code, 2020', 'Code on Social Security, 2020'], when: { jurisdictions: ['IN'] } },
  { id: 'in-valuation', phase: 'Definitive agreements', name: 'Valuation reports (Registered Valuer, FEMA and tax)', purpose: 'Independent valuation for the share swap ratio or price: by a Registered Valuer for schemes and preferential allotments, by a chartered accountant or SEBI-registered merchant banker for FEMA pricing, and fair market value for tax.', owner: 'Advisers', critical: true, references: ['Companies Act 2013 s.247', 'FEMA (Non-Debt Instruments) Rules 2019', 'SEBI ICDR Regulations 2018'], when: { jurisdictions: ['IN'] } },
  { id: 'in-bta', phase: 'Definitive agreements', name: 'Business transfer agreement (BTA)', purpose: 'Transfers the undertaking as a going concern for a lump-sum consideration: employees, contracts, licences, assets and liabilities of the business.', owner: 'Both parties', critical: true, when: { jurisdictions: ['IN'], structures: ['slump-sale'] } },
  { id: 'in-sha', phase: 'Definitive agreements', name: "Shareholders' agreement and amended articles", purpose: 'Governance, reserved matters, transfer restrictions, tag/drag and exit rights where the seller or founders keep a stake. Rights must be reflected in the articles to be enforceable.', owner: 'Both parties', when: { jurisdictions: ['IN'], structures: ['stock-purchase'], targetTypes: ['private'] } },
  { id: 'in-s62', phase: 'Corporate approvals', name: 'Preferential allotment approvals (if paying in shares)', purpose: 'Special resolution, private placement offer letter (PAS-4) and return of allotment (PAS-3). Listed issuers must also follow SEBI ICDR Chapter V pricing and lock-in.', owner: 'Buyer', references: ['Companies Act 2013 ss.42 and 62(1)(c)', 'SEBI ICDR Regulations 2018, Chapter V'], when: { jurisdictions: ['IN'] } },
  { id: 'in-s180', phase: 'Corporate approvals', name: 'Special resolution to sell the undertaking (seller)', purpose: 'Shareholder approval by special resolution for the sale or lease of the whole or substantially the whole of an undertaking, filed with the ROC in MGT-14.', owner: 'Seller', critical: true, references: ['Companies Act 2013 s.180(1)(a)'], when: { jurisdictions: ['IN'], structures: ['asset-purchase', 'slump-sale'] } },
  { id: 'in-s186', phase: 'Corporate approvals', name: 'Investment limit approvals (buyer)', purpose: 'Special resolution where the acquisition takes the buyer\'s investments, loans and guarantees above the statutory limit.', owner: 'Buyer', references: ['Companies Act 2013 s.186'], when: { jurisdictions: ['IN'] } },
  { id: 'in-rpt', phase: 'Corporate approvals', name: 'Related party transaction approvals', purpose: 'Audit committee, board and (where thresholds are crossed) shareholder approval if any counterparty is a related party.', owner: 'Both parties', references: ['Companies Act 2013 s.188', 'SEBI LODR Regulations 2015, Reg. 23'], when: { jurisdictions: ['IN'] } },
  { id: 'in-sast-29', phase: 'Regulatory approvals', name: 'SAST Regulation 29 disclosures', purpose: 'Disclosure to the company and stock exchanges within two working days of crossing 5% and of each further 2% change in holding.', owner: 'Buyer', references: ['SEBI SAST Regulations 2011, Reg. 29'], when: { jurisdictions: ['IN'], targetTypes: ['public'] } },
  { id: 'in-rbi', phase: 'Regulatory approvals', name: 'RBI / IRDAI / SEBI change-in-control approvals', purpose: 'Prior approval for acquiring control of regulated entities, for example RBI approval for an NBFC acquisition of 26% or more or a change of over 30% of directors, IRDAI for insurers, and SEBI for intermediaries.', owner: 'Buyer', references: ['RBI Master Directions for NBFCs', 'IRDAI regulations', 'SEBI (Intermediaries) Regulations 2008'], when: { jurisdictions: ['IN'] } },
  { id: 'in-odi', phase: 'Regulatory approvals', name: 'Overseas investment filings (Indian acquirer buying abroad)', purpose: 'Form ODI and related reporting through the authorised dealer bank, within the financial commitment limits.', owner: 'Buyer', references: ['Foreign Exchange Management (Overseas Investment) Rules and Regulations 2022'], when: { jurisdictions: ['IN'], crossBorder: true } },
  { id: 'in-demat', phase: 'Closing', name: 'Demat transfer instructions and register updates', purpose: 'Off-market transfer through depository participants (delivery instruction slips), stamp duty collected by the depository, and updated register of members (MGT-1).', owner: 'Seller', when: { jurisdictions: ['IN'], structures: ['stock-purchase'] } },
  { id: 'in-stamp', phase: 'Closing', name: 'Stamp duty assessment and payment', purpose: 'Stamp duty on share transfers, on conveyance of assets under a BTA (state rates on immovable property) and on NCLT scheme orders, which several states treat as conveyances.', owner: 'Buyer', critical: true, references: ['Indian Stamp Act, 1899 and state stamp Acts'], when: { jurisdictions: ['IN'] } },
  { id: 'in-gst', phase: 'Closing', name: 'GST treatment and input tax credit transfer', purpose: 'Confirms whether the transfer is of a going concern, and transfers unutilised input tax credit to the buyer (Form GST ITC-02).', owner: 'Both parties', references: ['CGST Act 2017 and rules'], when: { jurisdictions: ['IN'], structures: ['asset-purchase', 'slump-sale', 'merger', 'scheme'] } },
  { id: 'in-3cea', phase: 'Post-closing', name: "Accountant's report on slump sale (Form 3CEA)", purpose: 'Chartered accountant certifies the net worth of the undertaking used to compute slump-sale capital gains.', owner: 'Seller', references: ['Income-tax rules on slump sale'], when: { jurisdictions: ['IN'], structures: ['slump-sale'] } },
  { id: 'in-mps', phase: 'Post-closing', name: 'Minimum public shareholding compliance', purpose: 'If the buyer\'s holding exceeds 75% after the open offer, public shareholding must be restored to at least 25% within the permitted period, or the company delisted.', owner: 'Buyer', references: ['Securities Contracts (Regulation) Rules 1957, Rule 19A', 'SEBI SAST Regulations 2011, Reg. 7(4)'], when: { jurisdictions: ['IN'], targetTypes: ['public'] } },
  { id: 'in-delisting', phase: 'Post-closing', name: 'Delisting offer (if taking the company private)', purpose: 'Board and shareholder approvals, in-principle exchange approval, and a reverse book-building or fixed-price delisting offer.', owner: 'Buyer', references: ['SEBI (Delisting of Equity Shares) Regulations 2021'], when: { jurisdictions: ['IN'], targetTypes: ['public'] } },

  /* ---------------- IBC resolution plans (India) ---------------- */
  { id: 'ibc-eoi', phase: 'Preliminary terms', name: 'Expression of interest (Form G response)', purpose: 'Response to the resolution professional\'s invitation, with eligibility documents and net-worth criteria.', owner: 'Buyer', critical: true, references: ['IBBI (Insolvency Resolution Process for Corporate Persons) Regulations 2016, Reg. 36A'], when: { structures: ['ibc'] } },
  { id: 'ibc-29a', phase: 'Due diligence', name: 'Section 29A eligibility affidavit', purpose: 'Undertaking that the resolution applicant and its connected persons are not disqualified (e.g. wilful defaulters, NPA-related persons).', owner: 'Buyer', critical: true, references: ['Insolvency and Bankruptcy Code 2016 s.29A'], when: { structures: ['ibc'] } },
  { id: 'ibc-ir', phase: 'Due diligence', name: 'Information memorandum and virtual data room review', purpose: 'Review of the information memorandum prepared by the resolution professional, which replaces seller warranties.', owner: 'Buyer', references: ['IBC 2016 s.29'], when: { structures: ['ibc'] } },
  { id: 'ibc-plan', phase: 'Definitive agreements', name: 'Resolution plan and performance security', purpose: 'Plan meeting the request for resolution plans: payments to creditors, implementation schedule, management and funding, with the performance bank guarantee.', owner: 'Buyer', critical: true, references: ['IBC 2016 s.30', 'CIRP Regulations, Regs. 37–39'], when: { structures: ['ibc'] } },
  { id: 'ibc-coc', phase: 'Corporate approvals', name: 'Committee of creditors approval', purpose: 'Approval of the resolution plan by at least 66% of the voting share of the committee of creditors.', owner: 'Lenders', critical: true, references: ['IBC 2016 s.30(4)'], when: { structures: ['ibc'] } },
  { id: 'ibc-nclt', phase: 'Regulatory approvals', name: 'NCLT approval order', purpose: 'Adjudicating authority approval making the plan binding on all stakeholders. CCI approval, where required, must be obtained before CoC approval.', owner: 'Both parties', critical: true, references: ['IBC 2016 s.31'], when: { structures: ['ibc'] } },
  { id: 'ibc-monitoring', phase: 'Post-closing', name: 'Monitoring committee and implementation reports', purpose: 'Committee supervising implementation of the plan until completion.', owner: 'Buyer', when: { structures: ['ibc'] } },
];

export interface DealConfig {
  structure: DealStructure;
  jurisdiction: Jurisdiction;
  targetType: TargetType;
  crossBorder: boolean;
  financed: boolean;
}

export function tailorChecklist(cfg: DealConfig): ChecklistDoc[] {
  return CHECKLIST.filter((d) => {
    const w = d.when;
    if (!w) return true;
    if (w.structures && !w.structures.includes(cfg.structure)) return false;
    if (w.jurisdictions && !w.jurisdictions.includes(cfg.jurisdiction)) return false;
    if (w.targetTypes && !w.targetTypes.includes(cfg.targetType)) return false;
    if (w.crossBorder && !cfg.crossBorder) return false;
    if (w.financed && !cfg.financed) return false;
    return true;
  });
}

/* ---------------- Due diligence request list ---------------- */
export const DD_REQUEST_LIST: { area: string; items: string[] }[] = [
  {
    area: 'Corporate and capitalisation',
    items: [
      'Certificate of incorporation / memorandum and articles, bylaws and all amendments',
      'Organisational chart of all subsidiaries with ownership percentages and jurisdictions',
      'Board and shareholder minutes and written consents for the last 5 years',
      'Fully diluted capitalisation table, including options, warrants, convertibles and SAFEs',
      'Shareholder, voting, investor rights and right-of-first-refusal agreements',
      'Equity incentive plans, award agreements and 409A / fair value reports',
      'Good standing certificates and foreign qualifications',
    ],
  },
  {
    area: 'Financial',
    items: [
      'Audited financial statements for the last 3 years and auditor management letters',
      'Monthly management accounts for the current and prior year',
      'Budget and 3–5 year financial projections with assumptions',
      'Revenue by customer, product, geography and contract type; ARR / bookings bridges where relevant',
      'Accounts receivable and payable ageing; inventory reports',
      'Net working capital analysis by month for 24 months',
      'Schedule of debt, guarantees, letters of credit and off-balance-sheet arrangements',
      'Capital expenditure history and commitments',
      'Details of any restatements, material weaknesses or changes in accounting policy',
    ],
  },
  {
    area: 'Tax',
    items: [
      'Income, sales/VAT/GST, payroll and property tax returns for open years',
      'Tax audits, assessments, rulings and correspondence with tax authorities',
      'Transfer pricing documentation and intercompany agreements',
      'Net operating losses, credits and other tax attributes, and any limitations',
      'Tax sharing, allocation or indemnity agreements',
      'Details of tax holidays, incentives and permanent establishment exposures',
    ],
  },
  {
    area: 'Material contracts',
    items: [
      'Top 20 customer and top 20 supplier contracts, with revenue/spend for each',
      'Contracts with change-of-control, anti-assignment, exclusivity, MFN or non-compete provisions',
      'Partnership, joint venture, distribution, reseller and agency agreements',
      'Government contracts and grants',
      'Credit agreements, indentures, security agreements and guarantees',
      'Prior acquisition and divestiture agreements with continuing obligations or earn-outs',
    ],
  },
  {
    area: 'Intellectual property and technology',
    items: [
      'Schedule of registered and applied-for patents, trademarks, copyrights and domains',
      'Inbound and outbound licences, including royalty obligations',
      'Invention assignment and confidentiality agreements with all employees and contractors',
      'Open-source software inventory and licence compliance policy',
      'Product architecture, hosting and key third-party dependencies',
      'IP disputes, infringement claims or ownership challenges',
    ],
  },
  {
    area: 'Data privacy and cybersecurity',
    items: [
      'Privacy policies, records of processing and data protection impact assessments',
      'Data processing agreements and cross-border transfer mechanisms',
      'Information security policies, certifications (SOC 2, ISO 27001) and penetration test reports',
      'Security incidents and data breaches in the last 5 years, and notifications made',
      'Regulator inquiries or complaints under GDPR, CCPA, DPDP Act 2023 or similar laws',
    ],
  },
  {
    area: 'Employees and benefits',
    items: [
      'Employee census: role, location, start date, compensation, bonus and equity',
      'Employment agreements for senior management and key employees',
      'Change-of-control, severance, retention and transaction bonus arrangements',
      'Benefit, pension and retirement plans, with funding status',
      'Contractor and consultant agreements, and classification analysis',
      'Collective bargaining agreements, works councils and labour disputes',
      'Harassment, discrimination and whistleblower complaints and investigations',
    ],
  },
  {
    area: 'Litigation and compliance',
    items: [
      'Pending and threatened litigation, arbitration and regulatory proceedings',
      'Settlements, consent decrees and judgments in the last 5 years',
      'Anti-corruption, sanctions and export control policies and any violations',
      'Permits, licences and certifications required to operate, and their transferability',
      'Correspondence with regulators',
    ],
  },
  {
    area: 'Real estate and environmental',
    items: [
      'Schedule of owned and leased properties, with deeds and leases',
      'Title reports, surveys and encumbrances for owned property',
      'Environmental permits, assessments, notices of violation and remediation obligations',
    ],
  },
  {
    area: 'Insurance',
    items: [
      'Schedule of insurance policies, limits, deductibles and premiums',
      'Claims history for the last 5 years and open claims',
      'D&O policy and indemnification agreements with directors and officers',
    ],
  },
  {
    area: 'Commercial',
    items: [
      'Customer retention, churn and net revenue retention by cohort',
      'Sales pipeline and win/loss analysis',
      'Pricing policy and discounting history',
      'Competitive landscape and market share analysis',
      'Customer satisfaction metrics and key complaints',
    ],
  },
];
