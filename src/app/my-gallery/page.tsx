import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function MyGalleryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p>로그인이 필요합니다</p>
        <Link href="/login" className="text-purple-600 hover:underline">
          로그인하기
        </Link>
      </div>
    );
  }

  // 유저 상세 정보 가져오기
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // 내가 구매한 이미지
  const { data: purchasedImages } = await supabase
    .from("images")
    .select("*, creator:users!images_creator_id_fkey(*)")
    .eq("owner_id", user.id)
    .order("sold_at", { ascending: false });

  // 내가 판매한 이미지
  const { data: soldImages } = await supabase
    .from("images")
    .select("*, owner:users!images_owner_id_fkey(*)")
    .eq("creator_id", user.id)
    .not("owner_id", "is", null);

  // 판매 중인 내 이미지
  const { data: sellingImages } = await supabase
    .from("images")
    .select("*")
    .eq("creator_id", user.id)
    .eq("is_for_sale", true);

  // 거래 내역
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, image:images(*), seller:users!transactions_seller_id_fkey(*)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">🖼️ 내 갤러리</h1>

      {/* 유저 정보 카드 */}
      {userData && (
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-3xl">
                👤
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900">
                  {userData.nickname || userData.name}
                </p>
                <p className="text-gray-500">{userData.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">보유 포인트</p>
              <p className="text-3xl font-bold text-purple-600">
                {userData.points.toLocaleString()} P
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-sm text-gray-600">
            <span>구매한 작품: {purchasedImages?.length || 0}개</span>
            <span>판매 중: {sellingImages?.length || 0}개</span>
            <span>판매 완료: {soldImages?.length || 0}개</span>
          </div>
        </div>
      )}

      {/* 내가 구매한 작품 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">구매한 작품 ({purchasedImages?.length || 0})</h2>
        {purchasedImages && purchasedImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {purchasedImages.map((image) => (
              <div key={image.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="aspect-square bg-gray-100">
                  {image.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.image_url}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      이미지 없음
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{image.title}</h3>
                  <p className="text-sm text-gray-500">
                    by {image.creator?.nickname || image.creator?.name || "익명"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    구매일: {new Date(image.sold_at || "").toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">아직 구매한 작품이 없습니다</p>
        )}
      </section>

      {/* 판매 중인 내 작품 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">판매 중인 작품 ({sellingImages?.length || 0})</h2>
        {sellingImages && sellingImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sellingImages.map((image) => (
              <Link
                key={image.id}
                href={`/market/${image.id}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
              >
                <div className="aspect-square bg-gray-100 relative">
                  {image.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.image_url}
                      alt={image.title}
                      className="w-full h-full object-cover"
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
                  <h3 className="font-semibold text-gray-900 truncate">{image.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            판매 중인 작품이 없습니다.{" "}
            <Link href="/sell" className="text-purple-600 hover:underline">
              작품 등록하기
            </Link>
          </p>
        )}
      </section>

      {/* 판매 완료된 작품 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">판매 완료 ({soldImages?.length || 0})</h2>
        {soldImages && soldImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {soldImages.map((image) => (
              <div key={image.id} className="bg-white rounded-xl shadow-sm overflow-hidden opacity-75">
                <div className="aspect-square bg-gray-100">
                  {image.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.image_url}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      이미지 없음
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{image.title}</h3>
                  <p className="text-sm text-green-600">+{image.price} P 획득</p>
                  <p className="text-xs text-gray-400 mt-1">
                    구매자: {image.owner?.nickname || image.owner?.name || "익명"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">아직 판매 완료된 작품이 없습니다</p>
        )}
      </section>

      {/* 거래 내역 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">거래 내역</h2>
        {transactions && transactions.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">작품</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">판매자</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">가격</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">일자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3">{tx.image?.title || "삭제된 작품"}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {tx.seller?.nickname || tx.seller?.name || "익명"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-purple-600">
                      -{tx.price} P
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-sm">
                      {new Date(tx.created_at).toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">거래 내역이 없습니다</p>
        )}
      </section>
    </div>
  );
}
