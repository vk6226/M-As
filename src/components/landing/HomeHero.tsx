import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ChevronRight as Arrow, Pause, Play, Plus, ArrowUpRight, GripVertical, Landmark, LineChart as LineIcon, X } from 'lucide-react';
import { useDealflow, type AppView } from '../../context/DealflowContext';
import { ParticleScene, type SceneAnchor } from './ParticleScene';
import { SHAPES } from './shapes';
import { AnimatedNumber } from '../ui/AnimatedNumber';

const ease = [0.16, 1, 0.3, 1] as const;

/* World-space anchor points for the hotspots on each form. */
const ANCHORS: [number, number, number][][] = [
  [[0.2, 1.85, 0.6], [1.35, 0.35, 0.4], [-0.1, -1.3, 1.1]],
  [[-1.0, 0.1, 0.8], [0.6, 0.9, 0.6], [0.1, -1.35, 1.1]],
  [[-0.3, 1.9, 0.4], [1.15, 0.6, 0.3], [0.0, -1.35, 1.1]],
];

interface Hotspot {
  label: string;
  title: string;
  value: string;
  body: string;
  view: AppView;
}

export const HomeHero: React.FC = () => {
  const { targets, pipeline, acquirer, setCurrentView } = useDealflow();
  const [shape, setShape] = useState(0);
  const [paused, setPaused] = useState(false);
  const spotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Auto-advance through the three forms.
  useEffect(() => {
    if (paused || reduce || open !== null) return;
    const id = setInterval(() => setShape((s) => (s + 1) % SHAPES.length), 8000);
    return () => clearInterval(id);
  }, [paused, reduce, open, shape]);

  // Hotspots follow the rotating object: write transforms straight to the DOM
  // each frame instead of re-rendering React 60 times a second.
  const onAnchors = useCallback((a: SceneAnchor[]) => {
    a.forEach((p, i) => {
      const el = spotRefs.current[i];
      if (!el) return;
      el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      // Keep hotspots clear of the headline block and the viewport edge.
      const host = el.parentElement;
      const w = host?.clientWidth ?? window.innerWidth;
      const small = w < 760;
      const copyBottom = small ? 300 : 0;
      const safe = p.x > 16 && p.x < w - (small ? 40 : 200) && p.y > copyBottom && p.y < (host?.clientHeight ?? window.innerHeight) - (small ? 220 : 140);
      el.classList.toggle('is-visible', p.visible && safe);
    });
  }, []);

  const m = useMemo(() => {
    const ev = targets.reduce((s, t) => s + t.valuation.targetEnterpriseValue, 0);
    const syn = targets.reduce((s, t) => s + t.strategicFit.potentialSynergiesRunRateM, 0);
    const pipe = pipeline.reduce((s, d) => s + d.expectedValuationM, 0);
    const mults = targets.map((t) => t.valuation.evArrMultiple).sort((a, b) => a - b);
    const median = mults.length ? mults[Math.floor(mults.length / 2)] : 0;
    const powder = acquirer.cashAndEquivalentsM + acquirer.creditFacilityAvailableM;
    const regions = new Set(targets.map((t) => t.headquarters.country)).size;
    const topRisk = targets.filter((t) => t.dealReadiness.includes('Immediate')).length;
    return { ev, syn, pipe, mults, median, powder, regions, topRisk };
  }, [targets, pipeline, acquirer]);

  const HOTSPOTS: Hotspot[][] = [
    [
      { label: 'Inspect deal hubs', title: 'Cross-border reach', value: `${m.regions} countries`, body: 'Targets in your universe by headquarters. Open company research for live SEC and NSE data.', view: 'research' },
      { label: 'Inspect live activity', title: 'Live M&A activity', value: 'SEC · NSE', body: 'Sale processes, signed deals, open offers and schemes, detected from filings as they publish.', view: 'activity' },
      { label: 'Inspect universe', title: 'Target universe', value: `$${(m.ev / 1000).toFixed(2)}B EV`, body: `${targets.length} companies screened on growth, efficiency, valuation and fit.`, view: 'screener' },
    ],
    [
      { label: 'Inspect valuation', title: 'Median EV / ARR', value: `${m.median.toFixed(1)}x`, body: 'Compare multiples side by side, and model offer premiums on the valuation tab of any company.', view: 'compare' },
      { label: 'Inspect momentum', title: 'Pipeline value', value: `$${(m.pipe / 1000).toFixed(2)}B`, body: `${pipeline.length} active deals from longlist to signing.`, view: 'pipeline' },
      { label: 'Inspect liquidity', title: 'Deployable capital', value: `$${m.powder.toLocaleString()}M`, body: `$${acquirer.cashAndEquivalentsM}M cash and $${acquirer.creditFacilityAvailableM}M committed credit.`, view: 'dashboard' },
    ],
    [
      { label: 'Inspect structure', title: 'Deal documents', value: '120 documents', body: 'Checklists tailored to structure and jurisdiction, from NDA to post-closing, including India.', view: 'documents' },
      { label: 'Inspect synergies', title: 'Run-rate synergies', value: `$${m.syn.toFixed(0)}M / yr`, body: 'Revenue and cost synergies across the universe, with a simulator in every dossier.', view: 'screener' },
      { label: 'Inspect readiness', title: 'Imminent processes', value: `${m.topRisk} targets`, body: 'Companies flagged as in an immediate sale process.', view: 'screener' },
    ],
  ];
  const spots = HOTSPOTS[shape];

  // Sparkline for the multiples widget.
  const spark = useMemo(() => {
    const vals = m.mults.length ? m.mults : [1, 2];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pts = vals.map((v, i) => [(i / (vals.length - 1)) * 100, 34 - ((v - min) / (max - min || 1)) * 26]);
    const mid = pts[Math.floor(pts.length / 2)];
    return { d: pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' '), mid };
  }, [m.mults]);

  const utilisation = Math.min(1, m.pipe / Math.max(m.powder, 1));

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero__frame" aria-hidden />
      <div className="hero__rays" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="hero__fog" aria-hidden />
      <div className="hero__glow" aria-hidden />

      <ParticleScene className="hero__canvas" shape={shape} anchors={ANCHORS} onAnchors={onAnchors} />

      {/* Copy */}
      <div className="hero__copy">
        <motion.h1 className="hero__title" initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1.1, ease, delay: 0.15 }}>
          A closer look
          <br />
          at every <span className="hero__title-grad">deal</span>
        </motion.h1>
        <motion.p className="hero__lede" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.35 }}>
          Helping corporate development teams find the right targets, read the real numbers and carry every deal from first look to close.
        </motion.p>
      </div>

      <div className="hero__cta">
        <motion.button className="pill-cta" onClick={() => setCurrentView('screener')} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.55 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <span className="pill-cta__icon">
            <Arrow size={16} />
          </span>
          Start screening
        </motion.button>
        <motion.div className="hero__proof" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.8 }}>
          <div className="hero__proof-stack">
            {targets.slice(0, 3).map((t) => (
              <span key={t.id} style={{ background: `linear-gradient(140deg, ${t.logoColor}, ${t.logoAccent ?? t.logoColor} 130%)` }}>
                {t.name.slice(0, 2).toUpperCase()}
              </span>
            ))}
          </div>
          <span className="hero__proof-num">
            <AnimatedNumber value={m.ev / 1000} format={(n) => `$${n.toFixed(1)}B`} />
          </span>
          <span className="hero__proof-text">
            of enterprise value
            <br />
            in your universe
          </span>
        </motion.div>
      </div>

      {/* Widgets */}
      <div className="hero__widgets">
        <motion.div className="widget" drag dragConstraints={heroRef} dragElastic={0.08} dragMomentum={false} initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.9, ease, delay: 0.6 }}>
          <div className="widget__head">
            <span>
              Deployable
              <br />
              capital
            </span>
            <span className="widget__tools">
              <GripVertical size={13} />
              <button className="widget__go" onClick={() => setCurrentView('dashboard')} aria-label="Open overview" onPointerDown={(e) => e.stopPropagation()}>
                <ArrowUpRight size={13} />
              </button>
            </span>
          </div>
          <Landmark size={18} className="widget__glyph" />
          <svg className="widget__gauge" viewBox="0 0 120 44" aria-hidden>
            {Array.from({ length: 25 }).map((_, i) => {
              const a = Math.PI * (1 - i / 24);
              const on = i / 24 <= utilisation;
              return (
                <motion.line
                  key={i}
                  x1={60 + Math.cos(a) * 34}
                  y1={42 - Math.sin(a) * 34}
                  x2={60 + Math.cos(a) * 42}
                  y2={42 - Math.sin(a) * 42}
                  stroke={on ? '#9db1ff' : 'rgba(255,255,255,0.18)'}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 + i * 0.025 }}
                />
              );
            })}
          </svg>
          <div className="widget__value">
            <AnimatedNumber value={m.powder} format={(n) => Math.round(n).toLocaleString()} />
            <small>$M</small>
          </div>
        </motion.div>

        <motion.div className="widget widget--tint" drag dragConstraints={heroRef} dragElastic={0.08} dragMomentum={false} initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.9, ease, delay: 0.75 }}>
          <div className="widget__head">
            <span>
              Median
              <br />
              EV / ARR
            </span>
            <span className="widget__tools">
              <GripVertical size={13} />
              <button className="widget__go" onClick={() => setCurrentView('compare')} aria-label="Open compare" onPointerDown={(e) => e.stopPropagation()}>
                <ArrowUpRight size={13} />
              </button>
            </span>
          </div>
          <LineIcon size={18} className="widget__glyph" />
          <svg className="widget__spark" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden>
            <motion.path d={spark.d} fill="none" stroke="#8fd3e8" strokeWidth="1.4" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease, delay: 1 }} />
            <motion.circle cx={spark.mid[0]} cy={spark.mid[1]} r="2.4" fill="#e8f6ff" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.2 }} />
          </svg>
          <div className="widget__value">
            <AnimatedNumber value={m.median} format={(n) => n.toFixed(1)} />
            <small>x</small>
          </div>
        </motion.div>
      </div>

      {/* Hotspots following the 3D object */}
      <div className="hero__hotspots">
        {spots.map((s, i) => {
          return (
            <div key={`${shape}-${i}`} ref={(el) => { spotRefs.current[i] = el; }} className={`hotspot${open === i ? ' is-open' : ''}`}>
              <button className="hotspot__btn" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                <span className="hotspot__plus">
                  <Plus size={12} />
                </span>
                <span className="hotspot__label">{s.label}</span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div className="hotspot__card" initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.3, ease }}>
                    <button className="hotspot__close" onClick={() => setOpen(null)} aria-label="Close">
                      <X size={12} />
                    </button>
                    <div className="hotspot__title">{s.title}</div>
                    <div className="hotspot__value">{s.value}</div>
                    <p>{s.body}</p>
                    <button className="hotspot__link" onClick={() => setCurrentView(s.view)}>
                      Open <ArrowUpRight size={12} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Form switcher */}
      <div className="hero__switcher">
        <button aria-label="Previous form" onClick={() => setShape((s) => (s + SHAPES.length - 1) % SHAPES.length)}>
          <ChevronLeft size={14} />
        </button>
        <span className="hero__switcher-label">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={shape} initial={{ y: 12, opacity: 0, filter: 'blur(3px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} exit={{ y: -12, opacity: 0, filter: 'blur(3px)' }} transition={{ duration: 0.35, ease }}>
              {SHAPES[shape].label}
            </motion.span>
          </AnimatePresence>
        </span>
        <button aria-label="Next form" onClick={() => setShape((s) => (s + 1) % SHAPES.length)}>
          <ChevronRight size={14} />
        </button>
        <button className="hero__switcher-pause" aria-label={paused ? 'Play' : 'Pause'} onClick={() => setPaused((p) => !p)}>
          {paused ? <Play size={12} /> : <Pause size={12} />}
        </button>
      </div>

      <div className="hero__baseline" aria-hidden />
      <div className="hero__dots" aria-hidden>
        {SHAPES.map((s, i) => (
          <span key={s.id} className={i === shape ? 'is-active' : ''} />
        ))}
      </div>
    </section>
  );
};
