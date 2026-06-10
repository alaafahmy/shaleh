"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addPayment } from "@/app/actions";

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
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);

  const unpaidReservations = reservations.filter(r => r.paid < r.totalCost);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const res = await addPayment(formData);
    setPending(false);
    if (res.error) {
      setError(res.error);
    } else {
      setIsOpen(false);
      setSelectedRes(null);
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
          <div className="glass-panel p-6 w-full max-w-lg relative">
            <button
              onClick={() => { setIsOpen(false); setSelectedRes(null); setError(null); }}
              className="absolute top-4 left-4 text-[#8b92a5] hover:text-white"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">إنشاء سند قبض جديد</h3>

            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm border border-red-500/30">{error}</div>}

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">الحجز المرتبط</label>
                <select
                  name="reservationId"
                  required
                  onChange={e => {
                    const r = reservations.find(r => r.id === e.target.value) || null;
                    setSelectedRes(r);
                  }}
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
                  <label className="block text-sm text-[#8b92a5] mb-1">المبلغ المدفوع (ر.س)</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="1"
                    max={selectedRes ? selectedRes.totalCost - selectedRes.paid : undefined}
                    className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">طريقة الدفع</label>
                  <select
                    name="method"
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
                  name="note"
                  className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); setSelectedRes(null); setError(null); }}
                  className="flex-1 bg-[var(--color-bg-input)] text-white p-3 rounded-lg hover:bg-[var(--color-border-subtle)] transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={pending}
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
