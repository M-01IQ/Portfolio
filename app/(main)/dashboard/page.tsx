'use client' // أضف هذا السطر فقط إذا كنت تستخدم Next.js App Router

import React from 'react'
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
  Legend
} from 'recharts'

// بيانات افتراضية للرسوم البيانية
const pieData = [
  { name: 'مكتمل', value: 400, color: '#16a34a' },
  { name: 'قيد الانتظار', value: 300, color: '#ff9b00' },
  { name: 'ملغي', value: 100, color: 'red' }
]

const lineData = [
  { day: 'الإثنين', val: 30 },
  { day: 'الثلاثاء', val: 45 },
  { day: 'الأربعاء', val: 35 },
  { day: 'الخميس', val: 60 },
  { day: 'الجمعة', val: 80 }
]

const barData = [
  { month: 'يناير', sales: 4000, profit: 2400 },
  { month: 'فبراير', sales: 3000, profit: 1398 },
  { month: 'مارس', sales: 9800, profit: 2000 },
  { month: 'أبريل', sales: 3908, profit: 2780 },
  { month: 'مايو', sales: 4800, profit: 1890 },
  { month: 'يونيو', sales: 3800, profit: 2390 }
]

const Dashboard = () => {
  return (
    <div className="w-full h-screen bg-emerald-50 grid grid-cols-2 grid-rows-3 gap-3 p-3 font-sans" dir="rtl">
      
      {/* المربع الأول: دائرة الإحصائيات (Donut Chart) */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-emerald-100 flex flex-col justify-between overflow-hidden">
        <h3 className="text-sm font-bold text-gray-700 mb-1">نسب المهام</h3>
        <div className="w-full h-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={35}
                outerRadius={55}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* المربع الثاني: رسم بياني بخطوط جانبية (Line Chart) */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-emerald-100 flex flex-col justify-between overflow-hidden">
        <h3 className="text-sm font-bold text-gray-700 mb-1">النشاط الأسبوعي</h3>
        <div className="w-full h-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="val" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* المربع الثالث: أشرطة عمودية (Bar Chart) - يمتد صفين وعمودين */}
      <div className="col-span-2 row-span-2 bg-white rounded-xl p-4 shadow-sm border border-emerald-100 flex flex-col justify-between overflow-hidden">
        <h3 className="text-base font-bold text-gray-800 mb-2">المبيعات والأرباح الشهرية</h3>
        <div className="w-full h-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" name="المبيعات" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="الأرباح" fill="#86efac" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}

export default Dashboard
