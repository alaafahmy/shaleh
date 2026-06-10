"use client";

import { useState } from "react";
import { UserX } from "lucide-react";
import { toggleUserStatus } from "@/app/actions";

export default function ToggleUserStatusButton({ id, active }: { id: string; active: boolean }) {
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    setPending(true);
    await toggleUserStatus(id, active);
    setPending(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className={`p-2 bg-[var(--color-bg-input)] rounded-md transition-colors disabled:opacity-50 ${
        active ? "text-[#cacedb] hover:text-red-500" : "text-[#cacedb] hover:text-emerald-500"
      }`}
      title={active ? "إيقاف المستخدم" : "تفعيل المستخدم"}
    >
      <UserX size={16} />
    </button>
  );
}
