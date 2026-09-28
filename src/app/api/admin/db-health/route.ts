import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DomainSearchLog } from "@/models/DomainSearchLog";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const result: any = {
    timestamp: new Date().toISOString(),
    mongodb_uri_defined: !!process.env.MONGODB_URI,
    steps: [],
  };

  try {
    await connectDB();
    result.steps.push("connected to MongoDB");

    // Remover o indice id_1 problematico se existir
    try {
      const collection = mongoose.connection.collection("domainsearchlogs");
      const indexes = await collection.indexes();
      result.existing_indexes = indexes.map((i: any) => i.name);

      const badIndex = indexes.find((i: any) => i.name === "id_1");
      if (badIndex) {
        await collection.dropIndex("id_1");
        result.steps.push("DROPPED bad index id_1");
      } else {
        result.steps.push("index id_1 not found (already clean)");
      }
    } catch (idxErr: any) {
      result.steps.push("index drop error: " + idxErr.message);
    }

    // Testar escrita
    const testDomain = "db-health-test-" + Date.now() + ".co.mz";
    const testDoc = await DomainSearchLog.create({
      domain: testDomain,
      sld: "db-health-test-" + Date.now(),
      extension: ".co.mz",
      isAvailable: true,
      searchCount: 1,
      ip: "127.0.0.1",
      userAgent: "db-health-check",
      firstSearchedAt: new Date(),
      lastSearchedAt: new Date(),
    });
    result.steps.push("write OK: " + testDoc._id);
    await DomainSearchLog.deleteOne({ _id: testDoc._id });
    result.steps.push("delete OK");
    result.total_docs = await DomainSearchLog.countDocuments();
    result.success = true;

  } catch (err: any) {
    result.success = false;
    result.error = err?.message || String(err);
    result.error_code = err?.code;
  }

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
