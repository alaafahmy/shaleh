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
        className="btn-primary px-5 py-2.5 flex items-center gap-2"
      >
        <Plus size={18} /> إضافة شاليه جديد
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel p-8 w-full max-w-lg relative animate-scale-up">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-5 left-5 text-[var(--color-ui-text-muted)] hover:text-white transition-colors bg-white/5 p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-400"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold text-white mb-8 tracking-wide">إضافة شاليه جديد</h3>
            
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ui-text-secondary)] mb-2">رقم الشاليه (المعرف) <span className="text-red-500">*</span></label>
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
                  className={`w-full glass-input p-3.5 ${idError ? '!border-red-500 !shadow-[0_0_0_1px_rgba(239,68,68,0.2)]' : ''}`} 
                  placeholder="مثال: C001" 
                  dir="ltr"
                />
                {idError && <p className="text-red-400 text-xs mt-1">{idError}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--color-ui-text-secondary)] mb-2">اسم الشاليه <span className="text-red-500">*</span></label>
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
                  className={`w-full glass-input p-3.5 ${nameError ? '!border-red-500 !shadow-[0_0_0_1px_rgba(239,68,68,0.2)]' : ''}`} 
                  placeholder="شاليه الجوهرة..." 
                />
                {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-ui-text-secondary)] mb-2">نوع الشاليه</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full glass-input p-3.5 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a1a1aa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:left_1rem_center] bg-[length:0.65rem_auto]"
                  >
                    <option value="صغير (VVIP)" className="bg-[var(--color-ui-bg-panel)] text-white">صغير (VVIP)</option>
                    <option value="متوسط (عائلي)" className="bg-[var(--color-ui-bg-panel)] text-white">متوسط (عائلي)</option>
                    <option value="كبير (مرافق متعددة)" className="bg-[var(--color-ui-bg-panel)] text-white">كبير (مرافق متعددة)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-ui-text-secondary)] mb-2">سعر الليلة الأساسي <span className="text-red-500">*</span></label>
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
                    className={`w-full glass-input p-3.5 ${priceError ? '!border-red-500 !shadow-[0_0_0_1px_rgba(239,68,68,0.2)]' : ''}`} 
                    placeholder="1500" 
                  />
                  {priceError && <p className="text-red-400 text-xs mt-1">{priceError}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-ui-text-secondary)] mb-2">وصف المرفق</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3} 
                  className="w-full glass-input p-3.5 resize-none" 
                  placeholder="وصف إضافي..."
                ></textarea>
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-[var(--color-ui-bg-input)] text-white p-3.5 rounded-xl hover:bg-[var(--color-ui-bg-panel-hover)] border border-[var(--color-ui-border-subtle)] transition-all duration-300 font-medium"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  disabled={pending}
                  className="flex-1 btn-primary p-3.5 disabled:opacity-50 flex items-center justify-center"
                >
                  {pending ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      جاري الحفظ...
                    </span>
                  ) : "حفظ الشاليه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
