import { useState } from "react";
import {
	Briefcase,
	CaretDown as ChevronDown,
	Check,
	Moon,
	Sun,
	User,
} from "@phosphor-icons/react";
import { useStore } from "@/store";
import { sendAction, switchProfile } from "@/ws";
import { inr, inrCompact, inrParts } from "@/lib";
import Logo from "./Logo";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Client identity header.
 *
 * The executive reads two things here and nothing else: who the client is,
 * and what they are worth. The workspace switcher sits quietly in the middle;
 * the theme control, the advisory basket and the full client file recede to
 * the right or behind the client name. No accent is spent on this surface —
 * the stamp belongs to the canvas below.
 */

const CLIENT_PROFILES = [
	{
		key: "investor",
		name: "Rahul Sharma",
		role: "Engineering Director · Bengaluru",
		style: "Moderately Aggressive",
		aum: 7500000,
	},
	{
		key: "conservative",
		name: "Anand Kulkarni",
		role: "Retiring VP Manufacturing · Pune",
		style: "Conservative Income",
		aum: 25000000,
	},
	{
		key: "aggressive",
		name: "Priya Iyer",
		role: "VP Product @ Fintech · Bengaluru",
		style: "Aggressive Growth",
		aum: 4500000,
	},
	{
		key: "balanced",
		name: "Dr. Vikramaditya Singhania",
		role: "Chief of Cardiology · Mumbai",
		style: "Balanced Multi-Asset",
		aum: 18000000,
	},
];

const FALLBACK_GOALS = [
	{ name: "Children's education", year: 2032, amount: 5000000 },
	{ name: "Early retirement", year: 2042, amount: 50000000 },
];

const TABS: Array<{
	id: "explorer" | "diagnostics" | "simulation";
	label: string;
}> = [
	{ id: "explorer", label: "Instrument shortlist" },
	{ id: "diagnostics", label: "Portfolio audit" },
	{ id: "simulation", label: "Goal projection" },
];

const MANDATE_LABEL: Record<string, string> = {
	awaiting_otp: "Awaiting OTP confirmation",
	authorized: "e-NACH mandate authorised",
	error: "Authorisation did not complete",
};

export default function TopBar() {
	const {
		basket,
		totalSip,
		activeTab,
		set,
		portfolio,
		profile,
		activeProfileKey,
		mandateStatus,
		theme,
		toggleTheme,
	} = useStore();
	const [clientFileOpen, setClientFileOpen] = useState(false);

	const client = portfolio || profile;

	const clientName = client?.name || "Rahul Sharma";
	const occupation = client?.occupation || "Engineering director";
	const city = client?.city || "Bengaluru";
	const riskProfile = client?.risk_profile || "Moderately aggressive";
	const aum = client?.total_aum_inr ?? 7500000;
	const monthlySurplus = client?.monthly_surplus_inr ?? 150000;
	const activeSip = client?.active_sip_inr ?? 60000;
	const unallocated = Math.max(monthlySurplus - activeSip, 0);

	const aumFigure = inrParts(aum);
	const goals = client?.goals?.length
		? client.goals.map((g) => ({
				name: g.name,
				year: g.target_year,
				amount: g.target_amount_inr,
			}))
		: FALLBACK_GOALS;

	const handleSelectClient = (key: string) => {
		switchProfile(key);
	};

	const openTab = (id: (typeof TABS)[number]["id"]) => {
		if (id === "explorer") {
			set({ activeTab: "explorer" });
			return;
		}
		if (id === "diagnostics") {
			set({ activeTab: "diagnostics", diagnosticsOpen: true });
			sendAction("get_portfolio_diagnostics");
			return;
		}
		set({ activeTab: "simulation", simulationOpen: true });
		sendAction("simulate_portfolio", {
			equity_pct: 65,
			debt_pct: 20,
			gold_pct: 10,
			liquid_pct: 5,
			monthly_sip_inr: 100000,
		});
	};

	return (
		<header className="sticky top-0 z-40 border-b border-rule bg-paper">
			<div className="mx-auto flex h-18 max-w-[1700px] items-center gap-6 px-gutter">
				{/* House mark */}
				<Logo />

				<div className="hidden h-10 border-l border-rule lg:block" />

				{/* Client identity — name and portfolio value, the two facts
				    the room needs. The whole block opens the client file. */}
				<Popover open={clientFileOpen} onOpenChange={setClientFileOpen}>
					<PopoverTrigger asChild>
						<button
							type="button"
							className="-mx-2 flex items-center gap-5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-paper-sunken"
							aria-label="Open client file"
						>
							<div className="min-w-0">
								<p className="label">Client under advisory</p>
								<p className="mt-1 truncate text-lg font-semibold leading-none text-ink-strong">
									{clientName}
								</p>
							</div>

							<div className="hidden border-l border-rule pl-5 sm:block">
								<p className="label">Portfolio value</p>
								<p className="mt-0.5 flex items-baseline gap-1.5 leading-none">
									<span className="figure text-ink-strong">
										{aumFigure.value}
									</span>
									{aumFigure.unit && (
										<span className="figure-unit">{aumFigure.unit}</span>
									)}
								</p>
							</div>

							<ChevronDown
								className={`size-4 shrink-0 text-ink-faint transition-transform duration-200 ${
									clientFileOpen ? "rotate-180" : ""
								}`}
							/>
						</button>
					</PopoverTrigger>

					<PopoverContent
						align="start"
						sideOffset={10}
						className="w-104 rounded-lg border-rule bg-paper-sheet p-0 text-ink shadow-raise"
					>
						{/* Multi-client persona switcher header */}
						<div className="border-b border-rule px-4 py-3 bg-paper-sunken/60">
							<p className="label mb-2">Switch advisory persona</p>
							<div className="grid grid-cols-2 gap-1.5">
								{CLIENT_PROFILES.map((p) => {
									const isCurrent =
										activeProfileKey === p.key ||
										(activeProfileKey === "investor" && p.key === "investor") ||
										clientName
											.toLowerCase()
											.includes(p.name.split(" ")[0].toLowerCase());
									return (
										<button
											key={p.key}
											type="button"
											onClick={() => handleSelectClient(p.key)}
											className={`flex flex-col text-left rounded-md px-2.5 py-1.5 transition-all text-xs border ${
												isCurrent
													? "border-accent bg-paper font-semibold text-ink-strong shadow-sm"
													: "border-transparent text-ink-muted hover:text-ink hover:bg-paper-sunken"
											}`}
										>
											<div className="flex items-center justify-between w-full">
												<span className="font-semibold text-ink-strong truncate">
													{p.name.split(" ")[0]} {p.name.split(" ")[1]?.[0]}.
												</span>
												<span className="text-[10px] tabular-nums font-mono text-ink-muted">
													{inrCompact(p.aum)}
												</span>
											</div>
											<span className="text-[10px] text-ink-faint truncate">
												{p.style}
											</span>
										</button>
									);
								})}
							</div>
						</div>

						<div className="px-5 pb-4 pt-4">
							<p className="label">Active client dossier</p>
							<p className="doc-title mt-1 text-xl leading-tight text-ink-strong">
								{clientName}
							</p>
							<p className="mt-1.5 text-xs text-ink-muted">
								{occupation} · {city}
								{client?.age ? ` · ${client.age} yrs` : ""}
							</p>
						</div>

						<div className="paper-sunken border-y border-rule px-5 py-1.5">
							<dl className="text-xs">
								<div className="flex items-baseline justify-between gap-6 py-2.5">
									<dt className="text-ink-muted">Portfolio value</dt>
									<dd className="tabular-nums font-semibold text-ink-strong">
										{inr(aum)}
									</dd>
								</div>
								<div className="flex items-baseline justify-between gap-6 py-2.5">
									<dt className="text-ink-muted">Risk profile</dt>
									<dd className="text-ink-strong">{riskProfile}</dd>
								</div>
								<div className="flex items-baseline justify-between gap-6 py-2.5">
									<dt className="text-ink-muted">Monthly surplus</dt>
									<dd className="tabular-nums text-ink-strong">
										{inr(monthlySurplus)}
										<span className="text-ink-faint"> /mo</span>
									</dd>
								</div>
								<div className="flex items-baseline justify-between gap-6 py-2.5">
									<dt className="text-ink-muted">Committed to SIPs</dt>
									<dd className="tabular-nums text-ink-strong">
										{inr(activeSip)}
										<span className="text-ink-faint"> /mo</span>
									</dd>
								</div>
								<div className="mark-attention my-1.5 flex items-baseline justify-between gap-6 py-1">
									<dt className="text-ink">Unallocated surplus</dt>
									<dd className="tabular-nums font-semibold text-ink-strong">
										{inr(unallocated)}
										<span className="text-ink-faint"> /mo</span>
									</dd>
								</div>
							</dl>
						</div>

						<div className="px-5 py-4">
							<p className="label-strong">Goals</p>
							<div className="mt-3 space-y-2.5">
								{goals.map((g) => (
									<div
										key={`${g.name}-${g.year}`}
										className="flex items-baseline justify-between gap-6 text-xs"
									>
										<span className="text-ink-muted">{g.name}</span>
										<span className="tabular-nums font-medium text-ink-strong">
											{inrCompact(g.amount)}
											<span className="font-normal text-ink-faint">
												{" "}
												· {g.year}
											</span>
										</span>
									</div>
								))}
							</div>
						</div>

						{mandateStatus !== "idle" && (
							<div className="border-t border-rule px-5 py-3.5">
								<p className="label">Mandate</p>
								<p className="mt-1.5 text-xs text-ink">
									{MANDATE_LABEL[mandateStatus] || mandateStatus}
								</p>
							</div>
						)}
					</PopoverContent>
				</Popover>

				{/* Workspace switcher — one restrained segmented control */}
				<nav
					className="mx-auto hidden items-center gap-0.5 rounded-lg border border-rule bg-paper-sunken p-1 md:flex"
					aria-label="Workspace"
				>
					{TABS.map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => openTab(tab.id)}
							aria-current={activeTab === tab.id ? "page" : undefined}
							className={`rounded-lg px-3.5 py-1.5 text-xs transition-colors ${
								activeTab === tab.id
									? "bg-paper-sheet font-semibold text-ink-strong shadow-sheet"
									: "font-medium text-ink-muted hover:text-ink"
							}`}
						>
							{tab.label}
						</button>
					))}
				</nav>

				{/* Quiet controls */}
				<div className="ml-auto flex items-center gap-2 md:ml-0">
					<button
						type="button"
						onClick={toggleTheme}
						className="grid size-9 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-paper-sunken hover:text-ink"
						title={theme === "dark" ? "Switch to light" : "Switch to dark"}
						aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
					>
						{theme === "dark" ? (
							<Sun className="size-4" />
						) : (
							<Moon className="size-4" />
						)}
					</button>

					<button
						type="button"
						onClick={() => {
							set({ basketOpen: true });
							sendAction("view_basket");
						}}
						className="paper-interactive flex h-9 items-center gap-2.5 px-3 text-xs font-medium text-ink"
						aria-label="Open advisory basket"
						title={
							basket.length
								? `Advisory basket — ${basket.length} instrument${
										basket.length === 1 ? "" : "s"
									}, ${inr(totalSip)} monthly`
								: "Advisory basket"
						}
					>
						<Briefcase className="size-4 text-ink-muted" />
						<span className="hidden md:inline">Basket</span>
						{basket.length > 0 && (
							<span className="border-l border-rule pl-2.5 font-semibold tabular-nums text-ink-strong">
								{basket.length}
							</span>
						)}
					</button>
				</div>
			</div>
		</header>
	);
}
