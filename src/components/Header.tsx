"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, LogOut, User } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const titles: Record<string, string> = {
    "/dashboard": "لوحة التحكم",
    "/dashboard/calendar": "التقويم التفاعلي",
    "/dashboard/chalets": "إدارة الشاليهات",
    "/dashboard/clients": "إدارة العملاء",
    "/dashboard/reservations": "الحجوزات",
    "/dashboard/payments": "المدفوعات",
    "/dashboard/revenue": "الإيرادات",
    "/dashboard/expenses": "المصروفات",
    "/dashboard/profits": "التقارير المالية",
    "/dashboard/maintenance": "الصيانة",
    "/dashboard/users": "المستخدمين",
  };

  const title = titles[pathname] || "النظام";

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // حتى لو فشل الطلب، نحذف الجلسة محلياً
    }
    // استبدال كل التاريخ بصفحة تسجيل الدخول (لا يمكن الرجوع للخلف)
    router.replace("/");
  }

  return (
    <>
      <header className="h-20 bg-[var(--color-bg-base)] border-b border-[var(--color-border-subtle)] px-8 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-6 flex-1">
          <h2 className="text-2xl font-bold text-white">{title}</h2>

          <div className="hidden md:flex items-center glass-input px-4 py-2 w-96 relative">
            <Search size={18} className="text-[#8b92a5] ml-3" />
            <input
              type="text"
              placeholder="بحث سريع... (اسم عميل، رقم حجز، شاليه)"
              className="bg-transparent border-none text-white text-sm w-full focus:outline-none placeholder-[#8b92a5]"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* الإشعارات */}
          <div className="relative cursor-pointer hover:bg-[var(--color-bg-input)] p-2 rounded-full transition-colors">
            <Bell size={24} className="text-[#d4a853]" />
            <span className="absolute top-1 right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[var(--color-bg-base)]">
              3
            </span>
          </div>

          {/* معلومات المستخدم */}
          <div className="flex items-center gap-3 pr-4 border-r border-[var(--color-border-subtle)]">
            <div className="text-left">
              <div className="text-sm font-bold text-white">المدير العام</div>
              <div className="text-xs text-[#8b92a5]">admin</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-[#d4a853] to-[#b18532] rounded-full flex items-center justify-center font-bold text-[#06080d]">
              <User size={18} />
            </div>
          </div>

          {/* زر تسجيل الخروج */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg transition-all text-sm font-bold"
            title="تسجيل الخروج"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </header>

      {/* حوار تأكيد تسجيل الخروج */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass-panel p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">👋</div>
              <h3 className="text-xl font-bold text-white mb-2">تسجيل الخروج</h3>
              <p className="text-[#8b92a5] text-sm">هل أنت متأكد من تسجيل الخروج؟ سيتم إنهاء جلستك الحالية.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-[var(--color-bg-input)] text-white p-3 rounded-lg hover:bg-[var(--color-border-subtle)] transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loggingOut ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    جاري الخروج...
                  </>
                ) : (
                  <>
                    <LogOut size={16} /> تسجيل الخروج
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
