-- =============================================
-- Pixel Market 테이블 생성
-- club-app과 같은 Supabase 인스턴스에서 실행
-- =============================================

-- 1. 이미지 테이블
CREATE TABLE IF NOT EXISTS images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0, -- 포인트
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  creator_id UUID REFERENCES users(id) NOT NULL,
  owner_id UUID REFERENCES users(id), -- NULL이면 아직 판매 중
  is_for_sale BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sold_at TIMESTAMP WITH TIME ZONE
);

-- 2. 거래 내역 테이블
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID REFERENCES images(id) NOT NULL,
  buyer_id UUID REFERENCES users(id) NOT NULL,
  seller_id UUID REFERENCES users(id) NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 이미지 태그 (선택적)
CREATE TABLE IF NOT EXISTS image_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  UNIQUE(image_id, tag)
);

-- =============================================
-- 인덱스
-- =============================================
CREATE INDEX IF NOT EXISTS idx_images_creator ON images(creator_id);
CREATE INDEX IF NOT EXISTS idx_images_owner ON images(owner_id);
CREATE INDEX IF NOT EXISTS idx_images_for_sale ON images(is_for_sale) WHERE is_for_sale = true;
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_image_tags_tag ON image_tags(tag);

-- =============================================
-- RLS (Row Level Security) 정책
-- =============================================

-- images 테이블
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- 전체 공개
CREATE POLICY "images_select" ON images
  FOR SELECT USING (true);

-- 로그인 사용자만 생성
CREATE POLICY "images_insert" ON images
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- 작성자 또는 admin만 수정
CREATE POLICY "images_update" ON images
  FOR UPDATE USING (
    auth.uid() = creator_id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 작성자, 소유자, admin만 삭제
CREATE POLICY "images_delete" ON images
  FOR DELETE USING (
    auth.uid() = creator_id OR
    auth.uid() = owner_id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- transactions 테이블
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 전체 공개 (투명성)
CREATE POLICY "transactions_select" ON transactions
  FOR SELECT USING (true);

-- 로그인 사용자만 생성 (구매 로직에서 처리)
CREATE POLICY "transactions_insert" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- image_tags 테이블
ALTER TABLE image_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "image_tags_select" ON image_tags
  FOR SELECT USING (true);

CREATE POLICY "image_tags_insert" ON image_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM images WHERE id = image_id AND creator_id = auth.uid())
  );

CREATE POLICY "image_tags_delete" ON image_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM images WHERE id = image_id AND creator_id = auth.uid())
  );

-- =============================================
-- 사이트 설정 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  listing_fee INTEGER NOT NULL DEFAULT 5, -- 등록 수수료 (포인트)
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- 기본 설정 생성
INSERT INTO site_settings (id, listing_fee) VALUES (1, 5) ON CONFLICT (id) DO NOTHING;

-- RLS 정책
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 전체 공개 (누구나 설정 조회 가능)
CREATE POLICY "site_settings_select" ON site_settings
  FOR SELECT USING (true);

-- admin만 수정 가능
CREATE POLICY "site_settings_update" ON site_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- Storage 버킷 생성
-- =============================================
-- Supabase 대시보드에서 직접 생성:
-- Storage > Create a new bucket > Name: "pixel-images" > Public bucket 체크

-- Storage 정책 (pixel-images 버킷)
-- 1. Public read: Anyone can download
-- 2. Authenticated upload: Only authenticated users can upload
-- 3. Owner delete: Only the file owner can delete

-- =============================================
-- 함수: 이미지 구매 (포인트 차감 + 소유권 이전)
-- =============================================
CREATE OR REPLACE FUNCTION purchase_image(
  p_image_id UUID,
  p_buyer_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_image RECORD;
  v_seller_id UUID;
  v_price INTEGER;
  v_buyer_points INTEGER;
  v_seller_points INTEGER;
BEGIN
  -- 이미지 정보 조회
  SELECT * INTO v_image FROM images WHERE id = p_image_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', '이미지를 찾을 수 없습니다');
  END IF;
  
  IF NOT v_image.is_for_sale THEN
    RETURN json_build_object('success', false, 'error', '판매 중인 이미지가 아닙니다');
  END IF;
  
  IF v_image.creator_id = p_buyer_id THEN
    RETURN json_build_object('success', false, 'error', '자신의 이미지는 구매할 수 없습니다');
  END IF;
  
  v_seller_id := v_image.creator_id;
  v_price := v_image.price;
  
  -- 구매자 포인트 확인
  SELECT points INTO v_buyer_points FROM users WHERE id = p_buyer_id;
  
  IF v_buyer_points < v_price THEN
    RETURN json_build_object('success', false, 'error', '포인트가 부족합니다');
  END IF;
  
  -- 판매자 현재 포인트 조회
  SELECT points INTO v_seller_points FROM users WHERE id = v_seller_id;
  
  -- 포인트 이전
  UPDATE users SET points = points - v_price WHERE id = p_buyer_id;
  UPDATE users SET points = points + v_price WHERE id = v_seller_id;
  
  -- 소유권 이전
  UPDATE images 
  SET owner_id = p_buyer_id, 
      is_for_sale = false, 
      sold_at = NOW()
  WHERE id = p_image_id;
  
  -- 거래 내역 생성
  INSERT INTO transactions (image_id, buyer_id, seller_id, price)
  VALUES (p_image_id, p_buyer_id, v_seller_id, v_price);
  
  RETURN json_build_object(
    'success', true, 
    'message', '구매 완료',
    'price', v_price
  );
END;
$$;

-- =============================================
-- 함수: 이미지 등록 (수수료 차감)
-- =============================================
CREATE OR REPLACE FUNCTION register_image(
  p_title VARCHAR(255),
  p_description TEXT,
  p_price INTEGER,
  p_image_url TEXT,
  p_creator_id UUID,
  p_listing_fee INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_points INTEGER;
  v_admin_id UUID;
BEGIN
  -- 수수료가 있는 경우
  IF p_listing_fee > 0 THEN
    -- 생성자 포인트 확인
    SELECT points INTO v_creator_points FROM users WHERE id = p_creator_id;
    
    IF v_creator_points < p_listing_fee THEN
      RETURN json_build_object('success', false, 'error', '포인트가 부족합니다');
    END IF;
    
    -- admin 유저 찾기
    SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;
    
    IF v_admin_id IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'admin 계정을 찾을 수 없습니다');
    END IF;
    
    -- 포인트 차감 (생성자)
    UPDATE users SET points = points - p_listing_fee WHERE id = p_creator_id;
    
    -- 포인트 이전 (admin)
    UPDATE users SET points = points + p_listing_fee WHERE id = v_admin_id;
  END IF;
  
  -- 이미지 등록
  INSERT INTO images (title, description, price, image_url, creator_id, is_for_sale)
  VALUES (p_title, p_description, p_price, p_image_url, p_creator_id, false);
  
  RETURN json_build_object('success', true, 'message', '등록 완료');
END;
$$;
