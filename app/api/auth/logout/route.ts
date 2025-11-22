"use server"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { cookieName } from "@/utils/auth"

export async function POST() {
  try {
    cookies().set(cookieName(), "", { httpOnly: true, path: "/", maxAge: 0 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "unknown" }, { status: 200 })
  }
}




