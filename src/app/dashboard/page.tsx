import { prisma } from "@/lib/prisma";
import { Home, ClipboardList, Users, TrendingUp, TrendingDown, LineChart, Wrench, AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [
    chaletsCount,
    activeReservationsCount,
    clientsCount,
    availableChalets,
    underMaintenanceCount,
    payments,
    expenses,
    recentReservations,
    pendingMaintenance,
  ] = await Promise.all([
    prisma.chalet.count(),
    prisma.reservation.count({ where: { status: { in: ['معلق', 'مؤكد'] } } }),
    prisma.client.count(),
    prisma.chalet.count({ where: { status: 'متاح' } }),
    prisma.chalet.count({ where: { status: 'تحت الصيانة' } }),
    prisma.payment.findMany({ select: { amount: true } }),
    prisma.expense.findMany({ select: { amount: true } }),
    prisma.reservation.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { name: true } }, chalet: { select: { name: true } }, payments: true },
    }),
    prisma.maintenance.findMany({
      where: { status: 'جارية' },
      include: { chalet: { select: { name: true } } },
      take: 5,
    }),
  ]);

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;

  // الديون المتبقية
  const totalUnpaid = recentReservations.reduce((sum, r) => {
    if (r.status === 'ملغي' || r.status === 'مكتمل') return sum;
    const paid = r.payments.reduce((s, p) => s + p.amount, 0);
    return sum + Math.max(0, r.totalCost - paid);
  }, 0);

  const formatCur = (num: number) => new Intl.NumberFormat('ar-SA').format(Math.round(num)) + ' ر.س';
  const formatDate = (date: Date) => date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'مؤكد': return <span className="bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded-full text-xs font-bold">مؤكد</span>;
      case 'معلق': return <span className="bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full text-xs font-bold">معلق</span>;
      case 'مكتمل': return <span className="bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full text-xs font-bold">مكتمل</span>;
      case 'ملغي': return <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full text-xs font-bold">ملغي</span>;
      default: return null;
    }
  };

  const occupancyRate = chaletsCount > 0 ? Math.round((activeReservationsCount / chaletsCount) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* تنبيه الصيانة إذا وجد */}
      {pendingMaintenance.length > 0 && (
        <div className="glass-panel p-4 border-orange-500/30 bg-orange-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-orange-500"><Wrench size={20} /></div>
            <div>
              <div className="font-bold text-white text-sm">{pendingMaintenance.length} طلب(ات) صيانة جارية</div>
              <div className="text-[#8b92a5] text-xs">
                {pendingMaintenance.map(m => m.chalet.name).join(' • ')}
              </div>
            </div>
          </div>
          <a href="/dashboard/maintenance" className="text-orange-400 text-xs hover:underline">عرض التفاصيل ←</a>
        </div>
      )}

      {/* بطاقات الإحصاءات */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

        <div className="glass-panel p-5 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-[#d4a853]"></div>
          <div className="w-10 h-10 rounded-lg bg-[#d4a853]/20 flex items-center justify-center mb-3">
            <Home className="text-[#d4a853]" size={20} />
          </div>
          <div className="text-2xl font-bold text-white">{chaletsCount}</div>
          <div className="text-[#8b92a5] text-xs mt-1">الشاليهات</div>
          <div className="text-xs text-emerald-400 mt-1">{availableChalets} متاح</div>
        </div>

        <div className="glass-panel p-5 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
            <ClipboardList className="text-blue-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-white">{activeReservationsCount}</div>
          <div className="text-[#8b92a5] text-xs mt-1">الحجوزات النشطة</div>
          <div className="text-xs text-[#d4a853] mt-1">إشغال {occupancyRate}%</div>
        </div>

        <div className="glass-panel p-5 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-purple-500"></div>
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
            <Users className="text-purple-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-white">{clientsCount}</div>
          <div className="text-[#8b92a5] text-xs mt-1">العملاء</div>
        </div>

        <div className="glass-panel p-5 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3">
            <TrendingUp className="text-emerald-500" size={20} />
          </div>
          <div className="text-xl font-bold text-emerald-400">{formatCur(totalRevenue)}</div>
          <div className="text-[#8b92a5] text-xs mt-1">الإيرادات المحصّلة</div>
        </div>

        <div className="glass-panel p-5 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500"></div>
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center mb-3">
            <TrendingDown className="text-red-500" size={20} />
          </div>
          <div className="text-xl font-bold text-red-400">{formatCur(totalExpenses)}</div>
          <div className="text-[#8b92a5] text-xs mt-1">المصروفات</div>
        </div>

        <div className={`glass-panel p-5 flex flex-col relative overflow-hidden ${totalProfit >= 0 ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
          <div className={`absolute top-0 right-0 w-1.5 h-full ${totalProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${totalProfit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            <LineChart className={totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'} size={20} />
          </div>
          <div className={`text-xl font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCur(totalProfit)}</div>
          <div className="text-[#8b92a5] text-xs mt-1">صافي الربح</div>
        </div>

      </div>

      {/* الديون المتبقية */}
      {totalUnpaid > 0 && (
        <div className="glass-panel p-4 border-orange-500/20 bg-orange-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-400" size={20} />
            <div>
              <div className="font-bold text-white text-sm">ديون غير محصّلة من الحجوزات النشطة</div>
              <div className="text-xs text-[#8b92a5]">يجب تحصيلها قبل تسجيل الخروج</div>
            </div>
          </div>
          <div className="text-xl font-bold text-orange-400">{formatCur(totalUnpaid)}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* آخر الحجوزات */}
        <div className="glass-panel overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-[var(--color-border-subtle)]">
            <h3 className="text-lg font-bold text-white">آخر الحجوزات</h3>
            <a href="/dashboard/reservations" className="text-[#d4a853] text-xs hover:underline">عرض الكل ←</a>
          </div>
          <div className="divide-y divide-[var(--color-border-subtle)]">
            {recentReservations.length === 0 ? (
              <div className="py-10 text-center text-[#8b92a5] text-sm">لا توجد حجوزات مسجّلة بعد</div>
            ) : (
              recentReservations.map(r => {
                const paid = r.payments.reduce((s, p) => s + p.amount, 0);
                const remaining = r.totalCost - paid;
                return (
                  <div key={r.id} className="p-4 hover:bg-[var(--color-bg-input)]/30 transition-colors flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white text-sm">{r.client.name}</div>
                      <div className="text-[#8b92a5] text-xs">{r.chalet.name} • {formatDate(r.checkIn)}</div>
                    </div>
                    <div className="text-left flex flex-col items-end gap-1">
                      {getStatusBadge(r.status)}
                      <div className="text-xs">
                        {remaining > 0.01 && r.status !== 'ملغي' ? (
                          <span className="text-red-400">متبقي: {formatCur(remaining)}</span>
                        ) : r.status !== 'ملغي' ? (
                          <span className="text-emerald-500">مسدّد ✓</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* التنبيهات والحالة */}
        <div className="glass-panel overflow-hidden">
          <div className="p-5 border-b border-[var(--color-border-subtle)]">
            <h3 className="text-lg font-bold text-white">حالة المرافق والتنبيهات</h3>
          </div>
          <div className="p-5 space-y-4">

            {/* نسبة الإشغال */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#8b92a5]">نسبة الإشغال</span>
                <span className="text-[#d4a853] font-bold">{occupancyRate}%</span>
              </div>
              <div className="w-full bg-[var(--color-bg-input)] rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#b18532] to-[#d4a853] transition-all"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#8b92a5] mt-1">
                <span>{activeReservationsCount} مشغول</span>
                <span>{chaletsCount} إجمالي</span>
              </div>
            </div>

            <hr className="border-[var(--color-border-subtle)]" />

            {/* حالة الشاليهات */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">{availableChalets}</div>
                <div className="text-xs text-[#8b92a5]">متاح</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {chaletsCount - availableChalets - underMaintenanceCount}
                </div>
                <div className="text-xs text-[#8b92a5]">محجوز</div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-400">{underMaintenanceCount}</div>
                <div className="text-xs text-[#8b92a5]">صيانة</div>
              </div>
            </div>

            {/* طلبات الصيانة الجارية */}
            {pendingMaintenance.length > 0 && (
              <>
                <hr className="border-[var(--color-border-subtle)]" />
                <div>
                  <div className="text-sm text-[#8b92a5] mb-2">طلبات صيانة جارية:</div>
                  {pendingMaintenance.map(m => (
                    <div key={m.id} className="flex items-center gap-2 py-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span className="text-sm text-white">{m.chalet.name}</span>
                      <span className="text-xs text-[#8b92a5]">— {m.type}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
