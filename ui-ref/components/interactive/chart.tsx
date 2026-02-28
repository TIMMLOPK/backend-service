"use client"

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { ChartProps } from "@/lib/types"

const CHART_COLORS = [
  "hsl(var(--primary))",
  "#60a5fa",
  "#34d399",
  "#f59e0b",
  "#f87171",
  "#a78bfa",
]

export function ChartComponent({ props }: { props: ChartProps }) {
  const xKey = props.axes?.x ?? Object.keys(props.data[0] ?? {})[0] ?? "x"
  const yKey = props.axes?.y ?? Object.keys(props.data[0] ?? {})[1] ?? "y"

  return (
    <div className="my-6 rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-sm font-semibold mb-4 text-center">{props.title}</p>
      <ResponsiveContainer width="100%" height={260}>
        {props.chart_type === "bar" ? (
          <BarChart data={props.data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            <Bar dataKey={yKey} radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
          </BarChart>
        ) : props.chart_type === "line" ? (
          <LineChart data={props.data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        ) : props.chart_type === "pie" ? (
          <PieChart>
            <Pie
              data={props.data}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {props.data.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            <Legend />
          </PieChart>
        ) : (
          <ScatterChart margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis dataKey={yKey} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            <Scatter data={props.data} fill="hsl(var(--primary))" />
          </ScatterChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
