/**
 * SymptomTrendChart
 * --------------------------------------------------------------------------
 * A recharts line chart of the user's discomfort over time, built from
 * analyzeTrends().series (lib/symptomTrends). Shows the noisy daily average
 * plus the smoothed 7-day rolling line so "am I getting better?" is obvious.
 *
 *   const { trends } = useInsights({ meals });
 *   <SymptomTrendChart report={trends} isUrdu={isUrdu} />
 *
 * recharts is already a project dependency.
 */
import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { TrendReport } from '@/lib/symptomTrends';

export interface SymptomTrendChartProps {
  report: TrendReport;
  isUrdu?: boolean;
  height?: number;
  className?: string;
}

function shortDate(key: string): string {
  // key is YYYY-MM-DD -> MM/DD
  const [, m, d] = key.split('-');
  return `${m}/${d}`;
}

export function SymptomTrendChart({
  report,
  isUrdu = false,
  height = 220,
  className = '',
}: SymptomTrendChartProps) {
  if (!report.series.length) {
    return (
      <div
        className={`flex h-40 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground ${className}`}
        dir="auto"
      >
        {isUrdu ? 'Abhi chart ke liye kafi data nahi' : 'Not enough data for a chart yet'}
      </div>
    );
  }

  const data = report.series.map((p) => ({
    date: shortDate(p.date),
    daily: p.count > 0 ? p.avg_score : null,
    rolling: p.rolling7,
  }));

  const wow = report.week_over_week;
  const trendLabel =
    wow.direction === 'improving'
      ? isUrdu ? 'Behtar ho raha hai' : 'Improving'
      : wow.direction === 'worsening'
      ? isUrdu ? 'Kharab ho raha hai' : 'Worsening'
      : wow.direction === 'flat'
      ? isUrdu ? 'Stable' : 'Stable'
      : '';

  return (
    <div className={`rounded-xl border border-border bg-card p-4 shadow-soft ${className}`} dir="auto">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {isUrdu ? 'Takleef ka rujhan' : 'Discomfort trend'}
        </h3>
        {trendLabel && (
          <span
            className={`text-xs font-medium ${
              wow.direction === 'improving'
                ? 'text-green-600'
                : wow.direction === 'worsening'
                ? 'text-red-600'
                : 'text-muted-foreground'
            }`}
          >
            {trendLabel}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
          <Tooltip
            contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid hsl(var(--border))' }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Line
            type="monotone"
            dataKey="daily"
            name={isUrdu ? 'Rozana' : 'Daily'}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            dot={false}
            connectNulls
            opacity={0.5}
          />
          <Line
            type="monotone"
            dataKey="rolling"
            name={isUrdu ? '7-din avg' : '7-day avg'}
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SymptomTrendChart;
