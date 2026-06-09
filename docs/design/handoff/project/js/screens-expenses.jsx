// ============================================================
// kōza · Dépenses (liste chronologique) + ajout rapide
// ============================================================

function SubPill({ cat, children }) {
  const c = CATEGORIES[cat];
  return <Pill color={c.color} bg={c.bg}>{children}</Pill>;
}

function ExpenseRow({ e }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <div className="grid place-items-center rounded-full shrink-0" style={{ width: 38, height: 38, background: CATEGORIES[e.cat].bg }}>
        <CatDot cat={e.cat} size={9} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[15px] truncate" style={{ color: 'var(--ink)' }}>{e.desc}</span>
          {e.rec && <Icon name="Repeat" size={13} style={{ color: 'var(--muted)' }} />}
        </div>
        <div className="mt-1"><SubPill cat={e.cat}>{e.sub}</SubPill></div>
      </div>
      <div className="num text-[15px] font-light shrink-0" style={{ color: 'var(--ink)' }}>{fmtEUR(e.amount)}</div>
    </div>
  );
}

function ExpensesScreen({ month, setMonth, expenses, openAdd }) {
  const idx = NAV_MONTHS.indexOf(month);
  const list = expensesForMonth(month, expenses).slice().sort((a, b) => b.date.localeCompare(a.date));
  const total = list.reduce((s, e) => s + e.amount, 0);
  const isPast = idx < NAV_MONTHS.indexOf(CURRENT_MONTH);

  // grouper par jour
  const groups = [];
  list.forEach(e => {
    let g = groups.find(x => x.date === e.date);
    if (!g) { g = { date: e.date, items: [] }; groups.push(g); }
    g.items.push(e);
  });

  return (
    <div className="screen-enter flex flex-col gap-6">
      <MonthNav
        month={month}
        canPrev={idx > 0}
        canNext={idx < NAV_MONTHS.length - 1}
        onPrev={() => setMonth(NAV_MONTHS[Math.max(0, idx - 1)])}
        onNext={() => setMonth(NAV_MONTHS[Math.min(NAV_MONTHS.length - 1, idx + 1)])}
        subtitle={`${list.length} dépenses · ${fmtEUR(total)}`}
      />

      {!isPast && (
        <Button variant="soft" icon="Plus" full onClick={openAdd}>Ajouter une dépense</Button>
      )}

      <div className="flex flex-col gap-7">
        {groups.map(g => {
          const dTot = g.items.reduce((s, e) => s + e.amount, 0);
          return (
            <div key={g.date}>
              <div className="flex items-baseline justify-between mb-1 px-1">
                <span className="text-[13px] font-medium" style={{ color: 'var(--secondary)', textTransform: 'capitalize' }}>{dayLabel(g.date)}</span>
                <span className="num text-[12px]" style={{ color: 'var(--muted)' }}>{fmtEUR(dTot)}</span>
              </div>
              <Card pad="px-5 py-1">
                {g.items.map((e, i) => (
                  <div key={e.id} style={{ borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
                    <ExpenseRow e={e} />
                  </div>
                ))}
              </Card>
            </div>
          );
        })}
        {groups.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
            <Icon name="Wind" size={28} style={{ color: 'var(--muted)' }} />
            <div className="text-[14px] mt-3">Aucune dépense ce mois-ci.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Formulaire d'ajout rapide (panneau / sheet) — « < 10 s »
// ============================================================
function QuickAddForm({ onClose, onAdd, defaultMonth }) {
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState('essentiels');
  const [sub, setSub] = useState('');
  const [desc, setDesc] = useState('');
  const dayDefault = defaultMonth === CURRENT_MONTH ? '2026-06-08' : defaultMonth + '-15';
  const [date, setDate] = useState(dayDefault);
  const amtRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => amtRef.current && amtRef.current.focus(), 350); return () => clearTimeout(t); }, []);

  const SUBS = {
    essentiels: ['Courses', 'Logement', 'Transport', 'Énergie', 'Santé', 'Téléphone'],
    loisirs: ['Restaurant', 'Sorties', 'Shopping', 'Abonnement', 'Café'],
    epargne: ['Virement', 'Projet', "Fonds d'urgence"],
  };

  const valid = parseFloat(amount.replace(',', '.')) > 0;
  const submit = () => {
    if (!valid) return;
    onAdd({
      id: 'u' + Date.now(),
      date,
      amount: Math.round(parseFloat(amount.replace(',', '.')) * 100) / 100,
      cat,
      sub: sub || SUBS[cat][0],
      desc: desc || sub || CATEGORIES[cat].label,
    });
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <div className="font-serif whitespace-nowrap" style={{ fontSize: 24 }}>Nouvelle dépense</div>
        <IconBtn name="X" onClick={onClose} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col gap-6">
        {/* Montant géant auto-focus */}
        <div className="flex flex-col items-center py-4">
          <div className="flex items-end gap-1">
            <input
              ref={amtRef} value={amount} inputMode="decimal" placeholder="0"
              onChange={e => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="num font-light text-center bg-transparent"
              style={{ fontSize: 40, width: Math.max(2, amount.length + 1) + 'ch', color: 'var(--ink)' }} />
            <span className="num font-light pb-1" style={{ fontSize: 28, color: 'var(--muted)' }}>€</span>
          </div>
        </div>

        <Field label="Catégorie"><CatSelect value={cat} onChange={(c) => { setCat(c); setSub(''); }} /></Field>

        <Field label="Sous-catégorie">
          <div className="flex flex-wrap gap-2">
            {SUBS[cat].map(s => (
              <button key={s} type="button" onClick={() => setSub(s)}
                className="tap text-[13px] px-3 h-9 rounded-full transition"
                style={{ background: sub === s ? CATEGORIES[cat].bg : 'var(--surface-alt)',
                         color: sub === s ? CATEGORIES[cat].color : 'var(--secondary)',
                         boxShadow: sub === s ? `inset 0 0 0 1.5px ${CATEGORIES[cat].color}` : 'none' }}>
                {s}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Description"><TextInput value={desc} onChange={setDesc} placeholder="ex. Carrefour" /></Field>

        <Field label="Date">
          <input type="date" value={date} min={defaultMonth + '-01'} max={defaultMonth + '-31'}
            onChange={e => setDate(e.target.value)}
            className="w-full rounded-input px-4 h-12 text-[15px]"
            style={{ background: 'var(--surface-alt)', color: 'var(--ink)' }} />
        </Field>
      </div>

      <div className="px-6 py-5" style={{ borderTop: '1px solid var(--line)' }}>
        <Button variant="primary" full onClick={submit} disabled={!valid}>
          Enregistrer {valid ? '· ' + fmtEUR(parseFloat(amount.replace(',', '.'))) : ''}
        </Button>
      </div>
    </div>
  );
}

Object.assign(window, { ExpensesScreen, QuickAddForm, ExpenseRow, SubPill });
