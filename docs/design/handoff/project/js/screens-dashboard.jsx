// ============================================================
// kōza · Dashboard mensuel + annuel
// ============================================================

function CategoryCard({ cat, spent, envelope }) {
  const c = CATEGORIES[cat];
  const ratio = envelope > 0 ? spent / envelope : 0;
  const over = ratio > 1;
  const pct = Math.round(ratio * 100);
  return (
    <div className="rounded-card p-5" style={{ background: c.bg }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CatDot cat={cat} />
          <span className="text-[14px] font-medium" style={{ color: 'var(--ink)' }}>{c.label}</span>
        </div>
        <span className="text-[13px] num" style={{ color: over ? 'var(--over)' : 'var(--secondary)' }}>{pct} %</span>
      </div>
      <div className="num font-light leading-none mb-1" style={{ fontSize: 28, color: 'var(--ink)' }}>{fmtEUR(spent)}</div>
      <div className="text-[12px] num mb-4" style={{ color: 'var(--secondary)' }}>sur {fmtEUR(envelope)}</div>
      <ProgressBar value={spent} max={envelope} color={c.color} />
    </div>
  );
}

function MonthlyDashboard({ month, setMonth, openAdd, expenses }) {
  const m = computeMonth(month, expenses);
  const cmp = comparePrev(month, expenses);
  const pend = pendingRecurring();
  const idx = NAV_MONTHS.indexOf(month);

  const donutSegments = CAT_ORDER.map(c => ({ value: m.envelopes[c], color: CATEGORIES[c].color }));

  return (
    <div className="screen-enter flex flex-col gap-7">
      {/* En-tête mois */}
      <MonthNav
        month={month}
        canPrev={idx > 0}
        canNext={idx < NAV_MONTHS.length - 1}
        onPrev={() => setMonth(NAV_MONTHS[Math.max(0, idx - 1)])}
        onNext={() => setMonth(NAV_MONTHS[Math.min(NAV_MONTHS.length - 1, idx + 1)])}
        subtitle={m.isPast ? 'Mois clôturé · lecture seule' : 'En cours'}
      />

      {/* Entrées du mois */}
      <div className="text-center">
        <div className="text-[13px]" style={{ color: 'var(--secondary)' }}>Entrées du mois</div>
        <div className="num font-light mt-1" style={{ fontSize: 22 }}>{fmtEUR(m.income)}</div>
      </div>

      {/* Donut + solde */}
      <div className="flex flex-col items-center">
        <Donut
          size={248} stroke={8} segments={donutSegments}
          center={
            <div>
              <div className="text-[12px] tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '.08em' }}>Solde</div>
              <div className="num font-light leading-none mt-1.5" style={{ fontSize: 40 }}>{fmtEUR(m.solde)}</div>
              <div className="text-[12px] mt-2" style={{ color: 'var(--secondary)' }}>base {fmtEUR(m.base)}</div>
            </div>
          }
        />
        {/* Légende 50/30/20 */}
        <div className="flex items-center gap-5 mt-5">
          {CAT_ORDER.map((c, i) => (
            <div key={c} className="flex items-center gap-1.5">
              <CatDot cat={c} size={7} />
              <span className="text-[12px]" style={{ color: 'var(--secondary)' }}>{[50,30,20][i]} %</span>
            </div>
          ))}
        </div>
      </div>

      {/* Report du mois dernier */}
      <div className="flex items-center justify-center gap-2 -mt-1 text-[13px]" style={{ color: 'var(--secondary)' }}>
        <Icon name="CornerUpRight" size={15} style={{ color: 'var(--muted)' }} />
        <span>Report du mois dernier · <span className="num" style={{ color: 'var(--accent)' }}>{fmtSigned(m.carryIn)}</span></span>
      </div>

      {/* Bannière à confirmer */}
      {pend.length > 0 && !m.isPast && (
        <SoftBanner icon="Clock3" tone="warning" action="Confirmer" onAction={openAdd}>
          <span><span className="num">{pend.length}</span> récurrente variable à confirmer ce mois — <span style={{ color: 'var(--secondary)' }}>{pend.map(p => p.label).join(', ')}</span></span>
        </SoftBanner>
      )}

      {/* Cartes catégories */}
      <div className="grid gap-3 sm:grid-cols-3">
        {CAT_ORDER.map(c => (
          <CategoryCard key={c} cat={c} spent={m.spentByCat[c]} envelope={m.envelopes[c]} />
        ))}
      </div>

      {/* Comparaison + ajout rapide */}
      <div className="flex items-center justify-between">
        {cmp ? (
          <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--secondary)' }}>
            <Icon name={cmp.pct <= 0 ? 'TrendingDown' : 'TrendingUp'} size={16} style={{ color: cmp.pct <= 0 ? 'var(--accent)' : 'var(--warning)' }} />
            <span><span className="num">{cmp.pct <= 0 ? '−' : '+'}{Math.abs(cmp.pct)} %</span> vs {cmp.prevLabel}, même période</span>
          </div>
        ) : <span />}
        {!m.isPast && <Button variant="soft" icon="Plus" onClick={openAdd}>Ajouter</Button>}
      </div>
    </div>
  );
}

// ============================================================
// Dashboard annuel
// ============================================================
function AnnualDashboard() {
  const data = YEAR_SUMMARY;
  const totals = data.reduce((a, d) => ({
    essentiels: a.essentiels + d.essentiels,
    loisirs: a.loisirs + d.loisirs,
    epargne: a.epargne + d.epargne,
  }), { essentiels: 0, loisirs: 0, epargne: 0 });
  const grand = totals.essentiels + totals.loisirs + totals.epargne;

  // épargne cumulée
  let cum = 0;
  const savings = data.map(d => { cum += d.epargne; return { label: d.label, value: cum }; });

  const trendSeries = [
    { key: 'essentiels', color: CATEGORIES.essentiels.color },
    { key: 'loisirs', color: CATEGORIES.loisirs.color },
    { key: 'epargne', color: CATEGORIES.epargne.color },
  ];

  return (
    <div className="screen-enter flex flex-col gap-7">
      <div className="text-center">
        <div className="font-serif" style={{ fontSize: 28 }}>Année 2026</div>
        <div className="text-[12px] mt-1" style={{ color: 'var(--muted)' }}>Janvier — Juin · 6 mois suivis</div>
      </div>

      {/* Répartition de l'année */}
      <Card>
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-[14px] font-medium">Répartition de l'année</span>
          <span className="num text-[13px]" style={{ color: 'var(--secondary)' }}>{fmtEUR(grand)} suivis</span>
        </div>
        <StackedBar segments={CAT_ORDER.map(c => ({ value: totals[c], color: CATEGORIES[c].color }))} />
        <div className="grid grid-cols-3 gap-3 mt-5">
          {CAT_ORDER.map(c => (
            <div key={c}>
              <div className="flex items-center gap-1.5 mb-1">
                <CatDot cat={c} size={7} />
                <span className="text-[12px]" style={{ color: 'var(--secondary)' }}>{CATEGORIES[c].label}</span>
              </div>
              <div className="num font-light" style={{ fontSize: 20 }}>{fmtEUR(totals[c])}</div>
              <div className="num text-[12px]" style={{ color: 'var(--muted)' }}>{Math.round(totals[c] / grand * 100)} %</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tendances */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[14px] font-medium">Tendances mensuelles</span>
          <div className="flex items-center gap-3">
            {CAT_ORDER.map(c => (
              <div key={c} className="flex items-center gap-1.5">
                <CatDot cat={c} size={7} />
                <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{CATEGORIES[c].label}</span>
              </div>
            ))}
          </div>
        </div>
        <LineTrend data={data} series={trendSeries} height={210} />
      </Card>

      {/* Progression épargne */}
      <Card>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[14px] font-medium">Progression de l'épargne</span>
          <span className="num text-[13px]" style={{ color: 'var(--epargne)' }}>{fmtEUR(cum)} cumulés</span>
        </div>
        <div className="text-[12px] mb-2" style={{ color: 'var(--muted)' }}>Total mis de côté depuis janvier</div>
        <AreaSavings data={savings} height={190} />
      </Card>
    </div>
  );
}

Object.assign(window, { MonthlyDashboard, AnnualDashboard, CategoryCard });
