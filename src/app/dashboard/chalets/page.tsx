import { prisma } from "@/lib/prisma";
import { Home } from "lucide-react";
import AddChaletForm from "@/components/AddChaletForm";
import EditChaletForm from "@/components/EditChaletForm";
import DeleteChaletButton from "@/components/DeleteChaletButton";

export const dynamic = 'force-dynamic';

export default async function ChaletsPage() {
  const chalets = await prisma.chalet.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'متاح':
        return <span className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">متاح</span>;
      case 'محجوز':
        return <span className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">محجوز</span>;
      case 'تحت الصيانة':
        return <span className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/30">تحت الصيانة</span>;
      default:
        return <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs font-bold border border-gray-500/30">{status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type.includes('VIP') || type.includes('VVIP')) return 'bg-[#d4a853]/20 text-[#d4a853] border-[#d4a853]/30';
    if (type.includes('كبير')) return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
  };

  const getChaletEmoji = (type: string) => {
    if (type.includes('VIP') || type.includes('VVIP')) return '👑';
    if (type.includes('كبير')) return '🏠';
    return '🏡';
  };

  const formatCur = (num: number) => new Intl.NumberFormat('ar-SA').format(num) + ' ر.س';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="bg-[#d4a853]/20 text-[#d4a853] p-2 rounded-lg"><Home size={24} /></span> إدارة الشاليهات
        </h2>
        <AddChaletForm />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {chalets.map(c => (
          <div key={c.id} className="glass-panel relative overflow-hidden flex flex-col group hover:border-[var(--color-gold-primary)] transition-colors">
            {/* Ribbon */}
            <div className="absolute -left-12 top-6 bg-[#d4a853] text-[#06080d] font-bold text-xs py-1 px-12 -rotate-45 shadow-lg z-10">
              {c.type}
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-4 pl-8">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${getTypeBadge(c.type)}`}>
                  <span className="text-2xl">{getChaletEmoji(c.type)}</span>
                </div>
                {getStatusBadge(c.status)}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{c.name}</h3>
              <p className="text-[#8b92a5] text-sm h-10 overflow-hidden line-clamp-2 mb-4">
                {c.description || 'لا يوجد وصف'}
              </p>

              <div className="bg-[var(--color-bg-base)]/50 rounded-lg p-4 mb-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[#8b92a5] mb-1">رقم الشاليه</div>
                  <div className="font-bold text-white text-sm">{c.id}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8b92a5] mb-1">سعر الليلة</div>
                  <div className="font-bold text-[#d4a853] text-sm">{formatCur(c.pricePerNight)}</div>
                </div>
              </div>
            </div>

            <div className="mt-auto border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]/30 p-4 flex justify-end gap-2">
              <EditChaletForm chalet={c} />
              <DeleteChaletButton id={c.id} name={c.name} />
            </div>
          </div>
        ))}

        {chalets.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#8b92a5]">
            <div className="text-5xl mb-4">🏠</div>
            <h4 className="text-lg font-bold text-white mb-2">لا توجد شاليهات</h4>
            <p>انقر على "إضافة شاليه" للبدء</p>
          </div>
        )}
      </div>
    </div>
  );
}
