import { NextResponse } from "next/server";
import { buildExport } from "@/lib/export";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await buildExport();
  const filename = `koza-export-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
