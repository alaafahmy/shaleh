"use client";

import { useState } from "react";
import { Edit, X } from "lucide-react";
import { updateClient } from "@/app/actions";

type Client = {
  id: string;
  name: string;
  phone: string;
  nationalId: string | null;
  notes: string | null;
};

export default function EditClientForm({ client }: { client: Client }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const res = await updateClient(client.id, formData);
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
            <h3 className="text-xl font-bold text-white mb-6">تعديل بيانات العميل</h3>

            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">اسم العميل الثلاثي</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={client.name}
                  className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">رقم الجوال</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    defaultValue={client.phone}
                    className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">رقم الهوية (اختياري)</label>
                  <input
                    type="text"
                    name="nationalId"
                    defaultValue={client.nationalId || ""}
                    className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">ملاحظات عن العميل</label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={client.notes || ""}
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
