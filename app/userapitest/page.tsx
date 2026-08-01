"use client"
import { useState, useEffect, FormEvent } from "react"

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  isAdmin?: boolean;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  
  // حالات حقول الفورم
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // حالة لتحديد هل نحن في وضع التعديل أم الإضافة
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const api = `/api/users`;

  // 1️⃣ جلب البيانات (GET)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(api);
        const data = await res.json();
        // تأكد من أن البيانات مصفوفة قبل ضبط الحالة
        setUsers(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error("خطأ في جلب البيانات:", err);
      }
    };
    fetchUsers();
  }, []);

  // تفريغ الحقول
  const resetForm = () => {
    setName("");
    setAge("");
    setEmail("");
    setPassword("");
    setIsAdmin(false);
    setEditingUserId(null);
  };

  // 2️⃣ دالة الإضافة والتعديل الموحدة
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (editingUserId) {
      await handleUpdateUser();
    } else {
      await handleAddUser();
    }
  };

  // دالة الإضافة (POST)
  const handleAddUser = async () => {
    if (!name || !age || !email || !password) return;

    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age: Number(age), email, password, isAdmin }),
      });

      if (res.ok) {
        const result = await res.json();
        const newUser: User = {
          id: result.data?.id || result.id || Date.now(),
          name,
          age: Number(age),
          email,
          isAdmin,
        };

        setUsers((prev) => [...prev, newUser]);
        resetForm();
      }
    } catch (err) {
      console.error("خطأ في الإضافة:", err);
    }
  };

  // 3️⃣ دالة التعديل (PUT)
  const handleUpdateUser = async () => {
    if (!editingUserId || !name || !age || !email) return;

    try {
      const res = await fetch(`${api}/${editingUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          age: Number(age),
          email,
          ...(password && { password }), // إرسال كلمة المرور فقط إذا تم إدخلها
          isAdmin,
        }),
      });

      if (res.ok) {
        // تحديث الواجهة فوراً
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUserId
              ? { ...u, name, age: Number(age), email, isAdmin }
              : u
          )
        );
        resetForm();
      }
    } catch (err) {
      console.error("خطأ في التعديل:", err);
    }
  };

  // تجهيز البيانات للتعديل عند الضغط على زر "تعديل"
  const handleStartEdit = (userItem: User) => {
    setEditingUserId(userItem.id);
    setName(userItem.name);
    setAge(String(userItem.age));
    setEmail(userItem.email);
    setIsAdmin(!!userItem.isAdmin);
    setPassword(""); // لا نضع كلمة المرور القديمة لأسباب أمنية
  };

  // 4️⃣ دالة الحذف (DELETE)
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${api}/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("خطأ في الحذف:", err);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen flex flex-col items-center" dir="rtl">
      
      {/* 1️⃣ نموذج الإضافة / التعديل */}
      <form 
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-10 flex flex-col gap-4"
      >
        <h2 className="text-xl font-bold text-gray-800 text-center">
          {editingUserId ? "تعديل بيانات المستخدم" : "إضافة مستخدم جديد"}
        </h2>
        
        <input
          type="text"
          placeholder="الاسم"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          required
        />
        <input
          type="number"
          placeholder="العمر"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          required
        />
        <input
          type="email"
          placeholder="الايميل"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          required
        />
        <input
          type="password"
          placeholder={editingUserId ? "كلمة المرور الجديدة (اختياري)" : "كلمة المرور"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          required={!editingUserId} // مطلوبة فقط في حالة الإضافة
        />

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          مسؤول (Admin)
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            className={`flex-1 py-2.5 text-white font-medium text-sm rounded-xl transition-colors duration-200 shadow-sm ${
              editingUserId 
                ? "bg-amber-500 hover:bg-amber-600 active:bg-amber-700" 
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            }`}
          >
            {editingUserId ? "حفظ التعديلات" : "إضافة"}
          </button>

          {editingUserId && (
            <button
              type="button"
              onClick={resetForm}
              className="py-2.5 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium text-sm rounded-xl transition-colors duration-200"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>

      {/* 2️⃣ عرض الكروت */}
      <div className="flex flex-wrap gap-6 justify-center w-full">
        {users.map((item) => (
          <div 
            key={item.id} 
            className="w-80 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col items-center text-center"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-1">{item.name}</h2>
            <p className="text-gray-500 text-sm mb-2">العمر: {item.age} سنة</p>
            <p className="text-gray-500 text-sm mb-2">الايميل: {item.email}</p>
            <p className="text-gray-500 text-sm mb-4">
              الصفة:{item.isAdmin ?
              <span className="font-semibold bg-green-300">مسؤول</span>
              :
              <span className="font-semibold bg-gray-300">مستخدم</span>
              }
            </p>

            <div className="flex gap-2 w-full mt-auto">
              <button
                onClick={() => handleStartEdit(item)}
                className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
              >
                تعديل
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="flex-1 py-2 px-3 bg-red-500 hover:bg-red-600 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
