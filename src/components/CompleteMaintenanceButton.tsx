"use client";

import { useState } from "react";
import { CheckCircle, X } from "lucide-react";
import { completeMaintenance } from "@/app/actions";

export default function CompleteMaintenanceButton({ id }: { id: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setPending(true);
    setError(null);
    const res = await completeMaintenance(id);
    setPending(false);
    if (res.error) {
      setError(res.error);
    } else {
      setIsOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 bg-[var(--color-bg-input)] rounded-md text-[#cacedb] hover:text-emerald-500 transition-colors"
        title="إنهاء الصيانة"
      >
        <CheckCircle size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 w-full max-w-sm relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 left-4 text-[#8b92a5] hover:text-white"
            >
              <X size={24} />
            </button>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-white mb-2">إنهاء طلب الصيانة</h3>
              <p className="text-[#8b92a5] text-sm">هل تريد تأكيد إنهاء هذا الطلب؟ سيتم تحديث حالة الشاليه إلى "متاح" تلقائياً.</p>
            </div>

            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-[var(--color-bg-input)] text-white p-3 rounded-lg hover:bg-[var(--color-border-subtle)] transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleComplete}
                disabled={pending}
                className="flex-1 bg-emerald-600 text-white font-bold p-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {pending ? "جاري التحديث..." : "تأكيد الإنهاء"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
