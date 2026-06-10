import { prisma } from "@/lib/prisma";
import { TrendingDown } from "lucide-react";
import AddExpenseForm from "@/components/AddExpenseForm";

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    include: { chalet: true },
    orderBy: { date: 'desc' }
  });

  const chalets = await prisma.chalet.findMany({
    select: { id: true, name: true }
  });

  const formatCur = (num: number) => new Intl.NumberFormat('ar-SA').format(num) + ' ر.س';
  const formatDate = (date: Date) => date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'صيانة':
        return <span className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/30">صيانة</span>;
      case 'رواتب':
        return <span className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">رواتب</span>;
      case 'كهرباء':
      case 'ماء':
        return <span className="bg-cyan-500/20 text-cyan-500 px-3 py-1 rounded-full text-xs font-bold border border-cyan-500/30">فواتير</span>;
      case 'نظافة':
        return <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/30">نظافة</span>;
      default:
        return <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs font-bold border border-gray-500/30">{type}</span>;
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="bg-red-500/20 text-red-500 p-2 rounded-lg"><TrendingDown size={24} /></span> المصروفات (سندات الصرف)
        </h2>
        <AddExpenseForm chalets={chalets} />
      </div>

      {/* Summary Card */}
      <div className="glass-panel p-4 flex justify-between items-center">
        <div className="text-[#8b92a5] text-sm">إجمالي المصروفات المسجلة</div>
        <div className="text-2xl font-bold text-red-400">{formatCur(totalExpenses)}</div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#d4a853] text-[#06080d]">
              <tr>
                <th className="px-6 py-4 font-bold">رقم السند</th>
                <th className="px-6 py-4 font-bold">النوع</th>
                <th className="px-6 py-4 font-bold">المبلغ</th>
                <th className="px-6 py-4 font-bold">الشاليه المرتبط</th>
                <th className="px-6 py-4 font-bold">البيان / الوصف</th>
                <th className="px-6 py-4 font-bold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] text-[#f5f5f5]">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-[var(--color-bg-input)]/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#d4a853]">{e.id.slice(-6)}</td>
                  <td className="px-6 py-4">{getTypeBadge(e.type)}</td>
                  <td className="px-6 py-4 font-bold text-red-400">{formatCur(e.amount)}</td>
                  <td className="px-6 py-4">{e.chalet?.name || '— (عام)'}</td>
                  <td className="px-6 py-4">{e.description}</td>
                  <td className="px-6 py-4 text-[#8b92a5]">{formatDate(e.date)}</td>
                </tr>
              ))}
              
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#8b92a5]">
                    <div className="text-4xl mb-4">💸</div>
                    <h4 className="text-lg font-bold text-white mb-2">لا توجد مصروفات</h4>
                    <p>المصروفات المسجلة ستظهر هنا</p>
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
