'use client';

import { useToast } from "@/components/ui/PopUp/ToastContext";
import { useConfirm } from "@/components/ui/PopUp/ConfirmContext";
import { useState, useEffect } from 'react';
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { showToast } = useToast();
  const { askConfirm } = useConfirm();
  
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    language: 'ar',
    notifications: true,
    emailAlerts: true,
    pushNotifications: false,
    autoSave: true,
    twoFactor: false,
    publicProfile: true,
    username: 'ahmed_user',
    email: 'ahmed@example.com',
    bio: '',
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    askConfirm(
      "حفظ الإعدادات",
      "هل أنت متأكد من أنك تريد حفظ التغييرات؟",
      () => {
        console.log('Saving settings:', settings);
        setSaved(true);
        showToast("تم حفظ الإعدادات بنجاح!", "success");
      }
    );
  };

  const tabs = [
    { id: 'general', label: 'عام', icon: '⚙️' },
    { id: 'notifications', label: 'الإشعارات', icon: '🔔' },
    { id: 'security', label: 'الأمان', icon: '🔒' },
    { id: 'appearance', label: 'المظهر', icon: '🎨' },
  ];

  return (
    <div className="min-h-screen bg-base-200 text-base-content p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            الإعدادات
          </h1>
          <p className="opacity-70">
            إدارة إعدادات حسابك وتفضيلاتك
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */} 
          <div className="md:w-64 flex-shrink-0">
            <nav className="bg-base-100 rounded-2xl shadow-sm overflow-hidden border border-base-300">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-right transition-colors
                    ${activeTab === tab.id
                      ? 'bg-primary/10 text-primary border-r-4 border-primary font-semibold'
                      : 'hover:bg-base-200 opacity-80 hover:opacity-100'
                    }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content  */}
          <div className="flex-1">
            <div className="bg-base-100 border border-base-300 rounded-2xl shadow-sm p-6">
              {/* General Tab */} 
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold mb-4">
                    الإعدادات العامة
                  </h2>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      اسم المستخدم
                    </label>
                    <input
                      type="text"
                      value={settings.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      className="input input-bordered w-full rounded-xl focus:outline-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="input input-bordered w-full rounded-xl focus:outline-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      اللغة
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => handleChange('language', e.target.value)}
                      className="select select-bordered w-full rounded-xl focus:outline-primary"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      نبذة عنك
                    </label>
                    <textarea
                      rows={3}
                      value={settings.bio}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      placeholder="اكتب نبذة قصيرة عنك..."
                      className="textarea textarea-bordered w-full rounded-xl focus:outline-primary resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Notifications tab */} 
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold mb-4">
                    إعدادات الإشعارات
                  </h2>

                  {[
                    { key: 'notifications', label: 'تفعيل الإشعارات', desc: 'استلام جميع الإشعارات' },
                    { key: 'emailAlerts', label: 'تنبيهات البريد الإلكتروني', desc: 'إرسال تنبيهات عبر البريد' },
                    { key: 'pushNotifications', label: 'الإشعارات الفورية', desc: 'إشعارات داخل التطبيق' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-base-200 last:border-0">
                      <div>
                        <h3 className="font-medium">{item.label}</h3>
                        <p className="text-sm opacity-60">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={Boolean(settings[item.key as keyof typeof settings])}
                        onChange={(e) => handleChange(item.key, e.target.checked)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Security tab */} 
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold mb-4">
                    الأمان والخصوصية
                  </h2>

                  <div className="flex items-center justify-between py-3 border-b border-base-200">
                    <div>
                      <h3 className="font-medium">المصادقة الثنائية (2FA)</h3>
                      <p className="text-sm opacity-60">تفعيل طبقة حماية إضافية</p>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={settings.twoFactor}
                      onChange={(e) => handleChange('twoFactor', e.target.checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-base-200">
                    <div>
                      <h3 className="font-medium">الملف الشخصي العام</h3>
                      <p className="text-sm opacity-60">إتاحة ملفك للجميع</p>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={settings.publicProfile}
                      onChange={(e) => handleChange('publicProfile', e.target.checked)}
                    />
                  </div>

                  <div className="pt-4">
                    <button className="btn btn-error btn-outline w-full rounded-xl">
                      تغيير كلمة المرور
                    </button>
                  </div>
                </div>
              )}

              {/* تبويب المظهر */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold mb-4">
                    المظهر والتخصيص
                  </h2>
                  
                  {/* زر التبديل الخاص بـ DaisyUI */}
                  <div className="flex items-center justify-between py-3 border-b border-base-200">
                    <div>
                      <h3 className="font-medium">الوضع المظلم / المضيء</h3>
                      <p className="text-sm opacity-60">تغيير مظهر واجهة التطبيق</p>
                    </div>

                    {mounted ? (
                      <label className="swap swap-rotate btn btn-ghost btn-circle">
                        <input
                          type="checkbox"
                          onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
                          checked={theme === "dark"}
                        />
                        {/* Sun icon */} 
                        <svg className="swap-on fill-current w-6 h-6" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,0,1.41l.71.71A1,1,0,0,0,7.76,7.76L7.05,7.05A1,1,0,0,0,5.64,7.05Zm12.02,12a1,1,0,0,0,1.41,0l.71-.71a1,1,0,0,0-1.41-1.41l-.71.71A1,1,0,0,0,17.66,19.05ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-7,7a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V19A1,1,0,0,0,14,18ZM12,6a6,6,0,1,0,6,6A6,6,0,0,0,12,6Z"/></svg>
                        {/* Moon icon */} 
                        <svg className="swap-off fill-current w-6 h-6" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Z"/></svg>
                      </label>
                    ) : (
                      <div className="w-8 h-8" />
                    )}
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h3 className="font-medium">الحفظ التلقائي</h3>
                      <p className="text-sm opacity-60">حفظ التغييرات تلقائياً</p>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={settings.autoSave}
                      onChange={(e) => handleChange('autoSave', e.target.checked)}
                    />
                  </div>
                </div>
              )}
              
              {/* save button */}
              <div className="mt-8 pt-6 border-t border-base-300 flex items-center gap-4">
                <button
                  onClick={handleSave}
                  className="btn btn-primary px-8 rounded-xl"
                >
                  حفظ التغييرات
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
