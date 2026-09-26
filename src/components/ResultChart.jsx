import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart, ReferenceLine, ReferenceDot } from 'recharts';

/**
 * ResultChart — thin wrapper around recharts with consistent VBOI styling.
 * type: 'line' | 'area'
 */
const ResultChart = ({
  data,
  xKey = 'x',
  series = [],
  height = 280,
  type = 'line',
  xLabel,
  yLabel,
  refLines = [],
  refDots = [],
  domainY,
  testId,
}) => {
  const ChartComp = type === 'area' ? AreaChart : LineChart;
  const SeriesComp = type === 'area' ? Area : Line;

  return (
    <div data-testid={testId} className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ChartComp data={data} margin={{ top: 8, right: 12, left: 4, bottom: 22 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
          <XAxis
            dataKey={xKey}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -8, style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontFamily: 'IBM Plex Mono' } } : undefined}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            domain={domainY}
            label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontFamily: 'IBM Plex Mono' } } : undefined}
          />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              fontFamily: 'IBM Plex Mono',
              fontSize: 12,
            }}
          />
          {series.length > 1 && (
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
          )}
          {refLines.map((r, i) => (
            <ReferenceLine key={`rl-${i}`} {...r} stroke={r.stroke || 'hsl(var(--accent))'} strokeDasharray="4 4" />
          ))}
          {refDots.map((d, i) => (
            <ReferenceDot key={`rd-${i}`} {...d} r={d.r || 4} fill={d.fill || 'hsl(var(--accent))'} stroke="white" strokeWidth={1.5} />
          ))}
          {series.map((s) => (
            <SeriesComp
              key={s.key}
              type={s.smooth === false ? 'linear' : 'monotone'}
              dataKey={s.key}
              stroke={s.color || 'hsl(var(--primary))'}
              fill={type === 'area' ? (s.fill || s.color || 'hsl(var(--primary))') : undefined}
              fillOpacity={type === 'area' ? (s.fillOpacity ?? 0.18) : undefined}
              strokeWidth={s.strokeWidth || 2}
              dot={false}
              name={s.name || s.key}
              isAnimationActive={false}
            />
          ))}
        </ChartComp>
      </ResponsiveContainer>
    </div>
  );
};

export default ResultChart;
