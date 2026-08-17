import { create } from "zustand";
import { toast } from "sonner";
import type {
	FundProduct,
	BasketItem,
	DiagnosticsData,
	SimulationData,
	ProposalData,
	Profile,
	ChatMsg,
} from "./types";

type Store = {
	// Connection & Advisor
	connected: boolean;
	thinking: boolean;
	sid: string;
	selectedAvatar: string;
	live: {
		available: boolean;
		active: boolean;
		status: string;
		muted: boolean;
		talking: boolean;
		caption: string;
	};

	// Fund catalog & Active Views
	activeTab: "explorer" | "diagnostics" | "simulation";
	explorerView: "carousel" | "grid" | "matrix";
	expandedAdvisor: boolean;
	funds: FundProduct[];
	profile: Profile | null;
	portfolio: Profile | null;
	visibleFundIds: string[] | null; // null => show all
	highlightIds: string[];
	filter: {
		category: string;
		subCategory: string;
		risk: string;
		sort: "cagr_desc" | "rating_desc" | "ter_asc" | "aum_desc";
		query: string;
	};

	// Advisory Basket
	basket: BasketItem[];
	totalLumpsum: number;
	totalSip: number;
	basketOpen: boolean;

	// Diagnostics & Simulation
	diagnostics: DiagnosticsData | null;
	diagnosticsOpen: boolean;
	simulation: SimulationData | null;
	simulationOpen: boolean;

	// Proposal & Mandate
	proposal: ProposalData | null;
	proposalOpen: boolean;
	mandateModalOpen: boolean;
	mandateStatus: "idle" | "awaiting_otp" | "authorized" | "error";
	lastTransactionId: string | null;

	// Chat & Toasts
	chat: ChatMsg[];
	voiceOn: boolean;
	listening: boolean;
	speaking: boolean;

	// Theme
	theme: "dark" | "light";
	toggleTheme: () => void;

	// Actions
	set: (p: Partial<Store>) => void;
	setFilter: (p: Partial<Store["filter"]>) => void;
	pushChat: (m: Omit<ChatMsg, "id">) => void;
	pushToast: (text: string, type?: "info" | "success" | "warning" | "error") => void;
	addToBasket: (item: BasketItem) => void;
	removeFromBasket: (productId: string) => void;
};

let _id = 1;
const nid = () => _id++;

if (typeof window !== "undefined") {
	const savedTheme = (localStorage.getItem("cymbal_theme") as "dark" | "light") || "dark";
	document.documentElement.classList.toggle("dark", savedTheme === "dark");
	setTimeout(() => {
		useStore.setState({ theme: savedTheme });
		(window as any).__store = useStore;
	}, 0);
}

export const useStore = create<Store>((set, get) => ({
	connected: false,
	thinking: false,
	sid: "",
	selectedAvatar: "Ananya",
	live: {
		available: false,
		active: false,
		status: "idle",
		muted: false,
		talking: false,
		caption: "",
	},

	activeTab: "explorer",
	explorerView: "carousel",
	expandedAdvisor: false,
	funds: [],
	profile: null,
	portfolio: null,
	visibleFundIds: null,
	highlightIds: [],
	filter: {
		category: "All",
		subCategory: "All",
		risk: "All",
		sort: "cagr_desc",
		query: "",
	},

	basket: [],
	totalLumpsum: 0,
	totalSip: 0,
	basketOpen: false,

	diagnostics: null,
	diagnosticsOpen: false,
	simulation: null,
	simulationOpen: false,

	proposal: null,
	proposalOpen: false,
	mandateModalOpen: false,
	mandateStatus: "idle",
	lastTransactionId: null,

	chat: [
		{
			id: 0,
			role: "assistant",
			text: "Namaste Rahul! I'm Ananya, your Senior Private Wealth Advisor at Cymbal Premier. How can I assist you with your ₹75L portfolio and goal milestones today?",
		},
	],
	voiceOn: true,
	listening: false,
	speaking: false,

	theme: "dark",
	toggleTheme: () => {
		const next = get().theme === "dark" ? "light" : "dark";
		if (typeof window !== "undefined") {
			localStorage.setItem("cymbal_theme", next);
			document.documentElement.classList.toggle("dark", next === "dark");
		}
		set({ theme: next });
	},

	set: (p) => set(p),
	setFilter: (p) => set((s) => ({ filter: { ...s.filter, ...p } })),
	pushChat: (m) => set((s) => ({ chat: [...s.chat, { ...m, id: nid() }] })),
	pushToast: (text, type = "info") => {
		switch (type) {
			case "success":
				toast.success(text);
				break;
			case "warning":
				toast.warning(text);
				break;
			case "error":
				toast.error(text);
				break;
			default:
				toast.info(text);
				break;
		}
	},

	addToBasket: (item) =>
		set((s) => {
			const existingIdx = s.basket.findIndex(
				(b) => b.product_id === item.product_id,
			);
			let nextBasket = [...s.basket];
			if (existingIdx >= 0) {
				nextBasket[existingIdx] = { ...nextBasket[existingIdx], ...item };
			} else {
				nextBasket.push(item);
			}
			const totalLumpsum = nextBasket.reduce(
				(acc, b) => acc + (b.lumpsum_inr || 0),
				0,
			);
			const totalSip = nextBasket.reduce(
				(acc, b) => acc + (b.monthly_sip_inr || 0),
				0,
			);
			return { basket: nextBasket, totalLumpsum, totalSip };
		}),

	removeFromBasket: (productId) =>
		set((s) => {
			const nextBasket = s.basket.filter((b) => b.product_id !== productId);
			const totalLumpsum = nextBasket.reduce(
				(acc, b) => acc + (b.lumpsum_inr || 0),
				0,
			);
			const totalSip = nextBasket.reduce(
				(acc, b) => acc + (b.monthly_sip_inr || 0),
				0,
			);
			return { basket: nextBasket, totalLumpsum, totalSip };
		}),
}));
