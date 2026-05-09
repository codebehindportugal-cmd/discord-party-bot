"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["#5865f2", "#34d399", "#f8c14a", "#fb7185"];

export function EarningsChart({ data }: { data: Array<{ week: string; gold: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid stroke="#253044" strokeDasharray="4 4" />
        <XAxis dataKey="week" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip contentStyle={{ background: "#101624", border: "1px solid #253044", borderRadius: 8 }} />
        <Line type="monotone" dataKey="gold" stroke="#5865f2" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PlayerActivityChart({ data }: { data: Array<{ name: string; minutes: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid stroke="#253044" strokeDasharray="4 4" />
        <XAxis dataKey="name" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip contentStyle={{ background: "#101624", border: "1px solid #253044", borderRadius: 8 }} />
        <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SplitPieChart({ data }: { data: Array<{ player: string; percentage: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Tooltip contentStyle={{ background: "#101624", border: "1px solid #253044", borderRadius: 8 }} />
        <Pie data={data} dataKey="percentage" nameKey="player" innerRadius={56} outerRadius={96} paddingAngle={3}>
          {data.map((_, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
