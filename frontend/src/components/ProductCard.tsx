import { useState } from "react";
import {
	Star,
	Plus,
	Check,
	TrendingUp,
	ShieldAlert,
	Sparkles,
	Layers,
} from "lucide-react";
import type { FundProduct } from "../types";
import { useStore } from "../store";
import { sendAction } from "../ws";

export default function ProductCard({ fund }: { fund: FundProduct }) {
	const { highlightIds, basket, addToBasket, pushToast } = useStore();
	const [sipAmount, setSipAmount] = useState<number>(25000);
	const [lumpAmount, setLumpAmount] = useState<number>(0);
	const [expanded, setExpanded] = useState(false);

	const isHighlighted = highlightIds.includes(fund.id);
	const inBasket = basket.some((b) => b.product_id === fund.id);

	const handleAddSip = () => {
		addToBasket({
			product_id: fund.id,
			name: fund.name,
			category: fund.category,
			sub_category: fund.sub_category,
			lumpsum_inr: lumpAmount,
			monthly_sip_inr: sipAmount,
			linked_goal: fund.sub_category.includes("Retirement")
				? "Retirement 2042"
				: "Wealth Creation",
			cagr_3y: fund.cagr_3y,
			ter: fund.ter,
		});
		sendAction("add_to_basket", {
			product_id: fund.id,
			monthly_sip_amount_inr: sipAmount,
			lumpsum_amount_inr: lumpAmount,
			linked_goal: "Wealth Creation",
		});
		pushToast(
			`Added ${fund.name} (₹${(sipAmount / 1000).toFixed(0)}k/mo) to Basket`,
			"success",
		);
	};

	const getRiskBadgeColor = (risk: string) => {
		const r = risk.toLowerCase();
		if (r.includes("low"))
			return "bg-emerald-50 text-emerald-700 border-emerald-200";
		if (r.includes("moderate"))
			return "bg-amber-50 text-amber-700 border-amber-200";
		return "bg-rose-50 text-rose-700 border-rose-200";
	};

	const getCategoryBadgeColor = (cat: string) => {
		switch (cat) {
			case "Equity":
				return "bg-indigo-50 text-indigo-700 border-indigo-200";
			case "Debt":
				return "bg-emerald-50 text-emerald-700 border-emerald-200";
			case "Commodities":
				return "bg-amber-50 text-amber-800 border-amber-200";
			case "Hybrid":
				return "bg-purple-50 text-purple-700 border-purple-200";
			default:
				return "bg-slate-50 text-slate-700 border-slate-200";
		}
	};

	return (
		<div
			className={`group relative bg-white rounded-2xl border transition-all duration-300 p-4 flex flex-col justify-between ${
				isHighlighted
					? "border-amber-400 ring-4 ring-amber-300/40 shadow-lg scale-[1.01]"
					: inBasket
						? "border-emerald-300 ring-2 ring-emerald-100 shadow-sm"
						: "border-slate-200 hover:border-slate-300 hover:shadow-md"
			}`}
		>
			{/* Top Header */}
			<div>
				<div className="flex items-center justify-between gap-2 mb-2">
					<span
						className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadgeColor(
							fund.category,
						)}`}
					>
						{fund.sub_category}
					</span>
					<div className="flex items-center gap-1">
						<div className="flex text-amber-400">
							{Array.from({ length: fund.rating }).map((_, i) => (
								<Star key={i} size={11} fill="currentColor" />
							))}
						</div>
						<span className="text-[10px] text-slate-400 font-semibold">
							{fund.rating}.0
						</span>
					</div>
				</div>

				<h3 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-[#0B2545] transition line-clamp-2">
					{fund.name}
				</h3>
				<p className="text-[11px] text-slate-500 mt-0.5 font-medium">
					{fund.amc}
				</p>

				{/* Core Financial Metrics */}
				<div className="grid grid-cols-3 gap-2 my-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
					<div>
						<p className="text-[10px] text-slate-400 font-semibold">3Y CAGR</p>
						<p className="text-xs font-extrabold text-emerald-600">
							+{fund.cagr_3y}%
						</p>
					</div>
					<div>
						<p className="text-[10px] text-slate-400 font-semibold">TER</p>
						<p className="text-xs font-extrabold text-slate-700">{fund.ter}%</p>
					</div>
					<div>
						<p className="text-[10px] text-slate-400 font-semibold">AUM</p>
						<p className="text-xs font-extrabold text-slate-700">
							₹{(fund.aum_crores / 1000).toFixed(1)}k Cr
						</p>
					</div>
				</div>

				{/* Top Holdings Tags */}
				<div className="mb-3">
					<p className="text-[10px] font-bold text-slate-400 mb-1">
						Top Holdings:
					</p>
					<div className="flex flex-wrap gap-1">
						{fund.top_holdings.slice(0, 3).map((h, i) => (
							<span
								key={i}
								className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
							>
								{h}
							</span>
						))}
					</div>
				</div>

				{/* Tags / Badges */}
				<div className="flex items-center gap-1.5 mb-3 flex-wrap">
					<span
						className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getRiskBadgeColor(
							fund.risk_level,
						)}`}
					>
						{fund.risk_level}
					</span>
					{fund.tags.slice(0, 2).map((t, i) => (
						<span
							key={i}
							className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-semibold"
						>
							{t}
						</span>
					))}
				</div>
			</div>

			{/* Action Footer */}
			<div className="pt-2 border-t border-slate-100 space-y-2">
				<div className="flex items-center justify-between text-xs">
					<span className="text-[11px] text-slate-500 font-semibold">
						Monthly SIP:
					</span>
					<select
						value={sipAmount}
						onChange={(e) => setSipAmount(Number(e.target.value))}
						className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 focus:outline-none"
					>
						<option value={10000}>₹10,000 / mo</option>
						<option value={20000}>₹20,000 / mo</option>
						<option value={25000}>₹25,000 / mo</option>
						<option value={35000}>₹35,000 / mo</option>
						<option value={50000}>₹50,000 / mo</option>
					</select>
				</div>

				<button
					onClick={handleAddSip}
					className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
						inBasket
							? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
							: "bg-[#0B2545] text-white hover:bg-[#134074] shadow-xs"
					}`}
				>
					{inBasket ? (
						<>
							<Check size={14} />
							<span>In Advisory Basket</span>
						</>
					) : (
						<>
							<Plus size={14} />
							<span>Add to Advisory Basket</span>
						</>
					)}
				</button>
			</div>
		</div>
	);
}
