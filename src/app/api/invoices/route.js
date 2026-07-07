import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getPagination, handleApiError, pageResult } from "@/lib/api-response";
import { getInvoiceTotals } from "@/lib/gst";

const STATUSES = ["Pending", "Paid", "Overdue", "Cancelled"];

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const { page, pageSize, skip } = getPagination(searchParams);

    const where = {
      userId: session.user.id,
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
            },
          }
        : {}),
      OR: [
        { invoiceNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { gstin: { contains: search } } },
      ],
    };

    const [invoices, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        include: { customer: true, items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json(pageResult(invoices, total, page, pageSize));
  } catch (error) {
    return handleApiError(error, "List invoices failed");
  }
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    if (!data.customerId || !Array.isArray(data.items) || !data.items.length) {
      return NextResponse.json({ error: "Customer and at least one item are required" }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, userId: session.user.id },
    });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const productIds = data.items.map((item) => item.productId).filter(Boolean);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, userId: session.user.id },
    });
    const productsById = new Map(products.map((product) => [product.id, product]));

    const normalizedItems = data.items.map((item) => {
      const product = productsById.get(item.productId);
      if (!product) throw new Error("Invalid product selected");
      return {
        productId: product.id,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice ?? product.price),
        gstRate: Number(item.gstRate ?? product.gstPercentage),
      };
    });

    const totals = getInvoiceTotals(normalizedItems, Number(data.discountPercent || 0), Boolean(data.isInterState));
    const count = await prisma.invoice.count({ where: { userId: session.user.id } });
    const invoiceNumber =
      data.invoiceNumber || `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          date: data.date ? new Date(data.date) : new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          status: STATUSES.includes(data.status) ? data.status : "Pending",
          customerId: customer.id,
          userId: session.user.id,
          subTotal: totals.subTotal,
          cgstAmount: totals.cgstAmount,
          sgstAmount: totals.sgstAmount,
          igstAmount: totals.igstAmount,
          discountAmount: totals.discountAmount,
          grandTotal: totals.grandTotal,
          items: {
            create: normalizedItems.map((item) => {
              const lineTotal = item.quantity * item.unitPrice;
              const tax = (lineTotal * item.gstRate) / 100;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                gstRate: item.gstRate,
                cgst: data.isInterState ? 0 : tax / 2,
                sgst: data.isInterState ? 0 : tax / 2,
                igst: data.isInterState ? tax : 0,
                total: lineTotal,
              };
            }),
          },
        },
        include: { items: { include: { product: true } }, customer: true },
      });

      for (const item of normalizedItems) {
        const product = productsById.get(item.productId);
        if (product.stock >= 0) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: Math.max(product.stock - item.quantity, 0) },
          });
        }
      }

      return created;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    if (error.message === "Invalid product selected") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleApiError(error, "Create invoice failed");
  }
}
