"""Cymbal Premier Wealth — PDF Advisory Proposal & Factsheet Generator.

Generates a Wealth Advisory Summary & Rebalancing Mandate PDF.
"""
from __future__ import annotations
import os
from pathlib import Path
from typing import Any

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.units import inch

from . import config


def generate_proposal_pdf(proposal_data: dict, out_path: Path | str) -> str:
    """Generate a 2-page wealth advisory proposal PDF."""
    p_path = Path(out_path)
    p_path.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(p_path),
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#0B2545")
    accent_color = colors.HexColor("#134074")
    gold_color = colors.HexColor("#B8860B")
    text_dark = colors.HexColor("#1D2D44")
    bg_light = colors.HexColor("#F0F4F8")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "DocSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=gold_color,
        spaceAfter=12,
    )

    section_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=text_dark,
    )

    meta_style = ParagraphStyle(
        "MetaText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748B"),
    )

    disclaimer_style = ParagraphStyle(
        "DisclaimerText",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor("#64748B"),
    )

    elements = []

    # 1. Header Banner
    elements.append(Paragraph("CYMBAL PREMIER WEALTH MANAGEMENT", subtitle_style))
    elements.append(Paragraph("Strategic Portfolio Advisory & Rebalancing Mandate", title_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceBefore=2, spaceAfter=10))

    # 2. Client & Proposal Metadata Box
    client_name = proposal_data.get("client_name", "Rahul Sharma")
    proposal_id = proposal_data.get("proposal_id", "CPW-PROP-001")
    date_str = proposal_data.get("date", "2026-08-17")

    meta_data = [
        [
            Paragraph(f"<b>Client Name:</b> {client_name}", body_style),
            Paragraph(f"<b>Proposal ID:</b> {proposal_id}", body_style),
        ],
        [
            Paragraph("<b>Advisor:</b> Ananya (Senior Wealth RM)", body_style),
            Paragraph(f"<b>Date:</b> {date_str}", body_style),
        ],
        [
            Paragraph("<b>Managed AUM:</b> ₹75,00,000", body_style),
            Paragraph("<b>Risk Profile:</b> Moderately Aggressive", body_style),
        ]
    ]

    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_light),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 10))

    # 3. Strategic Rationale & Diagnostics
    elements.append(Paragraph("1. Executive Summary & Diagnostic Findings", section_style))
    rationale = proposal_data.get(
        "strategic_rationale",
        "Diagnostic analysis revealed high single-fund concentration risk (80% of equity in Large Cap) with ₹90,000 unallocated monthly surplus. This proposal rebalances into high-conviction Flexi Cap and Multi-Asset strategies while mobilizing surplus cash into goal-linked SIPs to secure the 2042 Retirement target."
    )
    elements.append(Paragraph(rationale, body_style))
    elements.append(Spacer(1, 8))

    # 4. Strategic Asset Allocation Matrix
    elements.append(Paragraph("2. Asset Allocation & Rebalancing Shifts", section_style))
    alloc_headers = ["Asset Class", "Current Allocation", "Recommended Target", "Strategic Action"]
    alloc_rows = [
        alloc_headers,
        ["Equity & Growth", "70.0% (₹52.5L)", "65.0% (₹48.75L)", "Trim large cap concentration; reallocate to Flexi & AI tech"],
        ["Debt & Fixed Income", "15.0% (₹11.25L)", "20.0% (₹15.0L)", "Deploy in Target Maturity SDL 2030 & AAA Corp bonds"],
        ["Commodities / Gold", "10.0% (₹7.5L)", "10.0% (₹7.5L)", "Maintain Sovereign Gold ETF allocation as inflation hedge"],
        ["Liquid / Cash Buffer", "5.0% (₹3.75L)", "5.0% (₹3.75L)", "Maintain instant-access emergency reserve"],
    ]

    alloc_table = Table(alloc_rows, colWidths=[110, 110, 110, 210])
    alloc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('LEADING', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (2, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, bg_light]),
    ]))
    elements.append(alloc_table)
    elements.append(Spacer(1, 10))

    # 5. Proposed Advisory Basket Table
    elements.append(Paragraph("3. Recommended Advisory Basket & SIP Execution", section_style))
    basket_items = proposal_data.get("basket_items", [])
    if not basket_items:
        # Default mock items if basket was empty at generation
        basket_items = [
            {
                "name": "Cymbal Flexi Cap Opportunities Fund",
                "category": "Equity",
                "sub_category": "Flexi Cap",
                "lumpsum_inr": 300000,
                "monthly_sip_inr": 35000,
                "linked_goal": "Retirement 2042",
                "cagr_3y": 21.4,
                "ter": 0.72
            },
            {
                "name": "Cymbal Multi-Asset All-Weather Wealth Fund",
                "category": "Hybrid",
                "sub_category": "Multi-Asset",
                "lumpsum_inr": 200000,
                "monthly_sip_inr": 25000,
                "linked_goal": "Retirement 2042",
                "cagr_3y": 15.5,
                "ter": 0.70
            },
            {
                "name": "Cymbal CRISIL SDL 2030 Target Maturity Fund",
                "category": "Debt",
                "sub_category": "Target Maturity",
                "lumpsum_inr": 250000,
                "monthly_sip_inr": 20000,
                "linked_goal": "Education 2032",
                "cagr_3y": 7.8,
                "ter": 0.15
            },
            {
                "name": "Cymbal US & Global Tech MegaCap Feeder Fund",
                "category": "Equity",
                "sub_category": "International",
                "lumpsum_inr": 150000,
                "monthly_sip_inr": 20000,
                "linked_goal": "Global Hedge",
                "cagr_3y": 23.5,
                "ter": 0.55
            }
        ]

    b_headers = ["Instrument / Fund Name", "Asset Class", "Lump Sum (₹)", "Monthly SIP (₹)", "3Y CAGR", "Linked Goal"]
    b_rows = [b_headers]
    tot_lumpsum = 0
    tot_sip = 0

    for item in basket_items:
        lsum = item.get("lumpsum_inr", 0)
        msip = item.get("monthly_sip_inr", 0)
        tot_lumpsum += lsum
        tot_sip += msip
        b_rows.append([
            Paragraph(f"<b>{item.get('name')}</b>", body_style),
            item.get("sub_category", item.get("category", "-")),
            f"₹{lsum:,}" if lsum else "-",
            f"₹{msip:,}" if msip else "-",
            f"{item.get('cagr_3y', 0):.1f}%",
            item.get("linked_goal", "Wealth Creation"),
        ])

    b_rows.append([
        Paragraph("<b>TOTAL MANDATE VALUE</b>", body_style),
        "-",
        f"<b>₹{tot_lumpsum:,}</b>",
        f"<b>₹{tot_sip:,} / mo</b>",
        "-",
        "Target Milestones"
    ])

    basket_table = Table(b_rows, colWidths=[180, 80, 75, 75, 55, 75])
    basket_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), accent_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('LEADING', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, bg_light]),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#E2E8F0")),
    ]))
    elements.append(basket_table)
    elements.append(Spacer(1, 10))

    # 6. Goal Forecasting & Projections
    elements.append(Paragraph("4. Goal Trajectory & Milestone Forecast", section_style))
    forecast_text = (
        "Based on a blended expected portfolio CAGR of <b>12.8%</b> and total monthly SIP deployment of <b>₹1,00,000</b>:<br/>"
        "• <b>Children's Higher Education (2032)</b>: Projected value of ₹54.2 Lakhs vs target of ₹50.0 Lakhs (<b>108% on track</b>).<br/>"
        "• <b>Early Financial Independence (2042)</b>: Projected final corpus of <b>₹5.82 Crores</b> vs target of ₹5.00 Crores (<b>116% probability achieved</b>)."
    )
    elements.append(Paragraph(forecast_text, body_style))
    elements.append(Spacer(1, 14))

    # 7. Regulatory & SEBI Statutory Disclaimers
    elements.append(KeepTogether([
        Paragraph("Statutory Disclaimers & Regulatory Disclosures", section_style),
        Paragraph(
            "Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing. "
            "Past performance is not indicative of future returns. Asset allocation strategies and CAGR return projections are estimates "
            "based on historical asset class parameters and do not constitute a financial guarantee. Cymbal Premier Wealth Management is a SEBI registered "
            "Investment Advisory entity.",
            disclaimer_style
        )
    ]))

    doc.build(elements)
    return str(p_path)
