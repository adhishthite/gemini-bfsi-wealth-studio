import { create } from "zustand";
import type { Cart, ChatMsg, Product, SizingData, CheckoutStep } from "./types";

type VtoState = {
  status: "idle" | "processing" | "done" | "error";
  names?: string[];
  context?: string;
  image?: string;
  caption?: string;
  error?: string;
};

type CheckoutState = { open: boolean; step: CheckoutStep; data: any } | null;

type Store = {
  // connection
  connected: boolean;
  thinking: boolean;
  sid: string;
  selectedAvatar: string;
  live: { available: boolean; active: boolean; status: string; muted: boolean; talking: boolean; caption: string };
  // data
  catalog: Product[];
  profile: any;
  visibleIds: string[] | null; // null => all (AI filter)
  highlightIds: string[];
  criteria: any;
  filter: { gender: "all" | "women" | "men"; category: string; occasion: string; sort: string; query: string };
  // cart
  cart: Cart;
  cartOpen: boolean;
  // orders (My Orders)
  orders: any[];
  ordersOpen: boolean;
  // modals
  sizing: SizingData | null;
  vto: VtoState;
  checkout: CheckoutState;
  // chat + toasts
  chat: ChatMsg[];
  toasts: { id: number; text: string }[];
  // voice
  voiceOn: boolean;
  listening: boolean;
  speaking: boolean;

  set: (p: Partial<Store>) => void;
  setFilter: (p: Partial<Store["filter"]>) => void;
  pushChat: (m: Omit<ChatMsg, "id">) => void;
  pushToast: (text: string) => void;
  dismissToast: (id: number) => void;
  applyCommand: (command: string, args: any) => void;
};

let _id = 1;
const nid = () => _id++;
// expose for quick debugging in the browser console (harmless for a demo): __store.getState()/.setState()
if (typeof window !== "undefined") setTimeout(() => ((window as any).__store = useStore), 0);

export const useStore = create<Store>((set, get) => ({
  connected: false,
  thinking: false,
  sid: "",
  selectedAvatar: "Kira",
  live: { available: false, active: false, status: "idle", muted: false, talking: false, caption: "" },
  catalog: [],
  profile: null,
  visibleIds: null,
  highlightIds: [],
  criteria: null,
  filter: { gender: "men", category: "all", occasion: "all", sort: "featured", query: "" },
  cart: { items: [], subtotal: 0, discount: 0, total: 0, promo: null },
  cartOpen: false,
  orders: [],
  ordersOpen: false,
  sizing: null,
  vto: { status: "idle" },
  checkout: null,
  chat: [],
  toasts: [],
  voiceOn: true,
  listening: false,
  speaking: false,

  set: (p) => set(p),
  // manual filter overrides any AI filter
  setFilter: (p) => set((s) => ({ filter: { ...s.filter, ...p }, visibleIds: null, criteria: null })),
  pushChat: (m) => set((s) => ({ chat: [...s.chat, { ...m, id: nid() }] })),
  pushToast: (text) => {
    const id = nid();
    set((s) => ({ toasts: [...s.toasts, { id, text }] }));
    setTimeout(() => get().dismissToast(id), 3800);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  applyCommand: (command, args) => {
    switch (command) {
      case "filter": {
        // sync the gender tab to whatever the AI inferred, so UI + AI stay consistent
        const cg = args.criteria?.gender;
        set((s) => ({
          visibleIds: args.sku_ids ?? null, criteria: args.criteria ?? null, highlightIds: [],
          filter: cg ? { ...s.filter, gender: cg } : s.filter,
        }));
        break;
      }
      case "highlight":
        set({ highlightIds: args.sku_ids ?? [] });
        setTimeout(() => {
          const cur = get().highlightIds;
          if (cur === args.sku_ids) set({ highlightIds: [] });
        }, 4000);
        break;
      case "sizing":
        set({ sizing: args as SizingData });
        break;
      case "cart_update":
        // open the drawer when items were added; close it when the bag is emptied (e.g. after an order)
        set({ cart: args, cartOpen: !!(args.items && args.items.length) });
        break;
      case "orders_update":
        set({ orders: args.orders ?? [] });
        break;
      case "orders_open":
        set({ orders: args.orders ?? get().orders, ordersOpen: true });
        break;
      case "cart_open":
        set({ cartOpen: true });
        break;
      case "vto_start":
        set({ vto: { status: "processing", names: args.names, context: args.context } });
        break;
      case "vto_result":
        set((s) => ({ vto: { ...s.vto, status: "done", image: args.image_url, caption: args.caption } }));
        break;
      case "vto_error":
        set((s) => ({ vto: { ...s.vto, status: "error", error: args.message } }));
        break;
      case "checkout":
        set({ checkout: { open: true, step: args.step, data: args.data }, cartOpen: false });
        break;
      case "toast":
        get().pushToast(args.text);
        break;
    }
  },
}));
