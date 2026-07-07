import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { validateGSTIN } from "@/lib/gst";

export async function GET(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const customer = await prisma.customer.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(customer);
  } catch (error) {
    return handleApiError(error, "Get customer failed");
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const existing = await prisma.customer.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = await req.json();
    const gstin = data.gstin?.trim().toUpperCase() || null;
    if (!validateGSTIN(gstin)) {
      return NextResponse.json({ error: "Invalid GSTIN format" }, { status: 400 });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name?.trim() || existing.name,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        gstin,
        address: data.address?.trim() || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "Update customer failed");
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const existing = await prisma.customer.findFirst({
      where: { id, userId: session.user.id },
      include: { invoices: { select: { id: true }, take: 1 } },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.invoices.length) {
      return NextResponse.json({ error: "Customer has invoices and cannot be deleted" }, { status: 409 });
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Delete customer failed");
  }
}
