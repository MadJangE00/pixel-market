"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Image, User } from "@/types";

interface Props {
  initialUserData: User | null;
  initialMyImages: Image[];
  initialSellingImages: Image[];
  initialPurchasedImages: Image[];
  initialSoldImages: Image[];
}

export default function MyGalleryClient({
  initialUserData,
  initialMyImages,
  initialSellingImages,
  initialPurchasedImages,
  initialSoldImages,
}: Props) {
  const [userData] = useState(initialUserData);
  const [myImages, setMyImages] = useState(initialMyImages);
  const [sellingImages, setSellingImages] = useState(initialSellingImages);
  const [purchasedImages, setPurchasedImages] = useState(initialPurchasedImages);
  const [soldImages] = useState(initialSoldImages);
  const [loading, setLoading] = useState<string | null>(null);
  const [resellModal, setResellModal] = useState<{ image: Image; newPrice: number } | null>(null);
  const router = useRouter();

  const FEE_PERCENT = 20;
  const ADMIN_FEE_PERCENT = 10;
  const CREATOR_FEE_PERCENT = 10;

  const calculateFee = (price: number) => {
    // 총 수수료 20% (올림)
    return Math.ceil(price * 0.2);
  };

  const calculateAdminFee = (price: number) => {
    // Admin 10% (올림)
    return Math.ceil(price * 0.1);
  };

  const calculateCreatorFee = (price: number) => {
    // 제작자 = 총 수수료 - Admin 수수료
    return calculateFee(price) - calculateAdminFee(price);
  };

  const handleToggleSale = async (imageId: string, currentlyForSale: boolean) => {
    setLoading(imageId);
    const supabase = createClient();

    const { error } = await supabase
      .from("images")
      .update({ is_for_sale: !currentlyForSale })
      .eq("id", imageId);

    setLoading(null);

    if (error) {
      alert("실패했습니다: " + error.message);
      return;
    }

    // 상태 업데이트
    if (currentlyForSale) {
      // 판매 중지
      const image = sellingImages.find((img) => img.id === imageId);
      if (image) {
        setSellingImages(sellingImages.filter((img) => img.id !== imageId));
        setMyImages([...myImages, { ...image, is_for_sale: false }]);
      }
    } else {
      // 판매 시작
      const image = myImages.find((img) => img.id === imageId);
      if (image) {
        setMyImages(myImages.filter((img) => img.id !== imageId));
        setSellingImages([...sellingImages, { ...image, is_for_sale: true }]);
      }
    }

    router.refresh();
  };

  const handleResell = async () => {
    if (!resellModal) return;

    const { image, newPrice } = resellModal;
    const fee = calculateFee(newPrice);

    setLoading(image.id);
    const supabase = createClient();

    // RPC 호출로 재판매 처리
    const { error } = await supabase.rpc("resell_image", {
      p_image_id: image.id,
      p_new_price: newPrice,
      p_fee: fee,
    });

    setLoading(null);
    setResellModal(null);

    if (error) {
      alert("재판매 등록 실패: " + error.message);
      return;
    }

    // 상태 업데이트
    setPurchasedImages(purchasedImages.filter((img) => img.id !== image.id));
    setSellingImages([...sellingImages, { ...image, price: newPrice, is_for_sale: true }]);

    router.refresh();
  };

  const handleStopResell = async (imageId: string) => {
    setLoading(imageId);
    const supabase = createClient();

    const { error } = await supabase
      .from("images")
      .update({ is_for_sale: false })
      .eq("id", imageId);

    setLoading(null);

    if (error) {
      alert("실패했습니다: " + error.message);
      return;
    }

    // 상태 업데이트
    const image = sellingImages.find((img) => img.id === imageId);
    if (image) {
      setSellingImages(sellingImages.filter((img) => img.id !== imageId));
      setPurchasedImages([...purchasedImages, { ...image, is_for_sale: false }]);
    }

    router.refresh();
  };

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
            <span>내 작품: {myImages.length + sellingImages.length}개</span>
            <span>판매 중: {sellingImages.length}개</span>
            <span>구매한 작품: {purchasedImages.length}개</span>
            <span>판매 완료: {soldImages.length}개</span>
          </div>
        </div>
      )}

      {/* 내 작품 (판매 중 아님) */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">📁 내 작품 ({myImages.length})</h2>
        {myImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {myImages.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
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
                  <div className="absolute top-2 right-2 bg-gray-600 text-white px-2 py-1 rounded-full text-sm font-semibold">
                    {image.price} P
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{image.title}</h3>
                  <button
                    onClick={() => handleToggleSale(image.id, false)}
                    disabled={loading === image.id}
                    className="mt-3 w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {loading === image.id ? "처리 중..." : "판매하기"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            판매 중이 아닌 작품이 없습니다.{" "}
            <a href="/sell" className="text-purple-600 hover:underline">
              작품 등록하기
            </a>
          </p>
        )}
      </section>

      {/* 판매 중인 작품 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">🛒 판매 중인 작품 ({sellingImages.length})</h2>
        {sellingImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sellingImages.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
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
                  {image.owner_id && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                      재판매
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{image.title}</h3>
                  <button
                    onClick={() => image.owner_id ? handleStopResell(image.id) : handleToggleSale(image.id, true)}
                    disabled={loading === image.id}
                    className="mt-3 w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50"
                  >
                    {loading === image.id ? "처리 중..." : "판매 중지"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">판매 중인 작품이 없습니다</p>
        )}
      </section>

      {/* 구매한 작품 (재판매 가능) */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">
          🎨 구매한 작품 ({purchasedImages.length})
        </h2>
        {purchasedImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {purchasedImages.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
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
                  <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-sm font-semibold">
                    {image.price} P
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {image.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    by {image.creator?.nickname || image.creator?.name || "익명"}
                  </p>
                  <button
                    onClick={() => setResellModal({ image, newPrice: image.price })}
                    disabled={loading === image.id}
                    className="mt-1 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    재판매하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">아직 구매한 작품이 없습니다</p>
        )}
      </section>

      {/* 판매 완료된 작품 */}
      {soldImages.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            ✅ 판매 완료 ({soldImages.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {soldImages.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden opacity-75"
              >
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
                  <h3 className="font-semibold text-gray-900 truncate">
                    {image.title}
                  </h3>
                  <p className="text-sm text-green-600">+{image.price} P 획득</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 재판매 모달 */}
      {resellModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">재판매 설정</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                판매 가격 (포인트)
              </label>
              <input
                type="number"
                value={resellModal.newPrice}
                onChange={(e) => setResellModal({ ...resellModal, newPrice: parseInt(e.target.value) || 0 })}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">판매 가격</span>
                <span className="font-medium">{resellModal.newPrice} P</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">수수료</span>
                <span className="font-medium text-red-600">-{calculateFee(resellModal.newPrice)} P</span>
              </div>
              <div className="text-xs text-gray-500 pl-2">
                └ Admin: -{calculateAdminFee(resellModal.newPrice)} P
              </div>
              <div className="text-xs text-gray-500 pl-2">
                └ 제작자: -{calculateCreatorFee(resellModal.newPrice)} P
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-gray-900 font-medium">실제 수령</span>
                <span className="font-bold text-green-600">
                  {resellModal.newPrice - calculateFee(resellModal.newPrice)} P
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setResellModal(null)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                취소
              </button>
              <button
                onClick={handleResell}
                disabled={loading === resellModal.image.id}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
              >
                {loading === resellModal.image.id ? "처리 중..." : "판매 등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
