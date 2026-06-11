"use client";

import { useState } from "react";
import { Shield, X } from "lucide-react";
import { updateUser } from "@/app/actions";
import { validateName } from "@/lib/validation";

type User = {
  id: string;
  name: string;
  role: string;
};

export default function EditUserForm({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);

  // Errors State
  const [nameError, setNameError] = useState("");

  function validateForm(): boolean {
    let valid = true;
    const nameCheck = validateName(name, "الاسم الكامل");
    if (!nameCheck.valid) {
      setNameError(nameCheck.message!);
      valid = false;
    } else {
      setNameError("");
    }
    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("role", role);

    const res = await updateUser(user.id, formData);
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
        title="تعديل الصلاحيات"
      >
        <Shield size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => { setIsOpen(false); setError(null); }}
              className="absolute top-4 left-4 text-[#8b92a5] hover:text-white"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">تعديل المستخدم: {user.name}</h3>

            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">الاسم الكامل <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  onBlur={() => {
                    const check = validateName(name, "الاسم الكامل");
                    if (!check.valid) setNameError(check.message!);
                  }}
                  required
                  className={`w-full bg-[var(--color-bg-input)] border ${nameError ? 'border-red-500' : 'border-[var(--color-border-subtle)]'} rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]`}
                />
                {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
              </div>

              <div>
                <label className="block text-sm text-[#8b92a5] mb-1 flex items-center gap-1">
                  <Shield size={14} /> الصلاحية (الدور)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={user.role === 'admin'}
                  className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853] disabled:opacity-50"
                >
                  {user.role === 'admin' && <option value="admin">مدير النظام</option>}
                  <option value="reservation_manager">مدير الحجوزات</option>
                  <option value="accountant">محاسب</option>
                  <option value="receptionist">موظف استقبال</option>
                  <option value="maintenance">فني صيانة</option>
                </select>
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
