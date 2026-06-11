import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";
import AddClientForm from "@/components/AddClientForm";
import ClientList from "@/components/ClientList";
import ExportButton from "@/components/ExportButton";

export const dynamic = 'force-dynamic';

import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export default async function ClientsPage() {
  const user = await requirePermission("view_clients");
  const canViewCreator = ['admin', 'reservation_manager', 'accountant', 'receptionist'].includes(user.role);

  const clients = await prisma.client.findMany({
    where: { is_archived: false },
    include: {
      _count: {
        select: { reservations: true }
      },
      createdBy: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="bg-blue-500/20 text-blue-500 p-2 rounded-lg"><Users size={24} /></span> سجل العملاء
        </h2>
        <div className="flex gap-3">
          {hasPermission(user.role, "export_reports") && <ExportButton type="clients" />}
          <AddClientForm />
        </div>
      </div>

      <ClientList initialClients={clients} canViewCreator={canViewCreator} />
    </div>
  );
}
