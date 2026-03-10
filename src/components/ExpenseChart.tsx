import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { formatUSD, categoryLabels } from "../lib/utils";
import { TrendingUp, Activity, Flame } from "lucide-react";

const COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#6366f1",
];

interface ExpenseChartProps {
  period: "week" | "month";
}

interface CategoryData {
  count: number;
  gasSpent: number;
}

export function ExpenseChart({ period }: ExpenseChartProps) {
  const stats = useQuery(api.transactions.getStats, { period });

  if (stats === undefined) {
    return (
      <Card className="border-zinc-800/50 animate-pulse">
        <CardContent className="p-6">
          <div className="h-64 bg-zinc-800/50 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalTransactions === 0) {
    return (
      <Card className="border-zinc-800/50">
        <CardContent className="p-6">
          <div className="text-center py-12 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-800/50 flex items-center justify-center">
              <Activity className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400">No transaction data yet</p>
            <p className="text-zinc-500 text-sm">
              Connect a wallet and fetch transactions to see your charts
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pieData = Object.entries(stats.categoryBreakdown).map(
    ([category, data]) => {
      const typedData = data as CategoryData;
      return {
        name: categoryLabels[category] || category,
        value: typedData.count,
        gasSpent: typedData.gasSpent,
      };
    }
  );

  const customTooltipFormatter = (value: unknown) => {
    const numValue = typeof value === "number" ? value : 0;
    return [formatUSD(numValue), ""];
  };

  const pieTooltipFormatter = (value: unknown, name: unknown) => {
    const numValue = typeof value === "number" ? value : 0;
    const strName = typeof name === "string" ? name : "";
    return [`${numValue} transactions`, strName];
  };

  const barTooltipFormatter = (value: unknown) => {
    const numValue = typeof value === "number" ? value : 0;
    return [`${numValue} transactions`, ""];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Main Stats */}
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-zinc-800/50 bg-gradient-to-br from-violet-950/50 to-zinc-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Transactions</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stats.totalTransactions}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/50 bg-gradient-to-br from-orange-950/50 to-zinc-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Gas Spent</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatUSD(stats.totalGasSpent)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-600/20 flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/50 bg-gradient-to-br from-emerald-950/50 to-zinc-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Volume</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatUSD(stats.totalValue)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Area Chart */}
      <Card className="border-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            Spending Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#52525b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#52525b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "12px",
                    padding: "12px",
                  }}
                  labelStyle={{ color: "#a1a1aa" }}
                  formatter={customTooltipFormatter}
                />
                <Area
                  type="monotone"
                  dataKey="gas"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#gasGradient)"
                  name="Gas"
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#valueGradient)"
                  name="Volume"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="border-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            Transaction Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={3}
                  dataKey="value"
                  stroke="transparent"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "12px",
                    padding: "12px",
                  }}
                  formatter={pieTooltipFormatter}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {pieData.map((entry, index) => (
              <div
                key={entry.name}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 text-xs"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-zinc-300">{entry.name}</span>
                <span className="text-zinc-500">{entry.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Transaction Count */}
      <Card className="border-zinc-800/50 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Daily Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <XAxis
                  dataKey="date"
                  stroke="#52525b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#52525b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "12px",
                    padding: "12px",
                  }}
                  labelStyle={{ color: "#a1a1aa" }}
                  formatter={barTooltipFormatter}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
