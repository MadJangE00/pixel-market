import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminSettings from "./AdminSettings";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // admin 권한 확인
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "admin") {
    redirect("/");
  }

  // 현재 설정 가져오기
  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .single();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">⚙️ 관리자 페이지</h1>

      <AdminSettings initialSettings={settings} />
    </div>
  );
}
