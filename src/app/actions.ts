"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requirePermission } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import {
  validateSaudiPhone,
  validateSaudiNationalId,
  validateName,
  validateAmount,
  validateUsername,
  validatePassword,
  validateDateRange,
} from "@/lib/validation";
import { generateRefNumber } from "@/lib/reference-numbers";
import { createNotification } from "@/lib/notifications";

// ─── helper: revalidate all financial pages ───
function revalidateFinancials() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profits");
  revalidatePath("/dashboard/revenue");
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/expenses");
}

// ─────────────────────────────────────────────
// CLIENT ACTIONS
// ─────────────────────────────────────────────
export async function addClient(formData: FormData) {
  const user = await requirePermission("manage_clients");
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const nationalId = formData.get("nationalId") as string;
  const notes = formData.get("notes") as string;

  const vName = validateName(name);
  if (!vName.valid) return { error: vName.message };
  const vPhone = validateSaudiPhone(phone);
  if (!vPhone.valid) return { error: vPhone.message };
  const vNat = validateSaudiNationalId(nationalId);
  if (!vNat.valid) return { error: vNat.message };

  try {
    const ref = await generateRefNumber('CLT', prisma);
    const client = await prisma.client.create({
      data: { name, phone, nationalId: nationalId || null, notes: notes || null, is_archived: false, ref_number: ref, created_by: user.id },
    });
    await logAction({ userId: user.id, action: "إنشاء عميل", table: "Client", recordId: client.id, newValue: client });
    
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e: any) {
    if (e.code === "P2002") return { error: "رقم الجوال مسجل مسبقاً" };
    return { error: "حدث خطأ أثناء الإضافة" };
  }
}

export async function updateClient(id: string, formData: FormData) {
  const user = await requirePermission("manage_clients");
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const nationalId = formData.get("nationalId") as string;
  const notes = formData.get("notes") as string;

  const vName = validateName(name);
  if (!vName.valid) return { error: vName.message };
  const vPhone = validateSaudiPhone(phone);
  if (!vPhone.valid) return { error: vPhone.message };
  const vNat = validateSaudiNationalId(nationalId);
  if (!vNat.valid) return { error: vNat.message };

  try {
    const old = await prisma.client.findUnique({ where: { id } });
    const client = await prisma.client.update({
      where: { id },
      data: { name, phone, nationalId: nationalId || null, notes: notes || null },
    });
    await logAction({ userId: user.id, action: "تعديل عميل", table: "Client", recordId: id, oldValue: old, newValue: client });
    
    revalidatePath("/dashboard/clients");
    return { success: true };
  } catch (e: any) {
    if (e.code === "P2002") return { error: "رقم الجوال مسجل مسبقاً" };
    return { error: "حدث خطأ أثناء التعديل" };
  }
}

export async function deleteClient(id: string) {
  const user = await requirePermission("manage_clients");
  try {
    // التحقق من وجود حجوزات نشطة
    const activeReservations = await prisma.reservation.count({
      where: { 
        clientId: id,
        status: { in: ["مؤكد", "معلق"] }
      }
    });

    if (activeReservations > 0) {
      return { error: "لا يمكن حذف أو أرشفة العميل لوجود حجوزات نشطة لديه. يرجى إنهاء الحجوزات أو إلغائها أولاً." };
    }

    // FIX-BL-03: Archive instead of delete if there are historical reservations
    const hasReservations = await prisma.reservation.count({
      where: { clientId: id }
    });
    
    if (hasReservations > 0) {
      const client = await prisma.client.update({
        where: { id },
        data: { is_archived: true }
      });
      await logAction({ userId: user.id, action: "أرشفة عميل", table: "Client", recordId: id, newValue: client });
      revalidatePath("/dashboard/clients");
      return { success: true };
    }
    
    const old = await prisma.client.findUnique({ where: { id } });
    await prisma.client.delete({ where: { id } });
    await logAction({ userId: user.id, action: "حذف عميل", table: "Client", recordId: id, oldValue: old });
    
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e: any) {
    return { error: "حدث خطأ أثناء حذف العميل" };
  }
}

// ─────────────────────────────────────────────
// CHALET ACTIONS
// ─────────────────────────────────────────────
export async function addChalet(formData: FormData) {
  const user = await requirePermission("manage_chalets");
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const pricePerNight = Number(formData.get("pricePerNight"));
  const description = formData.get("description") as string;

  const vName = validateName(name, "اسم الشاليه");
  if (!vName.valid) return { error: vName.message };
  const vAmount = validateAmount(pricePerNight, "السعر");
  if (!vAmount.valid) return { error: vAmount.message };

  if (!id || !type) return { error: "جميع الحقول المطلوبة يجب تعبئتها" };

  try {
    const ref = await generateRefNumber('CH', prisma);
    const chalet = await prisma.chalet.create({
      data: { id, name, type, pricePerNight, description: description || null, status: "متاح", ref_number: ref },
    });
    await logAction({ userId: user.id, action: "إنشاء شاليه", table: "Chalet", recordId: id, newValue: chalet });
    
    revalidatePath("/dashboard/chalets");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendar");
    return { success: true };
  } catch (e: any) {
    if (e.code === "P2002") return { error: "رقم الشاليه مستخدم مسبقاً" };
    return { error: "حدث خطأ أثناء الإضافة" };
  }
}

export async function updateChalet(id: string, formData: FormData) {
  const user = await requirePermission("manage_chalets");
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const pricePerNight = Number(formData.get("pricePerNight"));
  const description = formData.get("description") as string;
  const status = formData.get("status") as string;

  const vName = validateName(name, "اسم الشاليه");
  if (!vName.valid) return { error: vName.message };
  const vAmount = validateAmount(pricePerNight, "السعر");
  if (!vAmount.valid) return { error: vAmount.message };

  if (!type) return { error: "جميع الحقول المطلوبة يجب تعبئتها" };

  try {
    const old = await prisma.chalet.findUnique({ where: { id } });
    const chalet = await prisma.chalet.update({
      where: { id },
      data: { name, type, pricePerNight, description: description || null, status },
    });
    await logAction({ userId: user.id, action: "تعديل شاليه", table: "Chalet", recordId: id, oldValue: old, newValue: chalet });

    revalidatePath("/dashboard/chalets");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendar");
    return { success: true };
  } catch (e: any) {
    return { error: "حدث خطأ أثناء التعديل" };
  }
}

export async function deleteChalet(id: string) {
  const user = await requirePermission("manage_chalets");
  try {
    const old = await prisma.chalet.findUnique({ where: { id } });
    await prisma.chalet.delete({ where: { id } });
    await logAction({ userId: user.id, action: "حذف شاليه", table: "Chalet", recordId: id, oldValue: old });
    
    revalidatePath("/dashboard/chalets");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendar");
    return { success: true };
  } catch (e: any) {
    return { error: "لا يمكن حذف الشاليه لوجود بيانات مرتبطة به" };
  }
}

// ─────────────────────────────────────────────
// RESERVATION ACTIONS
// ─────────────────────────────────────────────
export async function addReservation(formData: FormData) {
  const user = await requirePermission("manage_reservations");
  const chaletId = formData.get("chaletId") as string;
  const clientId = formData.get("clientId") as string;
  const checkInStr = formData.get("checkIn") as string;
  const checkOutStr = formData.get("checkOut") as string;
  const notes = formData.get("notes") as string;
  const totalPriceStr = formData.get("totalPrice") as string;
  const discountStr = formData.get("discount") as string;
  const discount = parseFloat(discountStr) || 0;

  const maxDiscount = (user.role === "admin" || user.role === "reservation_manager") ? 100 : 20;
  if (discount > maxDiscount || discount < 0) {
    return { error: `نسبة الخصم غير صالحة. الحد الأقصى لك هو ${maxDiscount}%` };
  }

  const vDate = validateDateRange(checkInStr, checkOutStr);
  if (!vDate.valid) return { error: vDate.message };

  const customTotal = Number(totalPriceStr);
  const vAmount = validateAmount(customTotal, "المبلغ الإجمالي");
  if (!vAmount.valid) return { error: vAmount.message };

  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);

  if (!chaletId || !clientId) return { error: "جميع الحقول الأساسية مطلوبة" };

  const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

  try {
    // فحص التعارض مع استثناء التسليم المباشر:
    // يُسمح بالحجز إذا كان تاريخ الدخول يساوي تاريخ خروج حجز سابق (direct handover)
    const conflict = await prisma.reservation.findFirst({
      where: {
        chaletId,
        status: { in: ["مؤكد", "مكتمل"] },
        AND: [
          { checkIn: { lt: checkOut } },
          { checkOut: { gt: checkIn } },
          // استثناء التسليم المباشر: إذا خروج الحجز الموجود = دخول الجديد → لا تعارض
          { NOT: { checkOut: { equals: checkIn } } }
        ],
      },
    });

    if (conflict) {
      // جلب أقرب تاريخين متاحين كاقتراح بديل
      const nextAvailable = await prisma.reservation.findFirst({
        where: {
          chaletId,
          status: { in: ["مؤكد", "مكتمل"] },
          checkOut: { gte: checkIn }
        },
        orderBy: { checkOut: 'asc' }
      });
      const suggestion = nextAvailable
        ? ` أقرب تاريخ متاح بعد: ${new Date(nextAvailable.checkOut).toLocaleDateString('ar-SA')}`
        : '';
      return { error: `يوجد تعارض! الشاليه محجوز في هذه الفترة المحددة.${suggestion}` };
    }

    const chalet = await prisma.chalet.findUnique({
      where: { id: chaletId },
      select: { pricePerNight: true, status: true }
    });
    if (!chalet) return { error: "الشاليه غير موجود" };
    if (chalet.status === "تحت الصيانة") return { error: "عذراً! هذا الشاليه تحت الصيانة ولا يمكن حجزه حالياً." };

    const totalCost = customTotal;
    const pricePerNight = totalCost / nights;

    const ref = await generateRefNumber('RES', prisma);
    const reservation = await prisma.reservation.create({
      data: { 
        chaletId, 
        clientId, 
        checkIn, 
        checkOut, 
        nights, 
        pricePerNight, 
        discount,
        totalCost, 
        status: "معلق", 
        notes: notes || null,
        created_by: user.id,
        ref_number: ref
      },
    });

    await logAction({ userId: user.id, action: "إنشاء حجز", table: "Reservation", recordId: reservation.id, newValue: reservation });

    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/calendar");
    revalidatePath("/dashboard");
    return { success: true, reservationId: reservation.id };
  } catch (e) {
    console.error(e);
    return { error: "حدث خطأ غير متوقع أثناء الحجز" };
  }
}

export async function updateReservationStatus(id: string, status: string) {
  const user = await requirePermission("manage_reservations");
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { payments: true },
    });
    if (!reservation) return { error: "الحجز غير موجود" };

    if (status === "مكتمل") {
      const paid = reservation.payments.reduce((s, p) => s + p.amount, 0);
      const remaining = reservation.totalCost - paid;
      if (remaining > 0.01) {
        return {
          error: `لا يمكن تسجيل الخروج! يوجد مبلغ متبقي غير مدفوع: ${new Intl.NumberFormat("ar-SA").format(remaining)} ر.س. يرجى تسجيل الدفعة أولاً.`,
          remainingAmount: remaining,
        };
      }
    }

    if (status === "مؤكد") {
      const chalet = await prisma.chalet.findUnique({
        where: { id: reservation.chaletId },
        select: { status: true }
      });
      if (chalet?.status === "تحت الصيانة") {
        return { error: "لا يمكن تأكيد الحجز لأن الشاليه حالياً تحت الصيانة." };
      }

      const conflict = await prisma.reservation.findFirst({
        where: {
          chaletId: reservation.chaletId,
          id: { not: id },
          status: { in: ["مؤكد", "مكتمل"] },
          AND: [
            { checkIn: { lt: reservation.checkOut } },
            { checkOut: { gt: reservation.checkIn } },
            { NOT: { checkOut: { equals: reservation.checkIn } } }
          ],
        },
      });
      if (conflict) {
        return { error: "لا يمكن تأكيد الحجز لوجود تعارض مع حجز مؤكد آخر في نفس الفترة." };
      }
    }

    const old = { status: reservation.status };
    const res = await prisma.reservation.update({ where: { id }, data: { status } });
    await logAction({ userId: user.id, action: "تحديث حالة الحجز", table: "Reservation", recordId: id, oldValue: old, newValue: res });

    if (status === "مؤكد") {
      await prisma.chalet.update({ where: { id: reservation.chaletId }, data: { status: "محجوز" } });
    } else if (status === "مكتمل" || status === "ملغي") {
      const otherActive = await prisma.reservation.findFirst({
        where: {
          chaletId: reservation.chaletId,
          id: { not: id },
          status: "مؤكد",
        },
      });
      if (!otherActive) {
        await prisma.chalet.update({ where: { id: reservation.chaletId }, data: { status: "متاح" } });
      }
    }

    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/chalets");
    revalidatePath("/dashboard/calendar");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { error: "حدث خطأ أثناء تحديث الحالة" };
  }
}

export async function cancelAndRefundReservation(id: string, refundAmount: number) {
  const user = await requirePermission("manage_reservations");
  
  if (refundAmount < 0) return { error: "مبلغ الاسترجاع غير صالح" };

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { payments: true, chalet: true, client: true }
    });

    if (!reservation) return { error: "الحجز غير موجود" };
    if (reservation.status === "ملغي") return { error: "الحجز ملغي مسبقاً" };

    const paid = reservation.payments.reduce((s, p) => s + p.amount, 0);

    if (refundAmount > paid + 0.01) {
      return { error: `لا يمكن استرجاع مبلغ أكبر من المدفوع (${new Intl.NumberFormat("ar-SA").format(paid)} ر.س)` };
    }

    // 1. Cancel the reservation
    const old = { status: reservation.status };
    const res = await prisma.reservation.update({ where: { id }, data: { status: "ملغي" } });
    await logAction({ userId: user.id, action: "إلغاء حجز", table: "Reservation", recordId: id, oldValue: old, newValue: res });

    // 2. Free up the chalet if no other active reservations
    const otherActive = await prisma.reservation.findFirst({
      where: {
        chaletId: reservation.chaletId,
        id: { not: id },
        status: "مؤكد",
      },
    });
    if (!otherActive) {
      await prisma.chalet.update({ where: { id: reservation.chaletId }, data: { status: "متاح" } });
    }

    // 3. Process the refund if applicable
    if (refundAmount > 0) {
      const expRef = await generateRefNumber('EXP', prisma);
      const expense = await prisma.expense.create({
        data: {
          type: "استرجاع مبلغ حجز",
          amount: refundAmount,
          chaletId: reservation.chaletId,
          description: `استرجاع مبلغ لحجز ملغي للعميل ${reservation.client.name} - رقم الحجز ${reservation.ref_number}`,
          created_by: user.id,
          ref_number: expRef
        }
      });
      await logAction({ userId: user.id, action: "استرجاع مبلغ", table: "Expense", recordId: expense.id, newValue: expense });
    }

    revalidateFinancials();
    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/chalets");
    revalidatePath("/dashboard/calendar");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (e) {
    console.error("Cancellation error:", e);
    return { error: "حدث خطأ أثناء الإلغاء" };
  }
}

export async function updateReservationDetails(formData: FormData) {
  const user = await requirePermission("manage_reservations");
  
  const id = formData.get("id") as string;
  const chaletId = formData.get("chaletId") as string;
  const checkInStr = formData.get("checkIn") as string;
  const checkOutStr = formData.get("checkOut") as string;
  const notes = formData.get("notes") as string;
  const totalPriceStr = formData.get("totalPrice") as string;
  const discountStr = formData.get("discount") as string;
  const discount = parseFloat(discountStr) || 0;

  const maxDiscount = (user.role === "admin" || user.role === "reservation_manager") ? 100 : 20;
  if (discount > maxDiscount || discount < 0) {
    return { error: `نسبة الخصم غير صالحة. الحد الأقصى لك هو ${maxDiscount}%` };
  }

  const vDate = validateDateRange(checkInStr, checkOutStr);
  if (!vDate.valid) return { error: vDate.message };

  const customTotal = Number(totalPriceStr);
  const vAmount = validateAmount(customTotal, "المبلغ الإجمالي");
  if (!vAmount.valid) return { error: vAmount.message };

  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);

  if (!id || !chaletId) return { error: "جميع الحقول الأساسية مطلوبة" };

  const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

  try {
    const existing = await prisma.reservation.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (!existing) return { error: "الحجز غير موجود" };

    const paid = existing.payments.reduce((s, p) => s + p.amount, 0);
    if (customTotal < paid) {
      return { error: `لا يمكن تعديل الإجمالي ليكون أقل من المبلغ المدفوع (${new Intl.NumberFormat("ar-SA").format(paid)} ر.س). قم بعمل استرجاع أولاً.` };
    }

    // فحص التعارض مع استثناء التسليم المباشر
    const conflict = await prisma.reservation.findFirst({
      where: {
        chaletId,
        id: { not: id },
        status: { in: ["مؤكد", "مكتمل"] },
        AND: [
          { checkIn: { lt: checkOut } },
          { checkOut: { gt: checkIn } },
          { NOT: { checkOut: { equals: checkIn } } }
        ],
      },
    });
    if (conflict) return { error: "يوجد تعارض! الشاليه محجوز في هذه الفترة المحددة." };

    const chalet = await prisma.chalet.findUnique({
      where: { id: chaletId },
      select: { pricePerNight: true, status: true }
    });
    if (!chalet) return { error: "الشاليه غير موجود" };
    if (chalet.status === "تحت الصيانة") return { error: "عذراً! هذا الشاليه تحت الصيانة ولا يمكن حجزه حالياً." };

    const totalCost = customTotal;
    const pricePerNight = totalCost / nights;

    const old = { ...existing };

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        chaletId,
        checkIn,
        checkOut,
        nights,
        totalCost,
        pricePerNight,
        discount,
        notes,
      }
    });

    // Handle chalet status if confirmed
    if (existing.status === "مؤكد" && existing.chaletId !== chaletId) {
      // release old chalet
      const otherActiveOld = await prisma.reservation.findFirst({
        where: { chaletId: existing.chaletId, id: { not: id }, status: "مؤكد" }
      });
      if (!otherActiveOld) {
        await prisma.chalet.update({ where: { id: existing.chaletId }, data: { status: "متاح" } });
      }
      
      // reserve new chalet
      await prisma.chalet.update({ where: { id: chaletId }, data: { status: "محجوز" } });
    }

    await logAction({ userId: user.id, action: "تعديل حجز", table: "Reservation", recordId: id, oldValue: old, newValue: updated });

    revalidateFinancials();
    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/chalets");
    revalidatePath("/dashboard/calendar");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (e) {
    console.error("Update Reservation error:", e);
    return { error: "حدث خطأ أثناء التعديل" };
  }
}


// ─────────────────────────────────────────────
// PAYMENT ACTIONS
// ─────────────────────────────────────────────
export async function addPayment(formData: FormData) {
  const user = await requirePermission("create_payments");
  const reservationId = formData.get("reservationId") as string;
  const amount = Number(formData.get("amount"));
  const method = formData.get("method") as string;
  const note = formData.get("note") as string;

  const vAmount = validateAmount(amount, "المبلغ");
  if (!vAmount.valid) return { error: vAmount.message };

  if (!reservationId || !method) return { error: "جميع الحقول المطلوبة يجب تعبئتها" };

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { payments: true },
    });
    if (!reservation) return { error: "الحجز غير موجود" };

    const paid = reservation.payments.reduce((s, p) => s + p.amount, 0);
    const remaining = reservation.totalCost - paid;

    if (amount > remaining + 0.01) {
      return {
        error: `المبلغ المدخل (${new Intl.NumberFormat("ar-SA").format(amount)} ر.س) يتجاوز المبلغ المتبقي (${new Intl.NumberFormat("ar-SA").format(remaining)} ر.س)`,
      };
    }

    if (reservation.status === "معلق") {
      const conflict = await prisma.reservation.findFirst({
        where: {
          chaletId: reservation.chaletId,
          id: { not: reservation.id },
          status: { in: ["مؤكد", "مكتمل"] },
          AND: [
            { checkIn: { lt: reservation.checkOut } },
            { checkOut: { gt: reservation.checkIn } },
            { NOT: { checkOut: { equals: reservation.checkIn } } }
          ],
        },
      });
      if (conflict) {
        return { error: "لا يمكن تسجيل الدفعة لتأكيد الحجز، حيث يوجد حجز مؤكد آخر لنفس الشاليه في هذه الفترة. يرجى إلغاء هذا الحجز أو تعديل تواريخه أولاً." };
      }
    }

    // FIX-BL-04: Generate receipt number
    const ref = await generateRefNumber('RCP', prisma);
    const receipt_number = ref;

    const newPayment = await prisma.payment.create({
      data: { 
        reservationId, 
        amount, 
        method, 
        note: note || null,
        created_by: user.id,
        ref_number: ref
      },
    });

    // FIX-BL-04: Auto copy to revenues
    const revRef = await generateRefNumber('REV', prisma);
    await prisma.revenue.create({
      data: {
        reservation_id: reservationId,
        payment_id: newPayment.id,
        chalet_id: reservation.chaletId,
        amount: amount,
        revenue_date: new Date(),
        ref_number: revRef
      }
    });

    await logAction({ userId: user.id, action: "تسجيل دفعة", table: "Payment", recordId: newPayment.id, newValue: newPayment });

    if (reservation.status === "معلق") {
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { status: "مؤكد" }
      });
      await prisma.chalet.update({
        where: { id: reservation.chaletId },
        data: { status: "محجوز" }
      });
      await logAction({ userId: user.id, action: "تأكيد تلقائي بالدفع", table: "Reservation", recordId: reservationId, oldValue: { status: "معلق" }, newValue: { status: "مؤكد" } });
    }

    revalidateFinancials();
    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/calendar");
    revalidatePath("/dashboard/chalets");
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
  const user = await requirePermission("manage_expenses");
  const type = formData.get("type") as string;
  const amount = Number(formData.get("amount"));
  const chaletId = formData.get("chaletId") as string;
  const description = formData.get("description") as string;

  const vAmount = validateAmount(amount, "المبلغ");
  if (!vAmount.valid) return { error: vAmount.message };

  if (!type || !description) return { error: "جميع الحقول المطلوبة يجب تعبئتها" };

  try {
    const ref = await generateRefNumber('EXP', prisma);
    const expense = await prisma.expense.create({
      data: { 
        type, 
        amount, 
        chaletId: chaletId || null, 
        description,
        created_by: user.id,
        ref_number: ref
      },
    });
    await logAction({ userId: user.id, action: "تسجيل مصروف", table: "Expense", recordId: expense.id, newValue: expense });

    revalidateFinancials();
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
  const user = await requirePermission("manage_maintenance");
  const chaletId = formData.get("chaletId") as string;
  const type = formData.get("type") as string;
  const cost = Number(formData.get("cost"));
  const notes = formData.get("notes") as string;

  const vAmount = validateAmount(cost, "التكلفة", 0);
  if (!vAmount.valid) return { error: vAmount.message };

  if (!chaletId || !type) return { error: "جميع الحقول المطلوبة يجب تعبئتها" };

  try {
    // فحص إذا كان الشاليه محجوز حالياً (يوجد عميل فيه الآن)
    const now = new Date();
    now.setHours(now.getHours() + 3); // KSA timezone adjustment
    const today = new Date(now.toISOString().split('T')[0]);

    const activeReservation = await prisma.reservation.findFirst({
      where: {
        chaletId,
        status: "مؤكد",
        checkIn: { lte: today },
        checkOut: { gt: today }
      }
    });

    if (activeReservation) {
      return { error: "عذراً! هذا الشاليه مشغول حالياً بحجز نشط، لا يمكن بدء الصيانة فيه." };
    }

    const ref = await generateRefNumber('MNT', prisma);
    const maintenance = await prisma.maintenance.create({
      data: { 
        chaletId, 
        type, 
        cost, 
        notes: notes || null, 
        status: "جارية",
        created_by: user.id,
        ref_number: ref
      },
    });

    const expRef = await generateRefNumber('EXP', prisma);
    await prisma.expense.create({
      data: {
        type: "صيانة",
        amount: cost,
        chaletId,
        description: `صيانة ${type} — شاليه`,
        maintenanceId: maintenance.id,
        created_by: user.id,
        ref_number: expRef
      },
    });

    await prisma.chalet.update({ where: { id: chaletId }, data: { status: "تحت الصيانة" } });
    await logAction({ userId: user.id, action: "طلب صيانة", table: "Maintenance", recordId: maintenance.id, newValue: maintenance });

    // إشعار تلقائي عند إنشاء طلب صيانة
    const chaletInfo = await prisma.chalet.findUnique({ where: { id: chaletId }, select: { name: true } });
    await createNotification({
      title: "طلب صيانة جديد",
      description: `تم تسجيل طلب صيانة للشاليه "${chaletInfo?.name}" — نوع: ${type}`,
      type: "maintenance",
      priority: "medium"
    });

    revalidatePath("/dashboard/maintenance");
    revalidatePath("/dashboard/chalets");
    revalidatePath("/dashboard/calendar");
    revalidateFinancials();
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "حدث خطأ أثناء تسجيل طلب الصيانة" };
  }
}

export async function completeMaintenance(id: string) {
  const user = await requirePermission("manage_maintenance");
  try {
    const maintenance = await prisma.maintenance.findUnique({
      where: { id },
      include: { chalet: { select: { name: true } } }
    });
    if (!maintenance) return { error: "الطلب غير موجود" };

    const updated = await prisma.maintenance.update({
      where: { id },
      data: { status: 'مكتملة', completedDate: new Date() }
    });
    await logAction({ userId: user.id, action: "إتمام صيانة", table: "Maintenance", recordId: id, newValue: updated });

    const activeM = await prisma.maintenance.findFirst({
      where: { chaletId: maintenance.chaletId, status: 'جارية' }
    });

    if (!activeM) {
      const now = new Date();
      now.setHours(now.getHours() + 3);
      const today = new Date(now.toISOString().split('T')[0]);
      const activeRes = await prisma.reservation.findFirst({
        where: { chaletId: maintenance.chaletId, status: "مؤكد", checkIn: { lte: today }, checkOut: { gt: today } }
      });

      await prisma.chalet.update({
        where: { id: maintenance.chaletId },
        data: { status: activeRes ? 'محجوز' : 'متاح' }
      });
    }

    // إشعار إتمام الصيانة
    await createNotification({
      title: "اكتملت أعمال الصيانة",
      description: `اكتملت أعمال الصيانة للشاليه "${(maintenance as any).chalet?.name}" — ${maintenance.type}`,
      type: "maintenance",
      priority: "low"
    });

    revalidatePath("/dashboard/maintenance");
    revalidatePath("/dashboard/chalets");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e: any) {
    return { error: "حدث خطأ أثناء التحديث" };
  }
}

export async function deleteMaintenance(id: string) {
  const user = await requirePermission("manage_maintenance");
  try {
    const maintenance = await prisma.maintenance.findUnique({
      where: { id },
      include: { expense: true }
    });
    
    if (!maintenance) return { error: "الطلب غير موجود" };

    if (maintenance.expense) {
      await prisma.expense.delete({ where: { id: maintenance.expense.id } });
    }

    await prisma.maintenance.delete({ where: { id } });
    await logAction({ userId: user.id, action: "حذف صيانة", table: "Maintenance", recordId: id, oldValue: maintenance });

    if (maintenance.status === 'جارية') {
      const activeM = await prisma.maintenance.findFirst({
        where: { chaletId: maintenance.chaletId, status: 'جارية' }
      });

      if (!activeM) {
        const now = new Date();
        now.setHours(now.getHours() + 3);
        const today = new Date(now.toISOString().split('T')[0]);
        const activeRes = await prisma.reservation.findFirst({
          where: { chaletId: maintenance.chaletId, status: "مؤكد", checkIn: { lte: today }, checkOut: { gt: today } }
        });

        await prisma.chalet.update({
          where: { id: maintenance.chaletId },
          data: { status: activeRes ? 'محجوز' : 'متاح' }
        });
      }
    }

    revalidatePath("/dashboard/maintenance");
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/chalets");
    return { success: true };
  } catch (e: any) {
    return { error: "لا يمكن حذف طلب الصيانة" };
  }
}

// ─────────────────────────────────────────────
// USER ACTIONS
// ─────────────────────────────────────────────
export async function addUser(formData: FormData) {
  const userSession = await requirePermission("manage_users");
  const name = formData.get("name") as string;
  const rawUsername = formData.get("username") as string;
  const username = rawUsername ? rawUsername.toLowerCase() : "";
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  const vName = validateName(name);
  if (!vName.valid) return { error: vName.message };
  const vUser = validateUsername(username);
  if (!vUser.valid) return { error: vUser.message };
  const vPass = validatePassword(password);
  if (!vPass.valid) return { error: vPass.message };

  if (!role) return { error: "جميع الحقول مطلوبة" };
  if (role === 'admin') return { error: "لا يمكن إضافة أكثر من مدير عام في النظام" };

  const roleMap: Record<string, string> = {
    admin: "مدير النظام",
    reservation_manager: "مدير الحجوزات",
    accountant: "محاسب",
    receptionist: "موظف استقبال",
    maintenance: "فني صيانة",
  };

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const ref = await generateRefNumber('USR', prisma);
    const user = await prisma.user.create({
      data: { name, username, password: hashedPassword, role, roleAr: roleMap[role] || role, active: true, ref_number: ref, mustChangePassword: true },
    });
    await logAction({ userId: userSession.id, action: "إنشاء مستخدم", table: "User", recordId: user.id });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (e: any) {
    if (e.code === "P2002") return { error: "اسم المستخدم مستخدم مسبقاً" };
    return { error: "حدث خطأ أثناء إضافة المستخدم" };
  }
}

export async function updateUser(id: string, formData: FormData) {
  const userSession = await requirePermission("manage_users");
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;

  const vName = validateName(name);
  if (!vName.valid) return { error: vName.message };

  if (role === 'admin') {
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.role !== 'admin') {
      return { error: "لا يمكن تحويل مستخدم عادي إلى مدير عام" };
    }
  }

  const roleMap: Record<string, string> = {
    admin: "مدير النظام",
    reservation_manager: "مدير الحجوزات",
    accountant: "محاسب",
    receptionist: "موظف استقبال",
    maintenance: "فني صيانة",
  };

  try {
    const old = await prisma.user.findUnique({ where: { id } });
    const user = await prisma.user.update({
      where: { id },
      data: { name, role, roleAr: roleMap[role] || role },
    });
    await logAction({ userId: userSession.id, action: "تعديل مستخدم", table: "User", recordId: id, oldValue: old, newValue: user });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (e) {
    return { error: "حدث خطأ أثناء تعديل المستخدم" };
  }
}

export async function toggleUserStatus(id: string, active: boolean) {
  const userSession = await requirePermission("manage_users");
  try {
    const user = await prisma.user.update({ where: { id }, data: { active: !active } });
    await logAction({ userId: userSession.id, action: "تغيير حالة المستخدم", table: "User", recordId: id, newValue: user });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (e) {
    return { error: "حدث خطأ أثناء تغيير حالة المستخدم" };
  }
}

export async function deleteUser(id: string) {
  const userSession = await requirePermission("manage_users");
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { error: "المستخدم غير موجود" };
    if (user.username === 'admin') return { error: "لا يمكن حذف المدير العام الأساسي" };

    try {
      await prisma.user.delete({ where: { id } });
      await logAction({ userId: userSession.id, action: "حذف مستخدم", table: "User", recordId: id, oldValue: user });

      revalidatePath("/dashboard/users");
      return { success: true };
    } catch (e: any) {
      const updated = await prisma.user.update({
        where: { id },
        data: { active: false, name: `${user.name} (محذوف)` }
      });
      await logAction({ userId: userSession.id, action: "إيقاف مستخدم (تعذر الحذف)", table: "User", recordId: id, newValue: updated });

      revalidatePath("/dashboard/users");
      return { error: "تم إيقاف حساب المستخدم وتغيير اسمه بدلاً من حذفه نهائياً للحفاظ على السجلات المالية المرتبطة به." };
    }
  } catch (e: any) {
    return { error: "حدث خطأ أثناء المعالجة" };
  }
}

// ─────────────────────────────────────────────
// PROFIT REPORT
// ─────────────────────────────────────────────
export async function getProfitReport(startDate: Date, endDate: Date, chaletId?: string) {
  await requirePermission("view_profit_analysis");
  
  const revenueFilter = {
    revenue_date: { gte: startDate, lte: endDate },
    ...(chaletId && { chalet_id: chaletId })
  };
  
  const expenseFilter = {
    date: { gte: startDate, lte: endDate },
    ...(chaletId && { chaletId: chaletId })
  };

  const [totalRevenue, totalExpense] = await Promise.all([
    prisma.revenue.aggregate({
      where: revenueFilter,
      _sum: { amount: true }
    }),
    prisma.expense.aggregate({
      where: expenseFilter,
      _sum: { amount: true }
    })
  ]);

  const revenue = totalRevenue._sum.amount ?? 0;
  const expense = totalExpense._sum.amount ?? 0;

  return {
    revenue,
    expense,
    profit: revenue - expense,
    profitMargin: revenue > 0
      ? ((revenue - expense) / revenue * 100).toFixed(2) + "%"
      : "0%"
  };
}

// ─────────────────────────────────────────────
// PASSWORD MANAGEMENT
// ─────────────────────────────────────────────
export async function resetUserPassword(id: string, formData: FormData) {
  const userSession = await requirePermission("manage_users");
  const newPassword = formData.get("newPassword") as string;
  
  const vPass = validatePassword(newPassword);
  if (!vPass.valid) return { error: vPass.message };

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { error: "المستخدم غير موجود" };

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const updated = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword, mustChangePassword: true }
    });

    await logAction({ userId: userSession.id, action: "إعادة تعيين كلمة المرور", table: "User", recordId: id });
    
    return { success: true };
  } catch (e) {
    return { error: "حدث خطأ أثناء المعالجة" };
  }
}

import { cookies } from "next/headers";
import { signSession, verifySession } from "@/lib/session";

export async function changeMyPassword(id: string, formData: FormData) {
  const newPassword = formData.get("newPassword") as string;
  
  const vPass = validatePassword(newPassword);
  if (!vPass.valid) return { error: vPass.message };

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword, mustChangePassword: false }
    });

    await logAction({ userId: id, action: "تغيير كلمة المرور إجبارياً", table: "User", recordId: id });
    
    // تحديث الكوكيز بجلسة موقَّعة جديدة
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    if (sessionToken) {
      const sessionData = verifySession(sessionToken) as any;
      if (sessionData) {
        sessionData.mustChangePassword = false;
        const token = signSession(sessionData);
        cookieStore.set("session_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 8,
          path: "/",
        });
      }
    }

    return { success: true };
  } catch (e) {
    return { error: "حدث خطأ أثناء تحديث كلمة المرور" };
  }
}
