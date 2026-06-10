"use client";

import { useState } from "react";
import { Edit, X } from "lucide-react";
import { updateChalet } from "@/app/actions";

type Chalet = {
  id: string;
  name: string;
  type: string;
  pricePerNight: number;
  description: string | null;
  status: string;
};

export default function EditChaletForm({ chalet }: { chalet: Chalet }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const res = await updateChalet(chalet.id, formData);
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
        className="p-2 bg-[var(--color-bg-input)] rounded-md text-[#cacedb] hover:text-[#d4a853] transition-colors"
        title="تعديل"
      >
        <Edit size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 w-full max-w-lg relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 left-4 text-[#8b92a5] hover:text-white"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">تعديل الشاليه: {chalet.name}</h3>

            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">اسم الشاليه</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={chalet.name}
                  className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">نوع الشاليه</label>
                  <select
                    name="type"
                    defaultValue={chalet.type}
                    className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                  >
                    <option value="صغير (VVIP)">صغير (VVIP)</option>
                    <option value="متوسط (عائلي)">متوسط (عائلي)</option>
                    <option value="كبير (مرافق متعددة)">كبير (مرافق متعددة)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">الحالة</label>
                  <select
                    name="status"
                    defaultValue={chalet.status}
                    className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                  >
                    <option value="متاح">متاح</option>
                    <option value="محجوز">محجوز</option>
                    <option value="تحت الصيانة">تحت الصيانة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">سعر الليلة الأساسي (ر.س)</label>
                <input
                  type="number"
                  name="pricePerNight"
                  required
                  defaultValue={chalet.pricePerNight}
                  className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">وصف المرفق</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={chalet.description || ""}
                  className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-[var(--color-bg-input)] text-white p-3 rounded-lg hover:bg-[var(--color-border-subtle)] transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 bg-[#d4a853] text-[#06080d] font-bold p-3 rounded-lg hover:bg-[#b18532] transition-colors disabled:opacity-50"
                >
                  {pending ? "جاري الحفظ..." : "حفظ التعديلات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
