"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/config/createClient";
import { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const supabase = createClient();

  // 🔒 1. قفل السكرول ومنع التفاعل بالخلفية عند فتح النافبار على الموبايل
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);

    // 🔍 جلب بيانات المستخدم الحالية ومراقبة تغير حالة التسجيل
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoadingUser(false);
    };

    fetchUser();

    // الاستماع للتغييرات (تسجيل الدخول أو الخروج من أي مكان في التطبيق)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 🚪 دالة تسجيل الخروج
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push('/auth/welcome');
    router.refresh();
  };

  // 🔗 الروابط الأساسية
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "dashboard", href: "/dashboard" },
    { name: "InteractiveMap", href: "/InteractiveMap" },
    { name: "Users", href: "/users" },
    { name: "Notification", href: "/notification" },
    { name: "Setting", href: "/setting" },
  ];

  // 💡 التحقق مما إذا كان المستخدم مسجلاً بحساب حقيقي وليس ضيفاً
  const isRegisteredUser = user && !user.is_anonymous;

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-base-100 border-b border-base-300 text-base-content shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo / Brand */}
            <div className="flex-shrink-0 flex items-center">
              <Link 
                href="/" 
                className="text-xl font-bold tracking-tight"
              >
                𝙼𝚄𝚂𝚃𝙰𝙵𝙰<span className="text-primary">.</span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8 h-full">
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

            {/* Desktop Action & Theme Switcher */}
            <div className="hidden md:flex items-center gap-3">
              {mounted ? (
                <label className="swap swap-rotate btn btn-ghost btn-circle btn-sm">
                  <input
                    type="checkbox"
                    onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
                    checked={theme === "dark"}
                  />
                  {/* أيقونة الشمس */}
                  <svg className="swap-on fill-current w-5 h-5" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,0,1.41l.71.71A1,1,0,0,0,7.76,7.76L7.05,7.05A1,1,0,0,0,5.64,7.05Zm12.02,12a1,1,0,0,0,1.41,0l.71-.71a1,1,0,0,0-1.41-1.41l-.71.71A1,1,0,0,0,17.66,19.05ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-7,7a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V19A1,1,0,0,0,14,18ZM12,6a6,6,0,1,0,6,6A6,6,0,0,0,12,6Z"/></svg>
                  {/* أيقونة القمر */}
                  <svg className="swap-off fill-current w-5 h-5" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Z"/></svg>
                </label>
              ) : (
                <div className="w-8 h-8" />
              )}

              {/* 🔴 شرط العرض: تسجيل الخروج للمسجلين، وتسجيل الدخول للضيوف وغير المسجلين */}
              {!loadingUser && (
                isRegisteredUser ? (
                  <button 
                    onClick={handleSignOut} 
                    className="btn btn-error btn-outline btn-sm rounded-lg cursor-pointer"
                  >
                    تسجيل الخروج
                  </button>
                ) : (
                  <Link 
                    href="/auth/welcome" 
                    className="btn btn-primary btn-sm rounded-lg shadow-sm"
                  >
                    تسجيل الدخول
                  </Link>
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

        {/* Side-Drawer Mobile Menu (z-50) */}
        <div 
          id="mobile-menu"
          className={`fixed top-0 right-0 z-50 h-full w-64 bg-base-100 border-l border-base-300 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col justify-between ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="px-4 pt-5 pb-3 space-y-1">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-base-200">
              <span className="text-lg font-bold">Menu</span>
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

          {/* 🔴 أسفل قائمة الموبايل */}
          <div className="p-4 border-t border-base-200">
            {!loadingUser && (
              isRegisteredUser ? (
                <button 
                  onClick={handleSignOut}
                  className="btn btn-error btn-outline w-full rounded-lg cursor-pointer"
                >
                  تسجيل الخروج
                </button>
              ) : (
                <Link 
                  href="/auth/welcome" 
                  onClick={() => setIsOpen(false)}
                  className="btn btn-primary w-full rounded-lg shadow-sm"
                >
                  تسجيل الدخول
                </Link>
              )
            )}
          </div>
        </div>
      </nav>

      {/* 🛡️ 2. Backdrop / Overlay خارجي يُغطي كامل الشاشة لمنع اللمس نهائياً (z-40) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity cursor-pointer"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* تعويض ارتفاع الـ Navbar */}
      <div className="h-16" />
    </>
  );
}
