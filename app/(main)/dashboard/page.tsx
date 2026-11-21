'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/config/createClient';
import Loading from '@/components/ui/Loading/Loading';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

/* ===================== Types ===================== */

type AccountType = 'registered' | 'guest';

// Minimal row used to build the charts
interface AnalyticsLogRow {
  created_at: string;
  account_type: AccountType;
}

// Row shown in the "recent visits" table (before attaching the user name)
interface RecentLogRow {
  id: number | string;
  account_type: AccountType;
  created_at: string;
  page_path: string;
  user_id: string | null;
}

// Recent row after the user name has been attached
interface RecentLog extends RecentLogRow {
  profiles: { user_name: string | null } | null;
}

interface ProfileRow {
  id: string;
  user_name: string | null;
}

// One point in the weekly line chart
interface WeeklyPoint {
  day: string;
  visits: number;
}

// One group of bars in the monthly bar chart
interface MonthlyPoint {
  month: string;
  registered: number;
  guest: number;
}

// Tooltip types (what recharts passes to the custom tooltip)
interface TooltipEntry {
  name?: string;
  dataKey?: string | number;
  value?: number | string;
  color?: string;
  fill?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

/* ===================== Constants ===================== */

// Indexed by Date.getDay() (0 = Sunday)
const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
// Indexed by Date.getMonth() (0 = January)
const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

/* ===================== Tooltip ===================== */

// Small popup shown when hovering over a chart element
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-base-100 border border-base-300 p-2.5 rounded-lg shadow-lg text-xs text-base-content">
        {label && <p className="font-bold mb-1 border-b border-base-200 pb-1">{label}</p>}
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color || entry.fill }} className="font-semibold my-0.5">
            {`${entry.name || entry.dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ===================== Page ===================== */

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [registeredCount, setRegisteredCount] = useState<number>(0);
  const [guestCount, setGuestCount] = useState<number>(0);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);

  useEffect(() => {
    // Prevents state updates if the component unmounts before fetching finishes
    let cancelled = false;

    async function fetchData() {
      try {
        const supabase = await createClient();

        const now = new Date();
        // First day of the month, 5 months ago (gives 6 full months including the current one)
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        // 1) Run all independent queries in parallel
        const [totalRes, registeredRes, guestRes, chartLogsRes, recentRes] = await Promise.all([
          // Total number of visits (count only, no rows)
          supabase.from('analytics_log').select('*', { count: 'exact', head: true }),
          // Visits by registered users
          supabase
            .from('analytics_log')
            .select('*', { count: 'exact', head: true })
            .eq('account_type', 'registered'),
          // Visits by guests
          supabase
            .from('analytics_log')
            .select('*', { count: 'exact', head: true })
            .eq('account_type', 'guest'),
          // Rows from the last 6 months, used to build the charts
          supabase
            .from('analytics_log')
            .select('created_at, account_type')
            .gte('created_at', sixMonthsAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(1000),
          // Latest 10 visits. No join: we fetch user_id only,
          // then fetch the user names in a separate query
          supabase
            .from('analytics_log')
            .select('id, account_type, created_at, page_path, user_id')
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

        // 2) Check for errors (otherwise failures would be silent)
        const firstError =
          totalRes.error || registeredRes.error || guestRes.error || chartLogsRes.error || recentRes.error;
        if (firstError) {
          console.error('Dashboard Error:', firstError);
          if (!cancelled) setError(firstError.message);
          return;
        }

        // 3) Fetch user names for the 10 recent rows
        const rows = (recentRes.data as RecentLogRow[] | null) || [];

        // Unique, non-null user ids
        const userIds = Array.from(
          new Set(rows.map((r) => r.user_id).filter((id): id is string => Boolean(id)))
        );

        let profiles: ProfileRow[] = [];
        if (userIds.length > 0) {
          const profilesRes = await supabase
            .from('profiles')
            .select('id, user_name')
            .in('id', userIds);

          if (profilesRes.error) {
            // Do not stop the page: names will just fall back to the default label
            console.error('Profiles Error:', profilesRes.error);
          } else {
            profiles = (profilesRes.data as ProfileRow[] | null) || [];
          }
        }

        // Lookup map: user id -> user name
        const nameById = new Map<string, string | null>(
          profiles.map((p) => [p.id, p.user_name])
        );

        // Attach the user name to each recent row
        const logsWithNames: RecentLog[] = rows.map((r) => ({
          ...r,
          profiles: r.user_id ? { user_name: nameById.get(r.user_id) ?? null } : null,
        }));

        if (cancelled) return;

        setTotalVisits(totalRes.count ?? 0);
        setRegisteredCount(registeredRes.count ?? 0);
        setGuestCount(guestRes.count ?? 0);
        setRecentLogs(logsWithNames);

        // 4) Build chart data
        const logs = (chartLogsRes.data as AnalyticsLogRow[] | null) || [];

        // Last 7 days, oldest to newest, each starting at 0 visits
        const days: { key: string; day: string; visits: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          days.push({ key: d.toDateString(), day: ARABIC_DAYS[d.getDay()], visits: 0 });
        }

        // Last 6 months (year included in the key), in chronological order
        const months: { key: string; month: string; registered: number; guest: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            key: `${d.getFullYear()}-${d.getMonth()}`,
            month: MONTH_NAMES[d.getMonth()],
            registered: 0,
            guest: 0,
          });
        }

        // Count each log into its matching day and month
        logs.forEach((log) => {
          const date = new Date(log.created_at);

          const dayItem = days.find((x) => x.key === date.toDateString());
          if (dayItem) dayItem.visits += 1;

          const monthItem = months.find((x) => x.key === `${date.getFullYear()}-${date.getMonth()}`);
          if (monthItem) {
            if (log.account_type === 'registered') monthItem.registered += 1;
            else if (log.account_type === 'guest') monthItem.guest += 1;
          }
        });

        // Remove the helper "key" field before passing data to the charts
        setWeeklyData(days.map(({ day, visits }) => ({ day, visits })));
        setMonthlyData(months.map(({ month, registered, guest }) => ({ month, registered, guest })));
      } catch (err) {
        console.error('Dashboard Error:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    // Cleanup: mark as cancelled when the page is left
    return () => {
      cancelled = true;
    };
  }, []);

  // Data for the pie chart
  const pieData = [
    { name: 'حسابات مسجلة', value: registeredCount, color: '#3b82f6' },
    { name: 'ضيوف', value: guestCount, color: '#f59e0b' },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 p-6 flex items-center justify-center" dir="rtl">
        <Loading />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-base-200 p-6" dir="rtl">
        <div className="max-w-6xl mx-auto alert alert-error">
          <span>تعذر تحميل الإحصائيات: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6 space-y-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-base-content">احصائيات المستخدمين</h1>
          <p className="text-sm text-base-content/60">نظرة عامة على الزيارات وحركة تسجيل الدخول للموقع</p>
        </div>

        {/* Statistics cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-base-100 shadow-sm border border-base-300 p-6 space-y-2">
            <span className="text-sm font-medium text-base-content/60">إجمالي الزيارات</span>
            <div className="text-3xl font-extrabold text-base-content">{totalVisits}</div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300 p-6 space-y-2">
            <span className="text-sm font-medium text-base-content/60">حسابات شخصية (Registered)</span>
            <div className="text-3xl font-extrabold text-primary">{registeredCount}</div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300 p-6 space-y-2">
            <span className="text-sm font-medium text-base-content/60">ضيوف (Guests)</span>
            <div className="text-3xl font-extrabold text-warning">{guestCount}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie chart: registered vs guest */}
          <div className="card bg-base-100 shadow-sm border border-base-300 p-5 flex flex-col h-72">
            <h3 className="text-sm font-bold text-base-content mb-2">توزيع الزوار حسب نوع الحساب</h3>
            <div className="flex-1 min-h-0">
              {registeredCount + guestCount === 0 ? (
                // Empty state when there is no data
                <div className="h-full flex items-center justify-center text-base-content/40 text-sm">
                  لا توجد بيانات
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Line chart: visits over the last 7 days */}
          <div className="card bg-base-100 shadow-sm border border-base-300 p-5 flex flex-col h-72">
            <h3 className="text-sm font-bold text-base-content mb-2">نشاط الزيارات خلال آخر 7 أيام</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.4} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    name="الزيارات"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar chart: registered vs guest per month (spans the full grid width) */}
          <div className="md:col-span-2 card bg-base-100 shadow-sm border border-base-300 p-5 flex flex-col h-80">
            <h3 className="text-base font-bold text-base-content mb-2">توزيع الزيارات خلال آخر 6 أشهر</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.4} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  <Bar dataKey="registered" name="حسابات مسجلة" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="guest" name="ضيوف" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent visits table */}
        <div className="card bg-base-100 shadow-sm border border-base-300 p-6 space-y-4">
          <h2 className="text-lg font-bold text-base-content">أحدث عمليات الدخول والتصفح</h2>

          <div className="overflow-x-auto">
            <table className="table w-full text-sm text-right">
              <thead>
                <tr className="border-b border-base-300 text-base-content/50 font-medium">
                  <th className="py-3 px-4 bg-transparent">نوع الحساب</th>
                  <th className="py-3 px-4 bg-transparent">اسم المستخدم</th>
                  <th className="py-3 px-4 bg-transparent">الصفحة</th>
                  <th className="py-3 px-4 bg-transparent">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-base-200/50 transition-colors">
                      {/* Account type badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`badge badge-soft ${
                            log.account_type === 'registered' ? 'badge-primary' : 'badge-warning'
                          }`}
                        >
                          {log.account_type === 'registered' ? 'مسجل' : 'ضيف'}
                        </span>
                      </td>
                      {/* User name (falls back to the guest label when missing) */}
                      <td className="py-3 px-4 font-medium text-base-content">
                        {log.profiles?.user_name || 'ضيف مجهول'}
                      </td>
                      {/* Page path is left-to-right even inside an RTL page */}
                      <td className="py-3 px-4 text-base-content/70" dir="ltr">
                        {log.page_path}
                      </td>
                      {/* Date and time in Arabic format */}
                      <td className="py-3 px-4 text-base-content/50 text-xs">
                        {new Date(log.created_at).toLocaleString('ar-EG')}
                      </td>
                    </tr>
                  ))
                ) : (
                  // Empty state when there are no visit records
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-base-content/40">
                      لا توجد سجلات زيارة حتى الآن.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}