import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getPagination, handleApiError, pageResult } from "@/lib/api-response";

function productPayload(data, userId) {
  return {
    name: data.name.trim(),
    description: data.description?.trim() || null,
    hsnCode: data.hsnCode?.trim() || null,
    price: Number(data.price || 0),
    gstPercentage: Number(data.gstPercentage ?? 18),
    stock: Number(data.stock ?? 0),
    category: data.category?.trim() || null,
    userId,
  };
}

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const { page, pageSize, skip } = getPagination(searchParams);

    const where = {
      userId: session.user.id,
      ...(category ? { category } : {}),
      OR: [
        { name: { contains: search } },
        { hsnCode: { contains: search } },
        { category: { contains: search } },
      ],
    };

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: pageSize }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json(pageResult(products, total, page, pageSize));
  } catch (error) {
    return handleApiError(error, "List products failed");
  }
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    if (!data.name?.trim() || data.price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: productPayload(data, session.user.id),
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Create product failed");
  }
}
