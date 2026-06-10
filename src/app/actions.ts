"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────
// CLIENT ACTIONS
// ─────────────────────────────────────────────
export async function addClient(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const nationalId = formData.get("nationalId") as string;
  const notes = formData.get("notes") as string;

  if (!name || !phone) return { error: "الاسم ورقم الجوال مطلوبان" };

  try {
    await prisma.client.create({
      data: {
        name,
        phone,
        nationalId: nationalId || null,
        notes: notes || null,
      },
    });
    revalidatePath("/dashboard/clients");
    return { success: true };
  } catch (e: any) {
    if (e.code === 'P2002') return { error: "رقم الجوال مسجل مسبقاً" };
    return { error: "حدث خطأ أثناء الإضافة" };
  }
}

export async function updateClient(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const nationalId = formData.get("nationalId") as string;
  const notes = formData.get("notes") as string;

  if (!name || !phone) return { error: "الاسم ورقم الجوال مطلوبان" };

  try {
    await prisma.client.update({
      where: { id },
      data: {
        name,
        phone,
        nationalId: nationalId || null,
        notes: notes || null,
      },
    });
    revalidatePath("/dashboard/clients");
    return { success: true };
  } catch (e: any) {
    if (e.code === 'P2002') return { error: "رقم الجوال مسجل مسبقاً" };
    return { error: "حدث خطأ أثناء التعديل" };
  }
}

// ─────────────────────────────────────────────
// CHALET ACTIONS
// ─────────────────────────────────────────────
export async function addChalet(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const pricePerNight = Number(formData.get("pricePerNight"));
  const description = formData.get("description") as string;

  if (!id || !name || !type || !pricePerNight) return { error: "جميع الحقول المطلوبة يجب تعبئتها" };

  try {
    await prisma.chalet.create({
      data: {
        id,
        name,
        type,
        pricePerNight,
        description: description || null,
        status: "متاح",
      },
    });
    revalidatePath("/dashboard/chalets");
    return { success: true };
  } catch (e: any) {
    if (e.code === 'P2002') return { error: "رقم الشاليه مستخدم مسبقاً" };
    return { error: "حدث خطأ أثناء الإضافة" };
  }
}

export async function updateChalet(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const pricePerNight = Number(formData.get("pricePerNight"));
  const description = formData.get("description") as string;
  const status = formData.get("status") as string;

  if (!name || !type || !pricePerNight) return { error: "جميع الحقول المطلوبة يجب تعبئتها" };

  try {
    await prisma.chalet.update({
      where: { id },
      data: {
        name,
        type,
        pricePerNight,
        description: description || null,
        status,
      },
    });
    revalidatePath("/dashboard/chalets");
    return { success: true };
  } catch (e: any) {
    return { error: "حدث خطأ أثناء التعديل" };
  }
}

export async function deleteChalet(id: string) {
  try {
    await prisma.chalet.delete({ where: { id } });
    revalidatePath("/dashboard/chalets");
    return { success: true };
  } catch (e: any) {
    return { error: "لا يمكن حذف الشاليه لوجود بيانات مرتبطة به" };
  }
}

// ─────────────────────────────────────────────
// RESERVATION ACTIONS
// ─────────────────────────────────────────────
export async function addReservation(formData: FormData) {
  const chaletId = formData.get("chaletId") as string;
  const clientId = formData.get("clientId") as string;
  const checkIn = new Date(formData.get("checkIn") as string);
  const checkOut = new Date(formData.get("checkOut") as string);
  const totalCost = Number(formData.get("totalPrice"));
  const notes = formData.get("notes") as string;

  if (!chaletId || !clientId || isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || !totalCost) {
    return { error: "جميع الحقول الأساسية مطلوبة" };
  }

  if (checkIn >= checkOut) {
    return { error: "تاريخ الخروج يجب أن يكون بعد تاريخ الدخول" };
  }

  const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
  const pricePerNight = totalCost / nights;

  try {
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        chaletId: chaletId,
        status: { in: ['مؤكد', 'معلق'] },
        OR: [
          {
            AND: [
              { checkIn: { lt: checkOut } },
              { checkOut: { gt: checkIn } }
            ]
          }
        ]
      }
    });

    if (conflictingReservation) {
      return { error: "يوجد تعارض! الشاليه محجوز في هذه الفترة المحددة." };
    }

    await prisma.reservation.create({
      data: {
        chaletId,
        clientId,
        checkIn,
        checkOut,
        nights,
        pricePerNight,
        totalCost,
        status: "معلق",
        notes: notes || null
      }
    });

    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/calendar");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "حدث خطأ غير متوقع أثناء الحجز" };
  }
}

export async function updateReservationStatus(id: string, status: string) {
  try {
    const data: any = { status };
    
    // Update chalet status accordingly
    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation) return { error: "الحجز غير موجود" };

    await prisma.reservation.update({ where: { id }, data });

    if (status === 'مؤكد') {
      await prisma.chalet.update({ where: { id: reservation.chaletId }, data: { status: 'محجوز' } });
    } else if (status === 'مكتمل' || status === 'ملغي') {
      await prisma.chalet.update({ where: { id: reservation.chaletId }, data: { status: 'متاح' } });
    }

    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/chalets");
    revalidatePath("/dashboard/calendar");
    return { success: true };
  } catch (e) {
    return { error: "حدث خطأ أثناء تحديث الحالة" };
  }
}

// ─────────────────────────────────────────────
// PAYMENT ACTIONS
// ─────────────────────────────────────────────
export async function addPayment(formData: FormData) {
  const reservationId = formData.get("reservationId") as string;
  const amount = Number(formData.get("amount"));
  const method = formData.get("method") as string;
  const note = formData.get("note") as string;

  if (!reservationId || !amount || !method) return { error: "جميع الحقول المطلوبة يجب تعبئتها" };
  if (amount <= 0) return { error: "المبلغ يجب أن يكون أكبر من صفر" };

  try {
    // Check that the amount doesn't exceed remaining
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { payments: true }
    });
    if (!reservation) return { error: "الحجز غير موجود" };

    const paid = reservation.payments.reduce((s, p) => s + p.amount, 0);
    const remaining = reservation.totalCost - paid;

    if (amount > remaining) {
      return { error: `المبلغ المدخل (${amount}) يتجاوز المبلغ المتبقي (${remaining.toFixed(2)})` };
    }

    await prisma.payment.create({
      data: {
        reservationId,
        amount,
        method,
        note: note || null,
      }
    });

    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/reservations");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "حدث خطأ أثناء تسجيل الدفعة" };
  }
}

// ─────────────────────────────────────────────
// EXPENSE ACTIONS
// ─────────────────────────────────────────────
export async function addExpense(formData: FormData) {
  const type = formData.get("type") as string;
  const amount = Number(formData.get("amount"));
  const chaletId = formData.get("chaletId") as string;
  const description = formData.get("description") as string;

  if (!type || !amount || !description) return { error: "جميع الحقول المطلوبة يجب تعبئتها" };
  if (amount <= 0) return { error: "المبلغ يجب أن يكون أكبر من صفر" };

  try {
    await prisma.expense.create({
      data: {
        type,
        amount,
        chaletId: chaletId || null,
        description,
      }
    });
    revalidatePath("/dashboard/expenses");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "حدث خطأ أثناء تسجيل المصروف" };
  }
}

// ─────────────────────────────────────────────
// MAINTENANCE ACTIONS
// ─────────────────────────────────────────────
export async function addMaintenance(formData: FormData) {
  const chaletId = formData.get("chaletId") as string;
  const type = formData.get("type") as string;
  const cost = Number(formData.get("cost"));
  const notes = formData.get("notes") as string;

  if (!chaletId || !type || !cost) return { error: "جميع الحقول المطلوبة يجب تعبئتها" };

  try {
    const maintenance = await prisma.maintenance.create({
      data: {
        chaletId,
        type,
        cost,
        notes: notes || null,
        status: "جارية",
      }
    });

    // Create linked expense
    await prisma.expense.create({
      data: {
        type: "صيانة",
        amount: cost,
        chaletId,
        description: `صيانة: ${type}`,
        maintenanceId: maintenance.id,
      }
    });

    // Update chalet status to maintenance
    await prisma.chalet.update({ where: { id: chaletId }, data: { status: 'تحت الصيانة' } });

    revalidatePath("/dashboard/maintenance");
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/chalets");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "حدث خطأ أثناء تسجيل طلب الصيانة" };
  }
}

export async function completeMaintenance(id: string) {
  try {
    const maintenance = await prisma.maintenance.update({
      where: { id },
      data: {
        status: "مكتملة",
        completedDate: new Date(),
      }
    });

    // Set chalet back to available
    await prisma.chalet.update({ where: { id: maintenance.chaletId }, data: { status: 'متاح' } });

    revalidatePath("/dashboard/maintenance");
    revalidatePath("/dashboard/chalets");
    return { success: true };
  } catch (e) {
    return { error: "حدث خطأ أثناء إنهاء الصيانة" };
  }
}

// ─────────────────────────────────────────────
// USER ACTIONS
// ─────────────────────────────────────────────
export async function addUser(formData: FormData) {
  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!name || !username || !password || !role) return { error: "جميع الحقول مطلوبة" };

  const roleMap: Record<string, string> = {
    admin: "مدير النظام",
    reservation_manager: "مدير الحجوزات",
    accountant: "محاسب",
    receptionist: "موظف استقبال",
    maintenance: "فني صيانة",
  };

  try {
    await prisma.user.create({
      data: {
        name,
        username,
        password, // In production, hash this!
        role,
        roleAr: roleMap[role] || role,
        active: true,
      }
    });
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (e: any) {
    if (e.code === 'P2002') return { error: "اسم المستخدم مستخدم مسبقاً" };
    return { error: "حدث خطأ أثناء إضافة المستخدم" };
  }
}

export async function updateUser(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;

  const roleMap: Record<string, string> = {
    admin: "مدير النظام",
    reservation_manager: "مدير الحجوزات",
    accountant: "محاسب",
    receptionist: "موظف استقبال",
    maintenance: "فني صيانة",
  };

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name,
        role,
        roleAr: roleMap[role] || role,
      }
    });
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (e) {
    return { error: "حدث خطأ أثناء تعديل المستخدم" };
  }
}

export async function toggleUserStatus(id: string, active: boolean) {
  try {
    await prisma.user.update({
      where: { id },
      data: { active: !active }
    });
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (e) {
    return { error: "حدث خطأ أثناء تغيير حالة المستخدم" };
  }
}
