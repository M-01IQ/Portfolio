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

// Tooltip مخصص يتكيف مع الثيم
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-base-100 border border-base-300 p-2.5 rounded-lg shadow-lg text-xs text-base-content">
        {label && <p className="font-bold mb-1 border-b border-base-200 pb-1">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color || entry.fill }} className="font-semibold my-0.5">
            {`${entry.name || entry.dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [registeredCount, setRegisteredCount] = useState<number>(0);
  const [guestCount, setGuestCount] = useState<number>(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);

    async function fetchData() {
      try {
        const supabase = await createClient();

        const { count: total } = await supabase
          .from('analytics_log')
          .select('*', { count: 'exact', head: true });

        const { count: registered } = await supabase
          .from('analytics_log')
          .select('*', { count: 'exact', head: true })
          .eq('account_type', 'registered');

        const { count: guest } = await supabase
          .from('analytics_log')
          .select('*', { count: 'exact', head: true })
          .eq('account_type', 'guest');

        const { data: allLogs } = await supabase
          .from('analytics_log')
          .select('created_at, account_type')
          .order('created_at', { ascending: false })
          .limit(1000);

        const { data: logs } = await supabase
          .from('analytics_log')
          .select(`
            id,
            account_type,
            created_at,
            page_path,
            profiles:user_id ( user_name )
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        setTotalVisits(total ?? 0);
        setRegisteredCount(registered ?? 0);
        setGuestCount(guest ?? 0);
        setRecentLogs(logs || []);

        const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const daysMap: { [key: string]: number } = {
          'السبت': 0, 'الأحد': 0, 'الإثنين': 0, 'الثلاثاء': 0, 'الأربعاء': 0, 'الخميس': 0, 'الجمعة': 0
        };

        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const monthlyMap: { [key: string]: { registered: number; guest: number } } = {};

        if (allLogs) {
          allLogs.forEach((log) => {
            const date = new Date(log.created_at);
            const dayName = arabicDays[date.getDay()];
            if (daysMap[dayName] !== undefined) {
              daysMap[dayName] += 1;
            }

            const monthName = monthNames[date.getMonth()];
            if (!monthlyMap[monthName]) {
              monthlyMap[monthName] = { registered: 0, guest: 0 };
            }
            if (log.account_type === 'registered') {
              monthlyMap[monthName].registered += 1;
            } else if (log.account_type === 'guest') {
              monthlyMap[monthName].guest += 1;
            }
          });
        }

        setWeeklyData(Object.keys(daysMap).map((day) => ({ day, visits: daysMap[day] })));
        setMonthlyData(
          Object.keys(monthlyMap).map((month) => ({
            month,
            registered: monthlyMap[month].registered,
            guest: monthlyMap[month].guest,
          }))
        );

      } catch (err) {
        console.error('Dashboard Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const pieData = [
    { name: 'حسابات مسجلة', value: registeredCount, color: '#3b82f6' }, // أزرق واضح
    { name: 'ضيوف', value: guestCount, color: '#f59e0b' },             // أصفر/برتقالي واضح
  ];

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-base-200 p-6 flex items-center justify-center" dir="rtl">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6 space-y-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* العناوين */}
        <div>
          <h1 className="text-2xl font-bold text-base-content">احصائيات المستخدمين</h1>
          <p className="text-sm text-base-content/60">نظرة عامة على الزيارات وحركة تسجيل الدخول للموقع</p>
        </div>

        {/* كروت الإحصائيات الرئيسية */}
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

        {/* الرسوم البيانية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* توزيع الزوار (Pie Chart) */}
          <div className="card bg-base-100 shadow-sm border border-base-300 p-5 flex flex-col justify-between h-72">
            <h3 className="text-sm font-bold text-base-content mb-2">توزيع الزوار حسب نوع الحساب</h3>
            <div className="w-full h-full min-h-0">
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
            </div>
          </div>

          {/* النشاط الأسبوعي (Line Chart) */}
          <div className="card bg-base-100 shadow-sm border border-base-300 p-5 flex flex-col justify-between h-72">
            <h3 className="text-sm font-bold text-base-content mb-2">نشاط الزيارات الأسبوعي الحقيقي</h3>
            <div className="w-full h-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.4} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
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

          {/* النمو الشهري الحقيقي (Bar Chart) */}
          <div className="md:col-span-2 card bg-base-100 shadow-sm border border-base-300 p-5 flex flex-col justify-between h-80">
            <h3 className="text-base font-bold text-base-content mb-2">توزيع الزيارات الشهرية بناءً على السجلات الفعلية</h3>
            <div className="w-full h-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.4} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  <Bar dataKey="registered" name="حسابات مسجلة" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="guest" name="ضيوف" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* جدول أحدث تسجيلات الدخول */}
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
                {recentLogs && recentLogs.length > 0 ? (
                  recentLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-base-200/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          log.account_type === 'registered' 
                            ? 'badge badge-primary badge-soft' 
                            : 'badge badge-warning badge-soft'
                        }`}>
                          {log.account_type === 'registered' ? 'مسجل' : 'ضيف'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-base-content">
                        {log.profiles?.user_name || 'ضيف مجهول'}
                      </td>
                      <td className="py-3 px-4 text-base-content/70 dir-ltr text-right">{log.page_path}</td>
                      <td className="py-3 px-4 text-base-content/50 text-xs">
                        {new Date(log.created_at).toLocaleString('ar-EG')}
                      </td>
                    </tr>
                  ))
                ) : (
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
