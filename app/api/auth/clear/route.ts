import { NextResponse } from "next/server";

export async function POST() {
  // Clear auth cookies if any
  const response = NextResponse.json({ success: true });

  response.cookies.delete("authToken");
  response.cookies.delete("privy-token");

  return response;
}
