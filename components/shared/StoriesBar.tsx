'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import StoriesComponent from 'react-insta-stories';
import { FaPlus, FaRegImage, FaTrash } from 'react-icons/fa';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/components/ui/PopUp/ToastContext';

const Stories = StoriesComponent;

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export interface StoryUser {
  id: string;
  username?: string;
  avatar?: string;
  profileImage?: string;
  role?: string;
}

export interface StoryRecord {
  id: string;
  user_id: string;
  username: string;
  avatar: string | null;
  role: string | null;
  url: string;
  media_type: 'image' | 'video';
  file_path: string;
  duration: number;
  created_at: string;
}

interface ProfileData {
  id: string;
  user_name: string | null;
  avatar_url: string | null;
  role: string | null;
}

interface ResolvedProfile {
  username: string;
  avatar: string;
  role: string | null;
}

interface GroupedStories {
  userId: string;
  username: string;
  avatar?: string | null;
  role?: string | null;
  stories: StoryRecord[];
}

interface ActiveStoryItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  duration: number;
  ownerId: string;
  filePath: string;
}

interface ViewedUserInfo {
  username: string;
  avatar?: string | null;
  role?: string | null;
  ownerId: string;
}

interface StoriesBarProps {
  externalUser?: StoryUser | null;
  bucketName?: string;
}

const DEFAULT_AVATAR = 'https://ik.imagekit.io/2vom8qfmg/images/DefaultUser.jpg';

function mapProfileRow(row: Partial<ProfileData> | null | undefined): ResolvedProfile {
  const cleanName =
    row?.user_name && row.user_name.trim().length > 0 ? row.user_name.trim() : 'مستخدم';
  const cleanAvatar =
    row?.avatar_url && row.avatar_url.trim().length > 0 ? row.avatar_url.trim() : DEFAULT_AVATAR;

  return {
    username: cleanName,
    avatar: cleanAvatar,
    role: row?.role ?? null,
  };
}

export default function StoriesBar({
  externalUser,
  bucketName = 'stories-media',
}: StoriesBarProps) {
  const { showToast } = useToast();

  const [currentUser, setCurrentUser] = useState<StoryUser | null>(externalUser ?? null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [rawStories, setRawStories] = useState<StoryRecord[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, ResolvedProfile>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'image' | 'video' | ''>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeStories, setActiveStories] = useState<ActiveStoryItem[] | null>(null);
  const [currentViewedUser, setCurrentViewedUser] = useState<ViewedUserInfo | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [viewerKey, setViewerKey] = useState<number>(0);

  const fetchProfileById = useCallback(async (userId: string): Promise<ResolvedProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_name, avatar_url, role')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;

    const mapped = mapProfileRow(data as ProfileData);
    setProfilesMap((prev) => ({
      ...prev,
      [userId]: mapped,
    }));

    return mapped;
  }, []);

  const fetchProfilesForIds = useCallback(async (userIds: string[]) => {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    if (uniqueIds.length === 0) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_name, avatar_url, role')
      .in('id', uniqueIds);

    if (error || !data) return;

    setProfilesMap((prev) => {
      const next = { ...prev };
      for (const row of data as ProfileData[]) {
        if (!row.id) continue;
        next[row.id] = mapProfileRow(row);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (externalUser !== undefined) {
      if (!externalUser) {
        setCurrentUser(null);
        setIsGuest(true);
        return;
      }

      setIsGuest(false);
      setCurrentUser(externalUser);
      fetchProfileById(externalUser.id).then((profile) => {
        if (!profile) return;
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                username: profile.username,
                avatar: profile.avatar,
                role: profile.role ?? prev.role,
              }
            : null
        );
      });
      return;
    }

    let isMounted = true;

    const syncUserWithProfile = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (error || !user || user.is_anonymous) {
        setCurrentUser(null);
        setIsGuest(true);
        return;
      }

      setIsGuest(false);
      const profile = await fetchProfileById(user.id);
      if (!isMounted) return;

      setCurrentUser({
        id: user.id,
        username: profile?.username || 'مستخدم',
        avatar: profile?.avatar || DEFAULT_AVATAR,
        role: profile?.role ?? undefined,
      });
    };

    syncUserWithProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      syncUserWithProfile();
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [externalUser, fetchProfileById]);

  const fetchStories = useCallback(async () => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .gt('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const storiesList = (data as StoryRecord[]) || [];
      setRawStories(storiesList);

      const ownerIds = storiesList.map((s) => s.user_id);
      if (ownerIds.length > 0) {
        await fetchProfilesForIds(ownerIds);
      }
    } catch (err) {
      console.error('خطأ في جلب القصص من Supabase:', err);
    }
  }, [fetchProfilesForIds]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    return () => {
      if (uploadPreview) {
        URL.revokeObjectURL(uploadPreview);
      }
    };
  }, [uploadPreview]);

  const groupedStories = useMemo<GroupedStories[]>(() => {
    const map = new Map<string, GroupedStories>();

    for (const story of rawStories) {
      const profile = profilesMap[story.user_id];
      const resolvedUsername = profile?.username || story.username || 'مستخدم';
      const resolvedAvatar = profile?.avatar || story.avatar || DEFAULT_AVATAR;
      const resolvedRole = profile?.role ?? story.role ?? null;

      const existing = map.get(story.user_id);
      if (existing) {
        existing.username = resolvedUsername;
        existing.avatar = resolvedAvatar;
        existing.role = resolvedRole;
        existing.stories.push(story);
      } else {
        map.set(story.user_id, {
          userId: story.user_id,
          username: resolvedUsername,
          avatar: resolvedAvatar,
          role: resolvedRole,
          stories: [story],
        });
      }
    }

    return Array.from(map.values());
  }, [rawStories, profilesMap]);

  const myStoriesGroup = useMemo(
    () => (isGuest ? undefined : groupedStories.find((group) => group.userId === currentUser?.id)),
    [groupedStories, currentUser?.id, isGuest]
  );

  const otherUsersStories = useMemo(
    () =>
      isGuest
        ? groupedStories
        : groupedStories.filter((group) => group.userId !== currentUser?.id),
    [groupedStories, currentUser?.id, isGuest]
  );

  const playableGroups = useMemo<GroupedStories[]>(() => {
    if (isGuest || !currentUser?.id) {
      return groupedStories;
    }
    const mine = groupedStories.filter((g) => g.userId === currentUser.id);
    const others = groupedStories.filter((g) => g.userId !== currentUser.id);
    return [...mine, ...others];
  }, [groupedStories, currentUser?.id, isGuest]);

  const formatGroupStories = useCallback(
    (group: GroupedStories): ActiveStoryItem[] =>
      group.stories.map((s) => ({
        id: s.id,
        url: s.url,
        type: s.media_type,
        duration: s.duration,
        ownerId: group.userId,
        filePath: s.file_path,
      })),
    []
  );

  const openGroupAtIndex = useCallback(
    (group: GroupedStories, startIndex = 0) => {
      if (!group.stories || group.stories.length === 0) return;
      const safeIndex = Math.max(0, Math.min(startIndex, group.stories.length - 1));
      const isMine = !isGuest && currentUser?.id === group.userId;

      setCurrentViewedUser({
        username: isMine ? 'قصتك' : group.username,
        avatar: group.avatar || DEFAULT_AVATAR,
        role: group.role ?? null,
        ownerId: group.userId,
      });
      setActiveStories(formatGroupStories(group));
      setCurrentIndex(safeIndex);
      setViewerKey((prev) => prev + 1);
      setIsOpen(true);
    },
    [currentUser?.id, formatGroupStories, isGuest]
  );

  const handleOpenStories = (storiesArray: StoryRecord[], userDetails: ViewedUserInfo) => {
    if (!storiesArray || storiesArray.length === 0) return;

    const matchedGroup = playableGroups.find((g) => g.userId === userDetails.ownerId);
    if (matchedGroup) {
      openGroupAtIndex(matchedGroup, 0);
      return;
    }

    const formattedStories: ActiveStoryItem[] = storiesArray.map((s) => ({
      id: s.id,
      url: s.url,
      type: s.media_type,
      duration: s.duration,
      ownerId: userDetails.ownerId,
      filePath: s.file_path,
    }));

    setCurrentIndex(0);
    setActiveStories(formattedStories);
    setCurrentViewedUser(userDetails);
    setViewerKey((prev) => prev + 1);
    setIsOpen(true);
  };

  const handleCloseStories = useCallback(() => {
    setIsOpen(false);
    setActiveStories(null);
    setCurrentViewedUser(null);
    setCurrentIndex(0);
    if (window.history.state?.storiesOpen) {
      window.history.back();
    }
  }, []);

  const handleAllStoriesEnd = useCallback(() => {
    if (!currentViewedUser) {
      handleCloseStories();
      return;
    }

    const currentGroupIdx = playableGroups.findIndex(
      (g) => g.userId === currentViewedUser.ownerId
    );

    if (currentGroupIdx !== -1 && currentGroupIdx + 1 < playableGroups.length) {
      openGroupAtIndex(playableGroups[currentGroupIdx + 1], 0);
    } else {
      handleCloseStories();
    }
  }, [currentViewedUser, handleCloseStories, openGroupAtIndex, playableGroups]);

  const goToNextStory = useCallback(() => {
    if (!activeStories || !currentViewedUser) return;

    if (currentIndex + 1 < activeStories.length) {
      setCurrentIndex((prev) => prev + 1);
      setViewerKey((prev) => prev + 1);
      return;
    }

    const currentGroupIdx = playableGroups.findIndex(
      (g) => g.userId === currentViewedUser.ownerId
    );
    if (currentGroupIdx !== -1 && currentGroupIdx + 1 < playableGroups.length) {
      openGroupAtIndex(playableGroups[currentGroupIdx + 1], 0);
    } else {
      handleCloseStories();
    }
  }, [
    activeStories,
    currentIndex,
    currentViewedUser,
    handleCloseStories,
    openGroupAtIndex,
    playableGroups,
  ]);

  const goToPreviousStory = useCallback(() => {
    if (!activeStories || !currentViewedUser) return;

    if (currentIndex - 1 >= 0) {
      setCurrentIndex((prev) => prev - 1);
      setViewerKey((prev) => prev + 1);
      return;
    }

    const currentGroupIdx = playableGroups.findIndex(
      (g) => g.userId === currentViewedUser.ownerId
    );
    if (currentGroupIdx > 0) {
      const prevGroup = playableGroups[currentGroupIdx - 1];
      openGroupAtIndex(prevGroup, prevGroup.stories.length - 1);
    }
  }, [activeStories, currentIndex, currentViewedUser, openGroupAtIndex, playableGroups]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseStories();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToNextStory();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToPreviousStory();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCloseStories, goToNextStory, goToPreviousStory]);

  const handleAddStoryClick = () => {
    if (isGuest || !currentUser?.id) {
      showToast('يجب تسجيل الدخول اولا', 'warning');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isGuest || !currentUser?.id) {
      showToast('يجب تسجيل الدخول اولا', 'warning');
      e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadPreview) {
      URL.revokeObjectURL(uploadPreview);
    }

    setSelectedFile(file);
    const fileType: 'image' | 'video' = file.type.startsWith('video') ? 'video' : 'image';
    setUploadPreview(URL.createObjectURL(file));
    setUploadType(fileType);

    e.target.value = '';
  };

  const handlePublishStory = async () => {
    if (isGuest || !currentUser?.id) {
      showToast('يجب تسجيل الدخول اولا', "warning");
      return;
    }

    if (!selectedFile || !uploadType) return;

    setIsUploading(true);
    try {
      const latestProfile = await fetchProfileById(currentUser.id);
      const finalUsername = latestProfile?.username || currentUser.username || 'مستخدم';
      const finalAvatar =
        latestProfile?.avatar || currentUser.avatar || currentUser.profileImage || DEFAULT_AVATAR;
      const finalRole = latestProfile?.role ?? currentUser.role ?? null;

      const fileExt =
        selectedFile.name.split('.').pop() || (uploadType === 'video' ? 'mp4' : 'jpg');
      const folder = uploadType === 'video' ? 'videos' : 'images';
      const fileName = `story_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}.${fileExt}`;
      const filePath = `${currentUser.id}/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: selectedFile.type,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('stories').insert({
        user_id: currentUser.id,
        username: finalUsername,
        avatar: finalAvatar,
        role: finalRole,
        url: publicUrlData.publicUrl,
        media_type: uploadType,
        file_path: filePath,
        duration: uploadType === 'video' ? 6000 : 4000,
      });

      if (insertError) {
        await supabase.storage.from(bucketName).remove([filePath]);
        throw insertError;
      }

      if (uploadPreview) {
        URL.revokeObjectURL(uploadPreview);
      }
      setUploadPreview(null);
      setSelectedFile(null);
      setUploadType('');
      await fetchStories();
      showToast('تم نشر القصة بنجاح!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ أثناء نشر القصة';
      showToast(message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteStory = async () => {
    if (isGuest || !activeStories || !activeStories[currentIndex]) return;
    const currentStory = activeStories[currentIndex];

    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه القصة؟')) return;

    setIsDeleting(true);
    try {
      const { error: dbError } = await supabase
        .from('stories')
        .delete()
        .eq('id', currentStory.id);

      if (dbError) throw dbError;

      if (currentStory.filePath) {
        const { error: storageError } = await supabase.storage
          .from(bucketName)
          .remove([currentStory.filePath]);

        if (storageError) {
          console.warn('تم حذف السجل لكن تعذر حذف الملف من Storage:', storageError.message);
        }
      }

      const updatedActive = activeStories.filter((_, idx) => idx !== currentIndex);

      handleCloseStories();
      await fetchStories();
      showToast('تم حذف القصة بنجاح!', 'success');

      if (updatedActive.length > 0) {
        setTimeout(() => {
          const nextIndex =
            currentIndex >= updatedActive.length ? updatedActive.length - 1 : currentIndex;
          setActiveStories(updatedActive);
          setCurrentIndex(nextIndex);
          setViewerKey((prev) => prev + 1);
          setIsOpen(true);
        }, 300);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ أثناء حذف القصة';
      showToast(message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ storiesOpen: true }, '');
    const handlePopState = () => {
      setIsOpen(false);
      setActiveStories(null);
      setCurrentViewedUser(null);
      setCurrentIndex(0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen]);

  const isOwnStoryActive =
    !isGuest &&
    Boolean(activeStories && activeStories[currentIndex] && currentUser?.id) &&
    activeStories![currentIndex].ownerId === currentUser!.id;

  const myProfileData = currentUser?.id ? profilesMap[currentUser.id] : undefined;
  const userAvatar = isGuest
    ? DEFAULT_AVATAR
    : myProfileData?.avatar || currentUser?.avatar || currentUser?.profileImage || DEFAULT_AVATAR;
  const myDisplayName = isGuest
    ? 'ضيف'
    : myProfileData?.username || currentUser?.username || 'مستخدم';

  return (
    <div className="w-full bg-base-100 p-0 border-b border-base-200 select-none">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*"
        className="hidden"
      />

      <div
        dir="rtl"
        className="flex overflow-x-auto scrollbar-hide px-2 gap-4 pt-2 pb-2 items-center"
      >
        <div className="flex flex-col items-center shrink-0 relative">
          <div
            onClick={() => {
              if (isGuest || !currentUser?.id) {
                showToast('يجب تسجيل الدخول اولا', 'warning');
                return;
              }
              if (myStoriesGroup) {
                handleOpenStories(myStoriesGroup.stories, {
                  username: myDisplayName,
                  avatar: userAvatar,
                  role: myProfileData?.role ?? currentUser.role ?? null,
                  ownerId: currentUser.id,
                });
              } else {
                handleAddStoryClick();
              }
            }}
            className="relative cursor-pointer"
          >
            <div className="avatar">
              <div
                className={`w-16 h-16 rounded-full ${
                  myStoriesGroup ? 'ring-2 ring-primary ring-offset-2' : 'ring ring-base-300'
                }`}
              >
                <img
                  src={userAvatar}
                  alt={myDisplayName}
                  className="rounded-full object-cover w-full h-full"
                />
              </div>
            </div>
            {!myStoriesGroup && (
              <div className="absolute bottom-0 left-0 bg-primary text-primary-content p-0.5 rounded-full border-2 border-base-100 flex items-center justify-center -translate-x-1 translate-y-1">
                <FaPlus className="w-3 h-3" />
              </div>
            )}
          </div>
          <span className="text-xs text-base-content/70 mt-2 w-16 truncate text-center font-medium">
            قصتك
          </span>
        </div>

        {!isGuest && currentUser && myStoriesGroup && (
          <div
            onClick={handleAddStoryClick}
            className="flex flex-col items-center shrink-0 cursor-pointer text-base-content/50 hover:text-primary transition"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-base-300 flex items-center justify-center bg-base-200">
              <FaRegImage size={20} />
            </div>
            <span className="text-[11px] mt-2 font-medium">إضافة جديد</span>
          </div>
        )}

        <div className="w-px h-12 bg-base-300 shrink-0" />

        {otherUsersStories.map((group) => (
          <div
            key={group.userId}
            onClick={() =>
              handleOpenStories(group.stories, {
                username: group.username,
                avatar: group.avatar,
                role: group.role,
                ownerId: group.userId,
              })
            }
            className="flex flex-col items-center shrink-0 cursor-pointer"
          >
            <div className="avatar">
              <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600">
                <div className="w-full h-full rounded-full bg-base-100 p-[2px]">
                  <img
                    src={group.avatar || DEFAULT_AVATAR}
                    alt={group.username}
                    className="rounded-full object-cover w-full h-full"
                  />
                </div>
              </div>
            </div>
            <span className="text-xs text-base-content mt-2 w-16 truncate text-center font-medium">
              {group.username}
            </span>
          </div>
        ))}
      </div>

      {uploadPreview && !isGuest && (
        <div className="fixed inset-0 bg-black/90 z-[10000] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-[380px] max-h-[90dvh] bg-zinc-900 text-white rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-white/15">
            <div className="p-3.5 text-center border-b border-white/10 font-bold text-white shrink-0">
              مراجعة القصة قبل النشر
            </div>
            <div className="w-full flex-1 min-h-0 max-h-[65dvh] bg-black flex items-center justify-center overflow-hidden">
              {uploadType === 'video' ? (
                <video
                  src={uploadPreview}
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                  muted
                />
              ) : (
                <img
                  src={uploadPreview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="p-3 flex gap-3 bg-zinc-950 border-t border-white/10 shrink-0">
              <button
                type="button"
                onClick={handlePublishStory}
                disabled={isUploading}
                className="btn btn-primary flex-1 text-white font-bold rounded-xl"
              >
                {isUploading ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    جاري النشر...
                  </>
                ) : (
                  'نشر الآن'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (uploadPreview) URL.revokeObjectURL(uploadPreview);
                  setUploadPreview(null);
                  setSelectedFile(null);
                  setUploadType('');
                }}
                disabled={isUploading}
                className="btn btn-outline border-white/40 text-white hover:bg-white/15 flex-1 rounded-xl"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {isOpen && activeStories && currentViewedUser && (
        <div className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center touch-none">
          <div
            className="absolute top-4 right-4 flex items-center gap-2.5 p-3"
            style={{ zIndex: 9999 }}
            dir="rtl"
          >
            <div className="avatar">
              <div className="w-9 h-9 rounded-full ring-1 ring-white/40">
                <img
                  src={currentViewedUser.avatar || DEFAULT_AVATAR}
                  alt="User Avatar"
                  className="object-cover rounded-full w-full h-full"
                />
              </div>
            </div>
            <div className="flex flex-col gap-0.5 text-right">
              <h3 className="text-sm font-bold text-white leading-none">
                {currentViewedUser.username}
              </h3>
            </div>
          </div>

          <div className="absolute top-4 left-4 flex items-center gap-2" style={{ zIndex: 9999 }}>
            {isOwnStoryActive && (
              <button
                type="button"
                onClick={handleDeleteStory}
                disabled={isDeleting}
                className="btn btn-circle btn-sm bg-black/40 border-none text-red-500 hover:text-red-400 hover:bg-black/60"
                title="حذف هذه القصة"
              >
                <FaTrash size={14} className={isDeleting ? 'animate-pulse' : ''} />
              </button>
            )}
            <button
              type="button"
              onClick={handleCloseStories}
              className="btn btn-circle btn-sm bg-black/40 border-none text-white hover:bg-black/60 text-base"
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>

          <div className="w-full max-w-[420px] h-full max-h-[85vh] md:rounded-lg overflow-hidden relative">
            <Stories
              key={`${viewerKey}-${currentViewedUser.ownerId}`}
              stories={activeStories}
              currentIndex={currentIndex}
              defaultInterval={4000}
              width="100%"
              height="100%"
              storyStyles={{ objectFit: 'cover' }}
              progressContainerStyles={{ direction: 'rtl', marginTop: '55px' }}
              progressWrapperStyles={{ direction: 'rtl' }}
              progressStyles={{ transformOrigin: 'right center' }}
              onStoryStart={(index: number) => setCurrentIndex(index)}
              onAllStoriesEnd={handleAllStoriesEnd}
            />
          </div>
        </div>
      )}
    </div>
  );
}