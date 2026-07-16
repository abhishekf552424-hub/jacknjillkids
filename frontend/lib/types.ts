export type UserRole = "customer" | "super_admin" | "order_manager" | "content_manager";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  role: UserRole;
};

export type AgeGroup = {
  id: string;
  label: string;
  slug: string;
  sort_order: number;
};

export type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  image_url: string | null;
  display_shape: "circle" | "square";
  is_featured_in_menu: boolean;
  sort_order: number;
  is_active: boolean;
  children?: Category[];
};

export type ProductImage = { id: string; url: string; alt_text: string | null; sort_order: number };
export type ProductVariant = {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  sku: string | null;
  stock_qty: number;
  price_override: number | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  gender: "boys" | "girls" | "unisex" | null;
  brand: string | null;
  base_price: number;
  mrp: number;
  status: "draft" | "active" | "out_of_stock" | "archived";
  is_featured: boolean;
  is_new_arrival: boolean;
  meta_title: string | null;
  meta_description: string | null;
  alt_text: string | null;
  size_chart_url: string | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  category?: Category | null;
};

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "return_approved"
  | "refunded";

export type Order = {
  id: string;
  order_number: string;
  user_id: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  tax: number;
  total: number;
  coupon_code: string | null;
  payment_status: "pending" | "paid" | "failed" | "refunded" | "cod";
  payment_method: "razorpay" | "cod" | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  shipping_address: any;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  history?: OrderStatusHistory[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  image_url: string | null;
  quantity: number;
  price_at_purchase: number;
};

export type OrderStatusHistory = {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_at: string;
};

export type HomepageSection = {
  id: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  config: any;
  sort_order: number;
  is_active: boolean;
};

export type TrustBadge = {
  id: string;
  icon: string | null;
  label: string;
  subtext: string | null;
  sort_order: number;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  page_context: string;
  sort_order: number;
};

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
};

export type CartLine = {
  variant_id: string;
  product_id: string;
  product_name: string;
  slug: string;
  image: string;
  variant_label: string;
  price: number;
  mrp: number;
  quantity: number;
  stock_qty: number;
};
