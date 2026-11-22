import React, { useState } from 'react';
import { PageContainer, PageHeader, Segmented } from '../ui/primitives';
import { 
  Cloud, 
  Terminal, 
  Check, 
  Copy, 
  Server, 
  Globe, 
  ShieldCheck, 
  Cpu, 
  DollarSign, 
  Layers, 
  ExternalLink,
  BookOpen,
  ArrowRight,
  Database,
  Sparkles,
  Zap,
  Bell,
  Clock,
  Activity,
  Key,
  Users
} from 'lucide-react';

export const AwsDeploymentGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'12-services' | 's3-cloudfront' | 'budget-calc' | 'multi-account' | 'docker-ecs'>('12-services');
  const [bucketName, setBucketName] = useState('aura-mna-platform-prod');
  const [awsRegion, setAwsRegion] = useState('us-east-1');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const twelveServices = [
    {
      id: 's3',
      name: '1. Amazon S3',
      category: 'Static Hosting & Deal Room Storage',
      cost: '$0.00 / mo',
      note: '5 GB Free Tier for 12 mos. Holds static app and confidential CIM PDFs.',
      icon: <Globe size={18} color="var(--accent-cyan)" />
    },
    {
      id: 'cloudfront',
      name: '2. Amazon CloudFront',
      category: 'Global Content Delivery Network',
      cost: '$0.00 / mo',
      note: '1 TB free egress + 10M requests free forever across 400+ Edge locations.',
      icon: <Cloud size={18} color="var(--accent)" />
    },
    {
      id: 'oac',
      name: '3. CloudFront OAC',
      category: 'Origin Access Control Security',
      cost: '$0.00 / mo',
      note: 'Included with CloudFront. Cryptographically locks S3 bucket from public access.',
      icon: <ShieldCheck size={18} color="var(--accent-emerald)" />
    },
    {
      id: 'cloudformation',
      name: '4. AWS CloudFormation',
      category: 'Infrastructure as Code (IaC)',
      cost: '$0.00 / mo',
      note: 'Free automation service. Deploys and manages the entire cloud stack in 1 click.',
      icon: <Layers size={18} color="var(--violet)" />
    },
    {
      id: 'apigateway',
      name: '5. Amazon API Gateway',
      category: 'Serverless RESTful API Endpoints',
      cost: '$0.00 / mo',
      note: '1 Million API calls free per month in Free Tier. Routes /api/targets requests.',
      icon: <Zap size={18} color="var(--accent-amber)" />
    },
    {
      id: 'lambda',
      name: '6. AWS Lambda',
      category: 'Serverless Valuation & Scoring Engine',
      cost: '$0.00 / mo',
      note: '1,000,000 invocations + 3.2M seconds compute free every month forever.',
      icon: <Cpu size={18} color="#ec4899" />
    },
    {
      id: 'dynamodb',
      name: '7. Amazon DynamoDB',
      category: 'NoSQL Target & Deal Pipeline Store',
      cost: '$0.00 / mo',
      note: '25 GB storage + 25 RCU/WCU free forever. Delivers sub-10ms target query latency.',
      icon: <Database size={18} color="var(--accent-emerald)" />
    },
    {
      id: 'cognito',
      name: '8. Amazon Cognito',
      category: 'Deal Team Identity & Role-Based Auth',
      cost: '$0.00 / mo',
      note: '50,000 Monthly Active Users (MAUs) free forever. Secures Investment Committee access.',
      icon: <Users size={18} color="var(--accent)" />
    },
    {
      id: 'bedrock',
      name: '9. Amazon Bedrock',
      category: 'Generative AI IC Memorandum Writer',
      cost: '~$1.00 / mo',
      note: 'Pay-per-token API (Claude / Titan). Generating 200+ IC Memos costs under $1.',
      icon: <Sparkles size={18} color="var(--violet)" />
    },
    {
      id: 'textract',
      name: '10. Amazon Textract',
      category: 'Automated Financial Statement OCR',
      cost: '$0.00 / mo',
      note: '1,000 pages free per month under free tier. Extracts tables from scanned PDF CIMs.',
      icon: <BookOpen size={18} color="var(--accent-cyan)" />
    },
    {
      id: 'eventbridge',
      name: '11. Amazon EventBridge',
      category: 'Daily Market Check Cron Scheduler',
      cost: '$0.00 / mo',
      note: '14 Million events free per month. Triggers daily SEC EDGAR Form D scrapers.',
      icon: <Clock size={18} color="var(--accent-amber)" />
    },
    {
      id: 'sns',
      name: '12. Amazon SNS & CloudWatch',
      category: 'Alert Notifications & System Logs',
      cost: '$0.00 / mo',
      note: '1M SNS emails + 5 GB CloudWatch logs free forever. Sends priority deal alerts.',
      icon: <Bell size={18} color="var(--accent-rose)" />
    },
  ];

  const s3Commands = [
    {
      title: 'Step 1: Build the Production Application',
      desc: 'Compiles TypeScript, minifies HTML/JS/CSS into optimized static assets.',
      cmd: `npm run build`,
    },
    {
      title: 'Step 2: Deploy Complete 12-Service CloudFormation Stack',
      desc: 'Deploys cloudformation-template.yaml to provision S3, CloudFront, DynamoDB, Lambda, Cognito, EventBridge, and SNS.',
      cmd: `./deploy-aws-s3-cloudfront.sh`,
    },
    {
      title: 'Step 3: Invalidate CloudFront Edge Cache on Updates',
      desc: 'Flushes global edge cache immediately so updates reflect worldwide.',
      cmd: `aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"`,
    },
  ];

  return (
    <PageContainer wide>
      <PageHeader
        eyebrow="Infrastructure"
        title="Deploy on AWS"
        description="A 12-service, three-account reference architecture sized to run for two years on $100 of AWS credit."
        meta={
          <>
            <span className="chip" style={{ cursor: 'default' }}><Layers size={13} /> 12 services</span>
            <span className="chip" style={{ cursor: 'default' }}><Users size={13} /> 3 accounts</span>
            <span className="chip" style={{ cursor: 'default' }}><DollarSign size={13} /> ~$1.50 / month</span>
          </>
        }
      />

      <div style={{ marginBottom: 24 }}>
        <Segmented
          value={activeTab}
          onChange={setActiveTab}
          layoutId="aws-tabs"
          options={[
            { value: '12-services', label: 'Architecture', icon: <Layers size={15} /> },
            { value: 'budget-calc', label: 'Cost plan', icon: <DollarSign size={15} /> },
            { value: 'multi-account', label: 'Account strategy', icon: <Users size={15} /> },
            { value: 's3-cloudfront', label: 'Deployment script', icon: <Terminal size={15} /> },
          ]}
        />
      </div>

      <div key={activeTab} className="tab-panel">
      {/* TAB 1: THE 12 SERVICES ARCHITECTURE */}
      {activeTab === '12-services' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Architecture Visual Grid */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-strong)' }}>
              Full Enterprise Architecture Topology (12 Integrated AWS Services)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Every service has an explicit corporate finance purpose, connected via serverless event-driven architecture:
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}>
              {twelveServices.map((svc) => (
                <div
                  key={svc.id}
                  style={{
                    background: 'var(--bg-inset)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {svc.icon}
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-strong)' }}>{svc.name}</strong>
                      </div>
                      <span className="badge badge-emerald">{svc.cost}</span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '6px' }}>
                      {svc.category}
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      {svc.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: $100 BUDGET CALCULATOR */}
      {activeTab === 'budget-calc' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-strong)' }}>
                How Your $100 Credits Last 24–36 Months Across 12 Services
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Because 10 out of the 12 services fall under the permanent AWS Always-Free Tier, your monthly burn rate is only ~$1.00–$2.50.
              </p>
            </div>

            <div style={{
              background: 'rgba(var(--emerald-rgb), 0.15)',
              border: '1px solid rgba(var(--emerald-rgb), 0.3)',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              textAlign: 'right',
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Runway on $100 Credits</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                ~33 Months
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-inset)', color: 'var(--text-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-hover)' }}>
                  <th style={{ padding: '12px' }}>AWS Service</th>
                  <th style={{ padding: '12px' }}>Free Tier Allowance</th>
                  <th style={{ padding: '12px' }}>Expected Usage</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Monthly Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-strong)' }}>1. CloudFront CDN</td>
                  <td style={{ padding: '12px', color: 'var(--accent-emerald)' }}>1 TB/mo & 10M requests free forever</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>~2 GB/mo (Internal M&A usage)</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>$0.00</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-strong)' }}>2. Amazon S3</td>
                  <td style={{ padding: '12px', color: 'var(--accent-emerald)' }}>5 GB free for 12 months</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>~50 MB (app + sample CIM PDFs)</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>$0.00</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-strong)' }}>3. CloudFront OAC & CloudFormation</td>
                  <td style={{ padding: '12px', color: 'var(--accent-emerald)' }}>100% Free always</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>Continuous automated stack</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>$0.00</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-strong)' }}>4. AWS Lambda & API Gateway</td>
                  <td style={{ padding: '12px', color: 'var(--accent-emerald)' }}>1M Lambda calls & 1M API calls free</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>~15,000 API requests/mo</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>$0.00</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-strong)' }}>5. Amazon DynamoDB</td>
                  <td style={{ padding: '12px', color: 'var(--accent-emerald)' }}>25 GB storage & 25 RCU/WCU free forever</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>~200 MB for target catalogs</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>$0.00</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-strong)' }}>6. Amazon Cognito</td>
                  <td style={{ padding: '12px', color: 'var(--accent-emerald)' }}>50,000 MAUs free forever</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>~25 corporate dealmakers</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>$0.00</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-strong)' }}>7. Amazon EventBridge & SNS</td>
                  <td style={{ padding: '12px', color: 'var(--accent-emerald)' }}>14M events & 100k email alerts free</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>Daily crons & deal triggers</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>$0.00</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-strong)' }}>8. Amazon Bedrock (GenAI IC Memo)</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>Pay-per-token ($0.003/1k tokens)</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>~200 IC memo generations/mo</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>~$1.20</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-strong)' }}>9. Amazon Textract (CIM OCR)</td>
                  <td style={{ padding: '12px', color: 'var(--accent-emerald)' }}>1,000 pages free per month for 3 mos</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>~50 PDF pages analyzed</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>$0.00 – $0.50</td>
                </tr>
                <tr style={{ background: 'var(--bg-inset)', fontWeight: 800 }}>
                  <td colSpan={3} style={{ padding: '14px', color: 'var(--text-strong)' }}>Total Monthly Burn Rate</td>
                  <td style={{ padding: '14px', textAlign: 'right', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>~$1.20 – $1.70 / mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: 3-ACCOUNT MULTI-ACCOUNT STRATEGY */}
      {activeTab === 'multi-account' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-strong)' }}>
              Optimizing Across 3 AWS Accounts (Triple Free Tier Multiplier)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              Because each new AWS account receives its own independent 12-Month Free Tier allowance, dividing your 12 services across your 3 accounts gives you <strong>3x the free storage, 3x the free Lambda compute, and complete environment isolation</strong>:
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px',
            }}>
              {/* Account 1 */}
              <div style={{ background: 'var(--bg-inset)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(var(--accent-rgb), 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>Account 1: Edge, Frontend & Identity</strong>
                  <span className="badge badge-cyan">$100 Credit</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '12px' }}>
                  Public edge delivery, perimeter security, and deal team authentication
                </div>
                <ul style={{ fontSize: '0.8rem', color: 'var(--text-soft)', lineHeight: 1.7, paddingLeft: '18px' }}>
                  <li><strong>Amazon CloudFront</strong> (Global Edge CDN - 400+ PoPs)</li>
                  <li><strong>Amazon S3</strong> (Static Web App Bundle Hosting)</li>
                  <li><strong>CloudFront OAC</strong> (Origin Access Control Security)</li>
                  <li><strong>AWS WAF</strong> (Anti-DDoS & Scraper Defense Rules)</li>
                  <li><strong>Amazon Cognito</strong> (Deal Team User Pool, MFA & JWT)</li>
                  <li><strong>Amazon Route 53</strong> (Enterprise DNS Routing)</li>
                  <li><strong>AWS Certificate Manager</strong> (Free Auto-Renewing SSL/TLS)</li>
                </ul>
              </div>

              {/* Account 2 */}
              <div style={{ background: 'var(--bg-inset)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(var(--violet-rgb), 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--violet)', fontSize: '0.95rem' }}>Account 2: Core Deal Engine & GenAI</strong>
                  <span className="badge badge-purple">$100 Credit</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '12px' }}>
                  Confidential corporate finance underwriting, database, and generative AI
                </div>
                <ul style={{ fontSize: '0.8rem', color: 'var(--text-soft)', lineHeight: 1.7, paddingLeft: '18px' }}>
                  <li><strong>AWS Lambda</strong> (Python Valuation & Underwriting Engine)</li>
                  <li><strong>Amazon API Gateway</strong> (Cognito-Secured REST API)</li>
                  <li><strong>Amazon DynamoDB</strong> (Targets & Deals - On-Demand)</li>
                  <li><strong>Amazon Bedrock</strong> (Claude / Titan GenAI IC Memos)</li>
                  <li><strong>Amazon Textract</strong> (CIM PDF Balance Sheet OCR)</li>
                  <li><strong>Amazon S3 VDR</strong> (Confidential Virtual Data Room)</li>
                  <li><strong>AWS KMS</strong> (Customer Managed Encryption Keys - CMEK)</li>
                </ul>
              </div>

              {/* Account 3 */}
              <div style={{ background: 'var(--bg-inset)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(var(--emerald-rgb), 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--accent-emerald)', fontSize: '0.95rem' }}>Account 3: Pipelines & Governance</strong>
                  <span className="badge badge-emerald">$100 Credit</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '12px' }}>
                  Workflow state machines, queues, daily cron jobs, and credit safety
                </div>
                <ul style={{ fontSize: '0.8rem', color: 'var(--text-soft)', lineHeight: 1.7, paddingLeft: '18px' }}>
                  <li><strong>AWS Step Functions</strong> (Due Diligence State Machine)</li>
                  <li><strong>Amazon SQS</strong> (CIM Ingestion Buffer & Dead-Letter Queue)</li>
                  <li><strong>Amazon EventBridge</strong> (Daily Market Scraper Crons)</li>
                  <li><strong>Amazon SNS</strong> (Deal Alerts to MDs & Investment Committee)</li>
                  <li><strong>AWS Secrets Manager</strong> (SEC EDGAR & Financial API Keys)</li>
                  <li><strong>Amazon CloudWatch</strong> (Centralized Audit Logs & Alarms)</li>
                  <li><strong>AWS Budgets</strong> ($80 Credit Safety Kill-Switch)</li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: '24px', background: 'rgba(var(--base-rgb), 0.95)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ color: 'var(--text-strong)', fontSize: '0.9rem' }}>1-Click Multi-Account Deployment Command:</strong>
                <span className="badge badge-cyan">Automated CLI</span>
              </div>
              <div style={{
                background: 'var(--bg-primary)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--accent-cyan)',
                whiteSpace: 'pre-wrap',
              }}>
                ./deploy-multi-account.sh aura-account1 aura-account2 aura-account3 deals@yourfirm.com
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DEPLOY SCRIPT */}
      {activeTab === 's3-cloudfront' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
              Deploy the Complete 12-Service Stack with CloudFormation
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              The included <code style={{ color: 'var(--accent-cyan)' }}>deploy-aws-s3-cloudfront.sh</code> script provisions your S3 buckets, CloudFront CDN, DynamoDB tables, Lambda role, and API Gateway automatically.
            </p>
          </div>

          {s3Commands.map((step, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-strong)' }}>{step.title}</h4>
                <button
                  onClick={() => copyToClipboard(step.cmd, idx)}
                  className="btn btn-secondary btn-sm"
                >
                  {copiedIndex === idx ? <Check size={13} color="var(--emerald)" /> : <Copy size={13} />}
                  <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>{step.desc}</p>
              <div style={{
                background: 'var(--bg-primary)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.825rem',
                color: 'var(--accent-cyan)',
                whiteSpace: 'pre-wrap',
              }}>
                {step.cmd}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </PageContainer>
  );
};
