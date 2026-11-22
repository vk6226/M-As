import React, { useState } from 'react';
import { LegalDocument, LegalCategory, DocumentStatus, MOCK_LEGAL_DOCUMENTS } from '../../data/legalDocuments';
import { useDealflow } from '../../context/DealflowContext';
import { LegalDocViewerModal } from './LegalDocViewerModal';
import { DraftInstrumentModal } from './DraftInstrumentModal';
import { downloadTextFile, generateLegalAgreementMarkdown } from '../../utils/exportUtils';
import { Scale, FileText, ShieldCheck, Search, Download, Plus, Eye, FileCheck, Clock, PenLine, SearchX } from 'lucide-react';
import { Segmented, EmptyState } from '../ui/primitives';
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
    { id: 'all', label: 'All' },
    { id: 'Definitive Purchase (SPA/APA)', label: 'Purchase' },
    { id: 'Regulatory & Antitrust', label: 'Regulatory' },
    { id: 'Confidentiality & NDA', label: 'Confidentiality' },
    { id: 'IP & Invention Assignment', label: 'IP' },
    { id: 'Employment & Retention', label: 'Employment' },
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
    const combinedMarkdown = `# AURA M&A TRANSACTION LEGAL GOVERNANCE PACK
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
    showToast('success', 'Closing pack downloaded', `Exported ${documents.length} documents into one file.`);
    try {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.7 } });
    } catch (e) {
      // ignore
    }
  };

  const handleVerifyAttestations = () => {
    showToast('info', 'Signatures verified', 'All counterparty signatures and document hashes match the registry.');
  };

  const statusBadge = (s: DocumentStatus) =>
    s === 'Executed' || s === 'Regulatory Cleared' ? 'badge-emerald' : s === 'Under Negotiation' ? 'badge-amber' : s === 'Draft Ready' ? 'badge-purple' : 'badge-cyan';

  const executed = documents.filter((d) => d.status === 'Executed' || d.status === 'Regulatory Cleared').length;
  const inReview = documents.filter((d) => d.status === 'In Legal Review' || d.status === 'Under Negotiation').length;
  const pendingSigs = documents.reduce((a, d) => a + d.signatures.filter((x) => x.status !== 'Signed').length, 0);

  const tiles = [
    { label: 'Documents', value: documents.length, icon: <FileText size={15} />, color: 'var(--accent)' },
    { label: 'Executed or cleared', value: executed, icon: <FileCheck size={15} />, color: 'var(--emerald)' },
    { label: 'In review', value: inReview, icon: <Clock size={15} />, color: 'var(--amber)' },
    { label: 'Signatures outstanding', value: pendingSigs, icon: <PenLine size={15} />, color: 'var(--violet)' },
  ];

  const dealTargets = Array.from(new Map(documents.map((d) => [d.targetId, d.targetName])).entries());

  return (
    <section id="legal-documentation-section" aria-label="Legal documentation" style={{ marginTop: 44, scrollMarginTop: 80 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow">Governance</div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 650, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Scale size={20} color="var(--accent)" /> Legal vault
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Purchase agreements, antitrust filings, NDAs and retention contracts across active deals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={handleVerifyAttestations} style={{ border: '1px solid var(--border-subtle)' }}>
            <ShieldCheck size={14} /> Verify signatures
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleDownloadAllPack}>
            <Download size={14} /> Download pack
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsDraftModalOpen(true)} id="btn-draft-instrument">
            <Plus size={14} /> Draft document
          </button>
        </div>
      </div>

      <div className="legal-tiles">
        {tiles.map((t) => (
          <div key={t.label} className="glass-panel" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="kpi__icon" style={{ color: t.color }}>{t.icon}</span>
            <div>
              <div className="stat__label">{t.label}</div>
              <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', letterSpacing: '-0.03em' }}>{t.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: 0, marginTop: 14, overflow: 'hidden' }}>
        <div className="legal-toolbar">
          <Segmented
            value={selectedCategory}
            onChange={setSelectedCategory}
            layoutId="legal-cat"
            size="sm"
            options={categories.map((c) => ({
              value: c.id,
              label: c.label,
              count: c.id === 'all' ? documents.length : documents.filter((d) => d.category === c.id).length,
            }))}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
            <label className="search-field" style={{ width: 220 }}>
              <Search size={14} />
              <input className="input-text" style={{ height: 34, fontSize: '0.82rem' }} placeholder="Search documents" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </label>
            <select value={selectedTargetId} onChange={(e) => setSelectedTargetId(e.target.value)} style={{ width: 'auto', height: 34, fontSize: '0.82rem', padding: '0 10px' }} aria-label="Deal">
              <option value="all">All deals</option>
              {dealTargets.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ width: 'auto', height: 34, fontSize: '0.82rem', padding: '0 10px' }} aria-label="Status">
              <option value="all">All statuses</option>
              {(['Executed', 'Regulatory Cleared', 'In Legal Review', 'Under Negotiation', 'Draft Ready'] as DocumentStatus[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyState icon={<SearchX size={22} />} title="No documents found" description="Adjust the search or filters to see more documents." />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Deal</th>
                  <th>Status</th>
                  <th>Signatures</th>
                  <th>Counsel</th>
                  <th>Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => {
                  const signed = doc.signatures.filter((s) => s.status === 'Signed').length;
                  const total = doc.signatures.length || 1;
                  return (
                    <tr key={doc.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedDoc(doc)}>
                      <td style={{ minWidth: 280 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span className="doc-icon"><FileText size={15} /></span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: '#fff', fontWeight: 550 }}>{doc.shortTitle}</div>
                            <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>{doc.docNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-soft)' }}>{doc.targetName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{doc.codeName}</div>
                      </td>
                      <td><span className={`badge ${statusBadge(doc.status)}`}>{doc.status}</span></td>
                      <td style={{ minWidth: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="tcard__bar" style={{ marginTop: 0, flex: 1, minWidth: 50 }}>
                            <i style={{ width: `${(signed / total) * 100}%`, background: signed === total ? 'var(--emerald)' : 'var(--accent)' }} />
                          </div>
                          <span className="font-mono" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{signed}/{doc.signatures.length}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.counselOfRecord}</td>
                      <td className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{doc.lastUpdated}</td>
                      <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button className="icon-btn" style={{ width: 32, height: 32, display: 'inline-grid' }} onClick={() => setSelectedDoc(doc)} title="View" id={`btn-view-${doc.id}`}>
                          <Eye size={15} />
                        </button>{' '}
                        <button
                          className="icon-btn"
                          style={{ width: 32, height: 32, display: 'inline-grid' }}
                          title="Download"
                          id={`btn-download-${doc.id}`}
                          onClick={() => {
                            downloadTextFile(generateLegalAgreementMarkdown(doc), `${doc.docNumber}_${doc.codeName.replace(/\s+/g, '_')}.md`, 'text/markdown');
                            showToast('success', 'Document downloaded', `Exported ${doc.docNumber}`);
                          }}
                        >
                          <Download size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LegalDocViewerModal document={selectedDoc} onClose={() => setSelectedDoc(null)} />
      <DraftInstrumentModal isOpen={isDraftModalOpen} onClose={() => setIsDraftModalOpen(false)} targets={targets} onDocumentCreated={handleDocumentCreated} />
    </section>
  );
};
