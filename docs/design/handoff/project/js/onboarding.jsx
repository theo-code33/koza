// ============================================================
// kōza · Onboarding 3 étapes
// ============================================================

function ZenArt({ size = 200 }) {
  // illustration zen abstraite — cercles concentriques + ligne d'horizon (formes simples)
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="78" stroke="var(--essentiels)" strokeWidth="1.5" opacity="0.5" />
      <circle cx="100" cy="100" r="56" stroke="var(--loisirs)" strokeWidth="1.5" opacity="0.5" />
      <circle cx="100" cy="100" r="34" fill="var(--accent-soft)" />
      <circle cx="100" cy="100" r="34" stroke="var(--epargne)" strokeWidth="1.5" opacity="0.6" />
      <circle cx="100" cy="100" r="9" fill="var(--accent)" />
      <line x1="14" y1="148" x2="186" y2="148" stroke="var(--line)" strokeWidth="1" />
    </svg>
  );
}

function StepDots({ step, total }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className="rounded-full transition-all" style={{
          width: i === step ? 22 : 7, height: 7,
          background: i === step ? 'var(--accent)' : 'var(--surface-alt)' }} />
      ))}
    </div>
  );
}

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState('2500');
  const [source, setSource] = useState('Salaire');
  const amtRef = useRef(null);
  const base = parseFloat(income.replace(',', '.')) || 0;

  useEffect(() => { if (step === 1) { const t = setTimeout(() => amtRef.current && amtRef.current.focus(), 400); return () => clearTimeout(t); } }, [step]);

  const next = () => step < 2 ? setStep(step + 1) : onDone();

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center px-6 py-14" style={{ maxWidth: 480, margin: '0 auto' }}>

          {step === 0 && (
            <div className="screen-enter flex flex-col items-center text-center">
              <ZenArt size={210} />
              <div className="font-serif mt-10" style={{ fontSize: 52, lineHeight: 1 }}>kōza</div>
              <div className="text-[13px] mt-2" style={{ color: 'var(--muted)', letterSpacing: '.2em' }}>口座</div>
              <p className="text-[17px] mt-7 leading-relaxed" style={{ color: 'var(--secondary)', maxWidth: 320 }}>
                Voyez où va votre argent, sans pression. Une règle simple — 50/30/20 — et beaucoup de calme.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="screen-enter w-full flex flex-col items-center text-center">
              <div className="font-serif whitespace-nowrap" style={{ fontSize: 34 }}>Vos entrées</div>
              <p className="text-[15px] mt-2 mb-10" style={{ color: 'var(--secondary)' }}>Combien recevez-vous, en moyenne, chaque mois ?</p>
              <div className="flex items-end gap-1 justify-center">
                <input ref={amtRef} value={income} inputMode="decimal"
                  onChange={e => setIncome(e.target.value.replace(/[^0-9.,]/g, ''))}
                  className="num font-light text-center bg-transparent"
                  style={{ fontSize: 56, width: Math.max(3, income.length + 1) + 'ch', color: 'var(--ink)' }} />
                <span className="num font-light pb-2" style={{ fontSize: 36, color: 'var(--muted)' }}>€</span>
              </div>
              <div className="w-full mt-10 text-left">
                <Field label="Source principale">
                  <Segmented options={['Salaire', 'Indépendant', 'Autre']} value={source} onChange={setSource} className="w-full" />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="screen-enter w-full flex flex-col items-center text-center">
              <div className="grid place-items-center rounded-full mb-6" style={{ width: 64, height: 64, background: 'var(--accent-soft)' }}>
                <Icon name="Check" size={28} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="font-serif whitespace-nowrap" style={{ fontSize: 34 }}>Vos enveloppes</div>
              <p className="text-[15px] mt-2 mb-8" style={{ color: 'var(--secondary)', maxWidth: 340 }}>
                À partir de <span className="num">{fmtEUR(base)}</span>, voici votre répartition. Rien n'est figé — c'est un repère, pas une règle.
              </p>
              <div className="w-full flex flex-col gap-3">
                {CAT_ORDER.map((c, i) => {
                  const cat = CATEGORIES[c];
                  const val = base * [0.5, 0.3, 0.2][i];
                  return (
                    <div key={c} className="flex items-center gap-3 rounded-card px-5 py-4" style={{ background: cat.bg }}>
                      <CatDot cat={c} size={10} />
                      <div className="flex-1 text-left">
                        <div className="text-[14px] font-medium">{cat.label}</div>
                        <div className="text-[12px]" style={{ color: 'var(--secondary)' }}>{[50, 30, 20][i]} % de votre base</div>
                      </div>
                      <div className="num font-light" style={{ fontSize: 22 }}>{fmtEUR(val)}</div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[13px] mt-7" style={{ color: 'var(--muted)' }}>
                Les dépenses ne réduisent pas votre base. On suit, simplement.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-6 flex flex-col gap-5" style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <StepDots step={step} total={3} />
        <div className="flex items-center gap-3">
          {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Retour</Button>}
          <Button variant="primary" full onClick={next}>
            {step === 0 ? 'Commencer' : step === 1 ? 'Continuer' : "Entrer dans kōza"}
          </Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Onboarding });
