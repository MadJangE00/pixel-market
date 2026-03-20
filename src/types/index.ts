export type User = {
  id: string
  email: string
  name: string
  nickname?: string
  phone?: string
  role: 'user' | 'admin'
  points: number
  created_at: string
}

export type Image = {
  id: string
  title: string
  description?: string
  price: number
  image_url: string
  thumbnail_url?: string
  creator_id: string
  owner_id?: string
  is_for_sale: boolean
  created_at: string
  sold_at?: string
  creator?: User
  owner?: User
  tags?: string[]
}

export type Transaction = {
  id: string
  image_id: string
  buyer_id: string
  seller_id: string
  price: number
  created_at: string
  image?: Image
  buyer?: User
  seller?: User
}
