"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  // تحقق مدخلات
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function validateInputs(): boolean {
    let valid = true;
    setUsernameError("");
    setPasswordError("");

    if (!username.trim()) {
      setUsernameError("اسم المستخدم مطلوب");
      valid = false;
    } else if (username.length < 2) {
      setUsernameError("اسم المستخدم على الأقل حرفين");
      valid = false;
    }

    if (!password) {
      setPasswordError("كلمة المرور مطلوبة");
      valid = false;
    } else if (password.length < 4) {
      setPasswordError("كلمة المرور على الأقل 4 أحرف");
      valid = false;
    }

    return valid;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setPending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // استبدال history لمنع العودة للخلف بعد تسجيل الدخول
        router.replace("/dashboard");
      } else {
        setError(data.error || "بيانات غير صحيحة");
      }
    } catch {
      setError("لا يمكن الاتصال بالخادم، تحقق من الاتصال بالإنترنت");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-[-50px] left-[-50px] w-[150px] h-[150px] bg-[#d4a853] rounded-full blur-[80px] opacity-20 pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-[150px] h-[150px] bg-[#3b82f6] rounded-full blur-[80px] opacity-10 pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-[#fbeea1] to-[#b18532] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-[#d4a853]/20">
            <span className="text-4xl">🏖️</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">نظام إدارة الشاليهات</h1>
          <p className="text-[#8b92a5] text-sm tracking-wide">Chalet Management System</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 relative z-10" noValidate>
          {/* اسم المستخدم */}
          <div>
            <label className="block text-sm font-medium text-[#cacedb] mb-2">اسم المستخدم</label>
            <div className="relative">
              <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b92a5]" />
              <input
                type="text"
                className={`glass-input w-full p-3 pr-10 ${usernameError ? "border-red-500/60" : ""}`}
                placeholder="أدخل اسم المستخدم"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError("");
                }}
                autoComplete="username"
                maxLength={30}
                dir="ltr"
              />
            </div>
            {usernameError && <p className="text-red-400 text-xs mt-1">{usernameError}</p>}
          </div>

          {/* كلمة المرور */}
          <div>
            <label className="block text-sm font-medium text-[#cacedb] mb-2">كلمة المرور</label>
            <div className="relative">
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b92a5]" />
              <input
                type={showPassword ? "text" : "password"}
                className={`glass-input w-full p-3 pr-10 pl-10 ${passwordError ? "border-red-500/60" : ""}`}
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                autoComplete="current-password"
                maxLength={50}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b92a5] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && <p className="text-red-400 text-xs mt-1">{passwordError}</p>}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-gradient-to-r from-[#d4a853] to-[#b18532] hover:from-[#fbeea1] hover:to-[#d4a853] text-[#06080d] font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#d4a853]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {pending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                جاري التحقق...
              </span>
            ) : "تسجيل الدخول"}
          </button>

          <p className="text-center text-[#8b92a5] text-xs mt-4">
            للتجربة: admin / admin123
          </p>
        </form>
      </div>
    </div>
  );
}
