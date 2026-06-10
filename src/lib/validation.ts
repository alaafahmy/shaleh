/**
 * مكتبة التحقق من صحة البيانات وفق المعايير السعودية
 * Saudi Arabia Input Validation Library
 */

// ── رقم الجوال السعودي ──────────────────────
// يجب أن يكون 10 أرقام ويبدأ بـ 05
export function validateSaudiPhone(phone: string): { valid: boolean; message?: string } {
  const cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return { valid: false, message: "رقم الجوال مطلوب" };
  if (cleaned.length !== 10) return { valid: false, message: "رقم الجوال يجب أن يكون 10 أرقام" };
  if (!cleaned.startsWith("05")) return { valid: false, message: "رقم الجوال يجب أن يبدأ بـ 05" };
  return { valid: true };
}

// ── رقم الهوية / الإقامة السعودية ──────────
// 10 أرقام — الهوية تبدأ بـ 1، الإقامة تبدأ بـ 2
// يطبق خوارزمية Luhn للتحقق
export function validateSaudiNationalId(id: string): { valid: boolean; message?: string } {
  if (!id) return { valid: true }; // اختياري
  const cleaned = id.replace(/\D/g, "");
  if (cleaned.length !== 10) return { valid: false, message: "رقم الهوية يجب أن يكون 10 أرقام" };
  if (!cleaned.startsWith("1") && !cleaned.startsWith("2")) {
    return { valid: false, message: "رقم الهوية يبدأ بـ 1 (مواطن) أو 2 (مقيم)" };
  }
  if (!luhnCheck(cleaned)) {
    return { valid: false, message: "رقم الهوية غير صحيح (تحقق من الأرقام)" };
  }
  return { valid: true };
}

// ── خوارزمية Luhn ────────────────────────────
function luhnCheck(num: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

// ── رقم الشاليه (المعرف) ────────────────────
// حروف وأرقام فقط، 2-10 أحرف
export function validateChaletId(id: string): { valid: boolean; message?: string } {
  if (!id) return { valid: false, message: "رقم الشاليه مطلوب" };
  if (id.length < 2 || id.length > 10) return { valid: false, message: "رقم الشاليه بين 2-10 أحرف" };
  if (!/^[A-Za-z0-9\u0600-\u06FF]+$/.test(id)) {
    return { valid: false, message: "رقم الشاليه يحتوي على حروف وأرقام فقط" };
  }
  return { valid: true };
}

// ── اسم النص (اسم الشاليه / العميل / المستخدم) ──
export function validateName(name: string, label = "الاسم", minLen = 2, maxLen = 50): { valid: boolean; message?: string } {
  if (!name?.trim()) return { valid: false, message: `${label} مطلوب` };
  if (name.trim().length < minLen) return { valid: false, message: `${label} على الأقل ${minLen} أحرف` };
  if (name.trim().length > maxLen) return { valid: false, message: `${label} لا يتجاوز ${maxLen} حرفاً` };
  return { valid: true };
}

// ── المبلغ المالي ─────────────────────────────
export function validateAmount(amount: number, label = "المبلغ", min = 1, max = 10_000_000): { valid: boolean; message?: string } {
  if (isNaN(amount) || amount === null || amount === undefined) return { valid: false, message: `${label} مطلوب` };
  if (amount <= 0) return { valid: false, message: `${label} يجب أن يكون أكبر من صفر` };
  if (amount < min) return { valid: false, message: `${label} الحد الأدنى هو ${min} ر.س` };
  if (amount > max) return { valid: false, message: `${label} الحد الأقصى هو ${max.toLocaleString("ar-SA")} ر.س` };
  return { valid: true };
}

// ── اسم المستخدم ──────────────────────────────
// حروف إنجليزية وأرقام و _ فقط، بدون مسافات
export function validateUsername(username: string): { valid: boolean; message?: string } {
  if (!username) return { valid: false, message: "اسم المستخدم مطلوب" };
  if (username.length < 3) return { valid: false, message: "اسم المستخدم على الأقل 3 أحرف" };
  if (username.length > 20) return { valid: false, message: "اسم المستخدم لا يتجاوز 20 حرفاً" };
  if (!/^[A-Za-z0-9_]+$/.test(username)) {
    return { valid: false, message: "اسم المستخدم: حروف إنجليزية، أرقام، أو _ فقط" };
  }
  return { valid: true };
}

// ── كلمة المرور ───────────────────────────────
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password) return { valid: false, message: "كلمة المرور مطلوبة" };
  if (password.length < 6) return { valid: false, message: "كلمة المرور على الأقل 6 أحرف" };
  if (password.length > 50) return { valid: false, message: "كلمة المرور لا تتجاوز 50 حرفاً" };
  return { valid: true };
}

// ── التاريخ ────────────────────────────────────
export function validateDateRange(checkIn: string, checkOut: string): { valid: boolean; message?: string } {
  if (!checkIn || !checkOut) return { valid: false, message: "التواريخ مطلوبة" };
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(inDate.getTime())) return { valid: false, message: "تاريخ الدخول غير صحيح" };
  if (isNaN(outDate.getTime())) return { valid: false, message: "تاريخ الخروج غير صحيح" };
  if (inDate < today) return { valid: false, message: "تاريخ الدخول لا يمكن أن يكون في الماضي" };
  if (outDate <= inDate) return { valid: false, message: "تاريخ الخروج يجب أن يكون بعد تاريخ الدخول" };

  const nights = Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));
  if (nights > 365) return { valid: false, message: "فترة الحجز لا تتجاوز 365 ليلة" };

  return { valid: true };
}

// ── دالة مساعدة: تنسيق رقم الجوال ───────────
export function formatPhoneInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

// ── دالة مساعدة: تنسيق رقم الهوية ───────────
export function formatNationalIdInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

// ── دالة مساعدة: تنسيق رقم الشاليه ──────────
export function formatChaletIdInput(value: string): string {
  return value.replace(/[^A-Za-z0-9\u0600-\u06FF]/g, "").slice(0, 10).toUpperCase();
}
