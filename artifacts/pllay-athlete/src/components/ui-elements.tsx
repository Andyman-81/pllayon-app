import React, { useRef, useEffect, useCallback } from 'react';
import { PHASE_COLORS, PHASE_LABELS } from '@/lib/constants';

/* ── RatingBox ─────────────────────────────────────────── */
interface RatingBoxProps {
  value: number;
  selected: boolean;
  onSelect: (v: number) => void;
  phaseColour?: string;
}

export function RatingBox({ value, selected, onSelect, phaseColour }: RatingBoxProps) {
  const colour = phaseColour ?? '#10AC6E';
  return (
    <button
      className={`rb${selected ? ' on' : ''}`}
      style={selected ? { borderColor: colour, background: colour, color: '#fff' } : {}}
      onClick={() => onSelect(value)}
      type="button"
      aria-label={`Rating ${value}`}
    >
      {value}
    </button>
  );
}

/* ── ScorecardTable ───────────────────────────────────── */
interface ScorecardTableProps {
  rows: string[];
  values: Record<string, number>;
  onChange: (rowLabel: string, value: number) => void;
  phaseColour?: string;
}

export function ScorecardTable({ rows, values, onChange, phaseColour }: ScorecardTableProps) {
  const colour = phaseColour ?? '#10AC6E';
  return (
    <div className="scorecard">
      <div className="sc-head">
        <span>Domain</span>
        {[1, 2, 3, 4, 5].map(n => <span key={n}>{n}</span>)}
      </div>
      {rows.map((row, i) => (
        <div key={row} className="sc-row">
          <span className="sc-label">{row}</span>
          {[1, 2, 3, 4, 5].map(n => (
            <RatingBox
              key={n}
              value={n}
              selected={(values[row] ?? 0) >= n}
              onSelect={(v) => onChange(row, v)}
              phaseColour={colour}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── WriteField ───────────────────────────────────────── */
interface WriteFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  phaseColour?: string;
  lines?: number;
  placeholder?: string;
}

export function WriteField({ label, value, onChange, phaseColour, lines = 1, placeholder }: WriteFieldProps) {
  const colour = phaseColour ?? '#10AC6E';
  const ref = useRef<HTMLTextAreaElement>(null);

  const autoGrow = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => { autoGrow(); }, [value, autoGrow]);

  return (
    <div className="wf">
      <label className="wl-label">{label}</label>
      <textarea
        ref={ref}
        className="wl"
        value={value}
        rows={lines}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); autoGrow(); }}
        onFocus={e => { e.currentTarget.style.borderBottomColor = colour; }}
        onBlur={e => { e.currentTarget.style.borderBottomColor = 'var(--grey1)'; }}
      />
    </div>
  );
}

/* ── ImplIntention ────────────────────────────────────── */
interface ImplIntentionProps {
  label?: string;
  values: { when: string; where: string; how: string };
  onChange: (field: 'when' | 'where' | 'how', val: string) => void;
  phaseColour?: string;
}

export function ImplIntention({ label = 'Next week I will:', values, onChange, phaseColour }: ImplIntentionProps) {
  const colour = phaseColour ?? '#10AC6E';

  const IMPL_PLACEHOLDERS = {
    when: 'e.g. Every Sunday evening after dinner',
    where: 'e.g. At my desk, phone in another room',
    how: 'e.g. Open the app, set a 5-minute timer, complete all fields before I close it',
  };

  function Col({ field, title }: { field: 'when' | 'where' | 'how'; title: string }) {
    const ref = useRef<HTMLTextAreaElement>(null);
    const grow = () => {
      const el = ref.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    };
    useEffect(() => { grow(); }, [values[field]]);
    return (
      <div className="impl-col">
        <span className="impl-label">{title}</span>
        <textarea
          ref={ref}
          className="wl"
          value={values[field]}
          rows={2}
          placeholder={IMPL_PLACEHOLDERS[field]}
          onChange={e => { onChange(field, e.target.value); grow(); }}
          onFocus={e => { e.currentTarget.style.borderBottomColor = colour; }}
          onBlur={e => { e.currentTarget.style.borderBottomColor = 'var(--grey1)'; }}
        />
      </div>
    );
  }

  return (
    <div className="impl-wrap">
      <div className="impl-label-row" style={{ color: colour }}>{label}</div>
      <div className="impl">
        <Col field="when" title="WHEN" />
        <Col field="where" title="WHERE" />
        <Col field="how" title="HOW" />
      </div>
    </div>
  );
}

/* ── MissionBox ───────────────────────────────────────── */
export function MissionBox({ mission, phaseColour }: { mission: string; phaseColour: string }) {
  const bg = `${phaseColour}14`;
  return (
    <div className="mission-box" style={{ borderColor: phaseColour, backgroundColor: bg }}>
      <div className="mission-label" style={{ color: phaseColour }}>Weekly Mission</div>
      <div className="mission-text" style={{ color: phaseColour }}>{mission}</div>
    </div>
  );
}

/* ── FocusQuestion ────────────────────────────────────── */
export function FocusQuestion({ question, phaseColour }: { question: string; phaseColour: string }) {
  return (
    <div className="focus-q" style={{ borderColor: phaseColour }}>
      <span className="fq-label" style={{ color: phaseColour }}>Focus Question</span>
      <p>{question}</p>
    </div>
  );
}

/* ── Callout ──────────────────────────────────────────── */
export function Callout({ title, colour = '#10AC6E', children }: { title: string; colour?: string; children: React.ReactNode }) {
  return (
    <div className="callout" style={{ borderColor: colour }}>
      <strong>{title}</strong>
      <p>{children as string}</p>
    </div>
  );
}

/* ── PhaseDivider ─────────────────────────────────────── */
interface PhaseDividerProps {
  num: number;
  name: string;
  subtitle: string;
  colour: string;
  pills?: string[];
}
export function PhaseDivider({ num, name, subtitle, colour, pills = [] }: PhaseDividerProps) {
  return (
    <div className="phase-div" style={{ background: colour }}>
      <div className="ghost-num">{num}</div>
      <div className="phase-eyebrow">Phase {num}</div>
      <div className="phase-title">{name}</div>
      <div className="phase-subtitle">{subtitle}</div>
      <div>{pills.map(p => <span key={p} className="phase-pill">{p}</span>)}</div>
    </div>
  );
}

/* ── ModuleHeader ─────────────────────────────────────── */
interface ModuleHeaderProps {
  eyebrow: string;
  title: string;
  desc?: string;
  colour: string;
}
export function ModuleHeader({ eyebrow, title, desc, colour }: ModuleHeaderProps) {
  return (
    <div className="mod-header">
      <div className="mod-eyebrow" style={{ color: colour }}>{eyebrow}</div>
      <div className="mod-title">{title}</div>
      {desc && <div className="mod-desc">{desc}</div>}
    </div>
  );
}

/* ── RatingRow (competition review) ─────────────────────── */
interface RatingRowProps {
  label: string;
  lo?: string;
  hi?: string;
  value: number;
  onChange: (v: number) => void;
  phaseColour?: string;
}
export function RatingRow({ label, lo = 'Low', hi = 'High', value, onChange, phaseColour }: RatingRowProps) {
  const colour = phaseColour ?? '#FF4936';
  return (
    <div className="rating-row">
      <div className="r-label">{label}</div>
      <div className="r-boxes">
        {[1, 2, 3, 4, 5].map(n => (
          <RatingBox key={n} value={n} selected={value >= n} onSelect={onChange} phaseColour={colour} />
        ))}
      </div>
      <div className="r-scale">
        <span>{lo}</span>
        <span>{hi}</span>
      </div>
    </div>
  );
}

/* ── SaveIndicator ────────────────────────────────────── */
export function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null;
  const map = {
    saving: { text: 'Saving…', color: 'var(--grey)' },
    saved: { text: 'Saved ✓', color: 'var(--green)' },
    error: { text: 'Error', color: 'var(--red)' },
  };
  const { text, color } = map[status] ?? map.saving;
  return (
    <span className="save-indicator" style={{ color }}>{text}</span>
  );
}

/* ── PhaseBadge ───────────────────────────────────────── */
export function PhaseBadge({ phase }: { phase: number }) {
  const color = PHASE_COLORS[phase] ?? PHASE_COLORS[0];
  const label = PHASE_LABELS[phase] ?? 'Unknown';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 100, border: `1px solid ${color}`, backgroundColor: `${color}15` }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color }} />
      <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color }}>Phase {phase}: {label}</span>
    </div>
  );
}

/* ── ProgressBarInline ────────────────────────────────── */
export function ProgressBarInline({ current, total, color }: { current: number; total: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <div style={{ width: '100%', height: 4, background: 'var(--grey1)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color ?? '#10AC6E', borderRadius: 2, transition: 'width .3s' }} />
    </div>
  );
}

/* ── GuidedField ──────────────────────────────────────── */
interface GuidedFieldProps {
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  phaseColour?: string;
}

export function GuidedField({ label, hint, placeholder, value, onChange, phaseColour }: GuidedFieldProps) {
  const colour = phaseColour ?? '#0B7DF1';
  const ref = useRef<HTMLTextAreaElement>(null);

  const grow = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(80, el.scrollHeight)}px`;
  }, []);

  useEffect(() => { grow(); }, [value, grow]);

  return (
    <div className="guided-field">
      <label className="guided-label">{label}</label>
      <p className="guided-hint">{hint}</p>
      <textarea
        ref={ref}
        className="guided-textarea"
        placeholder={placeholder}
        value={value}
        rows={3}
        onChange={e => { onChange(e.target.value); grow(); }}
        onFocus={e => { e.currentTarget.style.borderColor = colour; }}
        onBlur={e => { e.currentTarget.style.borderColor = '#F1F5F9'; }}
      />
    </div>
  );
}

/* ── SectionDivider ───────────────────────────────────── */
export function SectionDivider({ label, colour = '#0B7DF1' }: { label: string; colour?: string }) {
  return (
    <div className="section-divider">
      <div className="section-divider-label" style={{ color: colour }}>{label}</div>
    </div>
  );
}

/* ── DataTable ────────────────────────────────────────── */
interface DataTableProps {
  headers: string[];
  rows: string[][];
  headerColour?: string;
}
export function DataTable({ headers, rows, headerColour = '#111111' }: DataTableProps) {
  return (
    <table className="data-table">
      <thead>
        <tr style={{ background: headerColour }}>
          {headers.map(h => <th key={h}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => <td key={j}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
