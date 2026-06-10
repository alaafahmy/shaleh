import { prisma } from "@/lib/prisma";
import { CalendarDays, Eye } from "lucide-react";
import AddReservationForm from "@/components/AddReservationForm";
import ReservationActionButtons from "@/components/ReservationActionButtons";

export const dynamic = 'force-dynamic';

export default async function ReservationsPage() {
  const reservations = await prisma.reservation.findMany({
    include: {
      client: true,
      chalet: true,
      payments: true,
    },
    orderBy: { checkIn: 'desc' }
  });

  const clients = await prisma.client.findMany({ select: { id: true, name: true } });
  const chalets = await prisma.chalet.findMany({ select: { id: true, name: true, pricePerNight: true } });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'مؤكد':
        return <span className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">مؤكد</span>;
      case 'معلق':
        return <span className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/30">معلق</span>;
      case 'مكتمل':
        return <span className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">مكتمل</span>;
      case 'ملغي':
        return <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">ملغي</span>;
      default:
        return <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs font-bold border border-gray-500/30">{status}</span>;
    }
  };

  const formatCur = (num: number) => new Intl.NumberFormat('ar-SA').format(num) + ' ر.س';
  const formatDate = (date: Date) => date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="bg-[#d4a853]/20 text-[#d4a853] p-2 rounded-lg"><CalendarDays size={24} /></span> إدارة الحجوزات
        </h2>
        <AddReservationForm clients={clients} chalets={chalets} />
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#d4a853] text-[#06080d]">
              <tr>
                <th className="px-6 py-4 font-bold">رقم الحجز</th>
                <th className="px-6 py-4 font-bold">العميل</th>
                <th className="px-6 py-4 font-bold">الشاليه</th>
                <th className="px-6 py-4 font-bold">تاريخ الدخول</th>
                <th className="px-6 py-4 font-bold">تاريخ الخروج</th>
                <th className="px-6 py-4 font-bold">التكلفة الإجمالية</th>
                <th className="px-6 py-4 font-bold">المدفوع</th>
                <th className="px-6 py-4 font-bold">الحالة</th>
                <th className="px-6 py-4 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] text-[#f5f5f5]">
              {reservations.map(r => {
                const paid = r.payments.reduce((sum, p) => sum + p.amount, 0);
                const remaining = r.totalCost - paid;
                
                return (
                  <tr key={r.id} className="hover:bg-[var(--color-bg-input)]/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#d4a853]">{r.id.slice(-6)}</td>
                    <td className="px-6 py-4 font-bold">{r.client.name}</td>
                    <td className="px-6 py-4">{r.chalet.name}</td>
                    <td className="px-6 py-4">{formatDate(r.checkIn)}</td>
                    <td className="px-6 py-4">{formatDate(r.checkOut)}</td>
                    <td className="px-6 py-4 font-bold">{formatCur(r.totalCost)}</td>
                    <td className="px-6 py-4">
                      <span className={remaining > 0 ? "text-red-400" : "text-emerald-500"}>
                        {formatCur(paid)}
                      </span>
                      {remaining > 0 && <div className="text-xs text-[#8b92a5] mt-1">متبقي: {formatCur(remaining)}</div>}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 bg-[var(--color-bg-input)] rounded-md text-[#cacedb] hover:text-[#d4a853] transition-colors" title="تفاصيل">
                          <Eye size={16} />
                        </button>
                        <ReservationActionButtons id={r.id} status={r.status} />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {reservations.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-[#8b92a5]">
                    <div className="text-4xl mb-4">📋</div>
                    <h4 className="text-lg font-bold text-white mb-2">لا توجد حجوزات</h4>
                    <p>انقر على "إضافة حجز" للبدء</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
