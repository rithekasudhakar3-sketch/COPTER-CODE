import { NextResponse } from "next/server";

export function handleApiError(error, label = "API error") {
  console.error(label, error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function getPagination(searchParams) {
  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") || 8), 1), 50);
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function pageResult(data, total, page, pageSize) {
  return {
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  };
}
