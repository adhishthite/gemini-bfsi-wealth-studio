# ADR 0001: Standardization on ShadCN Native Primitives and OKLCH Design Tokens

## Status
Accepted (2026-08-17)

## Context
The Cymbal Premier Wealth Studio frontend previously relied on bespoke, ad-hoc overlay containers, native HTML range sliders and select elements, and legacy e-commerce component names (`StylistPanel`, `CartDrawer`, `OrdersModal`, `VtoModal`, `CheckoutModal`, `ProposalModal`). This caused inconsistent accessibility semantics, styling drift, and cognitive overhead when mapping UI files to domain concepts in `CONTEXT.md`.

## Decision
1. **ShadCN Native Primitives**: Standardize 100% of UI components on Radix-backed ShadCN primitives (`Dialog`, `Sheet`, `Select`, `ToggleGroup`, `Input`, `InputOTP`, `Slider`, `Progress`, `Alert`, `Popover`, `ScrollArea`, `Separator`, `Sonner`, `Badge`, `Button`, `Card`, `Tabs`, `Avatar`).
2. **100% OKLCH Color Space**: Define all design system CSS variables in OKLCH (`--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--destructive`, `--muted`, `--border`, `--wealth-navy`, `--wealth-gold`, `--wealth-emerald`).
3. **Strict Domain Nomenclature**: Rename all component files to mirror the core concepts in `CONTEXT.md`:
   - `StylistPanel.tsx` ➔ `AdvisorDock.tsx`
   - `CartDrawer.tsx` ➔ `AdvisoryBasketSheet.tsx`
   - `OrdersModal.tsx` ➔ `DiagnosticsDialog.tsx`
   - `VtoModal.tsx` ➔ `SimulationDialog.tsx`
   - `CheckoutModal.tsx` ➔ `MandateDialog.tsx`
   - `ProposalModal.tsx` ➔ `ProposalDialog.tsx`
4. **Toast Notification Unification**: Mount ShadCN `Toaster` from `sonner` in `App.tsx` and route all application toasts via `toast()` (`pushToast()` wrapper).

## Consequences
- Accessible ARIA keyboard navigation and focus management are natively guaranteed across all dialogs, sheets, select menus, and OTP inputs.
- Color rendition remains perceptually uniform and vibrant across high-gamut displays via OKLCH tokens.
- Zero dead or misleading legacy files remain in the codebase.
