export type FundCategory = "Equity" | "Debt" | "Commodities" | "Hybrid";

export type FundProduct = {
	id: string;
	name: string;
	amc: string;
	category: FundCategory;
	sub_category: string;
	nav: number;
	cagr_1y: number;
	cagr_3y: number;
	cagr_5y: number;
	risk_level: string;
	ter: number;
	aum_crores: number;
	fund_manager: string;
	rating: number;
	min_sip: number;
	min_lumpsum: number;
	top_holdings: string[];
	tags: string[];
	description: string;
};

export type BasketItem = {
	product_id: string;
	name: string;
	category: string;
	sub_category: string;
	lumpsum_inr: number;
	monthly_sip_inr: number;
	linked_goal?: string;
	cagr_3y?: number;
	ter?: number;
};

export type DiagnosticsData = {
	client_name?: string;
	total_aum_inr: number;
	current_allocation: {
		equity: number;
		debt: number;
		gold: number;
		cash_liquid: number;
	};
	concentration_risks: string[];
	goals: Array<{
		id: string;
		name: string;
		target_year: number;
		target_amount_inr: number;
		current_funded_inr: number;
		on_track: boolean | string;
	}>;
	monthly_surplus_inr: number;
	unallocated_surplus_inr: number;
};

export type SimulationTrajectoryPoint = {
	year: number;
	projected_corpus_inr: number;
	education_goal_target?: number | null;
	retirement_goal_target?: number | null;
};

export type SimulationData = {
	scenario: string;
	target_allocation: {
		equity: number;
		debt: number;
		gold: number;
		liquid: number;
	};
	blended_expected_cagr_pct: number;
	monthly_sip_inr: number;
	horizon_years: number;
	projected_final_corpus_inr: number;
	goals_feasibility: {
		education_2032_status: string;
		retirement_2042_status: string;
	};
	trajectory: SimulationTrajectoryPoint[];
};

export type ProposalData = {
	proposal_id: string;
	client_name: string;
	date: string;
	strategic_rationale: string;
	client_notes: string;
	basket_items: BasketItem[];
	total_lumpsum_inr: number;
	total_sip_inr: number;
	download_url: string;
	pdf_generated?: boolean;
};

export type Profile = {
	user_id: string;
	name: string;
	email: string;
	phone?: string;
	city: string;
	age: number;
	occupation: string;
	risk_profile: string;
	total_aum_inr: number;
	current_allocation: {
		equity: number;
		debt: number;
		gold: number;
		cash_liquid: number;
	};
	allocation_breakdown?: {
		equity_inr: number;
		debt_inr: number;
		gold_inr: number;
		cash_liquid_inr: number;
	};
	current_holdings?: Array<{
		id: string;
		name: string;
		category: string;
		invested_inr: number;
		current_value_inr: number;
		unrealized_gain_inr: number;
		xirr: number;
	}>;
	goals?: Array<{
		id: string;
		name: string;
		target_year: number;
		target_amount_inr: number;
		current_funded_inr: number;
		on_track: boolean | string;
	}>;
	monthly_surplus_inr?: number;
	active_sip_inr?: number;
	kyc_status?: string;
	bank_account?: {
		bank: string;
		account_number_last4: string;
		ifsc: string;
		type: string;
	};
	portfolio_health_notes?: string[];
};

export type ChatMsg = {
	id: number;
	role: "user" | "assistant";
	text: string;
};

export type ServerMsg =
	| {
			type: "init";
			session_id: string;
			funds: FundProduct[];
			catalog?: FundProduct[];
			profile: Profile;
			portfolio?: Profile;
			basket: BasketItem[];
			default_avatar: string;
			live_available: boolean;
	  }
	| { type: "assistant_text"; text: string }
	| {
			type: "filter_catalog";
			category?: string;
			sub_category?: string;
			query?: string;
			results_count: number;
			fund_ids: string[];
	  }
	| { type: "highlight_products"; product_ids: string[] }
	| { type: "show_portfolio_diagnostics"; diagnostics: DiagnosticsData }
	| { type: "update_simulation"; simulation: SimulationData }
	| {
			type: "update_basket";
			basket: BasketItem[];
			total_lumpsum: number;
			total_sip: number;
	  }
	| {
			type: "open_modal";
			modal:
				| "basket"
				| "mandate_authorization"
				| "diagnostics"
				| "simulation"
				| "proposal";
	  }
	| { type: "proposal_ready"; proposal: ProposalData }
	| {
			type: "mandate_executed";
			transaction_id: string;
			status: string;
			basket: BasketItem[];
			portfolio: Profile;
	  }
	| { type: "thinking" }
	| { type: "turn_complete" }
	| { type: "error"; message: string };
