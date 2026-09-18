'use client'

import React, { useEffect, useState } from 'react'
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

// بيانات الرسوم البيانية
const pieData = [
  { name: 'مكتمل', value: 400, color: '#16a34a' },
  { name: 'قيد الانتظار', value: 300, color: '#f59e0b' },
  { name: 'ملغي', value: 100, color: '#ef4444' }
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

// مكون مخصص لـ Tooltip يتفاعل مع ثيم DaisyUI
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-base-100 border border-base-300 p-2.5 rounded-lg shadow-xl text-xs text-base-content">
        {label && <p className="font-bold mb-1 border-b border-base-200 pb-1">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color || entry.fill }} className="font-semibold my-0.5">
            {`${entry.name || entry.dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const Dashboard = () => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="w-full h-screen bg-base-200" />
  }

  return (
    <div className="w-full h-screen bg-base-200 grid grid-cols-2 grid-rows-3 gap-3 p-3 font-sans" dir="rtl">
      
      {/* المربع الأول: Donut Chart */}
      <div className="bg-base-100 rounded-xl p-3 shadow-sm border border-base-300 flex flex-col justify-between overflow-hidden">
        <h3 className="text-sm font-bold text-base-content opacity-90 mb-1">نسب المهام</h3>
        <div className="w-full h-full min-h-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={35}
                outerRadius={55}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* المربع الثاني: Line Chart */}
      <div className="bg-base-100 rounded-xl p-3 shadow-sm border border-base-300 flex flex-col justify-between overflow-hidden">
        <h3 className="text-sm font-bold text-base-content opacity-90 mb-1">النشاط الأسبوعي</h3>
        <div className="w-full h-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-base-300" opacity={0.5} />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 10, fill: 'currentColor' }} 
                className="text-base-content/70"
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="val" name="النشاط" stroke="#16a34a" strokeWidth={3} dot={{ r: 4, fill: '#16a34a' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* المربع الثالث: Bar Chart */}
      <div className="col-span-2 row-span-2 bg-base-100 rounded-xl p-4 shadow-sm border border-base-300 flex flex-col justify-between overflow-hidden">
        <h3 className="text-base font-bold text-base-content opacity-90 mb-2">المبيعات والأرباح الشهرية</h3>
        <div className="w-full h-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-base-300" opacity={0.5} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: 'currentColor' }} 
                className="text-base-content/70"
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'currentColor' }} 
                className="text-base-content/70"
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                formatter={(value) => <span className="text-base-content">{value}</span>}
              />
              <Bar dataKey="sales" name="المبيعات" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="الأرباح" fill="#4ade80" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}

export default Dashboard
