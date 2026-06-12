"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Home,
  Users,
  ClipboardList,
  CreditCard,
  TrendingUp,
  TrendingDown,
  LineChart,
  Wrench,
  UserCog,
  LogOut,
  Menu,
  X
} from "lucide-react";

import { hasPermission, Permission } from "@/lib/permissions";

export default function Sidebar({ userRole }: { userRole?: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Helper function to check if the link should be shown
  const checkAccess = (permission?: Permission) => {
    if (!permission) return true; // Everyone can access
    if (!userRole) return false;
    return hasPermission(userRole, permission);
  };

  const allLinks = [
    { name: "الرئيسية", href: "/dashboard", icon: LayoutDashboard },
    { name: "التقويم التفاعلي", href: "/dashboard/calendar", icon: Calendar, requiredPermission: "view_reservations" as Permission },
    { name: "إدارة الشاليهات", href: "/dashboard/chalets", icon: Home, requiredPermission: "view_chalets" as Permission },
    { name: "إدارة العملاء", href: "/dashboard/clients", icon: Users, requiredPermission: "view_clients" as Permission },
    { name: "الحجوزات", href: "/dashboard/reservations", icon: ClipboardList, requiredPermission: "view_reservations" as Permission },
    { name: "المدفوعات", href: "/dashboard/payments", icon: CreditCard, requiredPermission: "view_payments" as Permission },
    { name: "الإيرادات", href: "/dashboard/revenue", icon: TrendingUp, requiredPermission: "view_financial_reports" as Permission },
    { name: "المصروفات", href: "/dashboard/expenses", icon: TrendingDown, requiredPermission: "manage_expenses" as Permission },
    { name: "الأرباح", href: "/dashboard/profits", icon: LineChart, requiredPermission: "view_profit_analysis" as Permission },
    { name: "الصيانة", href: "/dashboard/maintenance", icon: Wrench, requiredPermission: "view_maintenance" as Permission },
    { name: "المستخدمين", href: "/dashboard/users", icon: UserCog, requiredPermission: "manage_users" as Permission },
  ];

  const links = allLinks.filter(link => checkAccess(link.requiredPermission));

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-dark)] text-[var(--color-ui-bg-base)] p-4 rounded-full shadow-[0_0_20px_var(--color-brand-glow)] hover:scale-105 transition-transform"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-30 transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed md:relative top-0 right-0 h-screen bg-[var(--color-ui-bg-panel)] border-l border-[var(--color-ui-border-subtle)] w-64 flex flex-col z-40 transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"} overflow-y-auto`}>
        {/* Brand */}
      <div className="p-6 flex items-center justify-center border-b border-[var(--color-ui-border-subtle)] gap-3 bg-gradient-to-b from-[var(--color-ui-bg-panel-hover)] to-transparent">
        <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-brand-light)] to-[var(--color-brand-dark)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--color-brand-glow)] transform transition-transform hover:rotate-6">
          <span className="text-xl">🏖️</span>
        </div>
        <div>
          <h1 className="font-bold text-white text-lg tracking-wide">إدارة الشاليهات</h1>
          <p className="text-[10px] text-[var(--color-ui-text-muted)] uppercase tracking-widest">Alaa & Ayman Team</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {links.map((link, index) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 animate-fade-in ${
                isActive
                  ? "bg-[var(--color-ui-bg-input)] text-[var(--color-brand-primary)] font-bold border-r-2 border-[var(--color-brand-primary)] shadow-[inset_0_0_12px_rgba(212,168,83,0.1)]"
                  : "text-[var(--color-ui-text-secondary)] hover:bg-[var(--color-ui-bg-panel-hover)] hover:text-white"
              }`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <Icon size={20} className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-[var(--color-brand-primary)]" : "text-[var(--color-ui-text-muted)] group-hover:text-[var(--color-brand-primary)]"}`} />
              <span className="group-hover:translate-x-[-4px] transition-transform duration-300">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-[var(--color-ui-border-subtle)] bg-[var(--color-ui-bg-panel)]">
        <Link
          href="/"
          className="group flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:shadow-[inset_0_0_12px_rgba(239,68,68,0.1)] transition-all duration-300"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">تسجيل الخروج</span>
        </Link>
      </div>
    </aside>
    </>
  );
}
