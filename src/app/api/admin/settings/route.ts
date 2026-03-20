import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  // admin 권한 확인
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "admin") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  // 요청 본문 파싱
  const body = await request.json();
  const { listing_fee } = body;

  if (typeof listing_fee !== "number" || listing_fee < 0) {
    return NextResponse.json({ error: "잘못된 수수료 값" }, { status: 400 });
  }

  // 설정 업데이트
  const { error } = await supabase
    .from("site_settings")
    .update({ listing_fee, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, listing_fee });
}
