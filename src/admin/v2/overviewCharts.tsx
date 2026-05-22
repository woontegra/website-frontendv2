import type { DashboardDailyPoint } from '@/lib/adminAnalytics';

type ChartProps = {
  data: DashboardDailyPoint[];
  dataKey: keyof Pick<
    DashboardDailyPoint,
    'pageViews' | 'demoRequests' | 'users' | 'payments' | 'revenue'
  >;
  color: string;
  height?: number;
  formatValue?: (n: number) => string;
  /** Overview dashboard — küçük eksen ve sabit yükseklik */
  compact?: boolean;
};

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr.slice(5, 10);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function OverviewDailyChart({
  data,
  dataKey,
  color,
  height,
  formatValue = (n) => String(n),
  compact = false,
}: ChartProps) {
  const chartHeight = height ?? (compact ? 200 : 220);
  const padding = compact
    ? { top: 8, right: 6, bottom: 18, left: 30 }
    : { top: 12, right: 8, bottom: 28, left: 44 };
  const w = 560;
  const axisClass = compact ? 'fill-[#8a9aaa] text-[8px]' : 'fill-[#8a9aaa] text-[9px]';
  const strokeW = compact ? 1.5 : 2;
  const innerW = w - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const points = data.length > 0 ? data : [];
  const values = points.map((p) => p[dataKey] as number);
  const hasAnyValue = values.some((v) => v > 0);

  if (points.length === 0 || !hasAnyValue) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-[#dbe4ea] bg-[#fafbfc] px-3 py-2 text-[11px] text-[#8a9aaa]">
        Bu dönem için henüz veri yok
      </div>
    );
  }

  const max = Math.max(1, ...values);

  const coords = points.map((p, i) => {
    const x =
      padding.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = padding.top + innerH - ((p[dataKey] as number) / max) * innerH;
    return { x, y, raw: p };
  });

  const linePath =
    coords.length > 0
      ? coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
      : '';

  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${padding.top + innerH} L ${coords[0].x} ${padding.top + innerH} Z`
      : '';

  const yTicks = [0, 0.5, 1].map((t) => ({
    y: padding.top + innerH - t * innerH,
    label: formatValue(Math.round(max * t)),
  }));

  const xStep = Math.max(1, Math.floor(points.length / 6));

  return (
    <svg
      viewBox={`0 0 ${w} ${chartHeight}`}
      className={compact ? 'h-[200px] max-h-[220px] w-full' : 'h-auto w-full'}
      role="img"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      {yTicks.map((tick) => (
        <g key={tick.label}>
          <line
            x1={padding.left}
            y1={tick.y}
            x2={w - padding.right}
            y2={tick.y}
            stroke="#e8eef2"
            strokeWidth="1"
          />
          <text x={3} y={tick.y + 3} className={axisClass}>
            {tick.label}
          </text>
        </g>
      ))}
      {areaPath && <path d={areaPath} fill={color} fillOpacity={0.2} />}
      {linePath && (
        <path d={linePath} fill="none" stroke={color} strokeWidth={strokeW} strokeLinejoin="round" />
      )}
      {coords.map((c, i) =>
        i % xStep === 0 || i === coords.length - 1 ? (
          <text
            key={c.raw.date}
            x={c.x}
            y={chartHeight - (compact ? 5 : 6)}
            textAnchor="middle"
            className={axisClass}
          >
            {formatDayLabel(c.raw.date)}
          </text>
        ) : null,
      )}
    </svg>
  );
}
