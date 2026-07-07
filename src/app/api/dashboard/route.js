import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [today, monthly, pending, recentInvoices, customerCount, productCount, chartInvoices] =
      await prisma.$transaction([
        prisma.invoice.aggregate({
          where: { userId: session.user.id, date: { gte: todayStart }, status: { not: "Cancelled" } },
          _sum: { grandTotal: true, cgstAmount: true, sgstAmount: true, igstAmount: true },
        }),
        prisma.invoice.aggregate({
          where: {
            userId: session.user.id,
            date: { gte: monthStart, lt: nextMonth },
            status: { not: "Cancelled" },
          },
          _sum: { grandTotal: true, cgstAmount: true, sgstAmount: true, igstAmount: true },
        }),
        prisma.invoice.count({ where: { userId: session.user.id, status: "Pending" } }),
        prisma.invoice.findMany({
          where: { userId: session.user.id },
          include: { customer: true },
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
        prisma.customer.count({ where: { userId: session.user.id } }),
        prisma.product.count({ where: { userId: session.user.id } }),
        prisma.invoice.findMany({
          where: { userId: session.user.id, date: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } },
          select: { date: true, grandTotal: true, cgstAmount: true, sgstAmount: true, igstAmount: true },
        }),
      ]);

    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: date.toLocaleString("en", { month: "short" }),
        sales: 0,
        gst: 0,
      };
    });
    const byMonth = new Map(months.map((month) => [month.key, month]));

    chartInvoices.forEach((invoice) => {
      const key = `${invoice.date.getFullYear()}-${invoice.date.getMonth()}`;
      const entry = byMonth.get(key);
      if (entry) {
        entry.sales += invoice.grandTotal;
        entry.gst += invoice.cgstAmount + invoice.sgstAmount + invoice.igstAmount;
      }
    });

    return NextResponse.json({
      kpis: {
        todaySales: today._sum.grandTotal || 0,
        monthlySales: monthly._sum.grandTotal || 0,
        gstCollected:
          (monthly._sum.cgstAmount || 0) + (monthly._sum.sgstAmount || 0) + (monthly._sum.igstAmount || 0),
        pendingInvoices: pending,
        customers: customerCount,
        products: productCount,
      },
      chart: months,
      recentInvoices,
    });
  } catch (error) {
    return handleApiError(error, "Dashboard failed");
  }
}
