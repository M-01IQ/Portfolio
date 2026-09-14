'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export type Profile = {
  id: string;
  created_at: string;
  user_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

// إنشاء العميل مرة واحدة خارج نطاق المكون لمنع إعادة التهيئة في كل Render
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('id, created_at, user_name, avatar_url, bio')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('خطأ أثناء جلب البروفايل:', error.message);
        } else if (data) {
          setProfile(data as Profile);
          setUserName(data.user_name || '');
          setBio(data.bio || '');
        }
      } catch (err) {
        console.error('خطأ غير متوقع:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setUpdating(true);

    try {
      let newAvatarUrl = profile.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${profile.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, avatarFile, { 
            upsert: true,
            contentType: avatarFile.type 
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);

        newAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_name: userName,
          bio: bio,
          avatar_url: newAvatarUrl,
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              user_name: userName,
              bio: bio,
              avatar_url: newAvatarUrl,
            }
          : null
      );

      setIsOpen(false);
      setAvatarFile(null);
    } catch (error: any) {
      alert('حدث خطأ أثناء التحديث: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-gray-500 font-medium">جاري التحميل...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-200 dir-rtl">
          عذراً، لم نتمكن من العثور على بيانات البروفايل الخاصة بك.
        </div>
      </div>
    );
  }

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100 p-4 dir-rtl">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-right">
        <div className="flex flex-col items-center text-center">
          
          <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-4 border-indigo-500 shadow-sm bg-gray-100">
            <Image
              src={profile.avatar_url || 'https://via.placeholder.com/150'}
              alt={profile.user_name || 'User Avatar'}
              fill
              sizes="112px"
              className="object-cover"
              priority
              unoptimized={profile.avatar_url?.startsWith('http') ? true : false}
            />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            {profile.user_name || 'مستخدم بدون اسم'}
          </h1>

          {profile.user_name && (
            <p className="text-sm font-medium text-indigo-600 mt-1 dir-ltr">
              @{profile.user_name}
            </p>
          )}

          {profile.bio && (
            <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-xs">
              {profile.bio}
            </p>
          )}

          <button
            onClick={() => setIsOpen(true)}
            className="mt-5 w-full py-2 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            تعديل الملف الشخصي
          </button>

          <div className="mt-6 pt-4 border-t border-gray-100 w-full text-center">
            <span className="text-xs text-gray-400">
              انضم منذ:{' '}
              {new Date(profile.created_at).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-right shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">تعديل البيانات</h2>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تغيير الصورة الشخصية
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-500 file:ml-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="اسم المستخدم"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  النبذة (Bio)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="اكتب نبذة قصيرة عنك..."
                />
              </div>

              <div className="flex gap-2 pt-2 dir-rtl">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {updating ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
