import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { collectSystemHealthReport } from "@/lib/admin/collect-system-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await collectSystemHealthReport();
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Health check failed",
      },
      { status: 500 },
    );
  }
}
