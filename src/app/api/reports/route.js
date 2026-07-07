import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invoices = await prisma.invoice.findMany({
      where: { userId: session.user.id },
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { date: "desc" },
    });

    const monthly = new Map();
    const customers = new Map();
    const products = new Map();
    let gstTotal = 0;

    invoices.forEach((invoice) => {
      const month = invoice.date.toLocaleString("en", { month: "short", year: "numeric" });
      const monthEntry = monthly.get(month) || { name: month, sales: 0, gst: 0, invoices: 0 };
      monthEntry.sales += invoice.grandTotal;
      monthEntry.gst += invoice.cgstAmount + invoice.sgstAmount + invoice.igstAmount;
      monthEntry.invoices += 1;
      monthly.set(month, monthEntry);

      const gst = invoice.cgstAmount + invoice.sgstAmount + invoice.igstAmount;
      gstTotal += gst;

      const customerEntry = customers.get(invoice.customerId) || {
        name: invoice.customer.name,
        gstin: invoice.customer.gstin,
        sales: 0,
        invoices: 0,
      };
      customerEntry.sales += invoice.grandTotal;
      customerEntry.invoices += 1;
      customers.set(invoice.customerId, customerEntry);

      invoice.items.forEach((item) => {
        const productEntry = products.get(item.productId) || {
          name: item.product.name,
          hsnCode: item.product.hsnCode,
          quantity: 0,
          sales: 0,
        };
        productEntry.quantity += item.quantity;
        productEntry.sales += item.total;
        products.set(item.productId, productEntry);
      });
    });

    return NextResponse.json({
      summary: {
        totalSales: invoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0),
        gstTotal,
        invoiceCount: invoices.length,
      },
      monthly: Array.from(monthly.values()).reverse(),
      gst: invoices.map((invoice) => ({
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        customer: invoice.customer.name,
        cgst: invoice.cgstAmount,
        sgst: invoice.sgstAmount,
        igst: invoice.igstAmount,
        total: invoice.cgstAmount + invoice.sgstAmount + invoice.igstAmount,
      })),
      customers: Array.from(customers.values()).sort((a, b) => b.sales - a.sales),
      products: Array.from(products.values()).sort((a, b) => b.sales - a.sales),
    });
  } catch (error) {
    return handleApiError(error, "Reports failed");
  }
}
