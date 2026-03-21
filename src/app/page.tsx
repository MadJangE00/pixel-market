import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 유저 상세 정보 가져오기
  let userData = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    userData = data;
  }

  // 판매 중인 이미지 가져오기
  const { data: images } = await supabase
    .from("images")
    .select("*, creator:users!images_creator_id_fkey(*)")
    .eq("is_for_sale", true)
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 로그인한 유저 정보 카드 */}
      {userData && (
        <div className="mb-8 bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {userData.nickname || userData.name}님, 환영합니다!
              </p>
              <p className="text-sm text-gray-500">{userData.email}</p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-gray-500">보유 포인트</p>
            <p className="text-2xl font-bold text-purple-600">
              {userData.points.toLocaleString()} P
            </p>
          </div>
        </div>
      )}

      {/* 히어로 섹션 */}
      <section className="text-center py-10 md:py-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white mb-8 md:mb-12 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">🎨 Pixel Market</h1>
        <p className="text-base md:text-xl mb-6 md:mb-8">당신의 창작물을 포인트로 거래하세요</p>
        {!user ? (
          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
            <Link
              href="/login"
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              시작하기
            </Link>
            <Link
              href="/market"
              className="bg-transparent border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              마켓 둘러보기
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
            <Link
              href="/sell"
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              작품 등록하기
            </Link>
            <Link
              href="/market"
              className="bg-transparent border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              마켓 둘러보기
            </Link>
          </div>
        )}
      </section>

      {/* 최신 작품 */}
      <section>
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">🔥 최신 작품</h2>
        {images && images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((image) => (
              <Link
                key={image.id}
                href={`/market/${image.id}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition group"
              >
                <div className="aspect-square bg-gray-100 relative">
                  {image.thumbnail_url || image.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.thumbnail_url || image.image_url}
                      alt={image.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      이미지 없음
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full text-sm font-semibold">
                    {image.price} P
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {image.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    by {image.creator?.nickname || image.creator?.name || "익명"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            아직 등록된 작품이 없습니다
          </div>
        )}
      </section>
    </div>
  );
}
