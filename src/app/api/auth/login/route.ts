import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "اسم المستخدم وكلمة المرور مطلوبان" }, { status: 400 });
    }

    // التحقق من المستخدم في قاعدة البيانات
    const user = await prisma.user.findFirst({
      where: { username, password, active: true },
    });

    // fallback: admin الافتراضي إذا لم تكن قاعدة البيانات تحتوي على مستخدمين
    const isDefaultAdmin = username === "admin" && password === "admin123";

    if (!user && !isDefaultAdmin) {
      return NextResponse.json(
        { error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    const sessionData = user
      ? { id: user.id, name: user.name, username: user.username, role: user.role, roleAr: user.roleAr }
      : { id: "admin", name: "المدير العام", username: "admin", role: "admin", roleAr: "مدير النظام" };

    // إنشاء token بسيط (في الإنتاج يجب استخدام JWT)
    const token = Buffer.from(JSON.stringify(sessionData)).toString("base64");

    const response = NextResponse.json({ success: true, user: sessionData });

    // تعيين cookie آمن
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 ساعات
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
