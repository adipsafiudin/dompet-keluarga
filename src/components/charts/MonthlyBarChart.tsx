"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatRupiah } from "@/lib/utils";
import type { DailyData } from "@/types";

interface MonthlyBarChartProps {
  data: DailyData[];
}

export default function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    day: parseInt(d.date.split("-")[2]),
  }));

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 1000000
                ? `${v / 1000000}jt`
                : v >= 1000
                  ? `${v / 1000}rb`
                  : v
            }
          />
          <Tooltip
            formatter={(value, name) => [
              formatRupiah(Number(value)),
              name === "income" ? "Pemasukan" : "Pengeluaran",
            ]}
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              fontSize: "12px",
            }}
          />
          <Bar
            dataKey="income"
            fill="#10B981"
            radius={[2, 2, 0, 0]}
            maxBarSize={12}
          />
          <Bar
            dataKey="expense"
            fill="#EF4444"
            radius={[2, 2, 0, 0]}
            maxBarSize={12}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
