# AURA M&A

Deal intelligence for corporate development teams: screen acquisition targets, underwrite them, and run the deal pipeline from longlist to signing.

## Features

- **Overview**: acquisition mandate, deployable capital, pipeline by stage, sector mix, market signals and upcoming closings.
- **Target screener**: filter by sector, region and financial criteria, switch between card and table views, and source new companies from a text prompt.
- **Deal pipeline**: a kanban board with drag-and-drop between stages, notes and priorities.
- **Compare**: up to three companies side by side, with the best value in each row highlighted.
- **Dossier**: a side panel for each company with financials, a synergy simulator, risks, legal documents and an IC memo.
- **Legal vault**: purchase agreements, antitrust filings, NDAs and retention contracts, with signature tracking.
- **Company research (live)**: search any SEC-registered company by name, ticker or CIK. You get:
  - five years of income statement, balance sheet and cash-flow data from XBRL filings
  - M&A quality checks (growth, margins, Rule of 40, leverage, coverage)
  - valuation and offer maths at any control premium
  - a diligence document pack with links to every 10-K, 10-Q, proxy, material 8-K and ownership filing
  - the company's filed merger and purchase agreements
- **India (live)**: search any NSE-listed company. You get:
  - the live price, market cap, P/E and index membership
  - the latest quarterly results (revenue, EBITDA, profit, EPS) with trailing-twelve-month totals
  - promoter and public shareholding by quarter
  - annual reports, results filings, board meetings and Regulation 30 M&A disclosures
  - an offer and open-offer calculator under SEBI SAST: the 25% trigger, the 26% minimum offer and the pricing rules

  For unlisted Indian companies, you import AOC-4 figures from a CSV template and get the same analysis, plus a list of the MCA filings to obtain.
- **M&A activity (live)**: a feed of companies exploring a sale or that have signed deals, merger votes, tender offers, activist 13D stakes or completed acquisitions, detected from SEC filings, with headline financials for each.
- **Deal documents**:
  - a checklist of 120 documents covering every phase from NDA to post-closing, tailored to the deal structure (share purchase, asset purchase, merger, tender offer, scheme, Indian slump sale, IBC resolution plan), target type and jurisdiction (US, UK, EU, India). For India it covers the Companies Act, SEBI SAST, LODR, PIT and ICDR rules, CCI, FEMA, Press Note 3, RBI/IRDAI approvals, NCLT, stamp duty, GST, tax and the labour codes
  - status tracking for each document
  - first-draft templates (NDA, LOI, exclusivity, DD request list, board resolutions, closing checklist, disclosure index, funds flow)
  - search of precedent agreements filed on EDGAR
- **Command palette**: press `⌘K` / `Ctrl+K` (or `/`) to jump to any page, action or company.

## Tech stack

React 19, TypeScript, Vite, Motion (animation) and Lucide icons. The design system lives in `src/index.css`. Shared layout pieces are in `src/components/ui/primitives.tsx`.

## Getting started

```bash
npm install
npm run dev       # local development
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## Live data setup

The live data needs a small server-side proxy, because neither source can be called straight from a browser:
- **SEC EDGAR** (US) requires a User-Agent header with a contact email on every request, and sends no CORS headers.
- **NSE India** requires browser-like headers and a cookie session.

The proxy lives in `server/upstreams.mjs` and runs in three places:

| Environment | How |
|---|---|
| `npm run dev` / `npm run preview` | Vite plugin in `vite.config.ts` |
| Production / Docker | `npm run build && npm start` (`server/index.mjs`, serves the app and the proxy); the `Dockerfile` runs this |
| S3 + CloudFront | `lambda/data_proxy.mjs`, routed from `/api/sec/*` and `/api/nse/*` |

Copy `.env.example` to `.env.local` and set `SEC_USER_AGENT="Your Company you@yourcompany.com"`. NSE moved its site to `nseindia.in` in 2026; override the host with `NSE_HOST` if that changes again.

**NSE blocks many cloud and datacenter IP addresses.** Run the proxy from a network NSE accepts (for example an office or residential connection in India), or switch to a licensed exchange data feed for production use.

For live US share prices, add a free [Finnhub](https://finnhub.io) key, either on the Valuation tab or as `VITE_FINNHUB_KEY`.

**Coverage.** SEC data covers companies that file with the SEC (US-listed companies and foreign filers). NSE data covers companies listed on the National Stock Exchange of India. Indian quarterly results don't include a balance sheet, so the valuation page asks for net debt from the latest half-year or annual filing. Unlisted companies (US or Indian) don't publish financials through a free API: Indian AOC-4 statements are on the MCA portal. Verified private-company data needs a licensed provider such as PitchBook, Capital IQ or Crunchbase.

**Legal content.** The document checklist and templates are a practitioner starting point, not legal advice. Thresholds and filing rules change, so confirm every item with qualified counsel in each jurisdiction.

## Deployment

The build output is a static site. It can be served from any static host, from S3 + CloudFront, or from Docker with nginx (see `Dockerfile` and `nginx.conf`). For the AWS multi-account setup, see `AWS_DEPLOYMENT_GUIDE.md`, the scripts `deploy-aws-s3-cloudfront.sh` and `deploy-multi-account.sh`, and the templates in `infra/`.

## Accessibility

All motion respects the operating system's reduced-motion setting. Every control can be reached and used with the keyboard.
