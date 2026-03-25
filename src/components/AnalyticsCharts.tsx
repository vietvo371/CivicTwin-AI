'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const tooltipStyle = {
  contentStyle: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
  labelStyle: { fontWeight: 'bold' as const, color: 'var(--foreground)', marginBottom: '4px' },
  itemStyle: { color: 'var(--foreground)', fontSize: '13px' },
  cursor: { fill: 'var(--muted)', opacity: 0.4 }
};

/**
 * Hook to get container width, bypassing Next.js server-rendering and flexbox parent issues
 */
function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });

    observer.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });

    return () => observer.disconnect();
  }, [ref]);

  return size;
}

interface TimelineChartProps {
  data: { date: string; count: number }[];
  label: string;
}
export function TimelineChart({ data, label }: TimelineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useContainerSize(containerRef);

  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground text-center py-12">No data</p>;

  // Pad data if there's only 1 point so AreaChart can actually draw an area line
  let chartData = [...data];
  if (chartData.length === 1) {
    const d = new Date(chartData[0].date);
    const subDays = (date: Date, days: number) => {
      const result = new Date(date);
      result.setDate(result.getDate() - days);
      return result.toISOString().split('T')[0];
    };
    chartData = [
      { date: subDays(d, 2), count: 0 },
      { date: subDays(d, 1), count: 0 },
      chartData[0],
      { date: subDays(d, -1), count: 0 }, // pad tomorrow
    ];
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: 260, minHeight: 260 }}>
      {width > 0 && (
        <AreaChart width={Math.floor(width)} height={260} data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradTimeline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickMargin={10} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} tickMargin={10} />
          <Tooltip {...tooltipStyle} />
          <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#gradTimeline)" name={label} activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} />
        </AreaChart>
      )}
    </div>
  );
}

interface SeverityPieProps {
  data: { name: string; value: number; color: string }[];
}
export function SeverityPieChart({ data }: SeverityPieProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useContainerSize(containerRef);

  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground text-center py-12">No data</p>;

  return (
    <div ref={containerRef} style={{ width: '100%', height: 260, minHeight: 260 }}>
      {width > 0 && (
        <BarChart width={Math.floor(width)} height={260} data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickMargin={10} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} tickMargin={10} />
          <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--muted)', opacity: 0.2 }} />
          <Bar dataKey="value" name="Sự cố" radius={[6, 6, 0, 0]} maxBarSize={48} minPointSize={0}>
            {data.map((e, i) => <Cell key={`cell-${i}`} fill={e.color} />)}
          </Bar>
        </BarChart>
      )}
    </div>
  );
}

const DENSITY_COLORS = ['#10b981', '#22d3ee', '#eab308', '#f97316', '#f43f5e'];

interface DensityHistogramProps {
  data: { range: string; count: number }[];
  label: string;
}
export function DensityHistogram({ data, label }: DensityHistogramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useContainerSize(containerRef);

  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground text-center py-12">No data</p>;
  return (
    <div ref={containerRef} style={{ width: '100%', height: 240, minHeight: 240 }}>
      {width > 0 && (
        <BarChart width={Math.floor(width)} height={240} data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
          <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickMargin={10} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} tickMargin={10} />
          <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--muted)', opacity: 0.2 }} />
          <Bar dataKey="count" name={label} radius={[6, 6, 0, 0]} maxBarSize={48} minPointSize={0}>
            {data.map((_, i) => <Cell key={`cell-${i}`} fill={DENSITY_COLORS[i % DENSITY_COLORS.length]} />)}
          </Bar>
        </BarChart>
      )}
    </div>
  );
}

interface TypeBarProps {
  data: { name: string; value: number; fill: string }[];
  label: string;
}
export function TypeBarChart({ data, label }: TypeBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useContainerSize(containerRef);

  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground text-center py-12">No data</p>;
  return (
    <div ref={containerRef} style={{ width: '100%', height: 240, minHeight: 240 }}>
      {width > 0 && (
        <BarChart width={Math.floor(width)} height={240} data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickMargin={10} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} tickMargin={10} />
          <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--muted)', opacity: 0.2 }} />
          <Bar dataKey="value" name={label} radius={[6, 6, 0, 0]} maxBarSize={48} minPointSize={0}>
            {data.map((e, i) => <Cell key={`type-cell-${i}`} fill={e.fill} />)}
          </Bar>
        </BarChart>
      )}
    </div>
  );
}
