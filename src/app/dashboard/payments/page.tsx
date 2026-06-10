import { prisma } from "@/lib/prisma";
import { Receipt, FileText } from "lucide-react";
import AddPaymentForm from "@/components/AddPaymentForm";

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: {
      reservation: {
        include: { client: true, chalet: true }
      }
    },
    orderBy: { date: 'desc' }
  });

  // Fetch reservations for the "add payment" form
  const reservations = await prisma.reservation.findMany({
    where: { status: { in: ['معلق', 'مؤكد'] } },
    include: {
      client: true,
      chalet: true,
      payments: true,
    },
  });

  // Build list with paid amount calculated
  const reservationOptions = reservations.map(r => ({
    id: r.id,
    client: { name: r.client.name },
    chalet: { name: r.chalet.name },
    totalCost: r.totalCost,
    paid: r.payments.reduce((s, p) => s + p.amount, 0),
  }));

  const formatCur = (num: number) => new Intl.NumberFormat('ar-SA').format(num) + ' ر.س';
  const formatDate = (date: Date) => date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'نقد':
        return <span className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">نقد</span>;
      case 'تحويل بنكي':
        return <span className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">تحويل بنكي</span>;
      default:
        return <span className="bg-purple-500/20 text-purple-500 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/30">{method}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="bg-emerald-500/20 text-emerald-500 p-2 rounded-lg"><Receipt size={24} /></span> المدفوعات (سندات القبض)
        </h2>
        <AddPaymentForm reservations={reservationOptions} />
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#d4a853] text-[#06080d]">
              <tr>
                <th className="px-6 py-4 font-bold">رقم السند</th>
                <th className="px-6 py-4 font-bold">رقم الحجز</th>
                <th className="px-6 py-4 font-bold">العميل</th>
                <th className="px-6 py-4 font-bold">الشاليه</th>
                <th className="px-6 py-4 font-bold">المبلغ</th>
                <th className="px-6 py-4 font-bold">طريقة الدفع</th>
                <th className="px-6 py-4 font-bold">التاريخ</th>
                <th className="px-6 py-4 font-bold">ملاحظات</th>
                <th className="px-6 py-4 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] text-[#f5f5f5]">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-[var(--color-bg-input)]/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#d4a853]">{p.id.slice(-6)}</td>
                  <td className="px-6 py-4 text-[#8b92a5]">{p.reservationId.slice(-6)}</td>
                  <td className="px-6 py-4 font-bold">{p.reservation.client.name}</td>
                  <td className="px-6 py-4">{p.reservation.chalet.name}</td>
                  <td className="px-6 py-4 font-bold text-emerald-500">{formatCur(p.amount)}</td>
                  <td className="px-6 py-4">{getMethodBadge(p.method)}</td>
                  <td className="px-6 py-4">{formatDate(p.date)}</td>
                  <td className="px-6 py-4 text-[#8b92a5] max-w-[150px] truncate">{p.note || '—'}</td>
                  <td className="px-6 py-4">
                    <button className="p-2 bg-[var(--color-bg-input)] rounded-md text-[#cacedb] hover:text-blue-500 transition-colors" title="طباعة السند">
                      <FileText size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {payments.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-[#8b92a5]">
                    <div className="text-4xl mb-4">💰</div>
                    <h4 className="text-lg font-bold text-white mb-2">لا توجد مدفوعات</h4>
                    <p>المدفوعات المسجلة ستظهر هنا</p>
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
