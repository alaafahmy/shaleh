"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addExpense } from "@/app/actions";
import { validateAmount } from "@/lib/validation";

type Chalet = { id: string; name: string };

export default function AddExpenseForm({ chalets }: { chalets: Chalet[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState("صيانة");
  const [amount, setAmount] = useState("");
  const [chaletId, setChaletId] = useState("");
  const [description, setDescription] = useState("");

  // Errors State
  const [amountError, setAmountError] = useState("");

  function validateForm(): boolean {
    let valid = true;

    const amountCheck = validateAmount(Number(amount), "المبلغ");
    if (!amountCheck.valid) {
      setAmountError(amountCheck.message!);
      valid = false;
    } else {
      setAmountError("");
    }

    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("type", type);
    formData.append("amount", amount);
    formData.append("chaletId", chaletId);
    formData.append("description", description);

    const res = await addExpense(formData);
    setPending(false);
    if (res.error) {
      setError(res.error);
    } else {
      setIsOpen(false);
      setAmount("");
      setDescription("");
      setType("صيانة");
      setChaletId("");
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-[#d4a853] to-[#b18532] text-[#06080d] px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <Plus size={18} /> سند صرف جديد
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
            <h3 className="text-xl font-bold text-white mb-6">إنشاء سند صرف جديد</h3>

            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm border border-red-500/30">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">نوع المصروف</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                    className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                  >
                    <option value="صيانة">صيانة</option>
                    <option value="نظافة">نظافة</option>
                    <option value="كهرباء">كهرباء</option>
                    <option value="ماء">ماء</option>
                    <option value="رواتب">رواتب</option>
                    <option value="مستلزمات">مستلزمات</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">المبلغ (ر.س) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (amountError) setAmountError("");
                    }}
                    onBlur={() => {
                      const check = validateAmount(Number(amount), "المبلغ");
                      if (!check.valid) setAmountError(check.message!);
                    }}
                    required
                    min="1"
                    className={`w-full bg-[var(--color-bg-input)] border ${amountError ? 'border-red-500' : 'border-[var(--color-border-subtle)]'} rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]`}
                    placeholder="0"
                  />
                  {amountError && <p className="text-red-400 text-xs mt-1">{amountError}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">الشاليه المرتبط (اختياري)</label>
                <select
                  value={chaletId}
                  onChange={(e) => setChaletId(e.target.value)}
                  className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                >
                  <option value="">— عام (غير مرتبط بشاليه)</option>
                  {chalets.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">البيان / الوصف <span className="text-red-500">*</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                  placeholder="تفاصيل المصروف..."
                />
              </div>

              <div className="pt-4 flex gap-3">
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
                  {pending ? "جاري التسجيل..." : "تسجيل المصروف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
