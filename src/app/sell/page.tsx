"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { SiteSettings } from "@/types";

export default function SellPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userPoints, setUserPoints] = useState(0);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // 유저 정보 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("points")
          .eq("id", user.id)
          .single();
        if (userData) setUserPoints(userData.points);
      }

      // 수수료 설정 가져오기
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    };

    fetchData();
  }, []);

  const listingFee = settings?.listing_fee || 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("이미지를 선택해주세요");
      return;
    }

    if (!title.trim()) {
      setError("제목을 입력해주세요");
      return;
    }

    if (!price || parseInt(price) < 0) {
      setError("올바른 가격을 입력해주세요");
      return;
    }

    // 수수료 확인
    if (userPoints < listingFee) {
      setError(`포인트가 부족합니다. 등록 수수료: ${listingFee}P, 보유: ${userPoints}P`);
      return;
    }

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

    // Storage에 이미지 업로드
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("pixel-images")
      .upload(fileName, file);

    if (uploadError) {
      setError("이미지 업로드 실패: " + uploadError.message);
      setLoading(false);
      return;
    }

    // 공개 URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from("pixel-images").getPublicUrl(fileName);

    // DB에 저장 + 수수료 처리 (RPC 호출)
    const { error: insertError } = await supabase.rpc("register_image", {
      p_title: title,
      p_description: description || null,
      p_price: parseInt(price),
      p_image_url: publicUrl,
      p_creator_id: user.id,
      p_listing_fee: listingFee,
    });

    setLoading(false);

    if (insertError) {
      setError("등록 실패: " + insertError.message);
      return;
    }

    router.push("/market");
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">🎨 작품 등록</h1>

      {/* 수수료 안내 */}
      {settings && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-800">💰 등록 수수료 안내</p>
              <p className="text-sm text-amber-700 mt-1">
                작품 등록 시 <strong>{listingFee}P</strong>가 차감됩니다.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-amber-700">보유 포인트</p>
              <p className={`font-bold ${userPoints >= listingFee ? "text-amber-800" : "text-red-600"}`}>
                {userPoints.toLocaleString()} P
              </p>
            </div>
          </div>
          {userPoints < listingFee && (
            <p className="mt-2 text-sm text-red-600 font-medium">
              ⚠️ 포인트가 부족하여 등록할 수 없습니다.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 이미지 업로드 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이미지
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition"
          >
            {preview ? (
              <div className="aspect-video relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg"
                />
              </div>
            ) : (
              <div className="text-gray-500">
                <div className="text-4xl mb-2">📷</div>
                <p>클릭하여 이미지 선택</p>
                <p className="text-sm mt-1">JPG, PNG, GIF</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            placeholder="작품 제목"
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            설명 (선택)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            placeholder="작품에 대한 설명"
          />
        </div>

        {/* 가격 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            가격 (포인트)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              placeholder="100"
            />
            <span className="text-gray-500">P</span>
          </div>
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={loading || userPoints < listingFee}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "등록 중..." : `작품 등록하기 (${listingFee}P 차감)`}
        </button>
      </form>
    </div>
  );
}
