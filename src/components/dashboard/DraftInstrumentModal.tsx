import React, { useState } from 'react';
import { TargetCompany } from '../../types/mna';
import { LegalDocument, LegalCategory } from '../../data/legalDocuments';
import { useDealflow } from '../../context/DealflowContext';
import { X, Scale, Sparkles, Check, FileSignature } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DraftInstrumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targets: TargetCompany[];
  onDocumentCreated: (doc: LegalDocument) => void;
}

export const DraftInstrumentModal: React.FC<DraftInstrumentModalProps> = ({
  isOpen,
  onClose,
  targets,
  onDocumentCreated,
}) => {
  const { showToast } = useDealflow();
  const [selectedTargetId, setSelectedTargetId] = useState<string>(targets[0]?.id || 'tgt-01');
  const [instrumentType, setInstrumentType] = useState<string>('Letter of Intent (LOI) & Term Sheet');
  const [category, setCategory] = useState<LegalCategory>('Confidentiality & NDA');
  const [jurisdiction, setJurisdiction] = useState<string>('State of Delaware (Court of Chancery)');
  const [counsel, setCounsel] = useState<string>('Skadden, Arps, Slate, Meagher & Flom LLP');
  const [survivalMonths, setSurvivalMonths] = useState<number>(18);
  const [indemnityCapPct, setIndemnityCapPct] = useState<number>(1.0);
  const [notes, setNotes] = useState<string>('Standard 2026 Delaware Chancery model with R&W Insurance wrap.');

  if (!isOpen) return null;

  const target = targets.find((t) => t.id === selectedTargetId) || targets[0];

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const docCode = `LOI-${target.codeName.replace(/\s+/g, '').toUpperCase()}-2026.01`;
    
    const newDoc: LegalDocument = {
      id: `leg-draft-${Date.now()}`,
      docNumber: docCode,
      title: `${instrumentType} // ${target.name}`,
      shortTitle: instrumentType,
      targetId: target.id,
      targetName: target.name,
      codeName: target.codeName,
      category: category,
      status: 'Draft Ready',
      statusColor: 'var(--accent-violet)',
      counselOfRecord: counsel,
      governingLaw: jurisdiction,
      lastUpdated: new Date().toISOString().slice(0, 10),
      effectiveDate: `Draft Generated: ${new Date().toLocaleDateString('en-US')}`,
      summary: `Standard transaction instrument drafted for ${target.name} (${target.codeName}) under the governance of ${jurisdiction}, advised by ${counsel}.`,
      keyTerms: [
        { label: 'Target Valuation Baseline', value: `$${target.valuation.targetEnterpriseValue.toFixed(1)}M Enterprise Value (${target.valuation.evArrMultiple.toFixed(1)}x ARR)` },
        { label: 'Indemnification Cap', value: `${indemnityCapPct}% of EV ($${((target.valuation.targetEnterpriseValue * indemnityCapPct) / 100).toFixed(1)}M)` },
        { label: 'Survival Period', value: `${survivalMonths} months general representations & warranties` },
        { label: 'Drafting Counsel', value: counsel },
        { label: 'Special Instructions', value: notes || 'None specified' },
      ],
      clauses: [
        {
          section: 'Section 1.01',
          title: 'Exclusivity & Standstill Covenant',
          content: 'Upon bilateral execution, Target covenants to grant Acquirer 45 business days of strict exclusivity during which no third-party solicitation shall take place.'
        },
        {
          section: 'Section 2.04',
          title: 'Representations and Warranties Framework',
          content: `Seller warrants that all customer contracts, IP patents (${target.patentsCount} active filings), and financial books comply with GAAP and Delaware General Corporation Law.`
        }
      ],
      signatures: [
        {
          role: 'Acquirer Signatory',
          entity: 'Apex Strategic Enterprise Group Inc.',
          signatory: 'Marcus Vance (MD, Corp Dev)',
          status: 'Signed',
          signedAt: `${new Date().toISOString().slice(0, 10)} 10:00 EST`
        },
        {
          role: 'Target Representative',
          entity: target.name,
          signatory: 'Authorized Corporate Officer',
          status: 'Awaiting Counterparty'
        }
      ]
    };

    onDocumentCreated(newDoc);
    showToast('success', 'Legal Instrument Drafted', `Generated ${docCode} for ${target.name}`);
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    } catch (err) {
      // ignore
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          background: 'rgba(11, 17, 32, 0.98)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.2)',
          overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.98) 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
            }}>
              <FileSignature size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                Draft New M&A Legal Instrument
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Template orchestration for NDAs, LOIs, Definitive Term Sheets & Clean Team Protocols
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-subtle)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleGenerate} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '6px', fontWeight: 600 }}>
                TARGET PIPELINE ENTITY
              </label>
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="input-text"
                style={{ padding: '8px 12px' }}
              >
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.codeName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '6px', fontWeight: 600 }}>
                INSTRUMENT TEMPLATE TYPE
              </label>
              <select
                value={instrumentType}
                onChange={(e) => {
                  setInstrumentType(e.target.value);
                  if (e.target.value.includes('NDA') || e.target.value.includes('Clean')) {
                    setCategory('Confidentiality & NDA');
                  } else if (e.target.value.includes('LOI') || e.target.value.includes('Purchase')) {
                    setCategory('Definitive Purchase (SPA/APA)');
                  } else if (e.target.value.includes('HSR') || e.target.value.includes('Antitrust')) {
                    setCategory('Regulatory & Antitrust');
                  } else {
                    setCategory('IP & Invention Assignment');
                  }
                }}
                className="input-text"
                style={{ padding: '8px 12px' }}
              >
                <option value="Letter of Intent (LOI) & Term Sheet">Letter of Intent (LOI) & Term Sheet</option>
                <option value="Bilateral Mutual NDA & Clean Team Agreement">Bilateral Mutual NDA & Clean Team Agreement</option>
                <option value="Stock Purchase Agreement (SPA) Working Draft">Stock Purchase Agreement (SPA) Working Draft</option>
                <option value="Hart-Scott-Rodino Pre-Merger Exemption Checklist">Hart-Scott-Rodino Pre-Merger Exemption Checklist</option>
                <option value="Proprietary Inventions Assignment (PIIA) Deed">Proprietary Inventions Assignment (PIIA) Deed</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '6px', fontWeight: 600 }}>
                GOVERNING JURISDICTION
              </label>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="input-text"
                style={{ padding: '8px 12px' }}
              >
                <option value="State of Delaware (Court of Chancery)">State of Delaware (Court of Chancery)</option>
                <option value="State of New York (Commercial Division)">State of New York (Commercial Division)</option>
                <option value="State of California (Santa Clara County)">State of California (Santa Clara County)</option>
                <option value="United Kingdom (English High Court of Justice)">United Kingdom (English High Court of Justice)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '6px', fontWeight: 600 }}>
                LEAD OUTSIDE COUNSEL
              </label>
              <select
                value={counsel}
                onChange={(e) => setCounsel(e.target.value)}
                className="input-text"
                style={{ padding: '8px 12px' }}
              >
                <option value="Skadden, Arps, Slate, Meagher & Flom LLP">Skadden, Arps, Slate, Meagher & Flom LLP</option>
                <option value="Latham & Watkins LLP">Latham & Watkins LLP</option>
                <option value="Wilson Sonsini Goodrich & Rosati">Wilson Sonsini Goodrich & Rosati</option>
                <option value="Cooley LLP">Cooley LLP</option>
                <option value="In-House Corporate Legal Office">In-House Corporate Legal Office</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '6px', fontWeight: 600 }}>
                <span>GENERAL REPS SURVIVAL</span>
                <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{survivalMonths} Months</span>
              </label>
              <input
                type="range"
                min="6"
                max="36"
                step="6"
                value={survivalMonths}
                onChange={(e) => setSurvivalMonths(Number(e.target.value))}
                className="range-slider"
                style={{ width: '100%' }}
              >
              </input>
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '6px', fontWeight: 600 }}>
                <span>INDEMNITY CAP</span>
                <span style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>{indemnityCapPct.toFixed(1)}% of EV</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.5"
                value={indemnityCapPct}
                onChange={(e) => setIndemnityCapPct(Number(e.target.value))}
                className="range-slider"
                style={{ width: '100%' }}
              >
              </input>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '6px', fontWeight: 600 }}>
              SPECIAL COMMERCIAL COVENANTS & DEAL NOTES
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-text"
              style={{ resize: 'none', padding: '10px 12px', fontSize: '0.8rem' }}
              placeholder="Enter specific carve-outs, escrow milestones, or retention guidelines..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="btn-submit-draft-legal">
              <Sparkles size={14} />
              <span>Generate Legal Instrument</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
