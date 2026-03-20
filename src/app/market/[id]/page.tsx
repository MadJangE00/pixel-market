import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PurchaseButton from "./PurchaseButton";

export default async function ImageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: image, error } = await supabase
    .from("images")
    .select("*, creator:users!images_creator_id_fkey(*), owner:users!images_owner_id_fkey(*)")
    .eq("id", id)
    .single();

  if (error || !image) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 현재 사용자 포인트 조회
  let userPoints = 0;
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("points")
      .eq("id", user.id)
      .single();
    userPoints = userData?.points || 0;
  }

  const isOwner = user?.id === image.creator_id;
  const canPurchase = image.is_for_sale && !isOwner && user;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="md:flex">
          {/* 이미지 */}
          <div className="md:w-1/2 bg-gray-100">
            <div className="aspect-square">
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
          </div>

          {/* 정보 */}
          <div className="md:w-1/2 p-6 flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900">{image.title}</h1>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-3xl font-bold text-purple-600">
                {image.price} P
              </span>
              {image.is_for_sale ? (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                  판매 중
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                  판매 완료
                </span>
              )}
            </div>

            {image.description && (
              <p className="mt-4 text-gray-600">{image.description}</p>
            )}

            <div className="mt-6 space-y-2 text-sm text-gray-500">
              <p>
                <span className="font-medium">창작자:</span>{" "}
                {image.creator?.nickname || image.creator?.name || "익명"}
              </p>
              {image.owner && (
                <p>
                  <span className="font-medium">소유자:</span>{" "}
                  {image.owner?.nickname || image.owner?.name || "익명"}
                </p>
              )}
              <p>
                <span className="font-medium">등록일:</span>{" "}
                {new Date(image.created_at).toLocaleDateString("ko-KR")}
              </p>
            </div>

            {/* 액션 버튼 */}
            <div className="mt-auto pt-6 space-y-3">
              {canPurchase && (
                <>
                  <div className="text-sm text-gray-500">
                    내 포인트: <span className="font-semibold">{userPoints} P</span>
                    {userPoints < image.price && (
                      <span className="text-red-500 ml-2">(포인트 부족)</span>
                    )}
                  </div>
                  <PurchaseButton
                    imageId={image.id}
                    price={image.price}
                    disabled={userPoints < image.price}
                  />
                </>
              )}

              {isSeller && (
                <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-center">
                  내 작품입니다
                </div>
              )}

              {!user && image.is_for_sale && (
                <a
                  href="/login"
                  className="block w-full bg-purple-600 text-white py-3 rounded-lg font-semibold text-center hover:bg-purple-700 transition"
                >
                  로그인하고 구매하기
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
