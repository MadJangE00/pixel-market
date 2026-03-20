import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!userData) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">👤 프로필</h1>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500">이메일</label>
            <p className="font-medium">{userData.email}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">이름</label>
            <p className="font-medium">{userData.name}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">닉네임</label>
            <p className="font-medium">{userData.nickname || "-"}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">포인트</label>
            <p className="text-2xl font-bold text-purple-600">{userData.points} P</p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              💡 포인트는 Club App에서 활동하여 획득할 수 있습니다
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <Link
            href="/my-gallery"
            className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold text-center hover:bg-purple-700 transition"
          >
            내 갤러리
          </Link>
          <form
            action={async () => {
              "use server";
              const supabase = await createClient();
              await supabase.auth.signOut();
            }}
          >
            <button
              type="submit"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
        <p className="font-medium mb-1">Club App과 연동됩니다</p>
        <p>
          같은 계정으로 Club App에서 활동하고 포인트를 획득하세요.
          여기서는 그 포인트로 작품을 구매할 수 있습니다!
        </p>
      </div>
    </div>
  );
}
