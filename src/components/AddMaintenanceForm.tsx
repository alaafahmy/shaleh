"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addMaintenance } from "@/app/actions";
import { validateAmount } from "@/lib/validation";

type Chalet = { id: string; name: string };

export default function AddMaintenanceForm({ chalets }: { chalets: Chalet[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [chaletId, setChaletId] = useState("");
  const [type, setType] = useState("كهربائية");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  // Errors State
  const [costError, setCostError] = useState("");

  function validateForm(): boolean {
    let valid = true;

    const costCheck = validateAmount(Number(cost), "التكلفة التقديرية");
    if (!costCheck.valid) {
      setCostError(costCheck.message!);
      valid = false;
    } else {
      setCostError("");
    }

    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("chaletId", chaletId);
    formData.append("type", type);
    formData.append("cost", cost);
    formData.append("notes", notes);

    const res = await addMaintenance(formData);
    setPending(false);
    if (res.error) {
      setError(res.error);
    } else {
      setIsOpen(false);
      setChaletId("");
      setType("كهربائية");
      setCost("");
      setNotes("");
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-[#d4a853] to-[#b18532] text-[#06080d] px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <Plus size={18} /> طلب صيانة جديد
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 w-full max-w-lg relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => { setIsOpen(false); setError(null); }}
              className="absolute top-4 left-4 text-[#8b92a5] hover:text-white"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">إنشاء طلب صيانة جديد</h3>

            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm border border-red-500/30">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">الشاليه <span className="text-red-500">*</span></label>
                <select
                  value={chaletId}
                  onChange={(e) => setChaletId(e.target.value)}
                  required
                  className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                >
                  <option value="">اختر الشاليه...</option>
                  {chalets.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">نوع الصيانة <span className="text-red-500">*</span></label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                    className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                  >
                    <option value="كهربائية">كهربائية</option>
                    <option value="سباكة">سباكة</option>
                    <option value="تكييف">تكييف</option>
                    <option value="أثاث">أثاث</option>
                    <option value="نظافة عامة">نظافة عامة</option>
                    <option value="طلاء">طلاء</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">التكلفة التقديرية (ر.س) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => {
                      setCost(e.target.value);
                      if (costError) setCostError("");
                    }}
                    onBlur={() => {
                      const check = validateAmount(Number(cost), "التكلفة التقديرية");
                      if (!check.valid) setCostError(check.message!);
                    }}
                    required
                    min="1"
                    className={`w-full bg-[var(--color-bg-input)] border ${costError ? 'border-red-500' : 'border-[var(--color-border-subtle)]'} rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]`}
                    placeholder="0"
                  />
                  {costError && <p className="text-red-400 text-xs mt-1">{costError}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">ملاحظات (اختياري)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                  placeholder="تفاصيل إضافية..."
                />
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-sm text-orange-400">
                ⚠️ سيتم تحديث حالة الشاليه إلى "تحت الصيانة" تلقائياً وسيُسجَّل مصروف مرتبط.
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); setError(null); }}
                  className="flex-1 bg-[var(--color-bg-input)] text-white p-3 rounded-lg hover:bg-[var(--color-border-subtle)] transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 bg-[#d4a853] text-[#06080d] font-bold p-3 rounded-lg hover:bg-[#b18532] transition-colors disabled:opacity-50"
                >
                  {pending ? "جاري التسجيل..." : "تسجيل طلب الصيانة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
