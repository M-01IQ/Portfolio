'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Modal from '@/components/ui/PopUp/Modal';
import { Profile } from '@/types/profile';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  fontClassName?: string;
  onSave: (data: { userName: string; bio: string; avatarFile: File | null; removeAvatar: boolean }) => Promise<void>;
  updating: boolean;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  fontClassName = '',
  onSave,
  updating,
}: EditProfileModalProps) {
  const [userName, setUserName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset local state when modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      setUserName(profile.user_name || '');
      setBio(profile.bio || '');
      setAvatarFile(null);
      setPreviewUrl(profile.avatar_url || null);
      setRemoveAvatar(false);
    }
  }, [isOpen, profile]);

  // Safe close handler using requestAnimationFrame to prevent releasePointerCapture issues
  const handleSafeClose = () => {
    requestAnimationFrame(() => {
      onClose();
    });
  };

  // Handle image file selection and generate local preview URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setRemoveAvatar(false);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Handle avatar removal and stop event propagation
  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatarFile(null);
    setPreviewUrl(null);
    setRemoveAvatar(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ userName, bio, avatarFile, removeAvatar });
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=6366f1&color=fff`;

  return (
    <Modal isOpen={isOpen} onClose={handleSafeClose} title="تعديل الملف الشخصي">
      <form onSubmit={handleSubmit} className="space-y-4 mt-3 p-1 text-right">
        {/* Avatar preview and upload section */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="relative group w-24 h-24">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary shadow">
              <Image
                src={previewUrl || defaultAvatar}
                alt="Avatar Preview"
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Remove avatar button (X) */}
            {previewUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-0 right-0 bg-error text-error-content rounded-full p-1 shadow-md hover:bg-error/80 transition-colors cursor-pointer"
                title="إزالة الصورة"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-outline btn-xs rounded-lg mt-1"
          >
            تغيير الصورة
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Username input */}
        <div>
          <label className="block text-sm font-medium text-base-content mb-1">
            اسم المستخدم
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className={`input input-bordered w-full text-sm ${fontClassName}`}
            placeholder="اسم المستخدم"
          />
        </div>

        {/* Bio input */}
        <div>
          <label className="block text-sm font-medium text-base-content mb-1">
            النبذة (Bio)
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="textarea textarea-bordered w-full text-sm leading-relaxed"
            rows={3}
            placeholder="اكتب نبذة قصيرة عنك..."
          />
        </div>

        {/* Form action buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="submit"
            disabled={updating}
            className="btn btn-primary w-full font-medium rounded-xl">
            {updating ? <span className="loading loading-spinner loading-xs"></span> : 'حفظ التغييرات'}
          </button>
          <button
            type="button"
            onClick={handleSafeClose}
            className="btn btn-ghost w-full rounded-xl"
            > إلغاء
          </button>
        </div>
      </form>
    </Modal>
  );
}
