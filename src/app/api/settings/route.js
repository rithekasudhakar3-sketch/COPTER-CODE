import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { validateGSTIN } from "@/lib/gst";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, businessName: true, gstin: true, address: true, logoUrl: true, theme: true, currency: true, taxMode: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error, "Get settings failed");
  }
}

export async function PUT(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const gstin = data.gstin?.trim().toUpperCase() || null;
    if (!validateGSTIN(gstin)) {
      return NextResponse.json({ error: "Invalid GSTIN format" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        businessName: data.businessName?.trim() || null,
        gstin,
        address: data.address?.trim() || null,
        logoUrl: data.logoUrl || null,
        theme: data.theme || "light",
        currency: data.currency || "INR",
        taxMode: data.taxMode || "split",
      },
      select: { name: true, email: true, businessName: true, gstin: true, address: true, logoUrl: true, theme: true, currency: true, taxMode: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error, "Update settings failed");
  }
}
