import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Plus, Download, Building2, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { useDealflow } from '../../context/DealflowContext';
import { NAV_ITEMS } from './navConfig';
import { exportTargetsCsv } from '../../utils/exportUtils';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Cmd {
  id: string;
  group: 'Navigate' | 'Actions' | 'Targets';
  label: string;
  hint?: string;
  meta?: string;
  icon: React.ReactNode;
  run: () => void;
  keywords: string;
}

export const CommandPalette: React.FC<Props> = ({ open, onClose }) => {
  const { targets, setCurrentView, setSelectedTarget, setIsAddTargetOpen, showToast } = useDealflow();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Cmd[]>(() => {
    const nav: Cmd[] = NAV_ITEMS.map((n) => ({
      id: `nav-${n.id}`,
      group: 'Navigate',
      label: n.label,
      hint: n.description,
      icon: n.icon(16),
      run: () => setCurrentView(n.id),
      keywords: `${n.label} ${n.short} ${n.description}`,
    }));
    const actions: Cmd[] = [
      {
        id: 'act-add',
        group: 'Actions',
        label: 'Add or generate a company',
        hint: 'AI profiler, manual entry or CSV import',
        icon: <Plus size={16} />,
        run: () => setIsAddTargetOpen(true),
        keywords: 'add new create ingest generate company target',
      },
      {
        id: 'act-export',
        group: 'Actions',
        label: 'Export targets to CSV',
        icon: <Download size={16} />,
        run: () => {
          exportTargetsCsv(targets);
          showToast('success', 'CSV export complete', `Exported ${targets.length} targets.`);
        },
        keywords: 'export download csv spreadsheet',
      },
    ];
    const tgs: Cmd[] = [...targets]
      .sort((a, b) => b.strategicFit.overallScore - a.strategicFit.overallScore)
      .map((t) => ({
        id: `t-${t.id}`,
        group: 'Targets',
        label: t.name,
        hint: `${t.codeName} · ${t.sector}`,
        meta: `Fit ${t.strategicFit.overallScore}`,
        icon: <Building2 size={16} />,
        run: () => setSelectedTarget(t),
        keywords: `${t.name} ${t.codeName} ${t.sector}`,
      }));
    return [...nav, ...actions, ...tgs];
  }, [targets, setCurrentView, setSelectedTarget, setIsAddTargetOpen, showToast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.filter((c) => c.group !== 'Targets').concat(commands.filter((c) => c.group === 'Targets').slice(0, 5));
    const terms = q.split(/\s+/);
    return commands.filter((c) => terms.every((t) => c.keywords.toLowerCase().includes(t)));
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const exec = (c?: Cmd) => {
    if (!c) return;
    onClose();
    // Let the palette exit before heavy view work starts.
    setTimeout(c.run, 60);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      exec(filtered[active]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let lastGroup = '';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cmdk-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={onClose}
        >
          <motion.div
            className="cmdk"
            role="dialog"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: 'spring', stiffness: 520, damping: 36 }}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={onKeyDown}
          >
            <div className="cmdk__input-wrap">
              <Search size={18} color="var(--text-muted)" />
              <input
                ref={inputRef}
                className="cmdk__input"
                placeholder="Search targets, pages and actions…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="kbd">Esc</span>
            </div>
            <div className="cmdk__list" ref={listRef}>
              {filtered.length === 0 && <div className="cmdk__empty">No results for “{query}”</div>}
              {filtered.map((c, i) => {
                const header = c.group !== lastGroup ? c.group : null;
                lastGroup = c.group;
                return (
                  <React.Fragment key={c.id}>
                    {header && <div className="cmdk__group">{header}</div>}
                    <button
                      data-idx={i}
                      className={`cmdk__item${i === active ? ' is-active' : ''}`}
                      onMouseMove={() => setActive(i)}
                      onClick={() => exec(c)}
                    >
                      {i === active && (
                        <motion.span
                          layoutId="cmdk-hl"
                          className="cmdk__item-hl"
                          transition={{ type: 'spring', stiffness: 700, damping: 45 }}
                        />
                      )}
                      <span className="cmdk__item-icon">{c.icon}</span>
                      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span>{c.label}</span>
                        {c.hint && <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>{c.hint}</span>}
                      </span>
                      {c.meta && <span className="cmdk__item-meta">{c.meta}</span>}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
            <div className="cmdk__footer">
              <span>
                <span className="kbd"><ArrowUp size={10} /></span>
                <span className="kbd"><ArrowDown size={10} /></span> navigate
              </span>
              <span>
                <span className="kbd"><CornerDownLeft size={10} /></span> open
              </span>
              <span style={{ marginLeft: 'auto' }}>{filtered.length} results</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
