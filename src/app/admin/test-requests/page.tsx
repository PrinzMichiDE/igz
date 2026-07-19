import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { TestRequestManager } from "@/components/admin/test-request-manager";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminTestRequestsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const [pendingCount, requests] = await Promise.all([
    prisma.productTestRequest.count({ where: { status: "pending" } }),
    prisma.productTestRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        locale: true,
        status: true,
        name: true,
        email: true,
        company: true,
        productTitle: true,
        amazonUrl: true,
        asin: true,
        categoryHint: true,
        message: true,
        canShipSample: true,
        adminNote: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div className="igz-container py-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">
            Testanfragen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Produktvorschläge von Lesern und Marken · {pendingCount} offen
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary"
        >
          Zum Dashboard
        </Link>
      </div>

      <div className="mt-6">
        <AdminNav currentPath="/admin/test-requests" />
      </div>

      <div className="mt-8">
        <TestRequestManager
          requests={requests.map((row) => ({
            ...row,
            createdAt: row.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
