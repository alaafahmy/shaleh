"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addChalet } from "@/app/actions";
import { validateName, validateChaletId, validateAmount, formatChaletIdInput } from "@/lib/validation";

export default function AddChaletForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("صغير (VVIP)");
  const [pricePerNight, setPricePerNight] = useState("");
  const [description, setDescription] = useState("");

  // Errors State
  const [idError, setIdError] = useState("");
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");

  function validateForm(): boolean {
    let valid = true;

    const idCheck = validateChaletId(id);
    if (!idCheck.valid) {
      setIdError(idCheck.message!);
      valid = false;
    } else {
      setIdError("");
    }

    const nameCheck = validateName(name, "اسم الشاليه");
    if (!nameCheck.valid) {
      setNameError(nameCheck.message!);
      valid = false;
    } else {
      setNameError("");
    }

    const priceNum = Number(pricePerNight);
    const priceCheck = validateAmount(priceNum, "سعر الليلة");
    if (!priceCheck.valid) {
      setPriceError(priceCheck.message!);
      valid = false;
    } else {
      setPriceError("");
    }

    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("id", id);
    formData.append("name", name);
    formData.append("type", type);
    formData.append("pricePerNight", pricePerNight);
    formData.append("description", description);

    const res = await addChalet(formData);
    setPending(false);
    if (res.error) {
      setError(res.error);
    } else {
      setId(""); setName(""); setType("صغير (VVIP)"); setPricePerNight(""); setDescription("");
      setIsOpen(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-[#d4a853] to-[#b18532] text-[#06080d] px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <Plus size={18} /> إضافة شاليه جديد
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
            <h3 className="text-xl font-bold text-white mb-6">إضافة شاليه جديد</h3>
            
            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">رقم الشاليه (المعرف) <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={id}
                  onChange={(e) => {
                    setId(formatChaletIdInput(e.target.value));
                    if (idError) setIdError("");
                  }}
                  onBlur={() => {
                    const check = validateChaletId(id);
                    if (!check.valid) setIdError(check.message!);
                  }}
                  required 
                  className={`w-full bg-[var(--color-bg-input)] border ${idError ? 'border-red-500' : 'border-[var(--color-border-subtle)]'} rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]`} 
                  placeholder="مثال: C001" 
                  dir="ltr"
                />
                {idError && <p className="text-red-400 text-xs mt-1">{idError}</p>}
              </div>
              
              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">اسم الشاليه <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  onBlur={() => {
                    const check = validateName(name, "اسم الشاليه");
                    if (!check.valid) setNameError(check.message!);
                  }}
                  required 
                  className={`w-full bg-[var(--color-bg-input)] border ${nameError ? 'border-red-500' : 'border-[var(--color-border-subtle)]'} rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]`} 
                  placeholder="شاليه الجوهرة..." 
                />
                {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">نوع الشاليه</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                  >
                    <option value="صغير (VVIP)">صغير (VVIP)</option>
                    <option value="متوسط (عائلي)">متوسط (عائلي)</option>
                    <option value="كبير (مرافق متعددة)">كبير (مرافق متعددة)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">سعر الليلة الأساسي <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    value={pricePerNight}
                    onChange={(e) => {
                      setPricePerNight(e.target.value);
                      if (priceError) setPriceError("");
                    }}
                    onBlur={() => {
                      const check = validateAmount(Number(pricePerNight), "سعر الليلة");
                      if (!check.valid) setPriceError(check.message!);
                    }}
                    required 
                    min="1"
                    className={`w-full bg-[var(--color-bg-input)] border ${priceError ? 'border-red-500' : 'border-[var(--color-border-subtle)]'} rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]`} 
                    placeholder="1500" 
                  />
                  {priceError && <p className="text-red-400 text-xs mt-1">{priceError}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">وصف المرفق</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3} 
                  className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]" 
                  placeholder="وصف إضافي..."
                ></textarea>
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
                  {pending ? "جاري الحفظ..." : "حفظ الشاليه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
