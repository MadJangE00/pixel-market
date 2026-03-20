import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 판매 중인 이미지 가져오기
  const { data: images } = await supabase
    .from("images")
    .select("*, creator:users!images_creator_id_fkey(*)")
    .eq("is_for_sale", true)
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 히어로 섹션 */}
      <section className="text-center py-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white mb-12">
        <h1 className="text-4xl font-bold mb-4">🎨 Pixel Market</h1>
        <p className="text-xl mb-8">당신의 창작물을 포인트로 거래하세요</p>
        {!user ? (
          <div className="flex justify-center gap-4">
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
          <div className="flex justify-center gap-4">
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
        <h2 className="text-2xl font-bold mb-6">🔥 최신 작품</h2>
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
