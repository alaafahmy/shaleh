import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import ProfitsClient from "@/components/ProfitsClient";

export default async function ProfitsPage() {
  const user = await requirePermission("view_profit_analysis");
  const [payments, expenses, reservations] = await Promise.all([
    prisma.payment.findMany({ select: { amount: true, date: true } }),
    prisma.expense.findMany({ select: { amount: true, date: true } }),
    prisma.reservation.findMany({
      where: { status: { in: ['معلق', 'مؤكد'] } },
      include: { payments: true },
    }),
  ]);

  const canExport = hasPermission(user.role, "export_reports");

  return (
    <ProfitsClient 
      payments={payments} 
      expenses={expenses} 
      reservations={reservations} 
      canExport={canExport} 
    />
  );
}
