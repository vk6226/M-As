import React, { useState } from 'react';
import { motion, LayoutGroup } from 'motion/react';
import { useDealflow } from '../../context/DealflowContext';
import { DealStage, PriorityLevel } from '../../types/mna';
import { formatCurrency } from '../../utils/financialFormulas';
import { ChevronLeft, ChevronRight, MessageSquare, Trash2, Calendar, User, Plus, GripVertical, KanbanSquare, Inbox } from 'lucide-react';
import { PageContainer, PageHeader, Dot } from '../ui/primitives';
import confetti from 'canvas-confetti';

const PIPELINE_STAGES: { stage: DealStage; label: string; color: string }[] = [
  { stage: 'Longlist', label: 'Longlist', color: '#8d93a5' },
  { stage: 'Screening', label: 'Screening', color: '#7c87ff' },
  { stage: 'Initial DD & Valuation', label: 'Initial DD', color: '#9b8cff' },
  { stage: 'IOI Submitted', label: 'IOI submitted', color: '#b48cff' },
  { stage: 'Confirmatory DD', label: 'Confirmatory DD', color: '#fbbf24' },
  { stage: 'Closing & SPA', label: 'Closing & SPA', color: '#34d399' },
];

export const DealPipelineKanban: React.FC = () => {
  const { 
    pipeline, 
    targets, 
    updateDealStage, 
    updateDealPriority, 
    addDealNote, 
    removeFromPipeline, 
    setSelectedTarget,
    setCurrentView 
  } = useDealflow();

  const [activeNoteInputDealId, setActiveNoteInputDealId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const handleMoveStage = (dealId: string, currentStage: DealStage, direction: 'prev' | 'next') => {
    const currentIndex = PIPELINE_STAGES.findIndex((s) => s.stage === currentStage);
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (targetIndex >= 0 && targetIndex < PIPELINE_STAGES.length) {
      const nextStage = PIPELINE_STAGES[targetIndex].stage;
      updateDealStage(dealId, nextStage);

      // Trigger celebration if reaching Closing & SPA
      if (nextStage === 'Closing & SPA') {
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#34d399', '#7c87ff', '#b48cff', '#fbbf24'],
          });
        } catch (e) {
          // ignore
        }
      }
    }
  };

  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDrop = (stage: DealStage) => {
    const deal = pipeline.find((d) => d.id === draggingId);
    setDragOverStage(null);
    setDraggingId(null);
    if (!deal || deal.stage === stage) return;
    updateDealStage(deal.id, stage);
    if (stage === 'Closing & SPA') {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#34d399', '#7c87ff', '#b48cff', '#fbbf24'] });
    }
  };

  const handleSaveNote = (dealId: string) => {
    if (noteText.trim()) {
      addDealNote(dealId, noteText.trim());
      setNoteText('');
      setActiveNoteInputDealId(null);
    }
  };

  const getPriorityBadgeClass = (priority: PriorityLevel) => {
    switch (priority) {
      case 'Critical': return 'badge-rose';
      case 'High': return 'badge-amber';
      case 'Medium': return 'badge-cyan';
      default: return 'badge-gray';
    }
  };

  const totalEv = pipeline.reduce((a, d) => a + d.expectedValuationM, 0);
  const critical = pipeline.filter((d) => d.priority === 'Critical').length;

  return (
    <PageContainer wide>
      <PageHeader
        eyebrow="Execution"
        title="Deal pipeline"
        description="Track every deal from longlist to signing. Drag a card to another column, or use the arrows, to change its stage."
        meta={
          <>
            <span className="chip" style={{ cursor: 'default' }}><KanbanSquare size={13} /> {pipeline.length} active deals</span>
            <span className="chip" style={{ cursor: 'default' }}><span className="font-mono" style={{ color: '#fff' }}>{formatCurrency(totalEv)}</span> expected value</span>
            <span className="chip" style={{ cursor: 'default' }}><Dot color="var(--rose)" /> {critical} critical</span>
          </>
        }
        actions={
          <button className="btn btn-primary" onClick={() => setCurrentView('screener')}>
            <Plus size={15} /> Add from screener
          </button>
        }
      />

      <LayoutGroup>
        <div className="kanban">
          {PIPELINE_STAGES.map((col, colIdx) => {
            const deals = pipeline.filter((d) => d.stage === col.stage);
            const stageEv = deals.reduce((a, d) => a + d.expectedValuationM, 0);
            return (
              <div
                key={col.stage}
                data-reveal-item
                className={`kanban-col${dragOverStage === col.stage ? ' is-drop-target' : ''}`}
                style={{ ['--col-color' as string]: col.color }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverStage !== col.stage) setDragOverStage(col.stage);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverStage(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(col.stage);
                }}
              >
                <div className="kanban-col__head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Dot color={col.color} />
                    <span className="kanban-col__title">{col.label}</span>
                    <span className="segmented__count">{deals.length}</span>
                  </div>
                  <span className="font-mono" style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>{stageEv ? formatCurrency(stageEv) : '—'}</span>
                </div>

                <div className="kanban-col__body">
                  {deals.map((deal) => {
                    const target = targets.find((t) => t.id === deal.targetId);
                    if (!target) return null;
                    const notesOpen = activeNoteInputDealId === deal.id;
                    return (
                      <motion.div
                        key={deal.id}
                        layoutId={`deal-${deal.id}`}
                        layout
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className={`glass-panel kanban-card${draggingId === deal.id ? ' is-dragging' : ''}`}
                        data-no-reveal
                        draggable
                        onDragStartCapture={(e: React.DragEvent) => {
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggingId(deal.id);
                        }}
                        onDragEndCapture={() => {
                          setDraggingId(null);
                          setDragOverStage(null);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span className={`badge ${getPriorityBadgeClass(deal.priority)}`}>{deal.priority}</span>
                          <GripVertical size={14} color="var(--text-subtle)" />
                        </div>

                        <button className="kanban-card__title" onClick={() => setSelectedTarget(target)}>
                          <span className="tcard__logo" style={{ width: 28, height: 28, borderRadius: 7, fontSize: '0.66rem', background: `linear-gradient(140deg, ${target.logoColor}, ${target.logoAccent ?? target.logoColor} 120%)` }}>
                            {target.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span style={{ minWidth: 0 }}>
                            <span style={{ display: 'block', color: '#fff', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{target.name}</span>
                            <span className="font-mono" style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-subtle)' }}>{target.codeName}</span>
                          </span>
                        </button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Expected EV</span>
                          <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{formatCurrency(deal.expectedValuationM)}</span>
                        </div>

                        <div className="kanban-card__next">
                          <span style={{ color: 'var(--text-subtle)' }}>Next</span>
                          <span>{deal.nextMilestone}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={12} /> {deal.dealLead.split(' (')[0]}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={12} /> Close {new Date(deal.targetClosingDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>

                        {notesOpen && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                              {deal.notes.map((n, i) => (
                                <div key={i} style={{ fontSize: '0.74rem', color: 'var(--text-soft)', padding: '6px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>{n}</div>
                              ))}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <input
                                type="text"
                                placeholder="Add a note"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="input-text"
                                style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveNote(deal.id)}
                                autoFocus
                              />
                              <button onClick={() => handleSaveNote(deal.id)} className="btn btn-primary btn-sm" style={{ padding: '0 10px' }} aria-label="Save note">
                                <Plus size={13} />
                              </button>
                            </div>
                          </motion.div>
                        )}

                        <div className="kanban-card__foot">
                          <button className="btn btn-ghost btn-sm" style={{ height: 28, padding: '0 8px' }} onClick={() => setActiveNoteInputDealId(notesOpen ? null : deal.id)}>
                            <MessageSquare size={13} /> {deal.notes.length}
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ height: 28, padding: '0 8px' }} onClick={() => removeFromPipeline(deal.id)} title="Archive deal" aria-label="Archive deal">
                            <Trash2 size={13} />
                          </button>
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                            <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => handleMoveStage(deal.id, deal.stage, 'prev')} disabled={colIdx === 0} title="Previous stage" aria-label="Previous stage">
                              <ChevronLeft size={14} />
                            </button>
                            <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => handleMoveStage(deal.id, deal.stage, 'next')} disabled={colIdx === PIPELINE_STAGES.length - 1} title="Next stage" aria-label="Next stage">
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {deals.length === 0 && (
                    <div className="kanban-empty">
                      <Inbox size={18} />
                      <span>Drop a deal here</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </LayoutGroup>
    </PageContainer>
  );
};
