"use client";

import { useState } from "react";
import { Plus, X, Shield } from "lucide-react";
import { addUser } from "@/app/actions";
import { validateName, validateUsername, validatePassword } from "@/lib/validation";

export default function AddUserForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");

  // Errors State
  const [nameError, setNameError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function validateForm(): boolean {
    let valid = true;

    const nameCheck = validateName(name, "الاسم الكامل");
    if (!nameCheck.valid) {
      setNameError(nameCheck.message!);
      valid = false;
    } else {
      setNameError("");
    }

    const usernameCheck = validateUsername(username);
    if (!usernameCheck.valid) {
      setUsernameError(usernameCheck.message!);
      valid = false;
    } else {
      setUsernameError("");
    }

    const passCheck = validatePassword(password);
    if (!passCheck.valid) {
      setPasswordError(passCheck.message!);
      valid = false;
    } else {
      setPasswordError("");
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
    formData.append("username", username);
    formData.append("password", password);
    formData.append("role", role);

    const res = await addUser(formData);
    setPending(false);
    if (res.error) {
      setError(res.error);
    } else {
      setName(""); setUsername(""); setPassword(""); setRole("admin");
      setIsOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-[#d4a853] to-[#b18532] text-[#06080d] px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <Plus size={18} /> إضافة مستخدم
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
            <h3 className="text-xl font-bold text-white mb-6">إضافة مستخدم جديد</h3>

            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm border border-red-500/30">{error}</div>}

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
                  placeholder="محمد أحمد..."
                />
                {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">اسم المستخدم <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (usernameError) setUsernameError("");
                    }}
                    onBlur={() => {
                      const check = validateUsername(username);
                      if (!check.valid) setUsernameError(check.message!);
                    }}
                    required
                    className={`w-full bg-[var(--color-bg-input)] border ${usernameError ? 'border-red-500' : 'border-[var(--color-border-subtle)]'} rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]`}
                    placeholder="username"
                    dir="ltr"
                    maxLength={20}
                  />
                  {usernameError && <p className="text-red-400 text-xs mt-1">{usernameError}</p>}
                </div>
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">كلمة المرور <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    onBlur={() => {
                      const check = validatePassword(password);
                      if (!check.valid) setPasswordError(check.message!);
                    }}
                    required
                    className={`w-full bg-[var(--color-bg-input)] border ${passwordError ? 'border-red-500' : 'border-[var(--color-border-subtle)]'} rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]`}
                    placeholder="••••••••"
                    dir="ltr"
                    maxLength={50}
                  />
                  {passwordError && <p className="text-red-400 text-xs mt-1">{passwordError}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#8b92a5] mb-1 flex items-center gap-1">
                  <Shield size={14} /> الصلاحية (الدور)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                >
                  <option value="admin">مدير النظام</option>
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
                  {pending ? "جاري الإضافة..." : "إضافة المستخدم"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
