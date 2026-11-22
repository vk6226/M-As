import React, { useState } from 'react';
import { LegalDocument } from '../../data/legalDocuments';
import { generateLegalAgreementMarkdown, downloadTextFile } from '../../utils/exportUtils';
import { useDealflow } from '../../context/DealflowContext';
import { 
  X, 
  Scale, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Printer, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  Award, 
  UserCheck, 
  Lock,
  ExternalLink,
  Clock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LegalDocViewerModalProps {
  document: LegalDocument | null;
  onClose: () => void;
}

export const LegalDocViewerModal: React.FC<LegalDocViewerModalProps> = ({ document: doc, onClose }) => {
  const { showToast } = useDealflow();
  const [activeTab, setActiveTab] = useState<'contract' | 'raw' | 'covenants'>('contract');
  const [copied, setCopied] = useState(false);

  if (!doc) return null;

  const markdownContent = generateLegalAgreementMarkdown(doc);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    showToast('success', 'Agreement Copied', `Copied ${doc.docNumber} to clipboard.`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadTextFile(
      markdownContent,
      `${doc.docNumber}_${doc.codeName.replace(/\s+/g, '_')}.md`,
      'text/markdown'
    );
    showToast('success', 'Document Downloaded', `Saved ${doc.docNumber} to disk.`);
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.85 } });
    } catch (e) {
      // ignore
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${doc.title} - ${doc.docNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 40px; color: #0f172a; }
            h1 { color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 8px; font-size: 20px; }
            h2 { color: #0369a1; margin-top: 24px; font-size: 16px; border-bottom: 1px solid #e2e8f0; }
            h3 { color: #334155; font-size: 14px; margin-top: 16px; }
            p { font-size: 13px; color: #334155; }
            ul { font-size: 13px; color: #334155; }
            .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
            .meta { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="meta">
            <strong>DOCUMENT:</strong> ${doc.title} (${doc.docNumber})<br/>
            <strong>TARGET ASSET:</strong> ${doc.targetName} (${doc.codeName})<br/>
            <strong>GOVERNING LAW:</strong> ${doc.governingLaw}<br/>
            <strong>COUNSEL:</strong> ${doc.counselOfRecord}<br/>
            <strong>STATUS:</strong> ${doc.status} (${doc.effectiveDate})
          </div>
          <pre style="white-space: pre-wrap; font-family: inherit;">${markdownContent}</pre>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '960px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(11, 17, 32, 0.98)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.98) 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
            }}>
              <Scale size={20} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                }}>
                  {doc.docNumber}
                </span>
                <span className="badge badge-purple">{doc.category}</span>
                <span
                  className="badge"
                  style={{
                    background: `${doc.statusColor}15`,
                    color: doc.statusColor,
                    borderColor: `${doc.statusColor}40`,
                  }}
                >
                  {doc.status}
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                {doc.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-subtle)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            id="btn-close-legal-modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Metadata Strip */}
        <div style={{
          padding: '12px 28px',
          background: '#090d16',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          fontSize: '0.75rem',
        }}>
          <div>
            <span style={{ color: 'var(--text-subtle)', display: 'block', fontSize: '0.7rem' }}>TARGET ENTITY</span>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>{doc.targetName}</span>
            <span style={{ color: 'var(--accent-cyan)', marginLeft: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
              ({doc.codeName})
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-subtle)', display: 'block', fontSize: '0.7rem' }}>COUNSEL OF RECORD</span>
            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{doc.counselOfRecord}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-subtle)', display: 'block', fontSize: '0.7rem' }}>GOVERNING JURISDICTION</span>
            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{doc.governingLaw}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-subtle)', display: 'block', fontSize: '0.7rem' }}>EXECUTION TIMELINE</span>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{doc.effectiveDate}</span>
          </div>
        </div>

        {/* Tab Selector & Action Toolbar */}
        <div style={{
          padding: '12px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.4)',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('contract')}
              className={`btn btn-sm ${activeTab === 'contract' ? 'btn-primary' : 'btn-secondary'}`}
              id="tab-legal-contract"
            >
              <FileText size={13} />
              <span>Full Agreement View</span>
            </button>
            <button
              onClick={() => setActiveTab('covenants')}
              className={`btn btn-sm ${activeTab === 'covenants' ? 'btn-primary' : 'btn-secondary'}`}
              id="tab-legal-covenants"
            >
              <ShieldCheck size={13} />
              <span>Commercial Terms & Covenants</span>
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`btn btn-sm ${activeTab === 'raw' ? 'btn-primary' : 'btn-secondary'}`}
              id="tab-legal-raw"
            >
              <FileText size={13} />
              <span>Markdown Terminal</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={handleCopy} className="btn btn-secondary btn-sm" id="btn-copy-legal-doc">
              {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button onClick={handleDownload} className="btn btn-secondary btn-sm" id="btn-download-legal-doc">
              <Download size={13} />
              <span>Download .MD</span>
            </button>
            <button onClick={handlePrint} className="btn btn-primary btn-sm" id="btn-print-legal-doc">
              <Printer size={13} />
              <span>Print Execution Copy</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div style={{
          padding: '24px 28px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {activeTab === 'contract' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Executive Preamble */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '18px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                borderLeft: '4px solid var(--accent-cyan)',
              }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Recital & Preamble
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  {doc.summary}
                </p>
              </div>

              {/* Key Commercial Terms Highlight Grid */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={15} color="var(--accent-amber)" />
                  Key Transaction Terms & Indemnification Guardrails
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '12px',
                }}>
                  {doc.keyTerms.map((term, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#0b1120',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
                        {term.label}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600, marginTop: '4px', lineHeight: 1.4 }}>
                        {term.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Articles / Clauses */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Scale size={15} color="var(--accent-cyan)" />
                  Definitive Articles & Operational Covenants
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {doc.clauses.map((clause, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        padding: '16px 20px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                          color: 'var(--accent-cyan)',
                          fontWeight: 700,
                        }}>
                          {clause.section}
                        </span>
                        <span style={{ color: 'var(--text-subtle)' }}>•</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                          {clause.title}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.6 }}>
                        {clause.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures & Execution Attestation Block */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={15} color="var(--accent-emerald)" />
                  Counterparty Signatures & Escrow Attestation
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '12px',
                }}>
                  {doc.signatures.map((sig, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#090d16',
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${sig.status === 'Signed' ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                          {sig.role}
                        </span>
                        <span className={`badge ${sig.status === 'Signed' ? 'badge-emerald' : 'badge-amber'}`}>
                          {sig.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                        {sig.signatory}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {sig.entity}
                      </div>
                      {sig.signedAt && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                          ✓ Timestamp: {sig.signedAt}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'covenants' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Detailed breakdown of statutory compliance, indemnification caps, escrow retentions, and regulatory thresholds for {doc.docNumber}:
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-subtle)' }}>
                    <th style={{ padding: '10px 14px' }}>Covenant Dimension</th>
                    <th style={{ padding: '10px 14px' }}>Agreed Standard</th>
                    <th style={{ padding: '10px 14px' }}>Risk Rating</th>
                    <th style={{ padding: '10px 14px' }}>Enforcement Mechanism</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#ffffff' }}>Representations & Warranties Survival</td>
                    <td style={{ padding: '12px 14px', color: '#e2e8f0' }}>18 Months General / 6 Years Fundamental & Tax</td>
                    <td style={{ padding: '12px 14px' }}><span className="badge badge-emerald">Low Risk</span></td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>Escrow & R&W Insurance policy</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#ffffff' }}>Indemnification Cap & Deductible</td>
                    <td style={{ padding: '12px 14px', color: '#e2e8f0' }}>1.0% ($4.6M) retention; $50M Buyer-Side Policy</td>
                    <td style={{ padding: '12px 14px' }}><span className="badge badge-emerald">Optimal</span></td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>Euclid Transactional Insurance Binder</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#ffffff' }}>Antitrust HSR Filing Clearance</td>
                    <td style={{ padding: '12px 14px', color: '#e2e8f0' }}>15 U.S.C. § 18a FTC/DOJ review passed</td>
                    <td style={{ padding: '12px 14px' }}><span className="badge badge-cyan">Cleared</span></td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>Federal Early Termination Notice</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#ffffff' }}>IP Chain of Title & Contamination</td>
                    <td style={{ padding: '12px 14px', color: '#e2e8f0' }}>100% PIIA Execution; 0 GPL/AGPL viral hooks</td>
                    <td style={{ padding: '12px 14px' }}><span className="badge badge-emerald">Verified</span></td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>Black Duck Automated Static Code Audit</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#ffffff' }}>Restrictive Non-Compete Period</td>
                    <td style={{ padding: '12px 14px', color: '#e2e8f0' }}>36 Months covering North America & EU</td>
                    <td style={{ padding: '12px 14px' }}><span className="badge badge-purple">Enforceable</span></td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>Delaware Chancery Injunction Remedy</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'raw' && (
            <div style={{
              background: '#090d16',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '24px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              color: '#e2e8f0',
              whiteSpace: 'pre-wrap',
              boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5)',
            }}>
              {markdownContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
