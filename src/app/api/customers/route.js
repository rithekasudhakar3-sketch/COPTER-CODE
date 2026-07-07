import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getPagination, handleApiError, pageResult } from "@/lib/api-response";
import { validateGSTIN } from "@/lib/gst";

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const { page, pageSize, skip } = getPagination(searchParams);

    const where = {
      userId: session.user.id,
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { gstin: { contains: search } },
        { phone: { contains: search } },
      ],
    };

    const [customers, total] = await prisma.$transaction([
      prisma.customer.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: pageSize }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json(pageResult(customers, total, page, pageSize));
  } catch (error) {
    return handleApiError(error, "List customers failed");
  }
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    if (!data.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const gstin = data.gstin?.trim().toUpperCase() || null;
    if (!validateGSTIN(gstin)) {
      return NextResponse.json({ error: "Invalid GSTIN format" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        gstin,
        address: data.address?.trim() || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Create customer failed");
  }
}
