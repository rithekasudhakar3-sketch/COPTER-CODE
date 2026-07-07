import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";

function productPayload(data, existing) {
  return {
    name: data.name?.trim() || existing.name,
    description: data.description?.trim() || null,
    hsnCode: data.hsnCode?.trim() || null,
    price: Number(data.price ?? existing.price),
    gstPercentage: Number(data.gstPercentage ?? existing.gstPercentage),
    stock: Number(data.stock ?? existing.stock),
    category: data.category?.trim() || null,
  };
}

export async function GET(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(product);
  } catch (error) {
    return handleApiError(error, "Get product failed");
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const existing = await prisma.product.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = await req.json();
    const updated = await prisma.product.update({
      where: { id },
      data: productPayload(data, existing),
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "Update product failed");
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const existing = await prisma.product.findFirst({
      where: { id, userId: session.user.id },
      include: { invoiceItems: { select: { id: true }, take: 1 } },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.invoiceItems.length) {
      return NextResponse.json({ error: "Product is used by invoices and cannot be deleted" }, { status: 409 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Delete product failed");
  }
}
