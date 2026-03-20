import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MyGalleryClient from "./MyGalleryClient";

export default async function MyGalleryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 유저 상세 정보
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // 내 작품 (판매 중 아님)
  const { data: myImages } = await supabase
    .from("images")
    .select("*")
    .eq("creator_id", user.id)
    .eq("is_for_sale", false)
    .is("owner_id", null)
    .order("created_at", { ascending: false });

  // 판매 중인 내 작품
  const { data: sellingImages } = await supabase
    .from("images")
    .select("*")
    .eq("creator_id", user.id)
    .eq("is_for_sale", true)
    .order("created_at", { ascending: false });

  // 내가 구매한 이미지
  const { data: purchasedImages } = await supabase
    .from("images")
    .select("*, creator:users!images_creator_id_fkey(*)")
    .eq("owner_id", user.id)
    .order("sold_at", { ascending: false });

  // 판매 완료된 내 이미지
  const { data: soldImages } = await supabase
    .from("images")
    .select("*, owner:users!images_owner_id_fkey(*)")
    .eq("creator_id", user.id)
    .not("owner_id", "is", null);

  return (
    <MyGalleryClient
      initialUserData={userData}
      initialMyImages={myImages || []}
      initialSellingImages={sellingImages || []}
      initialPurchasedImages={purchasedImages || []}
      initialSoldImages={soldImages || []}
    />
  );
}
