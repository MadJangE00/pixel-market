import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function MarketPage() {
  const supabase = await createClient();

  const { data: images } = await supabase
    .from("images")
    .select("*, creator:users!images_creator_id_fkey(*)")
    .eq("is_for_sale", true)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">🎨 마켓</h1>

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
                <div className="absolute top-2 right-2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {image.price} P
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">
                  {image.title}
                </h3>
                {image.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {image.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  by {image.creator?.nickname || image.creator?.name || "익명"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <div className="text-6xl mb-4">🎨</div>
          <p className="text-xl">아직 판매 중인 작품이 없습니다</p>
          <p className="mt-2">첫 번째 작품을 등록해보세요!</p>
          <Link
            href="/sell"
            className="inline-block mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            작품 등록하기
          </Link>
        </div>
      )}
    </div>
  );
}
