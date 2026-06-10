"use client";

import { useState } from "react";
import { CheckCircle, XCircle, LogOut, X } from "lucide-react";
import { updateReservationStatus } from "@/app/actions";

type Action = "confirm" | "checkout" | "cancel";

interface ReservationActionButtonsProps {
  id: string;
  status: string;
}

export default function ReservationActionButtons({ id, status }: ReservationActionButtonsProps) {
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [confirmAction, setConfirmAction] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: Action) {
    const statusMap: Record<Action, string> = {
      confirm: "مؤكد",
      checkout: "مكتمل",
      cancel: "ملغي",
    };

    setPendingAction(action);
    setError(null);
    const res = await updateReservationStatus(id, statusMap[action]);
    setPendingAction(null);
    setConfirmAction(null);
    if (res.error) setError(res.error);
  }

  const actionLabels: Record<Action, string> = {
    confirm: "تأكيد الحجز",
    checkout: "تسجيل الخروج",
    cancel: "إلغاء الحجز",
  };

  const actionColors: Record<Action, string> = {
    confirm: "bg-emerald-600 hover:bg-emerald-700",
    checkout: "bg-blue-600 hover:bg-blue-700",
    cancel: "bg-red-600 hover:bg-red-700",
  };

  return (
    <>
      <div className="flex gap-2">
        {status === "معلق" && (
          <button
            onClick={() => setConfirmAction("confirm")}
            disabled={!!pendingAction}
            className="p-2 bg-[var(--color-bg-input)] rounded-md text-[#cacedb] hover:text-emerald-500 transition-colors disabled:opacity-50"
            title="تأكيد"
          >
            <CheckCircle size={16} />
          </button>
        )}
        {status === "مؤكد" && (
          <button
            onClick={() => setConfirmAction("checkout")}
            disabled={!!pendingAction}
            className="p-2 bg-[var(--color-bg-input)] rounded-md text-[#cacedb] hover:text-blue-500 transition-colors disabled:opacity-50"
            title="تسجيل خروج"
          >
            <LogOut size={16} />
          </button>
        )}
        {(status !== "مكتمل" && status !== "ملغي") && (
          <button
            onClick={() => setConfirmAction("cancel")}
            disabled={!!pendingAction}
            className="p-2 bg-[var(--color-bg-input)] rounded-md text-[#cacedb] hover:text-red-500 transition-colors disabled:opacity-50"
            title="إلغاء"
          >
            <XCircle size={16} />
          </button>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 w-full max-w-sm relative">
            <button
              onClick={() => { setConfirmAction(null); setError(null); }}
              className="absolute top-4 left-4 text-[#8b92a5] hover:text-white"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6">
              <div className="text-5xl mb-4">
                {confirmAction === "confirm" ? "✅" : confirmAction === "checkout" ? "🏁" : "❌"}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {actionLabels[confirmAction]}
              </h3>
              <p className="text-[#8b92a5] text-sm">
                هل أنت متأكد من هذا الإجراء؟
                {confirmAction === "cancel" && " لا يمكن التراجع عن الإلغاء."}
              </p>
            </div>

            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmAction(null); setError(null); }}
                className="flex-1 bg-[var(--color-bg-input)] text-white p-3 rounded-lg hover:bg-[var(--color-border-subtle)] transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleAction(confirmAction)}
                disabled={!!pendingAction}
                className={`flex-1 ${actionColors[confirmAction]} text-white font-bold p-3 rounded-lg transition-colors disabled:opacity-50`}
              >
                {pendingAction ? "جاري التحديث..." : "تأكيد"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
