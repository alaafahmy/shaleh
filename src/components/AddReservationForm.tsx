"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addReservation } from "@/app/actions";
import { validateAmount, validateDateRange } from "@/lib/validation";

type Client = { id: string; name: string };
type Chalet = { id: string; name: string; pricePerNight: number; status?: string };

export default function AddReservationForm({ clients, chalets }: { clients: Client[], chalets: Chalet[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [clientId, setClientId] = useState("");
  const [chaletId, setChaletId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [notes, setNotes] = useState("");

  // Errors State
  const [dateError, setDateError] = useState("");
  const [priceError, setPriceError] = useState("");

  function validateForm(): boolean {
    let valid = true;

    const dateCheck = validateDateRange(checkIn, checkOut);
    if (!dateCheck.valid) {
      setDateError(dateCheck.message!);
      valid = false;
    } else {
      setDateError("");
    }

    const priceCheck = validateAmount(Number(totalPrice), "المبلغ الإجمالي");
    if (!priceCheck.valid) {
      setPriceError(priceCheck.message!);
      valid = false;
    } else {
      setPriceError("");
    }

    return valid;
  }

  // Calculate suggested price
  function handleDateChange(inDate: string, outDate: string, chId: string) {
    setCheckIn(inDate);
    setCheckOut(outDate);
    setChaletId(chId);

    if (inDate && outDate && chId) {
      const inD = new Date(inDate);
      const outD = new Date(outDate);
      if (outD > inD) {
        const nights = Math.ceil((outD.getTime() - inD.getTime()) / (1000 * 60 * 60 * 24));
        const ch = chalets.find(c => c.id === chId);
        if (ch) {
          setTotalPrice((ch.pricePerNight * nights).toString());
        }
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("clientId", clientId);
    formData.append("chaletId", chaletId);
    formData.append("checkIn", checkIn);
    formData.append("checkOut", checkOut);
    formData.append("totalPrice", totalPrice);
    formData.append("notes", notes);

    const res = await addReservation(formData);
    setPending(false);
    if (res.error) {
      setError(res.error);
    } else {
      setIsOpen(false);
      setClientId(""); setChaletId(""); setCheckIn(""); setCheckOut(""); setTotalPrice(""); setNotes("");
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-primary px-5 py-2.5 flex items-center gap-2"
      >
        <Plus size={18} /> إضافة حجز جديد
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel p-8 w-full max-w-2xl relative animate-scale-up">
            <button 
              onClick={() => { setIsOpen(false); setError(null); }}
              className="absolute top-5 left-5 text-[var(--color-ui-text-muted)] hover:text-white transition-colors bg-white/5 p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-400"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold text-white mb-8 tracking-wide">إنشاء حجز جديد</h3>
            
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-ui-text-secondary)] mb-2">العميل <span className="text-red-500">*</span></label>
                  <select 
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required 
                    className="w-full glass-input p-3.5 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a1a1aa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:left_1rem_center] bg-[length:0.65rem_auto]"
                  >
                    <option value="" className="bg-[var(--color-ui-bg-panel)] text-white">اختر العميل...</option>
                    {clients.map(c => <option key={c.id} value={c.id} className="bg-[var(--color-ui-bg-panel)] text-white">{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-ui-text-secondary)] mb-2">الشاليه <span className="text-red-500">*</span></label>
                  <select 
                    value={chaletId}
                    onChange={(e) => handleDateChange(checkIn, checkOut, e.target.value)}
                    required 
                    className="w-full glass-input p-3.5 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a1a1aa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:left_1rem_center] bg-[length:0.65rem_auto]"
                  >
                    <option value="" className="bg-[var(--color-ui-bg-panel)] text-white">اختر الشاليه...</option>
                    {chalets.map(c => (
                      <option key={c.id} value={c.id} disabled={c.status === "تحت الصيانة"} className="bg-[var(--color-ui-bg-panel)] text-white">
                        {c.name} ({c.pricePerNight} ر.س/ليلة) {c.status === "تحت الصيانة" ? "- 🛠️ تحت الصيانة" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-ui-text-secondary)] mb-2">تاريخ الدخول <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    value={checkIn}
                    onChange={(e) => {
                      handleDateChange(e.target.value, checkOut, chaletId);
                      if (dateError) setDateError("");
                    }}
                    onBlur={() => {
                      if (checkIn && checkOut) {
                        const check = validateDateRange(checkIn, checkOut);
                        if (!check.valid) setDateError(check.message!);
                      }
                    }}
                    required 
                    dir="ltr"
                    className={`w-full glass-input p-3.5 text-right [color-scheme:dark] ${dateError ? '!border-red-500 !shadow-[0_0_0_1px_rgba(239,68,68,0.2)]' : ''}`} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-ui-text-secondary)] mb-2">تاريخ الخروج <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    value={checkOut}
                    onChange={(e) => {
                      handleDateChange(checkIn, e.target.value, chaletId);
                      if (dateError) setDateError("");
                    }}
                    onBlur={() => {
                      if (checkIn && checkOut) {
                        const check = validateDateRange(checkIn, checkOut);
                        if (!check.valid) setDateError(check.message!);
                      }
                    }}
                    required 
                    dir="ltr"
                    className={`w-full glass-input p-3.5 text-right [color-scheme:dark] ${dateError ? '!border-red-500 !shadow-[0_0_0_1px_rgba(239,68,68,0.2)]' : ''}`} 
                  />
                </div>
              </div>
              {dateError && <p className="text-red-400 text-xs mt-1">{dateError}</p>}

              <div>
                <label className="block text-sm font-medium text-[var(--color-ui-text-secondary)] mb-2">إجمالي المبلغ المطلوب (ر.س) <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  value={totalPrice}
                  onChange={(e) => {
                    setTotalPrice(e.target.value);
                    if (priceError) setPriceError("");
                  }}
                  onBlur={() => {
                    const check = validateAmount(Number(totalPrice), "المبلغ الإجمالي");
                    if (!check.valid) setPriceError(check.message!);
                  }}
                  required 
                  min="1"
                  className={`w-full glass-input p-3.5 ${priceError ? '!border-red-500 !shadow-[0_0_0_1px_rgba(239,68,68,0.2)]' : ''}`} 
                  placeholder="مثال: 3000" 
                />
                {priceError && <p className="text-red-400 text-xs mt-1">{priceError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-ui-text-secondary)] mb-2">ملاحظات الحجز</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2} 
                  className="w-full glass-input p-3.5 resize-none" 
                  placeholder="طلبات خاصة..."
                ></textarea>
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => { setIsOpen(false); setError(null); }}
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
                      جاري التحقق...
                    </span>
                  ) : "تأكيد الحجز"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
