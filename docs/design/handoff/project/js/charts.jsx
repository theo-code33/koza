// ============================================================
// kōza · graphiques SVG (faits main, calmes & sans dépendance)
// ============================================================

// ---- helpers géométrie -------------------------------------
function polar(cx, cy, r, deg) {
  const a = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
function arcPath(cx, cy, r, start, end) {
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

// Courbe lissée (Catmull-Rom -> Bézier), façon "monotone"
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

// ============================================================
// Donut 50/30/20 — trait fin, centre vide (solde)
// ============================================================
function Donut({ size = 220, stroke = 8, segments, center, gap = 3 }) {
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let cursor = 0;
  const arcs = segments.map((seg, i) => {
    const frac = seg.value / total;
    const start = cursor * 360 + gap / 2;
    const end = (cursor + frac) * 360 - gap / 2;
    cursor += frac;
    return { ...seg, start, end, key: i };
  });
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(0deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-alt)" strokeWidth={stroke} />
        {arcs.map(a => (
          <path key={a.key} d={arcPath(cx, cy, r, a.start, a.end)} fill="none"
            stroke={a.color} strokeWidth={stroke} strokeLinecap="round"
            style={{ transition: 'stroke .4s ease' }} />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center px-3">
        {center}
      </div>
    </div>
  );
}

// ============================================================
// Tendances — lignes monotones, sans grille, axes minimaux
// ============================================================
function LineTrend({ data, series, height = 200, yPad = 1.12 }) {
  const ref = useRef(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(es => setW(es[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const padL = 8, padR = 8, padT = 16, padB = 28;
  const innerW = w - padL - padR;
  const innerH = height - padT - padB;
  const maxV = Math.max(...series.flatMap(s => data.map(d => d[s.key]))) * yPad || 1;
  const x = i => padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = v => padT + innerH - (v / maxV) * innerH;

  return (
    <div ref={ref} className="w-full">
      <svg width={w} height={height} style={{ display: 'block', overflow: 'visible' }}>
        {series.map(s => {
          const pts = data.map((d, i) => [x(i), y(d[s.key])]);
          return (
            <g key={s.key}>
              <path d={smoothPath(pts)} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
              {pts.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r={2.6} fill="var(--surface)" stroke={s.color} strokeWidth={1.6} />
              ))}
            </g>
          );
        })}
        {data.map((d, i) => (
          <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="Inter">{d.label}</text>
        ))}
      </svg>
    </div>
  );
}

// ============================================================
// Aire douce — progression de l'épargne (cumulée)
// ============================================================
function AreaSavings({ data, color = 'var(--epargne)', height = 180 }) {
  const ref = useRef(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(es => setW(es[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const padL = 8, padR = 8, padT = 18, padB = 28;
  const innerW = w - padL - padR, innerH = height - padT - padB;
  const maxV = Math.max(...data.map(d => d.value)) * 1.1 || 1;
  const x = i => padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = v => padT + innerH - (v / maxV) * innerH;
  const pts = data.map((d, i) => [x(i), y(d.value)]);
  const line = smoothPath(pts);
  const area = `${line} L ${x(data.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`;
  const gid = useMemo(() => 'g' + Math.random().toString(36).slice(2, 8), []);
  return (
    <div ref={ref} className="w-full">
      <svg width={w} height={height} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.20" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={2.6} fill="var(--surface)" stroke={color} strokeWidth={1.6} />
        ))}
        {data.map((d, i) => (
          <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="Inter">{d.label}</text>
        ))}
      </svg>
    </div>
  );
}

// ============================================================
// Barre empilée horizontale — répartition de l'année
// ============================================================
function StackedBar({ segments, height = 14 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="w-full flex rounded-full overflow-hidden" style={{ height, gap: 2 }}>
      {segments.map((s, i) => (
        <div key={i} style={{ width: `${(s.value / total) * 100}%`, background: s.color, transition: 'width .6s ease' }} />
      ))}
    </div>
  );
}

Object.assign(window, { Donut, LineTrend, AreaSavings, StackedBar, smoothPath });
