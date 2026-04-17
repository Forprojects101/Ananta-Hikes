import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  // Clear auth cookies
  response.cookies.delete("auth-token");
  response.cookies.delete("verified-token");

  return response;
}
