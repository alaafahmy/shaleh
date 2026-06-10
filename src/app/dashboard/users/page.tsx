import { prisma } from "@/lib/prisma";
import { Shield, UserCog } from "lucide-react";
import AddUserForm from "@/components/AddUserForm";
import EditUserForm from "@/components/EditUserForm";
import ToggleUserStatusButton from "@/components/ToggleUserStatusButton";

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="bg-purple-500/20 text-purple-500 p-2 rounded-lg"><UserCog size={24} /></span> إدارة المستخدمين والصلاحيات
        </h2>
        <AddUserForm />
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#d4a853] text-[#06080d]">
              <tr>
                <th className="px-6 py-4 font-bold">المعرف</th>
                <th className="px-6 py-4 font-bold">الاسم</th>
                <th className="px-6 py-4 font-bold">اسم المستخدم</th>
                <th className="px-6 py-4 font-bold">الصلاحية (الدور)</th>
                <th className="px-6 py-4 font-bold">الحالة</th>
                <th className="px-6 py-4 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] text-[#f5f5f5]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[var(--color-bg-input)]/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#d4a853]">{u.id.slice(-6)}</td>
                  <td className="px-6 py-4 font-bold">{u.name}</td>
                  <td className="px-6 py-4" dir="ltr">{u.username}</td>
                  <td className="px-6 py-4">
                    <span className="bg-purple-500/20 text-purple-500 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/30 flex items-center gap-1 w-fit">
                      <Shield size={12} /> {u.roleAr}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.active ? (
                      <span className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">نشط</span>
                    ) : (
                      <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">موقوف</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <EditUserForm user={{ id: u.id, name: u.name, role: u.role }} />
                      <ToggleUserStatusButton id={u.id} active={u.active} />
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#8b92a5]">
                    <div className="text-4xl mb-4">👤</div>
                    <h4 className="text-lg font-bold text-white mb-2">لا يوجد مستخدمون</h4>
                    <p>انقر على "إضافة مستخدم" للبدء</p>
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
