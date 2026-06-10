"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addPayment } from "@/app/actions";
import { validateAmount } from "@/lib/validation";

type Reservation = {
  id: string;
  client: { name: string };
  chalet: { name: string };
  totalCost: number;
  paid: number;
};

export default function AddPaymentForm({ reservations }: { reservations: Reservation[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedResId, setSelectedResId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("نقد");
  const [note, setNote] = useState("");

  const [amountError, setAmountError] = useState("");

  const unpaidReservations = reservations.filter(r => r.paid < r.totalCost);
  const selectedRes = unpaidReservations.find(r => r.id === selectedResId) || null;

  function validateForm(): boolean {
    let valid = true;

    if (!selectedRes) return false;

    const maxAllowed = selectedRes.totalCost - selectedRes.paid;
    const amountNum = Number(amount);

    const amountCheck = validateAmount(amountNum, "المبلغ المدفوع", 1, maxAllowed);
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
    formData.append("reservationId", selectedResId);
    formData.append("amount", amount);
    formData.append("method", method);
    formData.append("note", note);

    const res = await addPayment(formData);
    setPending(false);
    if (res.error) {
      setError(res.error);
    } else {
      setIsOpen(false);
      setSelectedResId("");
      setAmount("");
      setNote("");
    }
  }

  const formatCur = (num: number) => new Intl.NumberFormat('ar-SA').format(num) + ' ر.س';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-[#d4a853] to-[#b18532] text-[#06080d] px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <Plus size={18} /> سند قبض جديد
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 w-full max-w-lg relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => { setIsOpen(false); setSelectedResId(""); setError(null); }}
              className="absolute top-4 left-4 text-[#8b92a5] hover:text-white"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">إنشاء سند قبض جديد</h3>

            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm border border-red-500/30">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">الحجز المرتبط <span className="text-red-500">*</span></label>
                <select
                  value={selectedResId}
                  onChange={(e) => setSelectedResId(e.target.value)}
                  required
                  className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                >
                  <option value="">اختر الحجز...</option>
                  {unpaidReservations.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.client.name} - {r.chalet.name} (متبقي: {formatCur(r.totalCost - r.paid)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedRes && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-sm">
                  <div className="flex justify-between text-[#8b92a5] mb-1">
                    <span>إجمالي الحجز:</span>
                    <span className="text-white font-bold">{formatCur(selectedRes.totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-[#8b92a5] mb-1">
                    <span>المدفوع:</span>
                    <span className="text-emerald-500 font-bold">{formatCur(selectedRes.paid)}</span>
                  </div>
                  <div className="flex justify-between text-[#8b92a5]">
                    <span>المتبقي:</span>
                    <span className="text-red-400 font-bold">{formatCur(selectedRes.totalCost - selectedRes.paid)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">المبلغ المدفوع (ر.س) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (amountError) setAmountError("");
                    }}
                    onBlur={() => {
                      if (!selectedRes) return;
                      const maxAllowed = selectedRes.totalCost - selectedRes.paid;
                      const check = validateAmount(Number(amount), "المبلغ المدفوع", 1, maxAllowed);
                      if (!check.valid) setAmountError(check.message!);
                    }}
                    required
                    min="1"
                    max={selectedRes ? selectedRes.totalCost - selectedRes.paid : undefined}
                    className={`w-full bg-[var(--color-bg-input)] border ${amountError ? 'border-red-500' : 'border-[var(--color-border-subtle)]'} rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]`}
                    placeholder="0"
                  />
                  {amountError && <p className="text-red-400 text-xs mt-1">{amountError}</p>}
                </div>
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">طريقة الدفع <span className="text-red-500">*</span></label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    required
                    className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                  >
                    <option value="نقد">نقد</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="شبكة (مدى/Visa)">شبكة (مدى/Visa)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">ملاحظات (اختياري)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); setSelectedResId(""); setError(null); }}
                  className="flex-1 bg-[var(--color-bg-input)] text-white p-3 rounded-lg hover:bg-[var(--color-border-subtle)] transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={pending || !selectedRes}
                  className="flex-1 bg-[#d4a853] text-[#06080d] font-bold p-3 rounded-lg hover:bg-[#b18532] transition-colors disabled:opacity-50"
                >
                  {pending ? "جاري التسجيل..." : "تسجيل الدفعة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
