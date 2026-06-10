import { prisma } from "@/lib/prisma";
import { LineChart, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ProfitsPage() {
  const [payments, expenses, reservations] = await Promise.all([
    prisma.payment.findMany({ select: { amount: true, date: true } }),
    prisma.expense.findMany({ select: { amount: true, date: true } }),
    prisma.reservation.findMany({
      where: { status: { in: ['معلق', 'مؤكد'] } },
      include: { payments: true },
    }),
  ]);

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // الديون المتبقية (حجوزات نشطة لم تُسدَّد كاملاً)
  const totalUnpaid = reservations.reduce((sum, r) => {
    const paid = r.payments.reduce((s, p) => s + p.amount, 0);
    return sum + Math.max(0, r.totalCost - paid);
  }, 0);

  const formatCur = (num: number) => new Intl.NumberFormat('ar-SA').format(Math.round(num)) + ' ر.س';

  // ── حساب الأرباح الشهرية الحقيقية ──
  const now = new Date();
  const currentYear = now.getFullYear();

  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  // تجميع الإيرادات والمصروفات الشهرية
  const monthlyRevenue = Array(12).fill(0);
  const monthlyExpenses = Array(12).fill(0);

  payments.forEach(p => {
    const d = new Date(p.date);
    if (d.getFullYear() === currentYear) {
      monthlyRevenue[d.getMonth()] += p.amount;
    }
  });

  expenses.forEach(e => {
    const d = new Date(e.date);
    if (d.getFullYear() === currentYear) {
      monthlyExpenses[d.getMonth()] += e.amount;
    }
  });

  const monthlyProfit = monthlyRevenue.map((rev, i) => rev - monthlyExpenses[i]);

  // أعلى قيمة للرسم البياني
  const maxVal = Math.max(...monthlyRevenue, ...monthlyExpenses, 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="bg-[#d4a853]/20 text-[#d4a853] p-2 rounded-lg"><LineChart size={24} /></span>
          التقارير المالية والأرباح
        </h2>
        <div className="text-[#8b92a5] text-sm">سنة {currentYear}</div>
      </div>

      {/* بطاقات الملخص الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-emerald-500" size={20} />
            </div>
            <div className="text-[#8b92a5] text-sm">إجمالي الإيرادات المحصّلة</div>
          </div>
          <div className="text-3xl font-bold text-emerald-400">{formatCur(totalRevenue)}</div>
          <div className="text-xs text-[#8b92a5] mt-1">من {payments.length} دفعة مسجّلة</div>
        </div>

        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="text-red-500" size={20} />
            </div>
            <div className="text-[#8b92a5] text-sm">إجمالي المصروفات</div>
          </div>
          <div className="text-3xl font-bold text-red-400">{formatCur(totalExpenses)}</div>
          <div className="text-xs text-[#8b92a5] mt-1">من {expenses.length} سند صرف</div>
        </div>

        <div className={`glass-panel p-5 relative overflow-hidden ${netProfit >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
          <div className={`absolute top-0 left-0 w-full h-1 ${netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${netProfit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              <LineChart className={netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'} size={20} />
            </div>
            <div className="text-[#8b92a5] text-sm">صافي الربح</div>
          </div>
          <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {netProfit < 0 ? '-' : ''}{formatCur(Math.abs(netProfit))}
          </div>
          <div className="text-xs text-[#8b92a5] mt-1">
            نسبة الربح: {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
          </div>
        </div>

        <div className="glass-panel p-5 relative overflow-hidden border-orange-500/20">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="text-orange-500" size={20} />
            </div>
            <div className="text-[#8b92a5] text-sm">ديون متبقية (غير محصّلة)</div>
          </div>
          <div className="text-3xl font-bold text-orange-400">{formatCur(totalUnpaid)}</div>
          <div className="text-xs text-[#8b92a5] mt-1">من الحجوزات النشطة</div>
        </div>
      </div>

      {/* الرسم البياني الشهري الحقيقي */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-bold text-white mb-6">الإيرادات والمصروفات الشهرية — {currentYear}</h3>

        {/* مفتاح الألوان */}
        <div className="flex gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-[#8b92a5]">إيرادات</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-[#8b92a5]">مصروفات</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#d4a853]"></div>
            <span className="text-xs text-[#8b92a5]">صافي الربح</span>
          </div>
        </div>

        <div className="h-64 flex items-end gap-1 pb-8 border-b border-[var(--color-border-subtle)] relative overflow-x-auto">
          {monthNames.map((m, i) => {
            const rev = monthlyRevenue[i];
            const exp = monthlyExpenses[i];
            const profit = monthlyProfit[i];
            const revH = maxVal > 0 ? (rev / maxVal) * 100 : 0;
            const expH = maxVal > 0 ? (exp / maxVal) * 100 : 0;
            const isCurrentMonth = i === now.getMonth();

            return (
              <div key={m} className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 group ${isCurrentMonth ? 'opacity-100' : 'opacity-80'}`}>
                {/* أعمدة */}
                <div className="w-full flex items-end gap-0.5 h-52">
                  <div
                    className="flex-1 bg-gradient-to-t from-emerald-700 to-emerald-500 rounded-t-sm transition-all group-hover:brightness-125 relative"
                    style={{ height: `${revH}%`, minHeight: rev > 0 ? '4px' : '0' }}
                    title={`إيرادات: ${formatCur(rev)}`}
                  />
                  <div
                    className="flex-1 bg-gradient-to-t from-red-700 to-red-500 rounded-t-sm transition-all group-hover:brightness-125 relative"
                    style={{ height: `${expH}%`, minHeight: exp > 0 ? '4px' : '0' }}
                    title={`مصروفات: ${formatCur(exp)}`}
                  />
                </div>
                {/* tooltip */}
                <div className={`hidden group-hover:flex flex-col absolute bottom-12 bg-[#06080d] border border-[var(--color-border-subtle)] rounded-lg p-2 text-xs z-10 whitespace-nowrap shadow-xl`}>
                  <span className="text-emerald-400">إيرادات: {formatCur(rev)}</span>
                  <span className="text-red-400">مصروفات: {formatCur(exp)}</span>
                  <span className={profit >= 0 ? 'text-[#d4a853]' : 'text-red-300'}>
                    ربح: {profit >= 0 ? '' : '-'}{formatCur(Math.abs(profit))}
                  </span>
                </div>
                {/* اسم الشهر */}
                <div className={`text-xs mt-1 ${isCurrentMonth ? 'text-[#d4a853] font-bold' : 'text-[#8b92a5]'}`}>
                  {m.slice(0, 3)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* جدول الأرباح الشهرية التفصيلي */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border-subtle)]">
          <h3 className="text-lg font-bold text-white">تفاصيل الأرباح الشهرية</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#d4a853] text-[#06080d]">
              <tr>
                <th className="px-6 py-3 font-bold">الشهر</th>
                <th className="px-6 py-3 font-bold">الإيرادات</th>
                <th className="px-6 py-3 font-bold">المصروفات</th>
                <th className="px-6 py-3 font-bold">صافي الربح</th>
                <th className="px-6 py-3 font-bold">نسبة الربح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] text-[#f5f5f5]">
              {monthNames.map((m, i) => {
                const rev = monthlyRevenue[i];
                const exp = monthlyExpenses[i];
                const profit = rev - exp;
                const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : null;
                const isCurrentMonth = i === now.getMonth();

                if (rev === 0 && exp === 0) return null;

                return (
                  <tr key={m} className={`hover:bg-[var(--color-bg-input)]/50 transition-colors ${isCurrentMonth ? 'bg-[#d4a853]/5' : ''}`}>
                    <td className="px-6 py-3 font-bold">
                      {m} {isCurrentMonth && <span className="text-[#d4a853] text-xs mr-1">(الحالي)</span>}
                    </td>
                    <td className="px-6 py-3 text-emerald-400 font-bold">{formatCur(rev)}</td>
                    <td className="px-6 py-3 text-red-400">{formatCur(exp)}</td>
                    <td className={`px-6 py-3 font-bold ${profit >= 0 ? 'text-[#d4a853]' : 'text-red-400'}`}>
                      {profit >= 0 ? '' : '-'}{formatCur(Math.abs(profit))}
                    </td>
                    <td className="px-6 py-3">
                      {margin !== null ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${Number(margin) >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {margin}%
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              }).filter(Boolean)}
              {monthlyRevenue.every(v => v === 0) && monthlyExpenses.every(v => v === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#8b92a5]">
                    <div className="text-4xl mb-4">📊</div>
                    <p>لا توجد بيانات مالية مسجّلة لهذا العام</p>
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
