import { NextResponse } from "next/server";

// PUT
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 👈 تحديث النوع إلى Promise
) {
  const { id } = await params; // 👈 استخدام await لفك الـ Promise
  const body = await request.json();

  return NextResponse.json(
    { message: `تم تعديل ${id}`, data: body },
    { status: 200 }
  );
}

// DELETE
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 👈 تحديث النوع إلى Promise
) {
  const { id } = await params; // 👈 استخدام await لفك الـ Promise

  return NextResponse.json(
    { message: `تم حذف ${id}` },
    { status: 200 }
  );
}
