import React, { useState } from 'react';
import { motion } from 'motion/react';

/** Grouped bar chart: one group per fiscal year, one bar per series. Validated palette (dark surface). */
export const SERIES_COLORS = ['#6d78f5', '#0d9488', '#c2780a'];

interface Props {
  years: string[]; // oldest -> newest
  series: { name: string; values: (number | undefined)[] }[];
  format: (n: number) => string;
  height?: number;
}

export const FinancialBars: React.FC<Props> = ({ years, series, format, height = 220 }) => {
  const [hover, setHover] = useState<number | null>(null);
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== undefined));
  const max = Math.max(0, ...all);
  const min = Math.min(0, ...all);
  const range = max - min || 1;
  const zeroPct = (max / range) * 100; // distance of the zero line from the top

  return (
    <div>
      <div className="fbars__legend">
        {series.map((s, i) => (
          <span key={s.name}>
            <i style={{ background: SERIES_COLORS[i] }} /> {s.name}
          </span>
        ))}
      </div>
      <div className="fbars" style={{ height }} role="img" aria-label={`${series.map((s) => s.name).join(', ')} by fiscal year`}>
        <div className="fbars__zero" style={{ top: `${zeroPct}%` }} />
        {years.map((y, yi) => (
          <div key={y} className="fbars__group" onMouseEnter={() => setHover(yi)} onMouseLeave={() => setHover(null)}>
            <div className="fbars__bars">
              {series.map((s, si) => {
                const v = s.values[yi];
                if (v === undefined) return <div key={s.name} className="fbars__bar-slot" />;
                const h = (Math.abs(v) / range) * 100;
                const neg = v < 0;
                return (
                  <div key={s.name} className="fbars__bar-slot">
                    <motion.div
                      className={`fbars__bar${neg ? ' is-neg' : ''}`}
                      style={{
                        background: SERIES_COLORS[si],
                        top: neg ? `${zeroPct}%` : undefined,
                        bottom: neg ? undefined : `${100 - zeroPct}%`,
                        opacity: hover === null || hover === yi ? 1 : 0.35,
                      }}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: yi * 0.06 + si * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                );
              })}
            </div>
            {hover === yi && (
              <div className="fbars__tip">
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>{y}</div>
                {series.map((s, si) => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <i style={{ width: 8, height: 8, borderRadius: 2, background: SERIES_COLORS[si], display: 'inline-block' }} />
                      {s.name}
                    </span>
                    <span className="font-mono" style={{ color: '#fff' }}>{s.values[yi] === undefined ? 'n/a' : format(s.values[yi]!)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="fbars__axis">
        {years.map((y) => (
          <span key={y}>{y}</span>
        ))}
      </div>
    </div>
  );
};
