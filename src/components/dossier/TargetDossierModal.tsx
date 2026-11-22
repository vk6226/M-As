import React, { useState } from 'react';
import { TargetCompany } from '../../types/mna';
import { useDealflow } from '../../context/DealflowContext';
import { FinancialTeardownChart } from './FinancialTeardownChart';
import { SynergySimulator } from './SynergySimulator';
import { ICMemoTeaser } from './ICMemoTeaser';
import { 
  X, 
  Building, 
  MapPin, 
  Calendar, 
  Users, 
  Sparkles, 
  ShieldAlert, 
  FileText, 
  BarChart3, 
  Zap, 
  Cpu, 
  Award, 
  Plus, 
  Check, 
  ExternalLink,
  Scale
} from 'lucide-react';
import { formatCurrency, formatMultiple, formatPercent } from '../../utils/financialFormulas';
import { MOCK_LEGAL_DOCUMENTS } from '../../data/legalDocuments';
import { generateLegalAgreementMarkdown, downloadTextFile } from '../../utils/exportUtils';

type DossierTab = 'overview' | 'financials' | 'synergies' | 'risks' | 'legal' | 'ic-memo';

export const TargetDossierModal: React.FC = () => {
  const { selectedTarget, setSelectedTarget, addToPipeline, pipeline, showToast } = useDealflow();
  const [activeTab, setActiveTab] = useState<DossierTab>('overview');

  if (!selectedTarget) return null;

  const target = selectedTarget;
  const isAlreadyInPipeline = pipeline.some((p) => p.targetId === target.id);
  const targetLegalDocs = MOCK_LEGAL_DOCUMENTS.filter((d) => d.targetId === target.id);

  const tabs: { id: DossierTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview & Strategy', icon: <Zap size={15} /> },
    { id: 'financials', label: 'Financial Teardown', icon: <BarChart3 size={15} /> },
    { id: 'synergies', label: 'Synergy Simulator', icon: <Sparkles size={15} /> },
    { id: 'risks', label: 'Risks & Due Diligence', icon: <ShieldAlert size={15} />, count: target.risks.length },
    { id: 'legal', label: 'Legal & Compliance', icon: <Scale size={15} />, count: targetLegalDocs.length },
    { id: 'ic-memo', label: 'IC Memo Generator', icon: <FileText size={15} /> },
  ];

  return (
    <div className="modal-backdrop" onClick={() => setSelectedTarget(null)}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.95)',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${target.logoColor} 0%, #1e293b 100%)`,
              border: `1px solid ${target.logoAccent}50`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#ffffff',
              boxShadow: `0 0 15px ${target.logoColor}40`,
            }}>
              {target.name.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{target.name}</h2>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: 'var(--accent-cyan)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {target.codeName}
                </span>
                <span className="badge badge-emerald">{target.dealReadiness}</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                marginTop: '4px',
              }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{target.sector}</span>
                <span>•</span>
                <span>{target.subSector}</span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <MapPin size={12} />
                  {target.headquarters.city}, {target.headquarters.country}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => !isAlreadyInPipeline && addToPipeline(target.id)}
              disabled={isAlreadyInPipeline}
              className={`btn btn-sm ${isAlreadyInPipeline ? 'btn-secondary' : 'btn-emerald'}`}
              id="btn-modal-add-pipeline"
            >
              {isAlreadyInPipeline ? (
                <>
                  <Check size={14} color="#10b981" />
                  <span style={{ color: '#10b981' }}>In Active Pipeline</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Add to Deal Pipeline</span>
                </>
              )}
            </button>

            <button
              onClick={() => setSelectedTarget(null)}
              id="btn-close-dossier"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 28px',
          background: 'rgba(11, 17, 32, 0.8)',
          borderBottom: '1px solid var(--border-subtle)',
          overflowX: 'auto',
        }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                id={`tab-dossier-${tab.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  border: isActive ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.825rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-subtle)' }}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: 'rgba(244, 63, 94, 0.2)',
                    color: '#fb7185',
                    fontWeight: 700,
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '28px', overflowY: 'auto' }}>
          {/* TAB 1: OVERVIEW & STRATEGY */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Executive Summary & Thesis */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '20px',
              }}>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: '20px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '10px' }}>
                    Executive Briefing & Architecture
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                    {target.executiveSummary}
                  </p>
                </div>

                <div style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: '20px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: '10px' }}>
                    Corporate M&A Investment Thesis
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                    {target.investmentThesis}
                  </p>
                </div>
              </div>

              {/* Strategic Scorecard Breakdown */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
              }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px' }}>
                  Proprietary Strategic Fit Scorecard
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '16px',
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Tech Stack Synergy</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      {target.strategicFit.techStackSynergy}/100
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Market Expansion</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                      {target.strategicFit.marketExpansion}/100
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Cultural Compatibility</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                      {target.strategicFit.culturalCompatibility}/100
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Talent & IP Retention</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                      {target.strategicFit.talentIPRetention}/100
                    </div>
                  </div>
                </div>
              </div>

              {/* Tech Stack & Patents */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
              }}>
                {/* Tech Stack */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: '20px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cpu size={15} color="var(--accent-cyan)" />
                    Verified Technology Stack & Infrastructure
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {target.techStack.map((tech, i) => (
                      <span key={i} style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: '#0b1120',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.78rem',
                        fontFamily: 'var(--font-mono)',
                        color: '#f8fafc',
                      }}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Customers & IP */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: '20px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={15} color="#c084fc" />
                    Key Enterprise Customers & IP Patents
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    {target.keyCustomers.map((c, i) => (
                      <span key={i} className="badge badge-purple">{c}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Granted Patents: <strong style={{ color: '#ffffff' }}>{target.patentsCount} active utility patents</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCIAL TEARDOWN */}
          {activeTab === 'financials' && (
            <FinancialTeardownChart target={target} />
          )}

          {/* TAB 3: SYNERGY UNDERWRITING */}
          {activeTab === 'synergies' && (
            <SynergySimulator target={target} />
          )}

          {/* TAB 4: RISKS & DUE DILIGENCE */}
          {activeTab === 'risks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Underwriting risk radar identifies critical operational, customer concentration, and regulatory hurdles:
              </div>

              {target.risks.map((risk) => (
                <div
                  key={risk.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    padding: '20px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: `4px solid ${risk.severity === 'High' ? 'var(--accent-rose)' : risk.severity === 'Medium' ? 'var(--accent-amber)' : 'var(--accent-emerald)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${risk.severity === 'High' ? 'badge-rose' : risk.severity === 'Medium' ? 'badge-amber' : 'badge-emerald'}`}>
                        {risk.severity} Severity
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                        {risk.category}
                      </span>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                    {risk.title}
                  </h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
                    {risk.description}
                  </p>

                  <div style={{
                    background: '#0b1120',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.8rem',
                    color: '#e2e8f0',
                  }}>
                    <strong style={{ color: 'var(--accent-emerald)' }}>Mitigation Control: </strong>
                    {risk.mitigation}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: LEGAL & REGULATORY COMPLIANCE */}
          {activeTab === 'legal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                    Transaction Legal Instruments & Regulatory Filing Dossier
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Active Definitive Agreements, HSR Antitrust Filings, MNDA Clean Room covenants, and IP Inventions Assignments for {target.name}.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      const doc = targetLegalDocs[0] || {
                        docNumber: `LOI-${target.codeName.toUpperCase()}`,
                        title: `Standard LOI // ${target.name}`,
                        targetName: target.name,
                        codeName: target.codeName,
                        category: 'Definitive Purchase (SPA/APA)',
                        counselOfRecord: 'Skadden Arps',
                        governingLaw: 'State of Delaware',
                        lastUpdated: '2026-10-20',
                        effectiveDate: 'Draft Working Copy',
                        summary: `Term sheet and indication of interest for ${target.name}.`,
                        keyTerms: [{ label: 'Indicative Valuation', value: `$${target.valuation.targetEnterpriseValue}M EV` }],
                        clauses: [{ section: 'Section 1', title: 'Exclusivity', content: '45-day bilateral exclusivity period.' }],
                        signatures: [{ role: 'Acquirer', entity: 'APEX', signatory: 'Marcus Vance', status: 'Signed' }]
                      };
                      downloadTextFile(generateLegalAgreementMarkdown(doc), `${doc.docNumber}.md`, 'text/markdown');
                      showToast('success', 'Document Downloaded', `Exported legal file for ${target.name}`);
                    }}
                    className="btn btn-secondary btn-sm"
                    id="btn-download-target-legal-pack"
                  >
                    <FileText size={13} />
                    <span>Download Legal Pack</span>
                  </button>
                </div>
              </div>

              {/* Target-specific legal cards or fallback */}
              {targetLegalDocs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {targetLegalDocs.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        background: '#090d16',
                        padding: '18px 20px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--accent-cyan)',
                            background: 'rgba(6, 182, 212, 0.12)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}>
                            {doc.docNumber}
                          </span>
                          <span className="badge badge-purple">{doc.category}</span>
                        </div>
                        <span
                          className="badge"
                          style={{
                            background: `${doc.statusColor}18`,
                            color: doc.statusColor,
                            borderColor: `${doc.statusColor}40`,
                          }}
                        >
                          {doc.status}
                        </span>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                          {doc.title}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5, marginTop: '4px' }}>
                          {doc.summary}
                        </p>
                      </div>

                      {/* Key Terms */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '8px',
                      }}>
                        {doc.keyTerms.map((t, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: 'rgba(15, 23, 42, 0.8)',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid rgba(255, 255, 255, 0.04)',
                              fontSize: '0.75rem',
                            }}
                          >
                            <span style={{ color: 'var(--text-subtle)', display: 'block', fontSize: '0.7rem' }}>{t.label}</span>
                            <span style={{ color: '#f8fafc', fontWeight: 600 }}>{t.value}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: 'var(--text-subtle)',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '10px',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}>
                        <div>
                          <strong>Counsel: </strong>{doc.counselOfRecord} • <strong>Law: </strong>{doc.governingLaw}
                        </div>
                        <button
                          onClick={() => {
                            downloadTextFile(generateLegalAgreementMarkdown(doc), `${doc.docNumber}.md`, 'text/markdown');
                            showToast('success', 'Document Downloaded', `Exported ${doc.docNumber}`);
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          <FileText size={12} />
                          <span>Export Agreement (.md)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '30px',
                  background: '#090d16',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-subtle)',
                  textAlign: 'center',
                }}>
                  <Scale size={28} color="var(--text-subtle)" style={{ marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                    Preliminary Confidentiality & MNDA In Progress
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '500px', margin: '4px auto 16px' }}>
                    Target is currently in early screening. Standard bilateral MNDA with 36-month trade secret survival is pre-drafted in the platform Legal Vault.
                  </p>
                  <button
                    onClick={() => {
                      const doc = {
                        docNumber: `MNDA-${target.codeName.toUpperCase()}-2026`,
                        title: `Bilateral Mutual NDA // ${target.name}`,
                        targetName: target.name,
                        codeName: target.codeName,
                        category: 'Confidentiality & NDA',
                        counselOfRecord: 'In-House Legal Counsel',
                        governingLaw: 'State of Delaware',
                        lastUpdated: new Date().toISOString().slice(0, 10),
                        effectiveDate: 'Pre-Draft Ready',
                        summary: `Mutual Non-Disclosure Agreement for preliminary evaluations of ${target.name}.`,
                        keyTerms: [
                          { label: 'Term', value: '36 Months from execution' },
                          { label: 'Jurisdiction', value: 'Delaware Chancery Court' }
                        ],
                        clauses: [
                          { section: 'Section 1', title: 'Scope', content: 'Protects proprietary algorithms, models, and financial books.' }
                        ],
                        signatures: [
                          { role: 'Acquirer', entity: 'APEX', signatory: 'Marcus Vance', status: 'Signed' },
                          { role: 'Target', entity: target.name, signatory: 'Authorized Officer', status: 'Pending Sign-off' }
                        ]
                      };
                      downloadTextFile(generateLegalAgreementMarkdown(doc), `${doc.docNumber}.md`, 'text/markdown');
                      showToast('success', 'MNDA Template Downloaded', `Generated standard MNDA for ${target.name}`);
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    <span>Download Pre-Drafted MNDA Template</span>
                  </button>
                </div>
              )}

              {/* Statutory Due Diligence Checklist */}
              <div style={{
                background: '#090d16',
                padding: '18px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="var(--accent-emerald)" />
                  Statutory M&A Closing & Diligence Checklist
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <CheckCircle2 size={15} color="var(--accent-emerald)" />
                    <span>HSR Antitrust Safe Harbor Analysis</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <CheckCircle2 size={15} color="var(--accent-emerald)" />
                    <span>IP Patent Chain of Title Verified ({target.patentsCount} Patents)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <CheckCircle2 size={15} color="var(--accent-emerald)" />
                    <span>Zero Copyleft GPL/AGPL Contamination</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <CheckCircle2 size={15} color="var(--accent-emerald)" />
                    <span>R&W Insurance 1.0% Retention Cap</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: IC MEMO TEASER */}
          {activeTab === 'ic-memo' && (
            <ICMemoTeaser target={target} />
          )}
        </div>
      </div>
    </div>
  );
};
