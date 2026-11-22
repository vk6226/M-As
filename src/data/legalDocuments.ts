export type LegalCategory = 
  | 'Confidentiality & NDA'
  | 'Definitive Purchase (SPA/APA)'
  | 'Regulatory & Antitrust'
  | 'IP & Invention Assignment'
  | 'Employment & Retention';

export type DocumentStatus = 
  | 'Executed'
  | 'In Legal Review'
  | 'Under Negotiation'
  | 'Regulatory Cleared'
  | 'Draft Ready';

export interface LegalDocument {
  id: string;
  docNumber: string;
  title: string;
  shortTitle: string;
  targetId: string;
  targetName: string;
  codeName: string;
  category: LegalCategory;
  status: DocumentStatus;
  statusColor: string;
  counselOfRecord: string;
  governingLaw: string;
  lastUpdated: string;
  effectiveDate: string;
  summary: string;
  keyTerms: {
    label: string;
    value: string;
  }[];
  clauses: {
    section: string;
    title: string;
    content: string;
  }[];
  signatures: {
    role: string;
    entity: string;
    signatory: string;
    status: 'Signed' | 'Pending Sign-off' | 'Awaiting Counterparty';
    signedAt?: string;
  }[];
}

export const MOCK_LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: 'leg-01',
    docNumber: 'SPA-CERBERUS-2026.04',
    title: 'Stock Purchase Agreement (SPA) & Plan of Merger',
    shortTitle: 'Definitive Stock Purchase Agreement',
    targetId: 'tgt-01',
    targetName: 'Aegis Sentinel Security',
    codeName: 'Project Cerberus',
    category: 'Definitive Purchase (SPA/APA)',
    status: 'In Legal Review',
    statusColor: 'var(--accent-cyan)',
    counselOfRecord: 'Skadden, Arps, Slate, Meagher & Flom LLP',
    governingLaw: 'State of Delaware (Court of Chancery)',
    lastUpdated: '2026-10-24',
    effectiveDate: 'Anticipated Closing: Dec 15, 2026',
    summary: 'Master definitive acquisition agreement providing for the 100% equity acquisition of Aegis Sentinel Security for $460.0M total consideration, structured as $390.0M cash at closing, $45.0M rollover equity, and $25.0M retention escrow.',
    keyTerms: [
      { label: 'Purchase Consideration', value: '$460.0M Enterprise Value ($390M Cash / $45M Rollover Equity)' },
      { label: 'Indemnification Cap', value: '1.0% of Enterprise Value ($4.6M) backed by $50M R&W Insurance policy' },
      { label: 'Survival Period', value: '18 months General Reps; 6 years Fundamental Reps & Tax' },
      { label: 'Escrow Reserve', value: '8.0% ($36.8M) held for 12 months with J.P. Morgan Escrow Agent' },
      { label: 'Breakup Fee', value: '$18.4M (4.0%) Reverse Termination Fee' },
      { label: 'Non-Compete', value: '3-year restrictive covenant for Founders and Senior Leadership' },
    ],
    clauses: [
      {
        section: 'Section 2.01',
        title: 'Purchase and Sale of Equity Interests',
        content: 'Upon the terms and subject to the conditions set forth in this Agreement, at the Closing, Seller shall sell, convey, assign, transfer and deliver to Purchaser, and Purchaser shall purchase and acquire from Seller, all right, title and interest in and to 100% of the issued and outstanding capital stock of the Company, free and clear of all Encumbrances.'
      },
      {
        section: 'Section 3.14',
        title: 'Intellectual Property & eBPF Kernel Probes',
        content: 'The Company owns and has good and marketable title to all Registered Intellectual Property, including Patent US-11928491-B2 and proprietary eBPF telemetry hooks, free from any third-party claims or copyleft Open Source Software (OSS) contamination under GPL/AGPL.'
      },
      {
        section: 'Section 6.04',
        title: 'Representations & Warranties Insurance (RWI)',
        content: 'Purchaser has secured a binding conditional binder for a Buyer-side Representations and Warranties Insurance Policy with Euclid Transactional LLC providing coverage of $50,000,000 in excess of a $4,600,000 retention amount.'
      },
      {
        section: 'Section 8.02',
        title: 'Closing Conditions & Pre-Closing Filings',
        content: 'The obligations of both parties to consummate the Merger are subject to expiration or termination of applicable waiting periods under the Hart-Scott-Rodino (HSR) Antitrust Improvements Act of 1976 and delivery of audited closing statements.'
      }
    ],
    signatures: [
      { role: 'Purchaser Representative', entity: 'Apex Strategic Enterprise Group Inc.', signatory: 'Marcus Vance (Managing Director)', status: 'Pending Sign-off' },
      { role: 'Target Founder & CEO', entity: 'Aegis Sentinel Inc.', signatory: 'Dr. Gregory Vance, Ph.D.', status: 'Pending Sign-off' },
      { role: 'Major Shareholder (Sponsor)', entity: 'Apex Horizon Ventures LP', signatory: 'Amanda Sterling (General Partner)', status: 'Pending Sign-off' },
    ]
  },
  {
    id: 'leg-02',
    docNumber: 'HSR-FTC-2026-0891',
    title: 'Hart-Scott-Rodino (HSR) Antitrust Pre-Merger Notification',
    shortTitle: 'FTC & DOJ Antitrust Pre-Merger Filing',
    targetId: 'tgt-01',
    targetName: 'Aegis Sentinel Security',
    codeName: 'Project Cerberus',
    category: 'Regulatory & Antitrust',
    status: 'Regulatory Cleared',
    statusColor: 'var(--accent-emerald)',
    counselOfRecord: 'Latham & Watkins LLP (Antitrust & Competition Practice)',
    governingLaw: 'Federal Trade Commission & US Department of Justice Antitrust Div.',
    lastUpdated: '2026-10-20',
    effectiveDate: 'Filing Granted Early Termination: Oct 28, 2026',
    summary: 'Formal pre-merger antitrust notification filed jointly under 15 U.S.C. § 18a. 2026 Size-of-Transaction and Size-of-Person tests analyzed. Combined market share in Cloud Identity Governance confirmed at 14.2%, well below HHI concentration threshold (ΔHHI < 85).',
    keyTerms: [
      { label: 'HSR 2026 Statutory Threshold', value: '$126.9M Size-of-Transaction (Met; Exceeds $126.9M threshold)' },
      { label: 'Herfindahl-Hirschman Index', value: 'Pre-merger: 1,420 | Post-merger: 1,505 (Safe harbor under DOJ horizontal guidelines)' },
      { label: 'Early Termination Status', value: 'Early Termination Requested & Cleared without Second Request' },
      { label: 'Filing Fee Paid', value: '$250,000 statutory fee disbursed via Fedwire' },
    ],
    clauses: [
      {
        section: 'Item 4(c) & 4(d)',
        title: 'Market Studies & Synergy Presentations',
        content: 'All confidential board decks, financial models, and strategic synergy projections prepared by or for officers/directors assessing markets, market shares, competition, and competitor analyses have been fully compiled and submitted.'
      },
      {
        section: 'Item 7',
        title: 'North American Industry Classification (NAICS)',
        content: 'NAICS Code 541512 (Computer Systems Design Services) and 511210 (Software Publishers). No overlap exceeding 15% in any Metropolitan Statistical Area or sub-tier segment.'
      }
    ],
    signatures: [
      { role: 'Regulatory Counsel', entity: 'Latham & Watkins LLP', signatory: 'Robert K. Higgins, Esq.', status: 'Signed', signedAt: '2026-10-18 14:22 EST' },
      { role: 'Acquirer General Counsel', entity: 'Apex Strategic Enterprise Group Inc.', signatory: 'Victoria Chen, Esq.', status: 'Signed', signedAt: '2026-10-18 16:05 EST' },
    ]
  },
  {
    id: 'leg-03',
    docNumber: 'MNDA-COGNITIVE-2026-09',
    title: 'Bilateral Mutual Non-Disclosure & Clean Team Agreement',
    shortTitle: 'MNDA & Clean Room Data Protocol',
    targetId: 'tgt-02',
    targetName: 'CognitiveCore AI',
    codeName: 'Project Vulcan',
    category: 'Confidentiality & NDA',
    status: 'Executed',
    statusColor: 'var(--accent-emerald)',
    counselOfRecord: 'Wilson Sonsini Goodrich & Rosati',
    governingLaw: 'State of California (Santa Clara County)',
    lastUpdated: '2026-09-08',
    effectiveDate: 'Executed: Sep 08, 2026 (Duration: 36 Months)',
    summary: 'Comprehensive non-disclosure covenant featuring an audited "Clean Team" protocol. Governs confidential disclosure of proprietary multi-modal foundation models, GPU cluster training weights, enterprise customer pricing, and salary band telemetry.',
    keyTerms: [
      { label: 'Confidentiality Term', value: '3 years from Effective Date; Trade Secrets protected in perpetuity' },
      { label: 'Standstill Covenant', value: '18-month standstill barring unsolicited tender offers or proxy contests' },
      { label: 'Non-Solicit Clause', value: '24-month reciprocal employee non-solicitation restricted to key engineering roles' },
      { label: 'Clean Room Protocol', value: 'Restricted access only to nominated third-party Ernst & Young diligence auditors' },
    ],
    clauses: [
      {
        section: 'Clause 3.1',
        title: 'Definition of Confidential Technical Data',
        content: 'Confidential Information includes neural network weights, attention matrices, inference latency benchmarks, training dataset curation algorithms, customer margin data, and unreleased product roadmaps.'
      },
      {
        section: 'Clause 6.3',
        title: 'Clean Team Safeguards',
        content: 'Highly commercially sensitive pricing and customer contract provisions shall only be accessed by designated "Clean Team" members who do not hold day-to-day commercial pricing authority within Acquirer.'
      }
    ],
    signatures: [
      { role: 'Chief Legal Officer', entity: 'Apex Strategic Enterprise Group Inc.', signatory: 'Victoria Chen, Esq.', status: 'Signed', signedAt: '2026-09-08 11:30 PST' },
      { role: 'Co-Founder & CEO', entity: 'CognitiveCore AI Inc.', signatory: 'Dr. Soraya Malek', status: 'Signed', signedAt: '2026-09-08 15:10 PST' },
    ]
  },
  {
    id: 'leg-04',
    docNumber: 'IOI-COGNITIVE-2026-V1',
    title: 'Non-Binding Indication of Interest (IOI) & Exclusivity Term Sheet',
    shortTitle: 'Non-Binding Indication of Interest',
    targetId: 'tgt-02',
    targetName: 'CognitiveCore AI',
    codeName: 'Project Vulcan',
    category: 'Confidentiality & NDA',
    status: 'Under Negotiation',
    statusColor: 'var(--accent-amber)',
    counselOfRecord: 'Skadden, Arps / In-House Corp Dev',
    governingLaw: 'State of Delaware',
    lastUpdated: '2026-10-15',
    effectiveDate: 'Submitted: Oct 12, 2026 (Offer valid through Nov 15, 2026)',
    summary: 'Strategic Indication of Interest proposing an enterprise acquisition range of $425.0M – $445.0M EV with a $50.0M performance-linked earnout, requesting 45 days of bilateral exclusivity.',
    keyTerms: [
      { label: 'Proposed Valuation', value: '$425M - $445M Enterprise Value (7.8x - 8.2x 2026E ARR)' },
      { label: 'Consideration Structure', value: '70% Cash at Closing, 20% Acquirer Equity, 10% Earnout Contingent on ARR Milestones' },
      { label: 'Bilateral Exclusivity', value: '45 days requested to complete confirmatory technical and code DD' },
      { label: 'Employee Retention Pool', value: '$35.0M dedicated 4-year unvested equity retention pool for AI research fellows' },
    ],
    clauses: [
      {
        section: 'Paragraph 4',
        title: 'Exclusivity & No-Shop Undertaking',
        content: 'During the Exclusivity Period, the Company and its representatives will immediately cease any existing discussions and will not solicit, initiate, or engage in any merger, asset acquisition, or equity financing proposals.'
      },
      {
        section: 'Paragraph 8',
        title: 'Non-Binding Effect',
        content: 'This Indication of Interest is non-binding and does not constitute a definitive agreement, except that Paragraphs 4 (Exclusivity), 7 (Confidentiality), and 9 (Governing Law) shall constitute legally binding obligations.'
      }
    ],
    signatures: [
      { role: 'Executive Vice President', entity: 'Apex Strategic Enterprise Group Inc.', signatory: 'Marcus Vance', status: 'Signed', signedAt: '2026-10-12 09:00 EST' },
      { role: 'Managing Partner', entity: 'Silicon Horizon Capital (Lead Series B)', signatory: 'Tarek Al-Mansoor', status: 'Awaiting Counterparty' },
    ]
  },
  {
    id: 'leg-05',
    docNumber: 'PIIA-KUBEMESH-2026-01',
    title: 'Proprietary Information & Inventions Assignment (PIIA) Audit Pack',
    shortTitle: 'IP Inventions & Open-Source Audit Pack',
    targetId: 'tgt-07',
    targetName: 'KubeMesh Infra',
    codeName: 'Project Bastion',
    category: 'IP & Invention Assignment',
    status: 'Executed',
    statusColor: 'var(--accent-emerald)',
    counselOfRecord: 'Gunderson Dettmer Stough Villeneuve Franklin & Hachigian, LLP',
    governingLaw: 'State of Washington (King County)',
    lastUpdated: '2026-10-14',
    effectiveDate: 'Audited & Bound: Oct 14, 2026',
    summary: 'Full chain-of-title intellectual property verification covering 100% of current and past employees, contractors, and external open-source contributors for KubeMesh service mesh kernel hooks.',
    keyTerms: [
      { label: 'Chain of Title Coverage', value: '100% (74 of 74 contributors executed formal PIIA deeds)' },
      { label: 'OSS License Scan', value: 'Zero GPLv3 / AGPL viral copyleft contamination found via Black Duck audit' },
      { label: 'Granted Utility Patents', value: '3 granted USPTO patents + 4 pending international PCT filings' },
      { label: 'Source Code Escrow', value: 'Iron Mountain Dual-Key Vault ready for escrow transfer at closing' },
    ],
    clauses: [
      {
        section: 'Section 1.02',
        title: 'Assignment of Inventions & Moral Rights Waiver',
        content: 'All technical inventions, service mesh algorithms, eBPF routing proxies, documentation, and source code conceived or developed during tenure are irrevocable, sole, and exclusive property of the Company.'
      },
      {
        section: 'Section 4.05',
        title: 'Open Source Software Verification Warranty',
        content: 'No proprietary software module incorporates or links with any software subject to Copyleft licenses that would require public disclosure of proprietary source code.'
      }
    ],
    signatures: [
      { role: 'Founder & Chief Architect', entity: 'KubeMesh Inc.', signatory: 'Linus Brandt', status: 'Signed', signedAt: '2026-10-14 18:30 PST' },
      { role: 'IP Diligence Lead Partner', entity: 'Gunderson Dettmer LLP', signatory: 'Rachel Green-Sloan, Esq.', status: 'Signed', signedAt: '2026-10-14 19:15 PST' },
    ]
  },
  {
    id: 'leg-06',
    docNumber: 'KEYMAN-QUANTUM-2026-03',
    title: 'Key-Person Non-Compete & Employment Retention Agreement',
    shortTitle: 'Key-Person Non-Compete & Retention Pool',
    targetId: 'tgt-05',
    targetName: 'QuantumKey Cryptography',
    codeName: 'Project Turing',
    category: 'Employment & Retention',
    status: 'Draft Ready',
    statusColor: 'var(--accent-violet)',
    counselOfRecord: 'Cooley LLP',
    governingLaw: 'State of New York',
    lastUpdated: '2026-10-22',
    effectiveDate: 'Effective Upon Closing of Transaction',
    summary: 'Restrictive covenants, 36-month non-compete agreements, and a $22.0M four-year retention pool tailored for the top 8 Post-Quantum Cryptography (PQC) mathematical researchers.',
    keyTerms: [
      { label: 'Retention Pool Size', value: '$22.0M distributed over 4-year vesting (25% annual cliff)' },
      { label: 'Non-Compete Period', value: '36 months post-separation from employment within quantum security domain' },
      { label: 'Key-Man Conditionality', value: 'Closing conditioned on execution by at least 6 of the 8 designated Principal Fellows' },
      { label: 'Severance & Good Reason', value: 'Double-trigger acceleration on unvested retention options' },
    ],
    clauses: [
      {
        section: 'Article 3',
        title: 'Post-Employment Restrictive Covenants',
        content: 'Employee agrees not to directly or indirectly design, consult for, or develop commercial Post-Quantum cryptographic primitives that compete with Acquirer products in the United States, EU, and UK.'
      },
      {
        section: 'Article 5',
        title: 'Special IP Assignment for Quantum Algorithms',
        content: 'All mathematical proofs and quantum circuit gate designs developed prior to closing are affirmed to be Company property.'
      }
    ],
    signatures: [
      { role: 'Principal Cryptographer', entity: 'QuantumKey Inc.', signatory: 'Prof. David K. Sterling', status: 'Pending Sign-off' },
      { role: 'Chief People Officer', entity: 'Apex Strategic Enterprise Group Inc.', signatory: 'Caroline Miller', status: 'Signed', signedAt: '2026-10-22 10:00 EST' },
    ]
  },
  {
    id: 'leg-07',
    docNumber: 'CFIUS-VELOCE-2026-11',
    title: 'CFIUS Cross-Border Declaration & Critical Infrastructure Clearance',
    shortTitle: 'CFIUS & National Security Declaration',
    targetId: 'tgt-03',
    targetName: 'VelocePay Global',
    codeName: 'Project Mercury',
    category: 'Regulatory & Antitrust',
    status: 'In Legal Review',
    statusColor: 'var(--accent-cyan)',
    counselOfRecord: 'Covington & Burling LLP (National Security & CFIUS Group)',
    governingLaw: 'Defense Production Act of 1950 (50 U.S.C. § 4565) / CFIUS Regulations',
    lastUpdated: '2026-10-19',
    effectiveDate: 'Filing Scheduled: Nov 05, 2026',
    summary: 'Voluntary declaration to the Committee on Foreign Investment in the United States (CFIUS) evaluating sovereign foreign LP participation in Acquirer syndicate relative to Critical Technology (TID U.S. Business) and financial payment switch infrastructure.',
    keyTerms: [
      { label: 'TID Business Analysis', value: 'Covered investment review due to real-time clearing payment rail infrastructure' },
      { label: 'Foreign Ownership (FOCI)', value: 'Syndicate foreign LP voting rights restricted below 5.0% safe harbor' },
      { label: 'Anticipated Assessment', value: '30-day assessment under 31 C.F.R. Part 800 with expected safe harbor clearance' },
    ],
    clauses: [
      {
        section: 'Section 4.1',
        title: 'FOCI Mitigation Protocol',
        content: 'No foreign entity or individual shall be granted board representation, observer rights, or access to non-public technical data regarding domestic federal clearing mechanisms.'
      }
    ],
    signatures: [
      { role: 'Special CFIUS Counsel', entity: 'Covington & Burling LLP', signatory: 'Ambassador John R. Vance (Ret.)', status: 'Pending Sign-off' },
    ]
  },
  {
    id: 'leg-08',
    docNumber: 'TSA-BASTION-2026-02',
    title: 'Transition Services Agreement (TSA) & Shared Infrastructure Carve-Out',
    shortTitle: 'Transition Services Agreement (TSA)',
    targetId: 'tgt-07',
    targetName: 'KubeMesh Infra',
    codeName: 'Project Bastion',
    category: 'Definitive Purchase (SPA/APA)',
    status: 'Draft Ready',
    statusColor: 'var(--accent-violet)',
    counselOfRecord: 'Skadden, Arps, Slate, Meagher & Flom LLP',
    governingLaw: 'State of Delaware',
    lastUpdated: '2026-10-16',
    effectiveDate: 'Post-Closing Execution Schedule',
    summary: 'Operational decoupling framework detailing 90-day transitional enterprise cloud infrastructure, ERP licensing, domain name DNS routing, and developer access token migrations.',
    keyTerms: [
      { label: 'TSA Period', value: '90-day transitional term with optional 30-day extension at cost + 10%' },
      { label: 'Services Scope', value: 'AWS GovCloud partition migration, Stripe billing API token re-routing, Okta SSO integration' },
      { label: 'Monthly Billing', value: '$85,000 / month flat baseline cost for shared cloud tenancy support' },
    ],
    clauses: [
      {
        section: 'Schedule A',
        title: 'Cloud Infrastructure Separation Milestone',
        content: 'Seller agrees to assist Purchaser in seamless cross-account AWS VPC peering and S3 storage migration without downtime exceeding 15 minutes during maintenance windows.'
      }
    ],
    signatures: [
      { role: 'VP Corporate Development', entity: 'Apex Strategic Enterprise Group Inc.', signatory: 'Marcus Vance', status: 'Signed', signedAt: '2026-10-16 11:00 EST' },
      { role: 'Chief Technology Officer', entity: 'KubeMesh Inc.', signatory: 'Devin Thorne', status: 'Awaiting Counterparty' },
    ]
  }
];
