'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/config/createClient';
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

// مكون المساعدة للرسائل المنبثقة فوق الرسوم البيانية (Tooltip)
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 p-2.5 rounded-lg shadow-lg text-xs text-gray-800">
        {label && <p className="font-bold mb-1 border-b border-gray-100 pb-1">{label}</p>}
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

  // الحالات الخاصة بالبيانات الجاهزة من السيرفر
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

        // 1. جلب إجمالي الزيارات الكلي
        const { count: total, error: err1 } = await supabase
          .from('analytics_log')
          .select('*', { count: 'exact', head: true });

        // 2. جلب عدد زيارات الحسابات المسجلة
        const { count: registered, error: err2 } = await supabase
          .from('analytics_log')
          .select('*', { count: 'exact', head: true })
          .eq('account_type', 'registered');

        // 3. جلب عدد زيارات الضيوف
        const { count: guest, error: err3 } = await supabase
          .from('analytics_log')
          .select('*', { count: 'exact', head: true })
          .eq('account_type', 'guest');

        // 4. جلب جميع السجلات لتحليل التواريخ ورسم البيانيات (أحدث 1000 سجل)
        const { data: allLogs, error: err4 } = await supabase
          .from('analytics_log')
          .select('created_at, account_type')
          .order('created_at', { ascending: false })
          .limit(1000);

        // 5. جلب أحدث 10 عمليات دخول مع جدول profiles
        const { data: logs, error: err5 } = await supabase
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

        if (err1 || err2 || err3 || err4 || err5) {
          console.error('Errors fetching dashboard data:', { err1, err2, err3, err4, err5 });
        }

        setTotalVisits(total ?? 0);
        setRegisteredCount(registered ?? 0);
        setGuestCount(guest ?? 0);
        setRecentLogs(logs || []);

        // --- معالجة بيانات الأيام الحقيقية ---
        const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const daysMap: { [key: string]: number } = {
          'السبت': 0, 'الأحد': 0, 'الإثنين': 0, 'الثلاثاء': 0, 'الأربعاء': 0, 'الخميس': 0, 'الجمعة': 0
        };

        // --- معالجة بيانات الشهور الحقيقية ---
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const monthlyMap: { [key: string]: { registered: number; guest: number } } = {};

        if (allLogs) {
          allLogs.forEach((log) => {
            const date = new Date(log.created_at);
            
            // معالجة الأيام
            const dayName = arabicDays[date.getDay()];
            if (daysMap[dayName] !== undefined) {
              daysMap[dayName] += 1;
            }

            // معالجة الشهور
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

        // تحويل البيانات إلى مصفوفات المخططات البيانية
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
    { name: 'حسابات مسجلة', value: registeredCount, color: '#2563eb' },
    { name: 'ضيوف', value: guestCount, color: '#d97706' },
  ];

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center" dir="rtl">
        <div className="text-gray-500 font-medium">جاري تحميل البيانات الحقيقية...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* العناوين */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم الإحصائيات</h1>
          <p className="text-sm text-gray-500">نظرة عامة على الزيارات وحركة تسجيل الدخول للموقع</p>
        </div>

        {/* كروت الإحصائيات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* إجمالي الزيارات */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-2">
            <span className="text-sm font-medium text-gray-500">إجمالي الزيارات</span>
            <div className="text-3xl font-extrabold text-gray-900">{totalVisits}</div>
          </div>

          {/* الحسابات المسجلة */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-2">
            <span className="text-sm font-medium text-gray-500">حسابات شخصية (Registered)</span>
            <div className="text-3xl font-extrabold text-blue-600">{registeredCount}</div>
          </div>

          {/* الضيوف */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-2">
            <span className="text-sm font-medium text-gray-500">ضيوف (Guests)</span>
            <div className="text-3xl font-extrabold text-amber-600">{guestCount}</div>
          </div>

        </div>

        {/* الرسوم البيانية المتفاعلة مع البيانات الحقيقية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. توزيع الزوار (Pie Chart) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-72">
            <h3 className="text-sm font-bold text-gray-800 mb-2">توزيع الزوار حسب نوع الحساب</h3>
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

          {/* 2. النشاط الأسبوعي الحقيقي (Line Chart) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-72">
            <h3 className="text-sm font-bold text-gray-800 mb-2">نشاط الزيارات الأسبوعي الحقيقي</h3>
            <div className="w-full h-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="visits" name="الزيارات" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. النمو الشهري الحقيقي (Bar Chart) */}
          <div className="md:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-80">
            <h3 className="text-base font-bold text-gray-800 mb-2">توزيع الزيارات الشهرية بناءً على السجلات الفعلية</h3>
            <div className="w-full h-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  <Bar dataKey="registered" name="حسابات مسجلة" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="guest" name="ضيوف" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* جدول أحدث تسجيلات الدخول */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">أحدث عمليات الدخول والتصفح</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-medium">
                  <th className="py-3 px-4">نوع الحساب</th>
                  <th className="py-3 px-4">اسم المستخدم</th>
                  <th className="py-3 px-4">الصفحة</th>
                  <th className="py-3 px-4">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentLogs && recentLogs.length > 0 ? (
                  recentLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          log.account_type === 'registered' 
                            ? 'bg-blue-50 text-blue-600' 
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {log.account_type === 'registered' ? 'مسجل' : 'ضيف'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {log.profiles?.user_name || 'ضيف مجهول'}
                      </td>
                      <td className="py-3 px-4 text-gray-500 dir-ltr text-right">{log.page_path}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs">
                        {new Date(log.created_at).toLocaleString('ar-EG')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
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
