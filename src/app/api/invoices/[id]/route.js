import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";

const STATUSES = ["Pending", "Paid", "Overdue", "Cancelled"];

export async function GET(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId: session.user.id },
      include: {
        items: { include: { product: true } },
        customer: true,
        user: {
          select: { name: true, businessName: true, gstin: true, address: true, logoUrl: true, email: true },
        },
      },
    });

    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (error) {
    return handleApiError(error, "Get invoice failed");
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({ where: { id, userId: session.user.id } });
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = await req.json();
    if (!STATUSES.includes(data.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: data.status },
      include: { customer: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "Update invoice failed");
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({ where: { id, userId: session.user.id } });
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Delete invoice failed");
  }
}
