'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Aref_Ruqaa } from 'next/font/google';
import Modal from '@/components/ui/PopUp/Modal';
import EditProfileModal from './EditProfileModal';
import { Profile } from '@/types/profile';

const fontType = Aref_Ruqaa({
  subsets: ['arabic'],
  weight: ['400', '700'],
});

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user || user.is_anonymous) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('id, created_at, user_name, avatar_url, bio')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('خطأ أثناء جلب البروفايل:', error.message);
        } else if (data) {
          setProfile(data as Profile);
        }
      } catch (err) {
        console.error('خطأ غير متوقع:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  const handleUpdate = async ({
    userName,
    bio,
    avatarFile,
    removeAvatar,
  }: {
    userName: string;
    bio: string;
    avatarFile: File | null;
    removeAvatar: boolean;
  }) => {
    if (!profile) return;
    setUpdating(true);

    try {
      let newAvatarUrl: string | null = profile.avatar_url;

      if (removeAvatar) {
        newAvatarUrl = null;
      } else if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${profile.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, avatarFile, {
            upsert: true,
            contentType: avatarFile.type,
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

      setIsEditOpen(false);
      router.refresh();
    } catch (error: any) {
      alert('حدث خطأ أثناء التحديث: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div dir="rtl" className="flex justify-center items-center min-h-screen bg-base-200 p-4">
        <div className="w-full max-w-sm bg-base-100 border border-base-200 rounded-3xl p-6 shadow-xl text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center text-warning mb-4 border border-warning/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-base-content mb-2">وضع الزائر</h2>
          <p className="text-sm text-base-content/70 leading-relaxed mb-6 max-w-[260px]">
            أنت تتصفح التطبيق كضيف حالياً. يرجى تسجيل الدخول لعرض وتحرير الملف الشخصي.
          </p>
          <div className="w-full space-y-2.5">
            <Link
              href="/auth/welcome"
              className="btn btn-primary w-full text-sm font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              تسجيل الدخول / إنشاء حساب
            </Link>
            <button onClick={() => router.back()} className="btn btn-ghost w-full text-xs rounded-xl">
              الرجوع للصفحة السابقة
            </button>
          </div>
        </div>
      </div>
    );
  }

  const avatarSrc = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.user_name || 'User')}&background=6366f1&color=fff`;

  return (
    <main dir="rtl" className="flex justify-center items-center min-h-screen bg-base-200 p-4">
      {/* Profile Card */} 
      <div className="w-full max-w-sm bg-base-100 rounded-3xl shadow-xl border border-base-200 p-6">
        <div className="flex flex-col items-center">
          <button
            onClick={() => setIsImageModalOpen(true)}
            className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-4 border-primary shadow-sm bg-base-200 hover:opacity-90 transition-opacity cursor-pointer group"
            title="عرض الصورة الشخصية"
          >
            <Image
              src={avatarSrc}
              alt={profile.user_name || 'User Avatar'}
              fill
              sizes="112px"
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </div>
          </button>

          <div className="w-full text-center mb-1">
            <h1 className={`text-2xl font-bold text-base-content ${fontType.className}`}>
              {profile.user_name || 'مستخدم بدون اسم'}
            </h1>
            {profile.user_name && (
              <p dir="ltr" className="text-sm font-medium text-primary mt-1 text-center">
                @{profile.user_name}
              </p>
            )}
          </div>

          {profile.bio && (
            <p className="mt-3 w-full text-right text-sm text-base-content/80 leading-relaxed whitespace-pre-wrap break-words">
              {profile.bio}
            </p>
          )}

          <button
            onClick={() => setIsEditOpen(true)}
            className="mt-5 w-full btn btn-primary font-medium rounded-xl"
          >
            تعديل الملف الشخصي
          </button>

          <div className="mt-6 pt-4 border-t border-base-200 w-full text-center">
            <span className="text-xs text-base-content/60">
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

      {/* Modification Mod */} 
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        profile={profile}
        fontClassName={fontType.className}
        onSave={handleUpdate}
        updating={updating}
      />

      {/* Image Preview Mod */} 
      <Modal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} title="">
        <div className="w-full flex justify-center">
          <div className="relative w-full aspect-square max-h-[70vh] rounded-2xl overflow-hidden border-2 border-base-200 shadow-inner bg-base-200">
            <Image
              src={avatarSrc}
              alt={profile.user_name || 'User Avatar'}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
      </Modal>
    </main>
  );
}
