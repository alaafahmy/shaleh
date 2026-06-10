"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addReservation } from "@/app/actions";
import { validateAmount, validateDateRange } from "@/lib/validation";

type Client = { id: string; name: string };
type Chalet = { id: string; name: string; pricePerNight: number };

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
        if (ch && !totalPrice) {
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
        className="bg-gradient-to-r from-[#d4a853] to-[#b18532] text-[#06080d] px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <Plus size={18} /> إضافة حجز جديد
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 w-full max-w-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => { setIsOpen(false); setError(null); }}
              className="absolute top-4 left-4 text-[#8b92a5] hover:text-white"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">إنشاء حجز جديد</h3>
            
            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm font-bold border border-red-500/30">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">العميل <span className="text-red-500">*</span></label>
                  <select 
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required 
                    className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                  >
                    <option value="">اختر العميل...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">الشاليه <span className="text-red-500">*</span></label>
                  <select 
                    value={chaletId}
                    onChange={(e) => handleDateChange(checkIn, checkOut, e.target.value)}
                    required 
                    className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]"
                  >
                    <option value="">اختر الشاليه...</option>
                    {chalets.map(c => <option key={c.id} value={c.id}>{c.name} ({c.pricePerNight} ر.س/ليلة)</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">تاريخ الدخول <span className="text-red-500">*</span></label>
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
                    className={`w-full bg-[var(--color-bg-input)] border ${dateError ? 'border-red-500' : 'border-[var(--color-border-subtle)]'} rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853] [color-scheme:dark]`} 
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">تاريخ الخروج <span className="text-red-500">*</span></label>
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
                    className={`w-full bg-[var(--color-bg-input)] border ${dateError ? 'border-red-500' : 'border-[var(--color-border-subtle)]'} rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853] [color-scheme:dark]`} 
                  />
                </div>
              </div>
              {dateError && <p className="text-red-400 text-xs mt-1">{dateError}</p>}

              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">إجمالي المبلغ المطلوب (ر.س) <span className="text-red-500">*</span></label>
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
                  className={`w-full bg-[var(--color-bg-input)] border ${priceError ? 'border-red-500' : 'border-[var(--color-border-subtle)]'} rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]`} 
                  placeholder="مثال: 3000" 
                />
                {priceError && <p className="text-red-400 text-xs mt-1">{priceError}</p>}
              </div>

              <div>
                <label className="block text-sm text-[#8b92a5] mb-1">ملاحظات الحجز</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2} 
                  className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4a853]" 
                  placeholder="طلبات خاصة..."
                ></textarea>
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
                  {pending ? "جاري التحقق..." : "تأكيد الحجز"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
