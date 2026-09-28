import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DomainSearchLog } from "@/models/DomainSearchLog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const result: any = {
    timestamp: new Date().toISOString(),
    mongodb_uri_defined: !!process.env.MONGODB_URI,
    mongodb_uri_prefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 25) + "..." : "NOT SET",
  };

  try {
    await connectDB();
    result.connected = true;

    const testDomain = `db-health-test-${Date.now()}.co.mz`;
    const testDoc = await DomainSearchLog.create({
      domain: testDomain,
      sld: `db-health-test-${Date.now()}`,
      extension: ".co.mz",
      isAvailable: true,
      searchCount: 1,
      ip: "127.0.0.1",
      userAgent: "db-health-check",
      firstSearchedAt: new Date(),
      lastSearchedAt: new Date(),
    });
    result.write_test = "OK";
    result.test_doc_id = testDoc._id?.toString();

    await DomainSearchLog.deleteOne({ _id: testDoc._id });
    result.delete_test = "OK";
    result.total_docs = await DomainSearchLog.countDocuments();

  } catch (err: any) {
    result.connected = false;
    result.error = err?.message || String(err);
    result.error_code = err?.code;
  }

  return NextResponse.json(result, { status: result.connected ? 200 : 500 });
}
