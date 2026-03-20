"use client";

import { useState } from "react";
import type { SiteSettings } from "@/types";

interface Props {
  initialSettings: SiteSettings | null;
}

export default function AdminSettings({ initialSettings }: Props) {
  const [listingFee, setListingFee] = useState(initialSettings?.listing_fee || 5);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_fee: listingFee }),
    });

    setLoading(false);

    if (res.ok) {
      setMessage("저장되었습니다!");
    } else {
      const data = await res.json();
      setMessage(data.error || "저장 실패");
    }
  };

  return (
    <div className="space-y-8">
      {/* 수수료 설정 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">💰 수수료 설정</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              작품 등록 수수료 (포인트)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={listingFee}
                onChange={(e) => setListingFee(parseInt(e.target.value) || 0)}
                min="0"
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
              <span className="text-gray-500">P</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              작품을 등록할 때 차감되는 수수료입니다. 수수료는 어드민 계정으로 이전됩니다.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? "저장 중..." : "저장"}
          </button>

          {message && (
            <p className={message.includes("실패") ? "text-red-600" : "text-green-600"}>
              {message}
            </p>
          )}
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">수수료 안내</p>
        <ul className="list-disc list-inside space-y-1">
          <li>수수료를 0으로 설정하면 무료 등록입니다</li>
          <li>수수료는 판매자가 아닌 어드민 계정으로 이전됩니다</li>
          <li>변경 사항은 즉시 적용됩니다</li>
        </ul>
      </div>
    </div>
  );
}
