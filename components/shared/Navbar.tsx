"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/config/createClient";
import { User } from "@supabase/supabase-js";
import { Reem_Kufi } from 'next/font/google';

const fontType = Reem_Kufi({
  subsets: ['arabic'],
  weight: ['400', '700'],
});

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Update profile state to include the role field
  const [profile, setProfile] = useState<{ user_name: string | null; avatar_url: string | null; role: string | null } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const supabase = createClient();

  // Lock scroll when mobile navigation drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Fetch user profile including the role column
  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("user_name, avatar_url, role")
      .eq("id", userId)
      .single();

    setProfile(data);
  }, [supabase]);

  useEffect(() => {
    setMounted(true);

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser && !currentUser.is_anonymous) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      
      setLoadingUser(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  // Handle user sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    setProfile(null);
    setUser(null);
    router.push('/auth/welcome');
    router.refresh();
  };
  // Sign out the anonymous (guest) session first, then go to the welcome page
  const handleGuestLogin = async () => {
  await supabase.auth.signOut();
  setIsOpen(false);
  setProfile(null);
  setUser(null);
  router.replace('/auth/welcome');
  router.refresh();
};

  // List of all navigation links with admin restriction flags
  const allNavLinks = [
    { name: "الصفحة الرئيسية", href: "/", adminOnly: false },
    { name: "لوحة التحكم", href: "/dashboard", adminOnly: false },
    { name: "الخريطة التفاعلية", href: "/InteractiveMap", adminOnly: false },
    { name: "الملف الشخصي", href: "/profile", adminOnly: false },
    { name: "المستخدمون", href: "/users", adminOnly: true },
    { name: "الاشعارات", href: "/notification", adminOnly: false },
    { name: "الاعدادات", href: "/setting", adminOnly: false },
  ];

  // Filter navigation links based on user role
  const navLinks = allNavLinks.filter((link) => {
    if (link.adminOnly) {
      return profile?.role === "admin";
    }
    return true;
  });

  const isRegisteredUser = user && !user.is_anonymous;

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-base-100 border-b border-base-300 text-base-content shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo / Brand */}
            <div className="flex-shrink-0 flex items-center">
              <Link 
                dir="rtl"
                href="/" 
                className={`text-xl font-bold tracking-tight ${fontType.className}`}
              >
                مصطفى<span className="text-primary">.</span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6 h-full">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className={`text-sm font-medium h-full flex items-center px-1 border-b-2 transition-all duration-200 ${
                      isActive 
                        ? 'text-primary border-primary font-semibold' 
                        : 'opacity-70 hover:opacity-100 border-transparent'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Action & Theme Switcher & Profile */}
            <div className="hidden md:flex items-center gap-3">
              {mounted ? (
                <label className="swap swap-rotate btn btn-ghost btn-circle btn-sm">
                  <input
                    type="checkbox"
                    onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
                    checked={theme === "dark"}
                  />
                  <svg className="swap-on fill-current w-5 h-5" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,0,1.41l.71.71A1,1,0,0,0,7.76,7.76L7.05,7.05A1,1,0,0,0,5.64,7.05Zm12.02,12a1,1,0,0,0,1.41,0l.71-.71a1,1,0,0,0-1.41-1.41l-.71.71A1,1,0,0,0,17.66,19.05ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-7,7a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V19A1,1,0,0,0,14,18ZM12,6a6,6,0,1,0,6,6A6,6,0,0,0,12,6Z"/></svg>
                  <svg className="swap-off fill-current w-5 h-5" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Z"/></svg>
                </label>
              ) : (
                <div className="w-8 h-8" />
              )}

              {!loadingUser && (
                isRegisteredUser ? (
                  <div className="flex items-center gap-2">
                    <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-base-300 border border-base-300 flex items-center justify-center shrink-0">
                        {profile?.avatar_url ? (
                          <Image
                            src={profile.avatar_url}
                            alt={profile.user_name || "User Avatar"}
                            fill
                            sizes="32px"
                            className="object-cover"
                            unoptimized={profile.avatar_url.startsWith('http')}
                          />
                        ) : (
                          <svg className="w-5 h-5 text-base-content/50" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-semibold max-w-[120px] truncate">
                        {profile?.user_name || "مستخدم"}
                      </span>
                    </Link>

                    <button 
                      onClick={handleSignOut} 
                      title="تسجيل الخروج"
                      aria-label="تسجيل الخروج"
                      className="btn btn-error btn-outline btn-square btn-sm rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H9" />
                      </svg>
                    </button>
                  </div>
                ) : (
  <button
    onClick={handleGuestLogin}
    className="btn btn-primary btn-sm rounded-lg shadow-sm"
  >
    تسجيل الدخول
  </button>
)
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button 
                type="button" 
                onClick={() => setIsOpen(!isOpen)} 
                className="btn btn-ghost btn-square btn-sm" 
                aria-controls="mobile-menu" 
                aria-expanded={isOpen}
              >
                <span className="sr-only">Open main menu</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
            
          </div>
        </div>

        {/* Side-Drawer Mobile Menu */}
        <div 
          id="mobile-menu"
          className={`fixed top-0 right-0 z-50 h-full w-64 bg-base-100 border-l border-base-300 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col justify-between ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div dir="rtl" className="px-4 pt-5 pb-3 space-y-1">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-base-200">
              <span className="text-lg font-bold">القائمة</span>
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-circle btn-sm"
              >
                <span className="sr-only">Close menu</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Links */}
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href}
                  href={link.href} 
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-content font-semibold' 
                      : 'hover:bg-base-200 opacity-80 hover:opacity-100'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Theme Toggle in Mobile Menu */}
            <div className="pt-4 mt-2 border-t border-base-200 flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium opacity-80">المظهر</span>
              {mounted && (
                <label className="swap swap-rotate btn btn-ghost btn-circle btn-sm">
                  <input
                    type="checkbox"
                    onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
                    checked={theme === "dark"}
                  />
                  <svg className="swap-on fill-current w-5 h-5" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,0,1.41l.71.71A1,1,0,0,0,7.76,7.76L7.05,7.05A1,1,0,0,0,5.64,7.05Zm12.02,12a1,1,0,0,0,1.41,0l.71-.71a1,1,0,0,0-1.41-1.41l-.71.71A1,1,0,0,0,17.66,19.05ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-7,7a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V19A1,1,0,0,0,14,18ZM12,6a6,6,0,1,0,6,6A6,6,0,0,0,12,6Z"/></svg>
                  <svg className="swap-off fill-current w-5 h-5" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Z"/></svg>
                </label>
              )}
            </div>
          </div>

          {/* Mobile Menu Footer */}
          <div className="p-4 border-t border-base-200">
            {!loadingUser && (
              isRegisteredUser ? (
                <div className="flex items-center gap-2">
                  <Link 
                    href="/profile" 
                    onClick={() => setIsOpen(false)} 
                    className="flex-1 flex items-center gap-3 p-2 rounded-lg bg-base-200/60 hover:bg-base-200 transition-colors overflow-hidden"
                  >
                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-base-300 shrink-0 flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt={profile.user_name || "User Avatar"}
                          fill
                          sizes="36px"
                          className="object-cover"
                          unoptimized={profile.avatar_url.startsWith('http')}
                        />
                      ) : (
                        <svg className="w-5 h-5 text-base-content/50" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden text-right">
                      <span className="text-sm font-bold truncate">
                        {profile?.user_name || "مستخدم"}
                      </span>
                      <span className="text-xs opacity-60 truncate">الملف الشخصي</span>
                    </div>
                  </Link>

                  <button 
                    onClick={handleSignOut}
                    title="تسجيل الخروج"
                    aria-label="تسجيل الخروج"
                    className="btn btn-error btn-outline btn-square shrink-0 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H9" />
                    </svg>
                  </button>
                </div>
              ) : (
  <button
    onClick={handleGuestLogin}
    className="btn btn-primary w-full rounded-lg shadow-sm"
  >
    تسجيل الدخول
  </button>
)
            )}
          </div>
        </div>
      </nav>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity cursor-pointer"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div className="h-16" />
    </>
  );
}
