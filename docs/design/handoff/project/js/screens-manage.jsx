// ============================================================
// kōza · Budgets · Récurrentes · Réglages
// ============================================================

// ------------------------------------------------------------
// BUDGETS
// ------------------------------------------------------------
function BudgetCard({ b }) {
  const ratio = b.saved / b.target;
  const pct = Math.round(ratio * 100);
  const remain = Math.max(0, b.target - b.saved);
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="font-serif" style={{ fontSize: 24 }}>{b.name}</div>
          {b.due && (
            <div className="flex items-center gap-1.5 mt-1 text-[12px]" style={{ color: 'var(--muted)' }}>
              <Icon name="CalendarDays" size={13} />
              <span>Échéance {fmtDate(b.due)}</span>
            </div>
          )}
        </div>
        <div className="grid place-items-center rounded-full shrink-0" style={{ width: 44, height: 44, background: 'var(--epargne-bg)' }}>
          <Icon name="Target" size={20} style={{ color: 'var(--epargne)' }} />
        </div>
      </div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="num font-light" style={{ fontSize: 28 }}>{fmtEUR(b.saved)}</span>
        <span className="num text-[13px]" style={{ color: 'var(--secondary)' }}>objectif {fmtEUR(b.target)}</span>
      </div>
      <ProgressBar value={b.saved} max={b.target} color="var(--epargne)" height={6} />
      <div className="flex items-center justify-between mt-2.5">
        <span className="num text-[12px]" style={{ color: 'var(--epargne)' }}>{pct} % atteint</span>
        <span className="num text-[12px]" style={{ color: 'var(--muted)' }}>encore {fmtEUR(remain)}</span>
      </div>
    </Card>
  );
}

function BudgetsScreen({ budgets, onCreate }) {
  return (
    <div className="screen-enter flex flex-col gap-5">
      <ScreenHead title="Budgets" sub="Vos projets et objectifs d'épargne, à votre rythme." />
      <Button variant="soft" icon="Plus" full onClick={onCreate}>Nouveau budget</Button>
      <div className="flex flex-col gap-4">
        {budgets.map(b => <BudgetCard key={b.id} b={b} />)}
      </div>
    </div>
  );
}

function BudgetForm({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('');
  const [due, setDue] = useState('');
  const valid = name.trim() && parseFloat(target.replace(',', '.')) > 0;
  const submit = () => {
    if (!valid) return;
    onAdd({ id: 'b' + Date.now(), name: name.trim(),
      target: parseFloat(target.replace(',', '.')),
      saved: parseFloat((saved || '0').replace(',', '.')) || 0,
      due: due || null, cat: 'epargne' });
    onClose();
  };
  return (
    <FormShell title="Nouveau budget" onClose={onClose} onSubmit={submit} valid={valid} cta="Créer le budget">
      <Field label="Nom du projet"><TextInput value={name} onChange={setName} placeholder="ex. Vacances Grèce" /></Field>
      <Field label="Objectif"><AmountInput value={target} onChange={setTarget} /></Field>
      <Field label="Déjà épargné" hint="Optionnel"><AmountInput value={saved} onChange={setSaved} /></Field>
      <Field label="Échéance" hint="Optionnel">
        <input type="date" value={due} onChange={e => setDue(e.target.value)}
          className="w-full rounded-input px-4 h-12 text-[15px]" style={{ background: 'var(--surface-alt)', color: 'var(--ink)' }} />
      </Field>
    </FormShell>
  );
}

// ------------------------------------------------------------
// RÉCURRENTES
// ------------------------------------------------------------
function FreqBadge({ children }) {
  return <Pill color="var(--secondary)" bg="var(--surface-alt)">{children}</Pill>;
}

function RecurringCard({ r, onToggle }) {
  const c = CATEGORIES[r.cat];
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="grid place-items-center rounded-full shrink-0" style={{ width: 44, height: 44, background: c.bg }}>
          <Icon name={r.type === 'Fixe' ? 'Repeat' : 'Waves'} size={19} style={{ color: c.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-medium truncate">{r.label}</span>
            {r.pending && r.active && <Pill color="var(--warning)" bg="var(--warning-bg)">À confirmer</Pill>}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <FreqBadge>{r.freq}</FreqBadge>
            <Pill color={r.type === 'Variable' ? 'var(--warning)' : 'var(--secondary)'} bg="var(--surface-alt)">{r.type}</Pill>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="num text-[15px] font-light" style={{ color: r.active ? 'var(--ink)' : 'var(--muted)' }}>
            {r.type === 'Variable' ? '~ ' : ''}{fmtEUR(r.amount)}
          </span>
          <Toggle on={r.active} onChange={() => onToggle(r.id)} label={r.label} />
        </div>
      </div>
    </Card>
  );
}

function RecurringScreen({ recurring, onToggle, onCreate }) {
  return (
    <div className="screen-enter flex flex-col gap-5">
      <ScreenHead title="Récurrentes" sub="Vos charges régulières, fixes ou variables." />
      <Button variant="soft" icon="Plus" full onClick={onCreate}>Nouvelle récurrente</Button>
      <div className="flex flex-col gap-4">
        {recurring.map(r => <RecurringCard key={r.id} r={r} onToggle={onToggle} />)}
      </div>
    </div>
  );
}

function RecurringForm({ onClose, onAdd }) {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Fixe');
  const [freq, setFreq] = useState('Mensuel');
  const [cat, setCat] = useState('essentiels');
  const [anchor, setAnchor] = useState('1');
  const valid = label.trim() && parseFloat(amount.replace(',', '.')) > 0;
  const submit = () => {
    if (!valid) return;
    onAdd({ id: 'r' + Date.now(), label: label.trim(),
      amount: parseFloat(amount.replace(',', '.')), cat, freq, type,
      anchor: parseInt(anchor) || 1, active: true, pending: type === 'Variable' });
    onClose();
  };
  return (
    <FormShell title="Nouvelle récurrente" onClose={onClose} onSubmit={submit} valid={valid} cta="Ajouter">
      <Field label="Libellé"><TextInput value={label} onChange={setLabel} placeholder="ex. Abonnement transport" /></Field>
      <Field label="Type">
        <Segmented options={['Fixe', 'Variable']} value={type} onChange={setType} className="w-full" />
        <div className="text-[12px] mt-1.5" style={{ color: 'var(--muted)' }}>
          {type === 'Variable' ? 'Le montant sera à confirmer chaque échéance.' : 'Montant constant à chaque échéance.'}
        </div>
      </Field>
      <Field label={type === 'Variable' ? 'Montant estimé' : 'Montant'}><AmountInput value={amount} onChange={setAmount} /></Field>
      <Field label="Catégorie"><CatSelect value={cat} onChange={setCat} /></Field>
      <Field label="Fréquence">
        <Segmented options={['Mensuel', 'Trimestriel', 'Annuel']} value={freq} onChange={setFreq} className="w-full" />
      </Field>
      <Field label="Jour d'ancrage" hint="Jour du mois où la charge tombe">
        <TextInput value={anchor} onChange={v => setAnchor(v.replace(/[^0-9]/g, ''))} placeholder="1" />
      </Field>
    </FormShell>
  );
}

// ------------------------------------------------------------
// RÉGLAGES
// ------------------------------------------------------------
function SettingsScreen({ theme, setTheme, lang, setLang, onReconfigure, onExport, onReplayIntro }) {
  return (
    <div className="screen-enter flex flex-col gap-6">
      <ScreenHead title="Réglages" sub="" />

      <div>
        <SectionLabel>Apparence</SectionLabel>
        <Card pad="p-2">
          <SettingRow icon="Sun" label="Thème clair" right={
            <Segmented options={[{ value: 'light', label: 'Clair' }, { value: 'dark', label: 'Sombre' }]} value={theme} onChange={setTheme} />
          } />
        </Card>
      </div>

      <div>
        <SectionLabel>Langue & devise</SectionLabel>
        <Card pad="p-2">
          <SettingRow icon="Languages" label="Langue" right={
            <Segmented options={[{ value: 'fr', label: 'FR' }, { value: 'en', label: 'EN' }]} value={lang} onChange={setLang} />
          } />
          <Divider />
          <SettingRow icon="Coins" label="Devise" sub="Euro (€)" right={<span className="num text-[14px]" style={{ color: 'var(--muted)' }}>EUR</span>} />
        </Card>
      </div>

      <div>
        <SectionLabel>Revenus</SectionLabel>
        <Card pad="p-2">
          <SettingRow icon="Wallet" label="Salaire mensuel" sub="2 500,00 € · le 28" onClick={onReconfigure}
            right={<Icon name="ChevronRight" size={18} style={{ color: 'var(--muted)' }} />} />
          <Divider />
          <SettingRow icon="Plus" label="Ajouter une source" onClick={onReconfigure}
            right={<Icon name="ChevronRight" size={18} style={{ color: 'var(--muted)' }} />} />
        </Card>
      </div>

      <div>
        <SectionLabel>Données</SectionLabel>
        <Card pad="p-2">
          <SettingRow icon="Download" label="Exporter (JSON)" sub="Toutes vos données, hors ligne" onClick={onExport}
            right={<Icon name="ChevronRight" size={18} style={{ color: 'var(--muted)' }} />} />
          <Divider />
          <SettingRow icon="Sparkles" label="Revoir l'introduction" onClick={onReplayIntro}
            right={<Icon name="ChevronRight" size={18} style={{ color: 'var(--muted)' }} />} />
        </Card>
      </div>

      <div className="text-center pt-2 pb-8">
        <div className="font-serif" style={{ fontSize: 22, color: 'var(--muted)' }}>kōza · 口座</div>
        <div className="text-[12px] mt-1" style={{ color: 'var(--muted)' }}>Suivre, sans juger.</div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Helpers partagés
// ------------------------------------------------------------
function ScreenHead({ title, sub }) {
  return (
    <div>
      <div className="font-serif" style={{ fontSize: 32 }}>{title}</div>
      {sub && <div className="text-[14px] mt-1" style={{ color: 'var(--secondary)' }}>{sub}</div>}
    </div>
  );
}
function SectionLabel({ children }) {
  return <div className="text-[12px] font-medium uppercase mb-2 px-1" style={{ color: 'var(--muted)', letterSpacing: '.06em' }}>{children}</div>;
}
function Divider() { return <div style={{ height: 1, background: 'var(--line)', margin: '0 14px' }} />; }
function SettingRow({ icon, label, sub, right, onClick }) {
  return (
    <div className={`flex items-center gap-3 px-3.5 py-3 rounded-[12px] ${onClick ? 'cursor-pointer tap' : ''}`} onClick={onClick}>
      <Icon name={icon} size={19} style={{ color: 'var(--secondary)' }} />
      <div className="flex-1">
        <div className="text-[14px]" style={{ color: 'var(--ink)' }}>{label}</div>
        {sub && <div className="text-[12px] num mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}
function AmountInput({ value, onChange }) {
  return (
    <div className="flex items-center rounded-input px-4 h-12" style={{ background: 'var(--surface-alt)' }}>
      <input value={value} inputMode="decimal" placeholder="0"
        onChange={e => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
        className="num flex-1 bg-transparent text-[15px]" style={{ color: 'var(--ink)' }} />
      <span className="num text-[15px]" style={{ color: 'var(--muted)' }}>€</span>
    </div>
  );
}
function FormShell({ title, children, onClose, onSubmit, valid, cta }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <div className="font-serif whitespace-nowrap" style={{ fontSize: 24 }}>{title}</div>
        <IconBtn name="X" onClick={onClose} />
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col gap-5">{children}</div>
      <div className="px-6 py-5" style={{ borderTop: '1px solid var(--line)' }}>
        <Button variant="primary" full onClick={onSubmit} disabled={!valid}>{cta}</Button>
      </div>
    </div>
  );
}

Object.assign(window, {
  BudgetsScreen, BudgetForm, RecurringScreen, RecurringForm, SettingsScreen,
  ScreenHead, SectionLabel, Divider, SettingRow, AmountInput, FormShell, BudgetCard, RecurringCard,
});
