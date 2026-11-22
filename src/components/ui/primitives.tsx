import React from 'react';
import { motion } from 'motion/react';

/* ---------------------------------------------------------------------------
   Shared layout primitives. Every page is built from these so spacing,
   typography and motion stay identical across the product.
   ------------------------------------------------------------------------- */

export const PageContainer: React.FC<{ children: React.ReactNode; wide?: boolean }> = ({ children, wide }) => (
  <div className={`page-container${wide ? ' page-container--wide' : ''}`}>{children}</div>
);

interface PageHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, description, actions, meta }) => (
  <header className="page-header">
    <div className="page-header__text">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1 className="page-title">{title}</h1>
      {description && <p className="page-header__desc">{description}</p>}
      {meta && <div className="page-header__meta">{meta}</div>}
    </div>
    {actions && <div className="page-header__actions">{actions}</div>}
  </header>
);

interface PanelProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  padding?: number | string;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export const Panel: React.FC<PanelProps> = ({ title, subtitle, icon, actions, children, padding = 22, className = '', style, id }) => (
  <section id={id} className={`glass-panel panel ${className}`} style={{ padding, ...style }}>
    {(title || actions) && (
      <div className="panel__head">
        <div className="panel__title-wrap">
          {icon && <span className="panel__icon">{icon}</span>}
          <div>
            {title && <h3 className="panel__title">{title}</h3>}
            {subtitle && <div className="panel__subtitle">{subtitle}</div>}
          </div>
        </div>
        {actions && <div className="panel__actions">{actions}</div>}
      </div>
    )}
    {children}
  </section>
);

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; icon?: React.ReactNode; count?: number }[];
  layoutId: string;
  size?: 'sm' | 'md';
}

export function Segmented<T extends string>({ value, onChange, options, layoutId, size = 'md' }: SegmentedProps<T>) {
  return (
    <div className={`segmented segmented--${size}`} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            className={`segmented__item${active ? ' is-active' : ''}`}
            onClick={() => onChange(o.value)}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="segmented__thumb"
                transition={{ type: 'spring', stiffness: 520, damping: 40 }}
              />
            )}
            {o.icon && <span className="segmented__icon">{o.icon}</span>}
            <span className="segmented__label">{o.label}</span>
            {o.count !== undefined && <span className="segmented__count">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; description?: React.ReactNode; action?: React.ReactNode }> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="empty-state">
    <div className="empty-state__icon">{icon}</div>
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <div style={{ marginTop: 18 }}>{action}</div>}
  </div>
);

export const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: 'default' | 'positive' | 'negative' | 'accent' }> = ({
  label,
  value,
  hint,
  tone = 'default',
}) => (
  <div className="stat">
    <div className="stat__label">{label}</div>
    <div className={`stat__value stat__value--${tone}`}>{value}</div>
    {hint && <div className="stat__hint">{hint}</div>}
  </div>
);

export const Dot: React.FC<{ color: string }> = ({ color }) => (
  <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 999, background: color, flexShrink: 0 }} />
);
