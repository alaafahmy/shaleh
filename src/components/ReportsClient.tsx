"use client";

import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, Calendar as CalendarIcon } from "lucide-react";
import ExportButton from "@/components/ExportButton";

type Chalet = { id: string; name: string; type: string };
type Revenue = { amount: number; revenue_date: Date; chalet_id: string | null };
type Expense = { amount: number; createdAt: Date; chaletId: string | null };
type Reservation = { id: string; chaletId: string; checkIn: Date };

export default function ReportsClient({
  chalets,
  revenues,
  expenses,
  reservations,
}: {
  chalets: Chalet[];
  revenues: Revenue[];
  expenses: Expense[];
  reservations: Reservation[];
}) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");

  const filterDateRange = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (activeTab) {
      case "daily":
        return { start: startOfToday, end: new Date(startOfToday.getTime() + 86400000) };
      case "weekly":
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - 7);
        return { start: startOfWeek, end: new Date(now.getTime() + 86400000) };
      case "monthly":
        return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
      case "yearly":
        return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1) };
    }
  }, [activeTab]);

  const filteredRevenues = useMemo(() => 
    revenues.filter(r => new Date(r.revenue_date) >= filterDateRange.start && new Date(r.revenue_date) < filterDateRange.end),
  [revenues, filterDateRange]);

  const filteredExpenses = useMemo(() => 
    expenses.filter(e => new Date(e.createdAt) >= filterDateRange.start && new Date(e.createdAt) < filterDateRange.end),
  [expenses, filterDateRange]);

  const filteredReservations = useMemo(() => 
    reservations.filter(r => new Date(r.checkIn) >= filterDateRange.start && new Date(r.checkIn) < filterDateRange.end),
  [reservations, filterDateRange]);

  const totalRevenue = filteredRevenues.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalRevenue - totalExpense;

  const chaletStats = chalets.map(chalet => {
    const revs = filteredRevenues.filter(r => r.chalet_id === chalet.id).reduce((s, r) => s + r.amount, 0);
    const exps = filteredExpenses.filter(e => e.chaletId === chalet.id).reduce((s, e) => s + e.amount, 0);
    const resCount = filteredReservations.filter(r => r.chaletId === chalet.id).length;
    return { ...chalet, revs, exps, net: revs - exps, resCount };
  }).sort((a, b) => b.net - a.net);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 hide-print">
        <div className="flex bg-[var(--color-ui-bg-panel)] p-1 rounded-xl shadow-lg shadow-[var(--color-brand-glow)] overflow-x-auto w-full md:w-auto">
          {[
            { id: "daily", label: "يومي" },
            { id: "weekly", label: "أسبوعي" },
            { id: "monthly", label: "شهري" },
            { id: "yearly", label: "سنوي" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 flex-1 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-dark)] text-white shadow-md"
                  : "text-[var(--color-ui-text-muted)] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <ExportButton type="reports" label="تصدير التقارير" />
      </div>

      <div className="print-only mb-8 text-center hidden">
        <h1 className="text-3xl font-bold mb-3 text-white">تقرير الأداء الشامل</h1>
        <p className="text-xl text-[var(--color-brand-primary)]">
          {activeTab === 'daily' ? 'التقرير اليومي' : activeTab === 'weekly' ? 'التقرير الأسبوعي' : activeTab === 'monthly' ? 'التقرير الشهري' : 'التقرير السنوي'}
        </p>
        <p className="text-sm mt-3 text-gray-400">تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</p>
        <hr className="mt-6 border-[var(--color-ui-border-subtle)]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 border-r-4 border-green-500 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-green-500/20"></div>
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 relative z-10">
            <TrendingUp size={24} />
          </div>
          <div className="relative z-10">
            <p className="text-[var(--color-ui-text-muted)] text-sm mb-1">إجمالي الإيرادات</p>
            <p className="text-2xl font-bold text-white">{new Intl.NumberFormat("ar-SA").format(totalRevenue)} ر.س</p>
          </div>
        </div>

        <div className="glass-panel p-6 border-r-4 border-red-500 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-red-500/20"></div>
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 relative z-10">
            <TrendingDown size={24} />
          </div>
          <div className="relative z-10">
            <p className="text-[var(--color-ui-text-muted)] text-sm mb-1">إجمالي المصروفات</p>
            <p className="text-2xl font-bold text-white">{new Intl.NumberFormat("ar-SA").format(totalExpense)} ر.س</p>
          </div>
        </div>

        <div className={`glass-panel p-6 border-r-4 rounded-2xl flex items-center gap-4 relative overflow-hidden group ${netIncome >= 0 ? 'border-[var(--color-brand-primary)]' : 'border-red-500'}`}>
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-16 -mt-16 transition-all duration-500 ${netIncome >= 0 ? 'bg-[var(--color-brand-primary)]/10 group-hover:bg-[var(--color-brand-primary)]/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}`}></div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 ${netIncome >= 0 ? 'bg-[var(--color-brand-primary)]/20 text-[var(--color-brand-primary)]' : 'bg-red-500/20 text-red-500'}`}>
            <DollarSign size={24} />
          </div>
          <div className="relative z-10">
            <p className="text-[var(--color-ui-text-muted)] text-sm mb-1">صافي الدخل</p>
            <p className="text-2xl font-bold text-white">{new Intl.NumberFormat("ar-SA").format(netIncome)} ر.س</p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden mt-8">
        <div className="p-6 border-b border-[var(--color-ui-border-subtle)] flex items-center gap-3">
          <div className="p-2 bg-[var(--color-brand-primary)]/10 rounded-lg">
            <CalendarIcon size={20} className="text-[var(--color-brand-primary)]" />
          </div>
          <h3 className="text-lg font-bold text-white">تفاصيل أداء الشاليهات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-[var(--color-ui-bg-panel-hover)]">
                <th className="p-4 text-sm font-semibold text-[#8b92a5]">اسم الشاليه</th>
                <th className="p-4 text-sm font-semibold text-[#8b92a5]">النوع</th>
                <th className="p-4 text-sm font-semibold text-[#8b92a5]">عدد الحجوزات</th>
                <th className="p-4 text-sm font-semibold text-[#8b92a5]">الإيرادات</th>
                <th className="p-4 text-sm font-semibold text-[#8b92a5]">المصروفات</th>
                <th className="p-4 text-sm font-semibold text-[#8b92a5]">الصافي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ui-border-subtle)]">
              {chaletStats.map(stat => (
                <tr key={stat.id} className="hover:bg-[var(--color-ui-bg-input)] transition-colors">
                  <td className="p-4 font-bold text-white">{stat.name}</td>
                  <td className="p-4 text-[var(--color-ui-text-secondary)]">{stat.type}</td>
                  <td className="p-4 text-[var(--color-brand-primary)] font-bold">
                    {stat.resCount} <span className="text-xs font-normal">مرة</span>
                  </td>
                  <td className="p-4 text-green-400">{new Intl.NumberFormat("ar-SA").format(stat.revs)}</td>
                  <td className="p-4 text-red-400">{new Intl.NumberFormat("ar-SA").format(stat.exps)}</td>
                  <td className={`p-4 font-bold ${stat.net >= 0 ? 'text-[var(--color-brand-primary)]' : 'text-red-400'}`}>
                    {new Intl.NumberFormat("ar-SA").format(stat.net)}
                  </td>
                </tr>
              ))}
              {chaletStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--color-ui-text-muted)]">
                    لا توجد بيانات متاحة لهذه الفترة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
