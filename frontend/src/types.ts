export type Color = { name: string; hex: string };

export type Product = {
  id: string;
  name: string;
  category: string;
  gender?: "women" | "men";
  fabric: string;
  price: number;
  mrp?: number;
  colors: Color[];
  tags: string[];
  occasions: string[];
  description: string;
  image: string;
  sizes?: string[];
};

export type CartItem = {
  sku_id: string;
  name: string;
  size?: string;
  qty: number;
  price: number;
  image: string;
};

export type Cart = {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  promo?: string | null;
};

export type SizingData = {
  sku_id: string;
  name: string;
  image: string;
  suggested_size: string;
  rationale: string;
  returns_rate?: number;
};

export type CheckoutStep = "review" | "promo" | "address" | "payment" | "success";

export type ChatMsg = { role: "user" | "assistant"; text: string; id: number };

export type ServerMsg =
  | { type: "init"; catalog: Product[]; profile: any; default_avatar: string; session_id: string; live_available: boolean }
  | { type: "assistant_text"; text: string; partial?: boolean }
  | { type: "ui_command"; command: string; args: any }
  | { type: "thinking" }
  | { type: "turn_complete" }
  | { type: "error"; message: string };
