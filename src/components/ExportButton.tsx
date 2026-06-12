"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown, Calendar, X } from "lucide-react";

type ExportType = "reservations" | "payments" | "expenses" | "profits" | "maintenance" | "clients" | "reports";

interface ExportButtonProps {
  type: ExportType;
  label?: string;
  chalets?: { id: string; name: string }[];
}

const typeLabels: Record<ExportType, string> = {
  reservations: "الحجوزات",
  payments: "المدفوعات",
  expenses: "المصروفات",
  profits: "الأرباح",
  reports: "التقارير",
  maintenance: "الصيانة",
  clients: "العملاء",
};

export default function ExportButton({ type, label, chalets = [] }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chaletId, setChaletId] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  // تعيين نطاق زمني سريع
  function setQuickRange(range: "thisMonth" | "lastMonth" | "thisYear" | "all") {
    const now = new Date();
    if (range === "thisMonth") {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
      setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]);
    } else if (range === "lastMonth") {
      setStartDate(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0]);
      setEndDate(new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0]);
    } else if (range === "thisYear") {
      setStartDate(new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]);
      setEndDate(new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0]);
    } else {
      setStartDate("");
      setEndDate("");
    }
  }

  function handleExport(format: "xlsx" | "pdf") {
    const params = new URLSearchParams({ type, format });
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (chaletId) params.set("chaletId", chaletId);

    const url = `/api/export?${params.toString()}`;

    if (format === "pdf") {
      // فتح النافذة فوراً وبشكل متزامن لتخطي حظر النوافذ المنبثقة في الايفون
      const newWin = window.open(url, "_blank");
      if (!newWin) {
        // إذا كان المتصفح (مثل سفاري في الايفون) يمنع النوافذ المنبثقة تماماً، ننتقل بالصفحة الحالية
        window.location.href = url;
      }
      setOpen(false);
      return;
    }

    downloadXlsx(url);
  }

  async function downloadXlsx(url: string) {
    setLoading("xlsx");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("فشل التصدير");
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${typeLabels[type]}_${new Date().toLocaleDateString("en-CA")}.xlsx`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
      setOpen(false);
    } catch (e) {
      alert("فشل التصدير، تحقق من الاتصال");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/40 text-emerald-400 hover:text-emerald-300 px-4 py-2 rounded-lg transition-all text-sm font-bold"
        title="تصدير التقرير"
      >
        <Download size={16} />
        <span>{label || "تصدير"}</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 left-4 text-[#8b92a5] hover:text-white"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Download size={20} className="text-emerald-400" />
              تصدير تقرير {typeLabels[type]}
            </h3>
            <p className="text-[#8b92a5] text-sm mb-6">حدّد النطاق الزمني وصيغة التصدير</p>

            {/* Quick Range */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { label: "هذا الشهر", value: "thisMonth" as const },
                { label: "الشهر الماضي", value: "lastMonth" as const },
                { label: "هذه السنة", value: "thisYear" as const },
                { label: "الكل", value: "all" as const },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setQuickRange(r.value)}
                  className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-bg-input)] hover:bg-[var(--color-border-subtle)] text-[#cacedb] hover:text-white transition-colors border border-[var(--color-border-subtle)]"
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-[#8b92a5] mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  dir="ltr"
                  className="w-full glass-input py-2 px-3 text-sm [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#8b92a5] mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  dir="ltr"
                  className="w-full glass-input py-2 px-3 text-sm [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Chalet Filter (optional) */}
            {chalets.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs text-[#8b92a5] mb-1">تصفية حسب الشاليه (اختياري)</label>
                <select
                  value={chaletId}
                  onChange={(e) => setChaletId(e.target.value)}
                  className="w-full glass-input py-2 px-3 text-sm"
                >
                  <option value="">كل الشاليهات</option>
                  {chalets.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Export Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleExport("xlsx")}
                disabled={!!loading}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading === "xlsx" ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <FileSpreadsheet size={16} />
                )}
                Excel (.xlsx)
              </button>
              <button
                onClick={() => handleExport("pdf")}
                disabled={!!loading}
                className="flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading === "pdf" ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <FileText size={16} />
                )}
                PDF طباعة
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
