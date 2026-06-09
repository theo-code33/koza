// ============================================================
// kōza · primitives UI
// ============================================================
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---- Icônes (lucide vanilla — icon-node data) --------------
const lucide = window.lucide || {};
const _icons = lucide.icons || {};
function Icon({ name, size = 20, strokeWidth = 1.6, className = '', style }) {
  const node = _icons[name];
  if (!node || !node[2]) return <span style={{ display: 'inline-block', width: size, height: size }} />;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style}>
      {node[2].map((child, i) => React.createElement(child[0], { key: i, ...child[1] }))}
    </svg>
  );
}

// ---- Carte --------------------------------------------------
function Card({ className = '', style, children, onClick, as = 'div', pad = 'p-6' }) {
  const Tag = as;
  return (
    <Tag className={`card ${pad} ${onClick ? 'cursor-pointer tap' : ''} ${className}`} style={style} onClick={onClick}>
      {children}
    </Tag>
  );
}

// ---- Barre de progression (4px, jamais rouge) --------------
function ProgressBar({ value, max, color, height = 4 }) {
  const ratio = max > 0 ? value / max : 0;
  const over = ratio > 1;
  const pct = Math.min(ratio, 1) * 100;
  const fill = over ? 'var(--over)' : color;
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'var(--surface-alt)' }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, background: fill, transition: 'width .7s cubic-bezier(.22,.61,.36,1)' }}
      />
    </div>
  );
}

// ---- Pill (sous-catégorie teintée) -------------------------
function Pill({ children, color, bg, className = '' }) {
  return (
    <span
      className={`inline-flex items-center text-[12px] font-medium px-2.5 py-1 rounded-full ${className}`}
      style={{ color: color || 'var(--secondary)', background: bg || 'var(--surface-alt)' }}
    >
      {children}
    </span>
  );
}

function CatDot({ cat, size = 8 }) {
  return <span style={{ width: size, height: size, borderRadius: 999, background: CATEGORIES[cat].color, display: 'inline-block' }} />;
}

// ---- Bouton -------------------------------------------------
function Button({ children, onClick, variant = 'primary', className = '', icon, full, type = 'button', disabled }) {
  const base = 'tap inline-flex items-center justify-center gap-2 rounded-btn text-[15px] font-medium px-5 h-11 transition';
  const styles = {
    primary: { background: 'var(--accent)', color: '#fff' },
    soft:    { background: 'var(--accent-soft)', color: 'var(--accent)' },
    ghost:   { background: 'transparent', color: 'var(--secondary)' },
    surface: { background: 'var(--surface-alt)', color: 'var(--ink)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${full ? 'w-full' : ''} ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}
      style={styles[variant]}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

// ---- Toggle -------------------------------------------------
function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className="tap relative shrink-0 rounded-full transition-colors"
      style={{ width: 46, height: 28, background: on ? 'var(--accent)' : 'var(--surface-alt)' }}>
      <span className="absolute rounded-full bg-white"
        style={{ width: 22, height: 22, top: 3, left: on ? 21 : 3, transition: 'left .25s cubic-bezier(.22,.61,.36,1)', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
    </button>
  );
}

// ---- Segmented control -------------------------------------
function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={`inline-flex p-1 rounded-full ${className}`} style={{ background: 'var(--surface-alt)' }}>
      {options.map(o => {
        const val = typeof o === 'string' ? o : o.value;
        const lab = typeof o === 'string' ? o : o.label;
        const active = val === value;
        return (
          <button key={val} type="button" onClick={() => onChange(val)}
            className="tap text-[13px] font-medium px-4 h-8 rounded-full transition-colors"
            style={{ background: active ? 'var(--surface)' : 'transparent',
                     color: active ? 'var(--ink)' : 'var(--secondary)',
                     boxShadow: active ? 'var(--shadow-sm)' : 'none' }}>
            {lab}
          </button>
        );
      })}
    </div>
  );
}

// ---- Navigateur de mois ------------------------------------
function MonthNav({ month, onPrev, onNext, canPrev, canNext, subtitle }) {
  return (
    <div className="flex items-center justify-between">
      <IconBtn name="ChevronLeft" onClick={onPrev} disabled={!canPrev} />
      <div className="text-center">
        <div className="font-serif leading-none whitespace-nowrap" style={{ fontSize: 28, textTransform: 'capitalize' }}>{monthLabel(month)}</div>
        {subtitle && <div className="text-[12px] mt-1.5 whitespace-nowrap" style={{ color: 'var(--muted)' }}>{subtitle}</div>}
      </div>
      <IconBtn name="ChevronRight" onClick={onNext} disabled={!canNext} />
    </div>
  );
}

function IconBtn({ name, onClick, disabled, size = 20, className = '', active }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`tap grid place-items-center rounded-full transition ${className}`}
      style={{ width: 40, height: 40,
        color: active ? 'var(--accent)' : 'var(--secondary)',
        background: active ? 'var(--accent-soft)' : 'transparent',
        opacity: disabled ? 0.3 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <Icon name={name} size={size} />
    </button>
  );
}

// ---- Bannière douce (à confirmer / info) -------------------
function SoftBanner({ icon = 'Bell', tone = 'warning', children, action, onAction }) {
  const colors = {
    warning: { c: 'var(--warning)', b: 'var(--warning-bg)' },
    accent:  { c: 'var(--accent)',  b: 'var(--accent-soft)' },
    over:    { c: 'var(--over)',    b: 'var(--over-bg)' },
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-card px-4 py-3.5" style={{ background: colors.b }}>
      <Icon name={icon} size={18} style={{ color: colors.c }} />
      <div className="flex-1 text-[14px]" style={{ color: 'var(--ink)' }}>{children}</div>
      {action && (
        <button type="button" onClick={onAction} className="tap text-[13px] font-medium shrink-0" style={{ color: colors.c }}>
          {action}
        </button>
      )}
    </div>
  );
}

// ---- Champ texte / montant ---------------------------------
function Field({ label, children, hint }) {
  return (
    <label className="block">
      {label && <div className="text-[13px] mb-2 font-medium" style={{ color: 'var(--secondary)' }}>{label}</div>}
      {children}
      {hint && <div className="text-[12px] mt-1.5" style={{ color: 'var(--muted)' }}>{hint}</div>}
    </label>
  );
}
function TextInput({ value, onChange, placeholder, type = 'text', inputRef, className = '', style }) {
  return (
    <input ref={inputRef} type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className={`w-full rounded-input px-4 h-12 text-[15px] transition ${className}`}
      style={{ background: 'var(--surface-alt)', color: 'var(--ink)', ...style }} />
  );
}

// ---- Sélecteur de catégorie (3 pills) ----------------------
function CatSelect({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {CAT_ORDER.map(c => {
        const cat = CATEGORIES[c];
        const active = value === c;
        return (
          <button key={c} type="button" onClick={() => onChange(c)}
            className="tap rounded-input h-11 text-[14px] font-medium transition"
            style={{
              background: active ? cat.bg : 'var(--surface-alt)',
              color: active ? cat.color : 'var(--secondary)',
              boxShadow: active ? `inset 0 0 0 1.5px ${cat.color}` : 'none',
            }}>
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

// ---- Scrim + conteneur modal (panneau / sheet) -------------
function Overlay({ children, onClose, mode }) {
  // mode: 'panel' (desktop, droite) | 'sheet' (mobile, bas)
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex" style={{ justifyContent: mode === 'panel' ? 'flex-end' : 'center', alignItems: mode === 'panel' ? 'stretch' : 'flex-end' }}>
      <div className="absolute inset-0 scrim-enter" style={{ background: 'rgba(20,20,22,.34)' }} onClick={onClose} />
      <div className={`relative ${mode === 'panel' ? 'panel-enter h-full w-[440px] max-w-[92vw]' : 'sheet-enter w-full max-w-[560px]'}`}
        style={{ background: 'var(--surface)',
          borderRadius: mode === 'panel' ? '0' : '24px 24px 0 0',
          borderLeft: mode === 'panel' ? '1px solid var(--line)' : 'none',
          boxShadow: mode === 'panel' ? '-8px 0 40px rgba(0,0,0,.10)' : '0 -8px 40px rgba(0,0,0,.12)' }}>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, {
  Icon, Card, ProgressBar, Pill, CatDot, Button, Toggle, Segmented,
  MonthNav, IconBtn, SoftBanner, Field, TextInput, CatSelect, Overlay,
  useState, useEffect, useRef, useMemo, useCallback,
});
