"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PurchaseButton({
  imageId,
  price,
  disabled,
}: {
  imageId: string;
  price: number;
  disabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePurchase = async () => {
    if (!confirm(`정말 ${price} 포인트로 구매하시겠습니까?`)) return;

    setLoading(true);
    const supabase = createClient();

    // 현재 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // RPC 함수 호출 (포인트 차감 + 소유권 이전)
    const { data, error } = await supabase.rpc("purchase_image", {
      p_image_id: imageId,
      p_buyer_id: user.id,
    });

    setLoading(false);

    if (error) {
      alert("구매 실패: " + error.message);
      return;
    }

    if (data?.success) {
      alert("구매 완료! 내 갤러리에서 확인하세요.");
      router.push("/my-gallery");
      router.refresh();
    } else {
      alert("구매 실패: " + (data?.error || "알 수 없는 오류"));
    }
  };

  return (
    <button
      onClick={handlePurchase}
      disabled={disabled || loading}
      className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "구매 중..." : disabled ? "포인트 부족" : `${price} P로 구매하기`}
    </button>
  );
}
