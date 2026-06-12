import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

type ExportType = "reservations" | "payments" | "expenses" | "profits" | "maintenance" | "clients" | "reports";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as ExportType;
  const format = searchParams.get("format") || "xlsx"; // 'xlsx' or 'pdf'
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const chaletId = searchParams.get("chaletId");

  const start = startDate ? new Date(startDate) : new Date("2020-01-01");
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  try {
    let rows: Record<string, any>[] = [];
    let sheetName = "تقرير";
    let fileName = "report";

    switch (type) {
      case "reservations": {
        sheetName = "الحجوزات";
        fileName = "reservations";
        const data = await prisma.reservation.findMany({
          where: { createdAt: { gte: start, lte: end } },
          include: { client: true, chalet: true, payments: true },
          orderBy: { checkIn: "desc" },
        });
        rows = data.map((r) => {
          const paid = r.payments.reduce((s, p) => s + p.amount, 0);
          return {
            "رقم الحجز": r.ref_number,
            "العميل": r.client.name,
            "الجوال": r.client.phone,
            "الشاليه": r.chalet.name,
            "تاريخ الدخول": new Date(r.checkIn).toLocaleDateString("ar-SA"),
            "تاريخ الخروج": new Date(r.checkOut).toLocaleDateString("ar-SA"),
            "الليالي": r.nights,
            "الإجمالي (ر.س)": r.totalCost,
            "المدفوع (ر.س)": paid,
            "المتبقي (ر.س)": r.totalCost - paid,
            "الحالة": r.status,
            "ملاحظات": r.notes || "",
          };
        });
        break;
      }

      case "payments": {
        sheetName = "المدفوعات";
        fileName = "payments";
        const data = await prisma.payment.findMany({
          where: {
            date: { gte: start, lte: end },
            ...(chaletId ? { reservation: { chaletId } } : {}),
          },
          include: { reservation: { include: { client: true, chalet: true } }, createdBy: true },
          orderBy: { date: "desc" },
        });
        rows = data.map((p) => ({
          "رقم السند": p.ref_number,
          "رقم الحجز": p.reservation.ref_number,
          "العميل": p.reservation.client.name,
          "الشاليه": p.reservation.chalet.name,
          "المبلغ (ر.س)": p.amount,
          "طريقة الدفع": p.method,
          "التاريخ": new Date(p.date).toLocaleDateString("ar-SA"),
          "المُحصِّل": p.createdBy?.name || "",
          "ملاحظات": p.note || "",
        }));
        break;
      }

      case "expenses": {
        sheetName = "المصروفات";
        fileName = "expenses";
        const data = await prisma.expense.findMany({
          where: {
            date: { gte: start, lte: end },
            ...(chaletId ? { chaletId } : {}),
          },
          include: { chalet: true, createdBy: true },
          orderBy: { date: "desc" },
        });
        rows = data.map((e) => ({
          "رقم السند": e.ref_number,
          "النوع": e.type,
          "المبلغ (ر.س)": e.amount,
          "الشاليه": e.chalet?.name || "عام",
          "البيان": e.description,
          "التاريخ": new Date(e.date).toLocaleDateString("ar-SA"),
          "بواسطة": e.createdBy?.name || "",
        }));
        break;
      }

      case "profits": {
        sheetName = "الأرباح";
        fileName = "profits";
        const [revenues, expenses] = await Promise.all([
          prisma.revenue.findMany({
            where: {
              revenue_date: { gte: start, lte: end },
              ...(chaletId ? { chalet_id: chaletId } : {}),
            },
            include: { chalet: true },
          }),
          prisma.expense.findMany({
            where: {
              date: { gte: start, lte: end },
              ...(chaletId ? { chaletId } : {}),
            },
          }),
        ]);
        const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);
        const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
        rows = [
          { "البند": "إجمالي الإيرادات (ر.س)", "القيمة": totalRevenue },
          { "البند": "إجمالي المصروفات (ر.س)", "القيمة": totalExpense },
          { "البند": "صافي الربح (ر.س)", "القيمة": totalRevenue - totalExpense },
          {
            "البند": "نسبة الربح",
            "القيمة": totalRevenue > 0 ? ((totalRevenue - totalExpense) / totalRevenue * 100).toFixed(2) + "%" : "0%",
          },
        ];
        break;
      }

      case "maintenance": {
        sheetName = "الصيانة";
        fileName = "maintenance";
        const data = await prisma.maintenance.findMany({
          where: {
            date: { gte: start, lte: end },
            ...(chaletId ? { chaletId } : {}),
          },
          include: { chalet: true, createdBy: true },
          orderBy: { date: "desc" },
        });
        rows = data.map((m) => ({
          "رقم الطلب": m.ref_number,
          "الشاليه": m.chalet.name,
          "نوع الصيانة": m.type,
          "التكلفة (ر.س)": m.cost,
          "التاريخ": new Date(m.date).toLocaleDateString("ar-SA"),
          "تاريخ الإتمام": m.completedDate ? new Date(m.completedDate).toLocaleDateString("ar-SA") : "—",
          "الحالة": m.status,
          "ملاحظات": m.notes || "",
          "بواسطة": m.createdBy?.name || "",
        }));
        break;
      }

      case "clients": {
        sheetName = "العملاء";
        fileName = "clients";
        const data = await prisma.client.findMany({
          where: { is_archived: false },
          include: { _count: { select: { reservations: true } } },
          orderBy: { name: "asc" },
        });
        rows = data.map((c) => ({
          "رقم العميل": c.ref_number,
          "الاسم": c.name,
          "الجوال": c.phone,
          "رقم الهوية": c.nationalId || "—",
          "عدد الحجوزات": c._count.reservations,
          "ملاحظات": c.notes || "",
        }));
        break;
      }

      case "reports": {
        sheetName = "التقارير_الشاملة";
        fileName = "reports";
        const [chalets, revenues, expens, reservations] = await Promise.all([
          prisma.chalet.findMany({ select: { id: true, name: true, type: true } }),
          prisma.revenue.findMany({
            where: { revenue_date: { gte: start, lte: end } },
            select: { amount: true, chalet_id: true }
          }),
          prisma.expense.findMany({
            where: { date: { gte: start, lte: end } },
            select: { amount: true, chaletId: true }
          }),
          prisma.reservation.findMany({
            where: { status: { in: ['مؤكد', 'مكتمل'] }, checkIn: { gte: start, lte: end } },
            select: { chaletId: true }
          })
        ]);

        const chaletStats = chalets.map(chalet => {
          const revs = revenues.filter(r => r.chalet_id === chalet.id).reduce((s, r) => s + r.amount, 0);
          const exps = expens.filter(e => e.chaletId === chalet.id).reduce((s, e) => s + e.amount, 0);
          const resCount = reservations.filter(r => r.chaletId === chalet.id).length;
          return { name: chalet.name, type: chalet.type, resCount, revs, exps, net: revs - exps };
        }).sort((a, b) => b.net - a.net);

        const totalRevs = revenues.reduce((s, r) => s + r.amount, 0);
        const totalExps = expens.reduce((s, e) => s + e.amount, 0);

        rows = chaletStats.map(c => ({
          "اسم الشاليه": c.name,
          "النوع": c.type,
          "عدد الحجوزات": c.resCount,
          "الإيرادات (ر.س)": c.revs,
          "المصروفات (ر.س)": c.exps,
          "الصافي (ر.س)": c.net
        }));
        
        rows.push({
          "اسم الشاليه": "الإجمالي",
          "النوع": "—",
          "عدد الحجوزات": reservations.length,
          "الإيرادات (ر.س)": totalRevs,
          "المصروفات (ر.س)": totalExps,
          "الصافي (ر.س)": totalRevs - totalExps
        });
        break;
      }

      default:
        return NextResponse.json({ error: "نوع التقرير غير صالح" }, { status: 400 });
    }

    if (format === "xlsx") {
      // إنشاء ملف Excel
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });

      // ضبط عرض الأعمدة تلقائياً
      const cols = Object.keys(rows[0] || {}).map((k) => ({
        wch: Math.max(k.length * 2, 15),
      }));
      ws["!cols"] = cols;

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(sheetName + "_" + new Date().toLocaleDateString("en-CA") + ".xlsx")}`,
        },
      });
    }

    if (format === "pdf") {
      // HTML template للطباعة كـ PDF
      const tableHeaders = rows.length > 0 ? Object.keys(rows[0]) : [];
      const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>${sheetName}</title>
<style>
  body { font-family: 'Arial', sans-serif; direction: rtl; padding: 20px; color: #222; }
  h1 { text-align: center; font-size: 22px; margin-bottom: 5px; }
  .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #1a1a2e; color: white; padding: 8px 12px; text-align: right; }
  td { padding: 7px 12px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #f8f8f8; }
  .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #999; }
  @media print {
    .no-print { display: none !important; }
    @page { margin: 0; }
    body { margin: 1.5cm; }
  }
</style>
</head>
<body>
<div class="no-print" style="text-align: center; margin-bottom: 20px; padding: 15px; background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px;">
  <p style="margin-top: 0; color: #8a6d3b; font-weight: bold; font-size: 14px;">لحفظ التقرير كملف PDF على الهاتف، اضغط على الزر أدناه ثم اختر "Save as PDF" أو "حفظ بتنسيق PDF" من خيارات الطابعة.</p>
  <button onclick="window.print()" style="background: #1a1a2e; color: white; border: none; padding: 10px 20px; font-size: 16px; border-radius: 5px; cursor: pointer;">🖨️ طباعة / حفظ كـ PDF</button>
</div>
<h1>نظام إدارة الشاليهات</h1>
<p class="subtitle">تقرير ${sheetName} — من ${start.toLocaleDateString("ar-SA")} إلى ${end.toLocaleDateString("ar-SA")}</p>
<table>
  <thead><tr>${tableHeaders.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
  <tbody>
    ${rows
      .map(
        (row) =>
          `<tr>${tableHeaders.map((h) => `<td>${row[h] ?? "—"}</td>`).join("")}</tr>`
      )
      .join("")}
  </tbody>
</table>
<p class="footer">تم الإنشاء بتاريخ: ${new Date().toLocaleString("ar-SA")}</p>
<script>
  window.onload = () => {
    // حاول فتح نافذة الطباعة تلقائياً للأجهزة التي تدعم ذلك
    setTimeout(() => { window.print(); }, 500);
  };
</script>
</body>
</html>`;

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    return NextResponse.json({ error: "صيغة غير مدعومة" }, { status: 400 });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "فشل التصدير" }, { status: 500 });
  }
}
