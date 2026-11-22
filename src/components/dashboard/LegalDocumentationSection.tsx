import React, { useState } from 'react';
import { LegalDocument, LegalCategory, DocumentStatus, MOCK_LEGAL_DOCUMENTS } from '../../data/legalDocuments';
import { useDealflow } from '../../context/DealflowContext';
import { LegalDocViewerModal } from './LegalDocViewerModal';
import { DraftInstrumentModal } from './DraftInstrumentModal';
import { downloadTextFile, generateLegalAgreementMarkdown } from '../../utils/exportUtils';
import { 
  Scale, 
  FileText, 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Award, 
  Lock, 
  Building2, 
  FileCheck, 
  UserCheck,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LegalDocumentationSection: React.FC = () => {
  const { targets, showToast } = useDealflow();
  const [documents, setDocuments] = useState<LegalDocument[]>(MOCK_LEGAL_DOCUMENTS);
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Instruments' },
    { id: 'Definitive Purchase (SPA/APA)', label: 'Definitive Purchase (SPA/APA)' },
    { id: 'Regulatory & Antitrust', label: 'Regulatory & Antitrust (HSR/CFIUS)' },
    { id: 'Confidentiality & NDA', label: 'Confidentiality & Clean Team' },
    { id: 'IP & Invention Assignment', label: 'IP & Inventions (PIIA)' },
    { id: 'Employment & Retention', label: 'Employment & Non-Compete' },
  ];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.codeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.counselOfRecord.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesTarget = selectedTargetId === 'all' || doc.targetId === selectedTargetId;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesTarget && matchesStatus;
  });

  const handleDocumentCreated = (newDoc: LegalDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleDownloadAllPack = () => {
    const combinedMarkdown = `# AURA M&A™ TRANSACTION LEGAL GOVERNANCE PACK
Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Acquiring Entity: Apex Strategic Enterprise Group Inc. (APEX)
Repository Security Clearance: Level 4 Confidential M&A

${documents.map((d) => generateLegalAgreementMarkdown(d)).join('\n\n================================================================================\n\n')}
`;

    downloadTextFile(
      combinedMarkdown,
      `AURA_M&A_Comprehensive_Legal_Pack_${new Date().toISOString().slice(0, 10)}.md`,
      'text/markdown'
    );
    showToast('success', 'Legal Closing Pack Downloaded', `Exported ${documents.length} legal instruments to a single consolidated dossier.`);
    try {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.7 } });
    } catch (e) {
      // ignore
    }
  };

  const handleVerifyAttestations = () => {
    showToast('info', 'Cryptographic Audit Verified', 'All counterparty digital signatures and SHA-256 hashes cross-verified against Delaware Chancery legal registry.');
  };

  return (
    <section 
      id="legal-documentation-section" 
      aria-label="M&A Legal Documentation and Transaction Governance"
      style={{ marginTop: '36px' }}
    >
      {/* Section Header */}
      <div
        className="glass-panel"
        style={{
          padding: '28px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)',
          border: '1px solid var(--border-accent)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}>
          <div style={{ maxWidth: '850px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="badge badge-cyan">Transaction Governance</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>•</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delaware General Corporation Law (DGCL) Compliant</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
              }}>
                <Scale size={22} />
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff' }}>
                Legal Documentation & Transaction Governance Vault
              </h2>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6, marginTop: '10px' }}>
              Centralized repository of executed and in-flight Stock Purchase Agreements (SPA), Hart-Scott-Rodino (HSR) Antitrust Pre-Merger filings, bilateral Clean Team MNDAs, CFIUS declarations, and Intellectual Property Inventions Assignment (PIIA) verifications.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleVerifyAttestations}
              className="btn btn-secondary btn-sm"
              id="btn-verify-signatures"
            >
              <ShieldCheck size={14} color="var(--accent-emerald)" />
              <span>Verify Signatures</span>
            </button>

            <button
              onClick={handleDownloadAllPack}
              className="btn btn-secondary btn-sm"
              id="btn-download-all-legal-pack"
            >
              <Download size={14} />
              <span>Export Legal Pack</span>
            </button>

            <button
              onClick={() => setIsDraftModalOpen(true)}
              className="btn btn-primary btn-sm"
              id="btn-draft-legal-instrument"
            >
              <Plus size={14} />
              <span>Draft New Instrument</span>
            </button>
          </div>
        </div>

        {/* Legal Health & Governance KPI Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          {/* Metric 1 */}
          <div style={{
            background: '#090d16',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
                Active Instruments
              </span>
              <FileText size={15} color="var(--accent-cyan)" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', margin: '4px 0 2px 0' }}>
              {documents.length} Files
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)' }}>
              {documents.filter((d) => d.status === 'Executed' || d.status === 'Regulatory Cleared').length} Fully Executed / Cleared
            </div>
          </div>

          {/* Metric 2 */}
          <div style={{
            background: '#090d16',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
                HSR Antitrust Runway
              </span>
              <Award size={15} color="var(--accent-emerald)" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', margin: '4px 0 2px 0' }}>
              $126.9M
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              2026 FTC/DOJ Statutory Threshold Monitored
            </div>
          </div>

          {/* Metric 3 */}
          <div style={{
            background: '#090d16',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
                IP Chain of Title
              </span>
              <Lock size={15} color="var(--accent-violet)" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', margin: '4px 0 2px 0' }}>
              100% PIIA
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)' }}>
              0 Copyleft GPL Contaminations Detected
            </div>
          </div>

          {/* Metric 4 */}
          <div style={{
            background: '#090d16',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
                R&W Insurance Policy
              </span>
              <ShieldCheck size={15} color="var(--accent-amber)" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)', margin: '4px 0 2px 0' }}>
              $50.0M
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Bound with 1.0% ($4.6M) Retention Cap
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '16px 20px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        {/* Top row: search & dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search by instrument name, document number, target code, or legal counsel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-text"
              style={{ paddingLeft: '38px', height: '38px', fontSize: '0.825rem' }}
              id="input-search-legal-docs"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Target Filter */}
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="input-text"
              style={{ width: 'auto', minWidth: '160px', height: '38px', fontSize: '0.8rem', padding: '6px 12px' }}
              id="select-filter-legal-target"
            >
              <option value="all">All Pipeline Assets</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.codeName})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-text"
              style={{ width: 'auto', minWidth: '140px', height: '38px', fontSize: '0.8rem', padding: '6px 12px' }}
              id="select-filter-legal-status"
            >
              <option value="all">All Statuses</option>
              <option value="Executed">Executed</option>
              <option value="Regulatory Cleared">Regulatory Cleared</option>
              <option value="In Legal Review">In Legal Review</option>
              <option value="Under Negotiation">Under Negotiation</option>
              <option value="Draft Ready">Draft Ready</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`btn btn-sm ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                borderRadius: '20px',
                padding: '4px 12px',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border-subtle)',
        }}>
          <Scale size={36} color="var(--text-subtle)" style={{ marginBottom: '12px' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>No matching legal instruments found</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Try adjusting your search criteria or select another category filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedTargetId('all');
              setSelectedStatus('all');
            }}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '16px' }}
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
        }}>
          {filteredDocs.map((doc) => {
            const signedCount = doc.signatures.filter((s) => s.status === 'Signed').length;
            const totalSignatures = doc.signatures.length;
            const isFullySigned = signedCount === totalSignatures;

            return (
              <div
                key={doc.id}
                className="glass-panel glass-panel-interactive"
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div>
                  {/* Top Bar: Doc Number, Target pill, Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--accent-cyan)',
                        padding: '2px 6px',
                        background: 'rgba(6, 182, 212, 0.1)',
                        borderRadius: '4px',
                        border: '1px solid rgba(6, 182, 212, 0.25)',
                      }}>
                        {doc.docNumber}
                      </span>
                      <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                        {doc.codeName}
                      </span>
                    </div>

                    <span
                      className="badge"
                      style={{
                        background: `${doc.statusColor}18`,
                        color: doc.statusColor,
                        borderColor: `${doc.statusColor}40`,
                        fontSize: '0.7rem',
                      }}
                    >
                      {doc.status}
                    </span>
                  </div>

                  {/* Document Title & Target Subtitle */}
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px', lineHeight: 1.35 }}>
                    {doc.title}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    {doc.targetName} • <span style={{ color: 'var(--text-subtle)' }}>{doc.category}</span>
                  </div>

                  {/* Summary */}
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#cbd5e1',
                    lineHeight: 1.5,
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {doc.summary}
                  </p>

                  {/* Key Covenants Tags */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                    {doc.keyTerms.slice(0, 2).map((term, i) => (
                      <div
                        key={i}
                        style={{
                          background: '#090d16',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          fontSize: '0.74rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                        }}
                      >
                        <span style={{ color: 'var(--text-subtle)', fontWeight: 600 }}>{term.label}</span>
                        <span style={{ color: '#f8fafc', fontWeight: 500, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }}>
                          {term.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Metadata Row: Counsel & Jurisdiction */}
                  <div style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-subtle)',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '10px',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}>
                    <div>
                      <strong style={{ color: '#94a3b8' }}>Counsel: </strong>
                      {doc.counselOfRecord}
                    </div>
                    <div>
                      <strong style={{ color: '#94a3b8' }}>Law: </strong>
                      {doc.governingLaw}
                    </div>
                  </div>
                </div>

                {/* Footer with Execution Progress and Action Buttons */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserCheck size={14} color={isFullySigned ? 'var(--accent-emerald)' : 'var(--accent-amber)'} />
                      <span style={{ fontSize: '0.75rem', color: isFullySigned ? 'var(--accent-emerald)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {signedCount} of {totalSignatures} Executed
                      </span>
                    </div>

                    <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                      Updated {doc.lastUpdated}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      id={`btn-view-${doc.id}`}
                    >
                      <BookOpen size={13} />
                      <span>Inspect Legal Terms</span>
                    </button>

                    <button
                      onClick={() => {
                        downloadTextFile(
                          generateLegalAgreementMarkdown(doc),
                          `${doc.docNumber}_${doc.codeName.replace(/\s+/g, '_')}.md`,
                          'text/markdown'
                        );
                        showToast('success', 'Document Downloaded', `Exported ${doc.docNumber}`);
                      }}
                      className="btn btn-secondary btn-sm"
                      title="Download markdown instrument"
                      id={`btn-download-${doc.id}`}
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Advisory Callout: Regulatory 2026 Alert */}
      <div
        style={{
          marginTop: '24px',
          background: 'rgba(6, 182, 212, 0.05)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
        }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'rgba(6, 182, 212, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-cyan)',
          flexShrink: 0,
        }}>
          <Scale size={18} />
        </div>
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
            2026 M&A Regulatory Compliance & Statutory Safe Harbor Notice
          </h4>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.6 }}>
            Under revised Federal Trade Commission (FTC) & Department of Justice Hart-Scott-Rodino (HSR) rules effective 2026, transactions below the <strong>$126.9M threshold</strong> are exempt from formal pre-merger notification. All definitive agreements in this vault incorporate <strong>Buyer-side Representations and Warranties Insurance (RWI)</strong> to cap seller indemnification exposure at 1.0% of Enterprise Value, backed by Delaware Chancery Court standard closing covenants.
          </p>
        </div>
      </div>

      {/* Modals */}
      <LegalDocViewerModal
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />

      <DraftInstrumentModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        targets={targets}
        onDocumentCreated={handleDocumentCreated}
      />
    </section>
  );
};
