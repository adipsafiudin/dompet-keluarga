"use client";

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatRupiah } from "@/lib/utils";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

interface MonthlyAmount {
  month: number; // 1-12
  amount: number;
}

interface CategoryYearChartProps {
  data: MonthlyAmount[];
  color: string;
  height?: number;
}

export default function CategoryYearChart({
  data,
  color,
  height = 80,
}: CategoryYearChartProps) {
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const found = data.find((d) => d.month === i + 1);
    return { month: MONTH_SHORT[i], amount: found?.amount ?? 0 };
  });

  const max = Math.max(...chartData.map((d) => d.amount), 1);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 2, left: 2, bottom: 0 }}
          barSize={14}
        >
          <XAxis
            dataKey="month"
            tick={{ fontSize: 9, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "transparent" }}
            formatter={(value) => [formatRupiah(Number(value)), "Jumlah"]}
            contentStyle={{
              borderRadius: "10px",
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              fontSize: "11px",
            }}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.amount > 0 ? color : "#F3F4F6"}
                fillOpacity={entry.amount === max ? 1 : 0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
