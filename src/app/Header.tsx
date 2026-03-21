"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@/types";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // 초기 유저 정보 가져오기
    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();
        setUser(userData);
        setIsAdmin(userData?.role === "admin");
      }
      setLoading(false);
    };

    fetchUser();

    // 인증 상태 변화 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        fetchUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 py-3 md:py-4">
        {/* 상단 줄: 로고 + 인증 */}
        <div className="flex items-center justify-between">
          <a href="/" className="text-lg md:text-xl font-bold text-purple-600 shrink-0">
            🎨 Pixel Market
          </a>

          {/* 데스크톱: 전체 메뉴 */}
          <div className="hidden md:flex items-center gap-4">
            <a href="/market" className="text-gray-600 hover:text-gray-900">
              마켓
            </a>
            <a href="/sell" className="text-gray-600 hover:text-gray-900">
              판매하기
            </a>
            <a href="/my-gallery" className="text-gray-600 hover:text-gray-900">
              내 갤러리
            </a>
            {isAdmin && (
              <a href="/admin" className="text-purple-600 hover:text-purple-700 font-medium">
                관리자
              </a>
            )}

            <div className="flex items-center gap-2">
              {loading ? (
                <div className="w-24 h-8 bg-gray-100 animate-pulse rounded" />
              ) : user ? (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
                  >
                    <span className="text-gray-700 font-medium">
                      {user.nickname || user.name}
                    </span>
                    <span className="text-purple-600 font-semibold">
                      {user.points.toLocaleString()} P
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-1.5 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* 모바일: 인증만 표시 */}
          <div className="md:hidden flex items-center gap-2">
            {loading ? (
              <div className="w-16 h-8 bg-gray-100 animate-pulse rounded" />
            ) : user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-lg text-sm"
                >
                  <span className="text-gray-700">
                    {user.nickname || user.name}
                  </span>
                  <span className="text-purple-600 font-semibold">
                    {user.points.toLocaleString()}P
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700 text-xs"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-purple-600 hover:text-purple-700 font-medium text-sm"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>

        {/* 모바일 하단 메뉴 */}
        <div className="md:hidden flex items-center gap-4 mt-2 pt-2 border-t border-gray-100 text-sm">
          <a href="/market" className="text-gray-600 hover:text-gray-900">
            마켓
          </a>
          <a href="/sell" className="text-gray-600 hover:text-gray-900">
            그림 등록하기
          </a>
          <a href="/my-gallery" className="text-gray-600 hover:text-gray-900">
            내 갤러리
          </a>
          {isAdmin && (
            <a href="/admin" className="text-purple-600 hover:text-purple-700 font-medium">
              관리자
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
