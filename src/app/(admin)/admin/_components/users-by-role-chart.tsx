"use client";

import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import type { AdminDashboardStats } from "@/types/admin";

interface UsersByRoleChartProps {
  stats: AdminDashboardStats | null;
  errorMessage?: string;
}

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 };
const SERIES_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export default function UsersByRoleChart({ stats, errorMessage }: UsersByRoleChartProps) {
  const router = useRouter();

  const data = stats
    ? [
        { role: "Tenants", count: stats.totalTenants },
        { role: "Owners", count: stats.totalOwners },
        { role: "Managers", count: stats.totalManagers },
        { role: "Admins", count: stats.totalAdmins },
      ]
    : [];
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const summary = data.map((item) => `${item.count} ${item.role.toLowerCase()}`).join(", ");

  return (
    <ChartCard
      title="Users by role"
      summary={`Users by role: ${summary}.`}
      errorMessage={errorMessage}
      onRetry={() => router.refresh()}
      isEmpty={!errorMessage && total === 0}
      emptyTitle="No users yet"
      emptyDescription="The chart appears once people sign up."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="role" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "0.75rem",
              color: "var(--foreground)",
            }}
            labelStyle={{ color: "var(--foreground)" }}
            itemStyle={{ color: "var(--foreground)" }}
          />
          <Bar dataKey="count" name="Users" radius={[6, 6, 0, 0]}>
            {data.map((item, index) => (
              <Cell key={item.role} fill={SERIES_COLORS[index % SERIES_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
