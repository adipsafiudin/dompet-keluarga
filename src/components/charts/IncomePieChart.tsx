"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatRupiah } from "@/lib/utils";
import type { IncomeSourceSummary } from "@/types";

interface IncomePieChartProps {
  data: IncomeSourceSummary[];
}

export default function IncomePieChart({ data }: IncomePieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
        Tidak ada pemasukan
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.income_source?.name || "Lainnya",
    value: d.total,
    color: d.income_source?.color || "#6B7280",
    percentage: d.percentage,
  }));

  return (
    <div>
      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatRupiah(Number(value))}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 px-4 mt-2">
        {chartData.map((entry, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-gray-600">
              {entry.name} ({Math.round(entry.percentage)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
