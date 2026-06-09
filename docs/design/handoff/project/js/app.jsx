// ============================================================
// kōza · App shell (navigation, routing, overlays)
// ============================================================

function useMediaQuery(q) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const fn = e => setM(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [q]);
  return m;
}

const NAV = [
  { key: 'dashboard', label: 'Tableau de bord', icon: 'LayoutDashboard' },
  { key: 'expenses', label: 'Dépenses', icon: 'ReceiptText' },
  { key: 'budgets', label: 'Budgets', icon: 'Target' },
  { key: 'recurring', label: 'Récurrentes', icon: 'Repeat' },
  { key: 'settings', label: 'Réglages', icon: 'Settings' },
];

function Sidebar({ route, setRoute, openAdd }) {
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-30 flex-col items-center py-7"
      style={{ width: 84, borderRight: '1px solid var(--line)', background: 'var(--surface)' }}>
      <div className="font-serif mb-9" style={{ fontSize: 26 }}>kō</div>
      <nav className="flex flex-col items-center gap-2 flex-1">
        {NAV.map(n => {
          const active = route === n.key;
          return (
            <button key={n.key} type="button" onClick={() => setRoute(n.key)} title={n.label}
              className="tap grid place-items-center rounded-[14px] transition"
              style={{ width: 48, height: 48,
                color: active ? 'var(--accent)' : 'var(--secondary)',
                background: active ? 'var(--accent-soft)' : 'transparent' }}>
              <Icon name={n.icon} size={21} strokeWidth={active ? 2 : 1.6} />
            </button>
          );
        })}
      </nav>
      <button type="button" onClick={openAdd} title="Ajouter"
        className="tap grid place-items-center rounded-full" style={{ width: 48, height: 48, background: 'var(--accent)', color: '#fff' }}>
        <Icon name="Plus" size={22} />
      </button>
    </aside>
  );
}

function BottomNav({ route, setRoute, openAdd }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2"
      style={{ height: 68, paddingBottom: 'env(safe-area-inset-bottom)', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
      {NAV.slice(0, 2).map(n => <BottomItem key={n.key} n={n} active={route === n.key} onClick={() => setRoute(n.key)} />)}
      <button type="button" onClick={openAdd} className="tap grid place-items-center rounded-full -mt-1"
        style={{ width: 50, height: 50, background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 14px rgba(90,122,106,.4)' }}>
        <Icon name="Plus" size={24} />
      </button>
      {NAV.slice(2, 3).map(n => <BottomItem key={n.key} n={n} active={route === n.key} onClick={() => setRoute(n.key)} />)}
      <BottomItem n={NAV[4]} active={route === 'settings'} onClick={() => setRoute('settings')} />
    </nav>
  );
}
function BottomItem({ n, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className="tap grid place-items-center" style={{ width: 52, height: 52,
      color: active ? 'var(--accent)' : 'var(--secondary)' }}>
      <Icon name={n.icon} size={22} strokeWidth={active ? 2 : 1.6} />
    </button>
  );
}

// ---- Bascule Mensuel / Annuel (dashboard) ------------------
function DashTabs({ value, onChange }) {
  return (
    <div className="flex justify-center">
      <Segmented options={[{ value: 'month', label: 'Mensuel' }, { value: 'year', label: 'Annuel' }]} value={value} onChange={onChange} />
    </div>
  );
}

function App() {
  const [onboarding, setOnboarding] = useState(false);
  const [route, setRoute] = useState('dashboard');
  const [dashView, setDashView] = useState('month');
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('fr');
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [overlay, setOverlay] = useState(null); // 'add' | 'budget' | 'recurring' | null

  const [expenses, setExpenses] = useState(EXPENSES);
  const [recurring, setRecurring] = useState(RECURRING);
  const [budgets, setBudgets] = useState(BUDGETS);
  const [toast, setToast] = useState(null);

  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const flash = (msg) => setToast(msg);

  const addExpense = (e) => { setExpenses(x => [...x, e]); setMonth(e.date.slice(0, 7)); flash('Dépense enregistrée'); };
  const addBudget = (b) => { setBudgets(x => [...x, b]); flash('Budget créé'); };
  const addRecurring = (r) => { setRecurring(x => [...x, r]); flash('Récurrente ajoutée'); };
  const toggleRecurring = (id) => setRecurring(x => x.map(r => r.id === id ? { ...r, active: !r.active } : r));

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ expenses, recurring, budgets, incomes: INCOMES }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'koza-export.json'; a.click();
    URL.revokeObjectURL(url);
    flash('Export JSON téléchargé');
  };

  const openAdd = () => setOverlay('add');
  const overlayMode = isDesktop ? 'panel' : 'sheet';

  let content;
  if (route === 'dashboard') {
    content = (
      <div className="flex flex-col gap-7">
        <DashTabs value={dashView} onChange={setDashView} />
        {dashView === 'month'
          ? <MonthlyDashboard month={month} setMonth={setMonth} openAdd={openAdd} expenses={expenses} />
          : <AnnualDashboard />}
      </div>
    );
  } else if (route === 'expenses') {
    content = <ExpensesScreen month={month} setMonth={setMonth} expenses={expenses} openAdd={openAdd} />;
  } else if (route === 'budgets') {
    content = <BudgetsScreen budgets={budgets} onCreate={() => setOverlay('budget')} />;
  } else if (route === 'recurring') {
    content = <RecurringScreen recurring={recurring} onToggle={toggleRecurring} onCreate={() => setOverlay('recurring')} />;
  } else if (route === 'settings') {
    content = <SettingsScreen theme={theme} setTheme={setTheme} lang={lang} setLang={setLang}
      onReconfigure={() => flash('Reconfiguration des revenus (démo)')} onExport={exportJSON}
      onReplayIntro={() => { setOnboarding(true); setRoute('dashboard'); }} />;
  }

  return (
    <div>
      {onboarding && <Onboarding onDone={() => setOnboarding(false)} />}

      <Sidebar route={route} setRoute={(r) => { setRoute(r); }} openAdd={openAdd} />
      <BottomNav route={route} setRoute={setRoute} openAdd={openAdd} />

      <main className="lg:pl-[84px]">
        <div className="mx-auto px-6 lg:px-8" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 120 }}>
          {content}
        </div>
      </main>

      {/* Overlays */}
      {overlay === 'add' && (
        <Overlay mode={overlayMode} onClose={() => setOverlay(null)}>
          <QuickAddForm onClose={() => setOverlay(null)} onAdd={addExpense} defaultMonth={month === CURRENT_MONTH || NAV_MONTHS.indexOf(month) === NAV_MONTHS.indexOf(CURRENT_MONTH) ? CURRENT_MONTH : month} />
        </Overlay>
      )}
      {overlay === 'budget' && (
        <Overlay mode={overlayMode} onClose={() => setOverlay(null)}>
          <BudgetForm onClose={() => setOverlay(null)} onAdd={addBudget} />
        </Overlay>
      )}
      {overlay === 'recurring' && (
        <Overlay mode={overlayMode} onClose={() => setOverlay(null)}>
          <RecurringForm onClose={() => setOverlay(null)} onAdd={addRecurring} />
        </Overlay>
      )}

      {/* Toast doux */}
      {toast && (
        <div className="fixed z-[70] left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-full screen-enter"
          style={{ bottom: isDesktop ? 28 : 84, background: 'var(--ink)', color: 'var(--bg)', boxShadow: '0 8px 30px rgba(0,0,0,.18)' }}>
          <Icon name="Check" size={16} />
          <span className="text-[13px] font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
