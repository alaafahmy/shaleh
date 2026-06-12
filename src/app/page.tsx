"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, Palmtree } from "lucide-react";

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="flex-1 flex items-center justify-center w-full my-8">
        <div className="glass-panel w-full max-w-md p-8 relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-[-50px] left-[-50px] w-[150px] h-[150px] bg-[#d4a853] rounded-full blur-[80px] opacity-20 pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-[150px] h-[150px] bg-[#3b82f6] rounded-full blur-[80px] opacity-10 pointer-events-none" />

        {/* Top Right Logo & System Name */}
        <div className="absolute top-8 right-8 flex items-center justify-start gap-3 z-10 animate-fade-in">
          <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-dark)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--color-brand-glow)]">
            <Palmtree className="text-white w-6 h-6" />
          </div>
          <div className="text-right">
            <h1 className="text-sm font-bold text-white tracking-wide">نظام إدارة الشاليهات</h1>
            <p className="text-[10px] text-[var(--color-ui-text-muted)] uppercase tracking-widest">Alaa Soft</p>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-right mb-10 mt-20 relative z-10">
          <h2 className="text-3xl font-bold text-white mb-3 animate-fade-in">مرحباً بعودتك</h2>
          <p className="text-sm text-[var(--color-ui-text-muted)] animate-fade-in" style={{ animationDelay: '100ms' }}>
            قم بتسجيل الدخول للوصول الى لوحة التحكم
          </p>
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
                  const val = e.target.value;
                  // السماح بالحروف الإنجليزية والأرقام فقط
                  if (/^[a-zA-Z0-9_.]*$/.test(val)) {
                    setUsername(val);
                    setUsernameError("");
                  }
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
            className="w-full btn-primary py-3.5 px-4 flex items-center justify-center gap-2"
          >
            {pending ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                جاري التحقق...
              </>
            ) : "تسجيل الدخول"}
          </button>

          <p className="text-center text-[#8b92a5] text-xs mt-4">
            للتجربة: admin / admin123
          </p>
        </form>
      </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 pb-4 pt-8 text-center text-[10px] text-white/30 tracking-widest uppercase animate-fade-in relative z-10 w-full">
        صنع بواسطة Alaa Soft
      </div>
    </div>
  );
}
