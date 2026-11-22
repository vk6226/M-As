/* ==========================================================================
   First-draft templates for core M&A documents.
   Output is Markdown with [BRACKETED] placeholders. These are starting points
   for counsel, not finished legal documents.
   ========================================================================== */
import { DD_REQUEST_LIST, JURISDICTIONS, PHASES, STRUCTURES, type ChecklistDoc, type DealConfig, type TemplateId } from './maDocumentChecklist';

export interface DealParties {
  buyer: string;
  target: string;
  seller: string;
  price: string; // free text, e.g. "$460.0M"
  codeName: string;
}

const GOVERNING_LAW: Record<DealConfig['jurisdiction'], string> = {
  US: 'the State of Delaware',
  UK: 'England and Wales',
  EU: '[MEMBER STATE]',
  IN: 'India, with disputes resolved by arbitration seated in [CITY] under the Arbitration and Conciliation Act, 1996',
};

const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const header = (title: string, p: DealParties, cfg: DealConfig) => `# ${title}

**${p.codeName}**: ${p.buyer} / ${p.target}
Structure: ${STRUCTURES.find((s) => s.id === cfg.structure)?.label} · Jurisdiction: ${JURISDICTIONS.find((j) => j.id === cfg.jurisdiction)?.label} · Target: ${cfg.targetType === 'public' ? 'Listed' : 'Private'}
Draft prepared ${today()}

> **Draft for discussion only. Not legal advice.** This template must be reviewed and adapted by qualified counsel in each relevant jurisdiction before use.

---
`;

export function renderTemplate(id: TemplateId, p: DealParties, cfg: DealConfig, checklist: ChecklistDoc[], statuses: Record<string, string>): string {
  const law = GOVERNING_LAW[cfg.jurisdiction];
  switch (id) {
    case 'nda':
      return `${header('Mutual Non-Disclosure Agreement', p, cfg)}
This Agreement is made on [DATE] between **${p.buyer}** ("Recipient") and **${p.target}** ("Company"), each a "Party".

## 1. Purpose
The Parties wish to evaluate a possible negotiated transaction involving the Company (the "Transaction"). The Company will provide information for this purpose only.

## 2. Confidential Information
"Confidential Information" means all information disclosed by or for the Company, in any form, before or after this Agreement, including analyses and notes prepared by the Recipient that contain it. It excludes information that (a) is or becomes public other than through breach, (b) was lawfully known to the Recipient before disclosure, (c) is received from a third party without a duty of confidence, or (d) is independently developed.

## 3. Obligations
The Recipient will (a) use Confidential Information solely to evaluate and negotiate the Transaction; (b) disclose it only to its directors, officers, employees, financing sources and advisers who need to know it ("Representatives") and are bound by confidentiality; and (c) be responsible for any breach by its Representatives.

## 4. Existence of discussions
Neither Party will disclose that discussions are taking place, or their terms, except as required by law or stock exchange rules${cfg.targetType === 'public' ? ', in which case the disclosing Party will give prior notice where lawful' : ''}.

## 5. Non-solicitation
For [12] months, the Recipient will not solicit for employment any officer or key employee of the Company with whom it had contact during the evaluation, except through general advertisements.
${cfg.targetType === 'public' ? `
## 6. Standstill
For [12–18] months, the Recipient will not, without the Company's prior written consent, acquire or offer to acquire any voting securities of the Company, solicit proxies, or seek to influence its management or board.
` : ''}
## ${cfg.targetType === 'public' ? '7' : '6'}. Competitively sensitive information
Any competitively sensitive information will be shared only under a separate clean team agreement.

## ${cfg.targetType === 'public' ? '8' : '7'}. Return or destruction
On request, the Recipient will return or destroy Confidential Information, subject to legal and regulatory retention requirements.

## ${cfg.targetType === 'public' ? '9' : '8'}. No obligation; no representation
No Party is obliged to proceed with a Transaction until a definitive agreement is signed. The Company makes no representation as to the accuracy or completeness of the information except as set out in a definitive agreement.

## ${cfg.targetType === 'public' ? '10' : '9'}. Term, remedies and governing law
This Agreement lasts [2] years. Damages may not be an adequate remedy, and the Company may seek injunctive relief. This Agreement is governed by the laws of ${law}.

| ${p.buyer} | ${p.target} |
|---|---|
| By: ____________ | By: ____________ |
| Name / Title: | Name / Title: |
`;

    case 'loi':
      return `${header('Letter of Intent', p, cfg)}
[DATE]

To the Board of Directors of **${p.target}**

Dear Directors,

${p.buyer} is pleased to submit this non-binding letter of intent for the proposed acquisition of ${p.target}.

## 1. Transaction
${STRUCTURES.find((s) => s.id === cfg.structure)?.description}

## 2. Consideration
An enterprise value of **${p.price || '[AMOUNT]'}** on a cash-free, debt-free basis, assuming a normalised level of net working capital, payable in [cash / shares / mix]. [Earn-out / rollover terms, if any.]

## 3. Key assumptions
[List valuation assumptions, e.g. audited EBITDA of [X], ARR of [Y], no material undisclosed liabilities.]

## 4. Due diligence
Confirmatory diligence covering financial, tax, legal, commercial, technology and HR matters, expected to take [4–6] weeks.

## 5. Definitive agreement
The Parties will negotiate a definitive agreement containing representations, warranties, covenants, conditions and indemnities customary for a transaction of this type${cfg.targetType === 'private' ? ', supported by [escrow / R&W insurance]' : ''}.

## 6. Conditions
Satisfactory diligence; board${cfg.targetType === 'public' || cfg.structure === 'merger' ? ' and shareholder' : ''} approvals; required regulatory approvals; key employee arrangements; no material adverse change.

## 7. Financing
${cfg.financed ? 'The Transaction will be funded with [cash on hand and committed debt financing]. Commitment letters will be delivered at signing.' : 'The Transaction will be funded from cash on hand and will not be subject to a financing condition.'}

## 8. Management and employees
[Intentions for management, retention pools and employees.]

## 9. Exclusivity (binding)
For [45] days from countersignature, the Company and its shareholders will not solicit, encourage or negotiate any alternative transaction.

## 10. Confidentiality, costs and governing law (binding)
This letter is subject to the NDA dated [DATE]. Each Party bears its own costs. This letter is governed by the laws of ${law}.

## 11. Non-binding nature
Except for Sections 9 and 10, this letter is not legally binding and creates no obligation until a definitive agreement is signed.

Yours faithfully,
**${p.buyer}**
`;

    case 'exclusivity':
      return `${header('Exclusivity Agreement', p, cfg)}
1. **Exclusivity period.** From the date of this Agreement until [DATE] (the "Exclusivity Period"), ${p.seller || p.target} and ${p.target} will not, directly or through representatives, solicit, initiate, encourage, negotiate or enter into any agreement for any sale of shares, assets or business of ${p.target}, or any merger or similar transaction, with anyone other than ${p.buyer}.
2. **Notice of approaches.** They will promptly notify ${p.buyer} of any unsolicited approach, including the identity of the party and the material terms.
3. **Conduct of business.** ${p.target} will carry on its business in the ordinary course during the Exclusivity Period.
4. **Termination.** This Agreement ends on the earlier of the end of the Exclusivity Period, signing of a definitive agreement, or written notice from ${p.buyer} that it no longer wishes to proceed.
5. **Governing law.** The laws of ${law}.
`;

    case 'dd-request': {
      const sections = DD_REQUEST_LIST.map(
        (a, i) => `## ${i + 1}. ${a.area}\n\n| # | Request | Status | VDR ref | Comments |\n|---|---|---|---|---|\n${a.items.map((it, j) => `| ${i + 1}.${j + 1} | ${it} | Open | | |`).join('\n')}`
      ).join('\n\n');
      return `${header('Due Diligence Request List', p, cfg)}
Please upload responses to the data room using the reference numbers below. Where a request is not applicable, mark it "N/A" with a short explanation. Requests cover ${p.target} and all of its subsidiaries for the last [3] years unless stated otherwise.

${sections}
`;
    }

    case 'board-resolution':
      return `${header('Board Resolutions', p, cfg)}
**[COMPANY NAME]**, Resolutions of the Board of Directors, adopted on [DATE] [at a duly convened meeting / by unanimous written consent].

**WHEREAS**, the Board has reviewed the proposed ${STRUCTURES.find((s) => s.id === cfg.structure)?.label.toLowerCase()} transaction between ${p.buyer} and ${p.target} for consideration of ${p.price || '[AMOUNT]'} (the "Transaction"), on the terms of the [definitive agreement] presented to the Board (the "Agreement");

**WHEREAS**, the Board has received the advice of its financial and legal advisers${cfg.targetType === 'public' ? ' and a fairness opinion from [ADVISER]' : ''};

${cfg.jurisdiction === 'IN' ? `**WHEREAS**, the Board has considered the requirements of the Companies Act, 2013 (including sections 179, 180${cfg.structure === 'asset-purchase' || cfg.structure === 'slump-sale' ? '(1)(a) (subject to approval of shareholders by special resolution)' : ''}, 186 and 188, as applicable)${cfg.targetType === 'public' ? ', the SEBI (LODR) Regulations, 2015 and the SEBI (SAST) Regulations, 2011' : ''};

` : ''}**NOW, THEREFORE, BE IT RESOLVED**, that the Transaction and the Agreement are advisable and in the best interests of the Company and its shareholders, and are approved;

**RESOLVED**, that [NAMES / TITLES] (the "Authorised Officers") are each authorised to execute and deliver the Agreement and all ancillary documents, with such changes as the Authorised Officer approves, such approval to be conclusively evidenced by execution;
${cfg.structure === 'merger' || cfg.structure === 'scheme' ? `
**RESOLVED**, that the Board recommends that shareholders approve the Transaction, and directs that it be submitted to shareholders at a meeting to be called for that purpose;
` : ''}${cfg.financed ? `
**RESOLVED**, that the financing for the Transaction, on the terms of the commitment letters presented to the Board, is approved;
` : ''}
**RESOLVED**, that the Authorised Officers are authorised to make all regulatory filings and take all further actions necessary to complete the Transaction, and all prior actions consistent with these resolutions are ratified.

Certified by: ____________, Company Secretary
`;

    case 'closing-checklist': {
      const rows = PHASES.map((ph) => {
        const docs = checklist.filter((d) => d.phase === ph);
        if (!docs.length) return '';
        return `## ${ph}\n\n| Document | Responsible | Status | Signatories / notes |\n|---|---|---|---|\n${docs.map((d) => `| ${d.name} | ${d.owner} | ${statuses[d.id] ?? 'Not started'} | |`).join('\n')}`;
      })
        .filter(Boolean)
        .join('\n\n');
      return `${header('Closing Checklist', p, cfg)}
Target signing: [DATE] · Target closing: [DATE]

${rows}
`;
    }

    case 'disclosure-index':
      return `${header('Disclosure Schedules: Index', p, cfg)}
Each schedule corresponds to the representation of the same number in the [Agreement]. Disclosure in one schedule applies to other representations only where its relevance is reasonably apparent on its face.

| Schedule | Subject |
|---|---|
| 3.1 | Organisation and qualification |
| 3.2 | Capitalisation and subsidiaries |
| 3.3 | Authority; no conflicts; required consents |
| 3.4 | Financial statements; undisclosed liabilities |
| 3.5 | Absence of changes since the balance sheet date |
| 3.6 | Material contracts |
| 3.7 | Intellectual property |
| 3.8 | Data privacy and information security |
| 3.9 | Litigation |
| 3.10 | Compliance with laws; permits |
| 3.11 | Tax |
| 3.12 | Employees and labour |
| 3.13 | Employee benefit plans |
| 3.14 | Real property |
| 3.15 | Environmental |
| 3.16 | Insurance |
| 3.17 | Customers and suppliers |
| 3.18 | Related-party transactions |
| 3.19 | Brokers and finders |
`;

    case 'funds-flow':
      return `${header('Funds Flow Memorandum', p, cfg)}
Closing date: [DATE]

## Purchase price calculation

| Item | Amount |
|---|---|
| Enterprise value | ${p.price || '[AMOUNT]'} |
| Plus: closing cash | [ ] |
| Less: closing indebtedness | ( ) |
| Less: transaction expenses | ( ) |
| Plus / (less): working capital adjustment vs. peg | [ ] |
| **Equity purchase price** | **[ ]** |
| Less: escrow deposit | ( ) |
| Less: adjustment holdback | ( ) |
| **Closing payment to sellers** | **[ ]** |

## Payments at closing

| Payee | Purpose | Amount | Bank / account (verify by phone) |
|---|---|---|---|
| [Lender] | Debt payoff per payoff letter | | |
| [Escrow agent] | Indemnity escrow | | |
| [Financial adviser] | Success fee | | |
| [Law firm] | Legal fees | | |
| [Paying agent] | Seller proceeds | | |

> Confirm all wire instructions by phone with a known contact. Never rely on instructions received only by email.
`;
  }
}
