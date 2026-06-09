// ============================================================
// kōza · données mockées + logique métier 50/30/20
// ============================================================

const CURRENT_MONTH = '2026-06';
const CARRY_BEFORE_APRIL = 280; // report cumulé du 1er trimestre

const CATEGORIES = {
  essentiels: { key: 'essentiels', label: 'Essentiels', share: 0.5, color: 'var(--essentiels)', bg: 'var(--essentiels-bg)' },
  loisirs:    { key: 'loisirs',    label: 'Loisirs',    share: 0.3, color: 'var(--loisirs)',    bg: 'var(--loisirs-bg)' },
  epargne:    { key: 'epargne',    label: 'Épargne',    share: 0.2, color: 'var(--epargne)',    bg: 'var(--epargne-bg)' },
};
const CAT_ORDER = ['essentiels', 'loisirs', 'epargne'];

// ---- Entrées (revenus) ------------------------------------
const INCOMES = [
  { id: 'i1', month: '2026-04', date: '2026-04-28', amount: 2500, source: 'Salaire' },
  { id: 'i2', month: '2026-05', date: '2026-05-28', amount: 2500, source: 'Salaire' },
  { id: 'i3', month: '2026-06', date: '2026-06-02', amount: 2500, source: 'Salaire' },
  { id: 'i4', month: '2026-06', date: '2026-06-05', amount: 300,  source: 'Vente' },
];

// ---- Dépenses ---------------------------------------------
// cat: essentiels | loisirs | epargne
const EXPENSES = [
  // ---- Juin 2026 (mois courant, jusqu'au 08) ----
  { id: 'e01', date: '2026-06-01', amount: 800,   cat: 'essentiels', sub: 'Logement',   desc: 'Loyer',          rec: true },
  { id: 'e02', date: '2026-06-02', amount: 84.30, cat: 'essentiels', sub: 'Courses',    desc: 'Carrefour' },
  { id: 'e03', date: '2026-06-03', amount: 38.50, cat: 'loisirs',    sub: 'Restaurant', desc: 'Le Sushi Bar' },
  { id: 'e04', date: '2026-06-04', amount: 400,   cat: 'epargne',    sub: 'Virement',   desc: 'Virement épargne' },
  { id: 'e05', date: '2026-06-05', amount: 86.40, cat: 'essentiels', sub: 'Transport',  desc: 'Navigo' },
  { id: 'e06', date: '2026-06-06', amount: 13.90, cat: 'loisirs',    sub: 'Sorties',    desc: 'UGC Ciné' },
  { id: 'e07', date: '2026-06-07', amount: 52.10, cat: 'essentiels', sub: 'Courses',    desc: 'Monoprix' },
  { id: 'e08', date: '2026-06-08', amount: 9.80,  cat: 'loisirs',    sub: 'Café',       desc: 'Boulangerie' },

  // ---- Mai 2026 (clôturé) ----
  { id: 'e09', date: '2026-05-01', amount: 800,   cat: 'essentiels', sub: 'Logement',   desc: 'Loyer',          rec: true },
  { id: 'e10', date: '2026-05-03', amount: 78.20, cat: 'essentiels', sub: 'Courses',    desc: 'Lidl' },
  { id: 'e11', date: '2026-05-05', amount: 45.00, cat: 'loisirs',    sub: 'Restaurant', desc: 'Trattoria' },
  { id: 'e12', date: '2026-05-07', amount: 58.40, cat: 'essentiels', sub: 'Énergie',    desc: 'Électricité',    rec: true },
  { id: 'e13', date: '2026-05-08', amount: 480,   cat: 'essentiels', sub: 'Assurance',  desc: 'Assurance auto', rec: true },
  { id: 'e14', date: '2026-05-10', amount: 86.40, cat: 'essentiels', sub: 'Transport',  desc: 'Navigo' },
  { id: 'e15', date: '2026-05-12', amount: 64.90, cat: 'loisirs',    sub: 'Shopping',   desc: 'Zara' },
  { id: 'e16', date: '2026-05-15', amount: 65.40, cat: 'essentiels', sub: 'Courses',    desc: 'Carrefour' },
  { id: 'e17', date: '2026-05-18', amount: 400,   cat: 'epargne',    sub: 'Virement',   desc: 'Virement épargne' },
  { id: 'e18', date: '2026-05-20', amount: 19.99, cat: 'essentiels', sub: 'Téléphone',  desc: 'Orange' },
  { id: 'e19', date: '2026-05-22', amount: 24.00, cat: 'loisirs',    sub: 'Sorties',    desc: 'Le Comptoir' },
  { id: 'e20', date: '2026-05-24', amount: 200,   cat: 'epargne',    sub: 'Projet',     desc: 'Vacances Grèce' },
  { id: 'e21', date: '2026-05-25', amount: 91.10, cat: 'essentiels', sub: 'Courses',    desc: 'Grand Frais' },
  { id: 'e22', date: '2026-05-28', amount: 13.49, cat: 'loisirs',    sub: 'Abonnement', desc: 'Netflix' },

  // ---- Avril 2026 (clôturé) ----
  { id: 'e23', date: '2026-04-01', amount: 800,   cat: 'essentiels', sub: 'Logement',   desc: 'Loyer',          rec: true },
  { id: 'e24', date: '2026-04-03', amount: 82.40, cat: 'essentiels', sub: 'Courses',    desc: 'Auchan' },
  { id: 'e25', date: '2026-04-05', amount: 41.20, cat: 'loisirs',    sub: 'Restaurant', desc: 'Pizzeria' },
  { id: 'e26', date: '2026-04-06', amount: 61.30, cat: 'essentiels', sub: 'Énergie',    desc: 'Électricité',    rec: true },
  { id: 'e27', date: '2026-04-09', amount: 86.40, cat: 'essentiels', sub: 'Transport',  desc: 'Navigo' },
  { id: 'e28', date: '2026-04-11', amount: 78.00, cat: 'loisirs',    sub: 'Shopping',   desc: 'H&M' },
  { id: 'e29', date: '2026-04-13', amount: 70.15, cat: 'essentiels', sub: 'Courses',    desc: 'Carrefour' },
  { id: 'e30', date: '2026-04-14', amount: 240,   cat: 'epargne',    sub: 'Projet',     desc: 'Vacances Grèce' },
  { id: 'e31', date: '2026-04-15', amount: 89.00, cat: 'essentiels', sub: 'Santé',      desc: 'Mutuelle' },
  { id: 'e32', date: '2026-04-16', amount: 400,   cat: 'epargne',    sub: 'Virement',   desc: 'Virement épargne' },
  { id: 'e33', date: '2026-04-20', amount: 19.99, cat: 'essentiels', sub: 'Téléphone',  desc: 'Orange' },
  { id: 'e34', date: '2026-04-23', amount: 88.60, cat: 'essentiels', sub: 'Courses',    desc: 'Grand Frais' },
  { id: 'e35', date: '2026-04-26', amount: 28.50, cat: 'loisirs',    sub: 'Sorties',    desc: 'Le Perchoir' },
  { id: 'e36', date: '2026-04-28', amount: 119.00,cat: 'loisirs',    sub: 'Sorties',    desc: 'Concert Olympia' },
];

// ---- Récurrentes -------------------------------------------
const RECURRING = [
  { id: 'r1', label: 'Loyer',         amount: 800, cat: 'essentiels', freq: 'Mensuel',     type: 'Fixe',     anchor: 1,  active: true },
  { id: 'r2', label: 'Électricité',   amount: 60,  cat: 'essentiels', freq: 'Mensuel',     type: 'Variable', anchor: 7,  active: true, pending: true },
  { id: 'r3', label: 'Assurance auto',amount: 480, cat: 'essentiels', freq: 'Annuel',      type: 'Fixe',     anchor: 5,  active: true },
  { id: 'r4', label: 'Abonnement Netflix', amount: 13.49, cat: 'loisirs', freq: 'Mensuel', type: 'Fixe',     anchor: 28, active: true },
];

// ---- Budgets / projets -------------------------------------
const BUDGETS = [
  { id: 'b1', name: 'Vacances Grèce',  target: 1200, saved: 740,  due: '2026-08-15', cat: 'epargne' },
  { id: 'b2', name: "Fonds d'urgence", target: 3000, saved: 1200, due: null,         cat: 'epargne' },
];

// ---- Résumé annuel (pour les graphiques) -------------------
// dépenses par catégorie + entrées, jan→juin 2026
const YEAR_SUMMARY = [
  { month: '2026-01', label: 'Jan', essentiels: 1180, loisirs: 360, epargne: 600, income: 2500 },
  { month: '2026-02', label: 'Fév', essentiels: 1240, loisirs: 410, epargne: 600, income: 2500 },
  { month: '2026-03', label: 'Mar', essentiels: 1210, loisirs: 290, epargne: 550, income: 2500 },
  { month: '2026-04', label: 'Avr', essentiels: 1297.84, loisirs: 266.70, epargne: 640, income: 2500 },
  { month: '2026-05', label: 'Mai', essentiels: 1679.49, loisirs: 147.39, epargne: 600, income: 2500 },
  { month: '2026-06', label: 'Juin',essentiels: 1022.80, loisirs: 62.20,  epargne: 400, income: 2800 },
];

// ============================================================
// Formatters FR
// ============================================================
function fmtEUR(n, opts = {}) {
  const whole = Math.abs(n % 1) < 0.005;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: opts.decimals != null ? opts.decimals : (whole ? 0 : 2),
    maximumFractionDigits: opts.decimals != null ? opts.decimals : 2,
  }).format(n);
}
function fmtNum(n) {
  const whole = Math.abs(n % 1) < 0.005;
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 }).format(n);
}
function fmtSigned(n) {
  const s = n >= 0 ? '+' : '−';
  return s + ' ' + fmtEUR(Math.abs(n));
}
function fmtDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
const MONTH_NAMES = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const DAY_NAMES = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}
function monthShort(key) {
  const [, m] = key.split('-').map(Number);
  return MONTH_NAMES[m - 1].slice(0, 1).toUpperCase() + MONTH_NAMES[m - 1].slice(1, 3) + '.';
}
function dayLabel(iso) {
  const dt = new Date(iso + 'T12:00:00');
  const [y, m, d] = iso.split('-').map(Number);
  return `${DAY_NAMES[dt.getDay()]} ${d} ${MONTH_NAMES[m - 1]}`;
}

// ============================================================
// Logique métier
// ============================================================
const NAV_MONTHS = ['2026-04', '2026-05', '2026-06']; // mois navigables (détaillés)

function expensesForMonth(key, list = EXPENSES) {
  return list.filter(e => e.date.slice(0, 7) === key);
}
function incomeForMonth(key) {
  return INCOMES.filter(i => i.month === key).reduce((s, i) => s + i.amount, 0);
}
function catTotals(expList) {
  const t = { essentiels: 0, loisirs: 0, epargne: 0 };
  expList.forEach(e => { t[e.cat] += e.amount; });
  return t;
}

// Chaîne de report : report(prev) + entrées - dépenses
function computeMonth(key, list = EXPENSES) {
  const idx = NAV_MONTHS.indexOf(key);
  let carryIn = CARRY_BEFORE_APRIL;
  for (let i = 0; i < idx; i++) {
    const k = NAV_MONTHS[i];
    const inc = incomeForMonth(k);
    const sp = expensesForMonth(k, list).reduce((s, e) => s + e.amount, 0);
    carryIn = carryIn + inc - sp;
  }
  const income = incomeForMonth(key);
  const exps = expensesForMonth(key, list);
  const spent = exps.reduce((s, e) => s + e.amount, 0);
  const base = income + carryIn;          // base 50/30/20
  const solde = base - spent;             // report courant (centre du donut)
  const spentByCat = catTotals(exps);
  const envelopes = {
    essentiels: base * 0.5,
    loisirs: base * 0.3,
    epargne: base * 0.2,
  };
  return { key, income, carryIn, base, spent, solde, spentByCat, envelopes, exps,
           isCurrent: key === CURRENT_MONTH,
           isPast: NAV_MONTHS.indexOf(key) < NAV_MONTHS.indexOf(CURRENT_MONTH) };
}

// Comparaison « même période » mois précédent (jamais alarmante)
function comparePrev(key, list = EXPENSES) {
  const idx = NAV_MONTHS.indexOf(key);
  if (idx <= 0) return null;
  const prev = NAV_MONTHS[idx - 1];
  const curExps = expensesForMonth(key, list);
  const maxDay = curExps.reduce((m, e) => Math.max(m, +e.date.slice(8)), 0) || 31;
  const sumTo = (k) => expensesForMonth(k, list).filter(e => +e.date.slice(8) <= maxDay).reduce((s, e) => s + e.amount, 0);
  const cur = sumTo(key), pre = sumTo(prev);
  if (pre === 0) return null;
  const pct = Math.round(((cur - pre) / pre) * 100);
  return { pct, prevLabel: MONTH_NAMES[+prev.slice(5) - 1] };
}

function pendingRecurring() {
  return RECURRING.filter(r => r.active && r.pending);
}

Object.assign(window, {
  CURRENT_MONTH, NAV_MONTHS, CATEGORIES, CAT_ORDER,
  INCOMES, EXPENSES, RECURRING, BUDGETS, YEAR_SUMMARY,
  fmtEUR, fmtNum, fmtSigned, fmtDate, monthLabel, monthShort, dayLabel,
  MONTH_NAMES, DAY_NAMES,
  expensesForMonth, incomeForMonth, catTotals, computeMonth, comparePrev, pendingRecurring,
});
