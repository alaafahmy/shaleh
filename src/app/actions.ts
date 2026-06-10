"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
    // Conflict Checking Logic
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
