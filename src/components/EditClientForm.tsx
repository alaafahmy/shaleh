"use client";

import { useState } from "react";
import { Edit, X } from "lucide-react";
import { updateClient } from "@/app/actions";
import { validateName, validateSaudiPhone, validateSaudiNationalId, formatPhoneInput, formatNationalIdInput } from "@/lib/validation";

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

  // Form State
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [nationalId, setNationalId] = useState(client.nationalId || "");
  const [notes, setNotes] = useState(client.notes || "");

  // Errors State
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [nationalIdError, setNationalIdError] = useState("");

  function validateForm(): boolean {
    let valid = true;

    const nameCheck = validateName(name, "اسم العميل");
    if (!nameCheck.valid) {
      setNameError(nameCheck.message!);
      valid = false;
    } else {
      setNameError("");
    }

    const phoneCheck = validateSaudiPhone(phone);
    if (!phoneCheck.valid) {
      setPhoneError(phoneCheck.message!);
      valid = false;
    } else {
      setPhoneError("");
    }

    const idCheck = validateSaudiNationalId(nationalId);
    if (!idCheck.valid) {
      setNationalIdError(idCheck.message!);
      valid = false;
    } else {
      setNationalIdError("");
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
    formData.append("phone", phone);
    formData.append("nationalId", nationalId);
    formData.append("notes", notes);

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
          <div className="glass-panel p-6 w-full max-w-lg relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 left-4 text-[#8b92a5] hover:text-white"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">تعديل بيانات العميل</h3>

            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">اسم العميل الثلاثي <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  onBlur={() => {
                    const check = validateName(name, "اسم العميل");
                    if (!check.valid) setNameError(check.message!);
                  }}
                  required
                  className={`w-full bg-[var(--color-bg-input)] border ${nameError ? 'border-red-500' : 'border-[var(--color-border-subtle)]'} rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]`}
                />
                {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">رقم الجوال <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const val = formatPhoneInput(e.target.value);
                      setPhone(val);
                      if (phoneError) setPhoneError("");
                    }}
                    onBlur={() => {
                      const check = validateSaudiPhone(phone);
                      if (!check.valid) setPhoneError(check.message!);
                    }}
                    required
                    className={`w-full bg-[var(--color-bg-input)] border ${phoneError ? 'border-red-500' : 'border-[var(--color-border-subtle)]'} rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]`}
                    dir="ltr"
                    maxLength={10}
                  />
                  {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
                </div>
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">رقم الهوية (اختياري)</label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => {
                      const val = formatNationalIdInput(e.target.value);
                      setNationalId(val);
                      if (nationalIdError) setNationalIdError("");
                    }}
                    onBlur={() => {
                      const check = validateSaudiNationalId(nationalId);
                      if (!check.valid) setNationalIdError(check.message!);
                    }}
                    className={`w-full bg-[var(--color-bg-input)] border ${nationalIdError ? 'border-red-500' : 'border-[var(--color-border-subtle)]'} rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]`}
                    dir="ltr"
                    maxLength={10}
                  />
                  {nationalIdError && <p className="text-red-400 text-xs mt-1">{nationalIdError}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">ملاحظات عن العميل</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
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
