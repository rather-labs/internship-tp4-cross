"use client";
import Oracle from "@/components/OracleAndRelayer";
function OraclePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Oracle</h1>
      <Oracle />
    </div>
  );
}

export default OraclePage;
