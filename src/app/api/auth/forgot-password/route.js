import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-response";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await prisma.user.findUnique({ where: { email } });

    return NextResponse.json({
      message: "If an account exists, password reset instructions will be sent.",
    });
  } catch (error) {
    return handleApiError(error, "Forgot password failed");
  }
}
