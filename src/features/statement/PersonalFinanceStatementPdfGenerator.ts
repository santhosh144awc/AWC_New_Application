/**
 * Ant Wealth Creation — Client-Side Personal Finance Statement PDF Generator
 *
 * Implements 100% browser-side, high-fidelity PDF document generation using jsPDF & jspdf-autotable.
 *
 * ARCHITECTURAL CONTRACT:
 * - Pure client-side generation. Zero server uploads, zero remote APIs, zero third-party telemetry.
 * - Ant Wealth Creation branding: Deep navy (#00182A), Growth teal (#00AB96), Warm gold (#FFC107).
 * - Multi-page support with repeated table headers, running headers/footers, and clean page numbering.
 * - Comprehensive reporting covering:
 *   1. Executive Cover & Summary KPI Dashboard
 *   2. Income Statement (Source-wise, deductions, net)
 *   3. Expense Statement (Household with mode indication, lifestyle, dependent, insurance, EMIs)
 *   4. Savings & Ongoing Investments Schedule (Surplus analysis + illustrative projection)
 *   5. Asset Schedule (6 classes, owner-wise breakdown, purpose)
 *   6. Liabilities Schedule (Owner-wise outstanding balance)
 *   7. Net Worth & Solvency Diagnostic (Incl vs Excl personal assets, key ratios)
 *   8. Preparer Notes & Statutory Regulatory Disclosures
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PersonalFinanceStatementResult } from '../../domain/finance/personalFinanceStatement';
import { BUSINESS_PROFILE } from '../../config/businessProfile';
import { formatIndianDate, getTodayLocalDateString } from '../../lib/dateUtils';

// Brand Color Palette (RGB)
const COLOR_NAVY = [0, 24, 42] as const; // #00182A
const COLOR_TEAL = [0, 171, 150] as const; // #00AB96
const COLOR_GOLD = [255, 193, 7] as const; // #FFC107
const COLOR_SLATE = [51, 65, 85] as const; // #334155
const COLOR_MUTED = [100, 116, 139] as const; // #64748B
const COLOR_LIGHT_BG = [248, 250, 252] as const; // #F8FAFC
const COLOR_WHITE = [255, 255, 255] as const;
const COLOR_BORDER = [226, 232, 240] as const; // #E2E8F0

/**
 * Formats an amount into standard Indian currency representation.
 * Example: 1250000 -> "Rs. 12,50,000"
 */
function formatRupees(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return 'Rs. 0';
  const isNeg = amount < 0;
  const absVal = Math.round(Math.abs(amount));
  const s = absVal.toString();
  let res = '';
  if (s.length > 3) {
    const last3 = s.substring(s.length - 3);
    const other = s.substring(0, s.length - 3);
    const withCommas = other.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    res = withCommas + ',' + last3;
  } else {
    res = s;
  }
  return `${isNeg ? '-' : ''}Rs. ${res}`;
}

function formatPercent(pct: number | null): string {
  if (pct === null || isNaN(pct) || !isFinite(pct)) return 'N/A';
  return `${pct.toFixed(1)}%`;
}

export function generatePersonalFinanceStatementPdf(
  data: PersonalFinanceStatementResult
): { blob: Blob; filename: string } {
  // Create jsPDF document: A4 Portrait, units in mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  const clientName = data.metadata.clientName.trim() || 'Valued Client';
  const spouseName = data.metadata.spouseName?.trim() || '';
  const rawStatementDate = data.metadata.statementDate || getTodayLocalDateString();
  const displayStatementDate = formatIndianDate(rawStatementDate);
  const preparedBy = data.metadata.preparedBy.trim() || BUSINESS_PROFILE.founder.fullName;

  // -------------------------------------------------------------
  // HEADER & FOOTER HOOK
  // -------------------------------------------------------------
  const totalPagesExp = '{total_pages_count_string}';

  const addHeaderAndFooter = (pageNumber: number) => {
    doc.saveGraphicsState();

    // Top Header line (skip cover/page 1 if executive card is prominent)
    if (pageNumber > 1) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
      doc.text(BUSINESS_PROFILE.firm.name.toUpperCase(), marginX, 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      doc.text('Personal Finance Statement', marginX + 45, 10);
      doc.text(clientName, pageWidth - marginX, 10, { align: 'right' });

      doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
      doc.setLineWidth(0.3);
      doc.line(marginX, 12, pageWidth - marginX, 12);
    }

    // Running Bottom Footer
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text(
      `Confidential Financial Planning Document • Prepared by ${preparedBy} • Date: ${displayStatementDate}`,
      marginX,
      pageHeight - 8
    );

    const pageStr = `Page ${pageNumber} of ${totalPagesExp}`;
    doc.text(pageStr, pageWidth - marginX, pageHeight - 8, { align: 'right' });

    doc.restoreGraphicsState();
  };

  // -------------------------------------------------------------
  // PAGE 1: EXECUTIVE COVER & HIGH-LEVEL KPI DASHBOARD
  // -------------------------------------------------------------
  // Top Brand Header Banner
  doc.setFillColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Brand Name & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
  doc.text(BUSINESS_PROFILE.firm.name, marginX, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_TEAL[0], COLOR_TEAL[1], COLOR_TEAL[2]);
  doc.text(BUSINESS_PROFILE.firm.tagline, marginX, 20);

  // Title on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.text('Personal Finance Statement', pageWidth - marginX, 16, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
  doc.text('Comprehensive Household Balance Sheet & Cash Flow', pageWidth - marginX, 22, { align: 'right' });

  // Client Metadata Box
  let curY = 38;
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.roundedRect(marginX, curY, contentWidth, 24, 3, 3, 'F');
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.roundedRect(marginX, curY, contentWidth, 24, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_SLATE[0], COLOR_SLATE[1], COLOR_SLATE[2]);
  doc.text('Client / Family Name:', marginX + 4, curY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text(clientName + (spouseName ? ` & ${spouseName}` : ''), marginX + 45, curY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_SLATE[0], COLOR_SLATE[1], COLOR_SLATE[2]);
  doc.text('Statement Date:', marginX + 4, curY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text(displayStatementDate, marginX + 45, curY + 14);

  if (data.metadata.childrenNames && data.metadata.childrenNames.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_SLATE[0], COLOR_SLATE[1], COLOR_SLATE[2]);
    doc.text('Children:', marginX + 4, curY + 20);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
    doc.text(data.metadata.childrenNames.join(', '), marginX + 45, curY + 20);
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_SLATE[0], COLOR_SLATE[1], COLOR_SLATE[2]);
  doc.text('Prepared By:', pageWidth - marginX - 65, curY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text(preparedBy, pageWidth - marginX - 42, curY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_SLATE[0], COLOR_SLATE[1], COLOR_SLATE[2]);
  doc.text('Status:', pageWidth - marginX - 65, curY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_TEAL[0], COLOR_TEAL[1], COLOR_TEAL[2]);
  doc.text('In-Memory Browser Verified', pageWidth - marginX - 42, curY + 14);

  curY += 30;

  // Section Heading: Executive Summary KPI Cards
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text('1. Executive Financial Snapshot', marginX, curY);
  curY += 4;

  const cardWidth = (contentWidth - 6) / 2;
  const cardHeight = 22;

  // 4 Top Key KPI Cards
  // Card 1: Annual Income
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.roundedRect(marginX, curY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.roundedRect(marginX, curY, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('NET ANNUAL INCOME', marginX + 4, curY + 6);
  doc.setFontSize(12);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text(formatRupees(data.incomeStage.totalNetAnnualIncome), marginX + 4, curY + 14);
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(`Monthly: ${formatRupees(data.incomeStage.totalNetMonthlyIncome)}`, marginX + 4, curY + 19);

  // Card 2: Annual Expenses
  const col2X = marginX + cardWidth + 6;
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.roundedRect(col2X, curY, cardWidth, cardHeight, 2, 2, 'F');
  doc.roundedRect(col2X, curY, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('TOTAL ANNUAL EXPENSES', col2X + 4, curY + 6);
  doc.setFontSize(12);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text(formatRupees(data.expenseStage.totalAnnualExpenses), col2X + 4, curY + 14);
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(`Monthly: ${formatRupees(data.expenseStage.totalMonthlyExpenses)} (${formatPercent(data.expenseStage.expenseToIncomeRatio)} of income)`, col2X + 4, curY + 19);

  curY += cardHeight + 4;

  // Card 3: Total Assets vs Liabilities
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.roundedRect(marginX, curY, cardWidth, cardHeight, 2, 2, 'F');
  doc.roundedRect(marginX, curY, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('TOTAL ASSETS & DEBTS', marginX + 4, curY + 6);
  doc.setFontSize(11);
  doc.setTextColor(COLOR_TEAL[0], COLOR_TEAL[1], COLOR_TEAL[2]);
  doc.text(`Assets: ${formatRupees(data.totalAssets)}`, marginX + 4, curY + 13);
  doc.setFontSize(8);
  doc.setTextColor(COLOR_SLATE[0], COLOR_SLATE[1], COLOR_SLATE[2]);
  doc.text(`Liabilities: ${formatRupees(data.totalLiabilities)} (Debt Ratio: ${formatPercent(data.debtToAssetRatioPercent)})`, marginX + 4, curY + 19);

  // Card 4: Net Worth
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.roundedRect(col2X, curY, cardWidth, cardHeight, 2, 2, 'F');
  doc.roundedRect(col2X, curY, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('NET WORTH COMPARISON', col2X + 4, curY + 6);
  doc.setFontSize(11);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text(`Actual (Excl. Personal): ${formatRupees(data.netWorthExcludingPersonalAssets)}`, col2X + 4, curY + 13);
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(`Notional (Incl. Personal): ${formatRupees(data.netWorthIncludingPersonalAssets)}`, col2X + 4, curY + 19);

  curY += cardHeight + 8;

  // Executive Balance Sheet Table Summary
  autoTable(doc, {
    startY: curY,
    head: [['Financial Dimension', 'Annual Amount (Rs.)', 'Monthly Amount (Rs.)', 'Share / Benchmark']],
    body: [
      ['Gross Household Income', formatRupees(data.incomeStage.totalGrossAnnualIncome), formatRupees(data.incomeStage.totalGrossAnnualIncome / 12), '100% Gross'],
      ['Less: Tax & Statutory Deductions', formatRupees(data.incomeStage.totalAnnualDeductions), formatRupees(data.incomeStage.totalAnnualDeductions / 12), formatPercent(data.incomeStage.totalGrossAnnualIncome > 0 ? (data.incomeStage.totalAnnualDeductions / data.incomeStage.totalGrossAnnualIncome) * 100 : null)],
      ['Net Take-Home Income', formatRupees(data.incomeStage.totalNetAnnualIncome), formatRupees(data.incomeStage.totalNetMonthlyIncome), '100% Net Disposable'],
      ['Total Annual Living & Loan Expenses', formatRupees(data.expenseStage.totalAnnualExpenses), formatRupees(data.expenseStage.totalMonthlyExpenses), formatPercent(data.expenseStage.expenseToIncomeRatio)],
      ['Annual Household Savings (Income - Expenses)', formatRupees(data.savingsStage.annualSavings), formatRupees(data.savingsStage.monthlySavings), `Savings Rate: ${formatPercent(data.savingsRatePercent)}`],
      ['Committed Ongoing Investments (SIPs/PPF/RDs)', formatRupees(data.savingsStage.totalOngoingInvestmentsAnnual), formatRupees(data.savingsStage.totalOngoingInvestmentsMonthly), formatPercent(data.incomeStage.totalNetAnnualIncome > 0 ? (data.savingsStage.totalOngoingInvestmentsAnnual / data.incomeStage.totalNetAnnualIncome) * 100 : null)],
      ['Net Surplus for Fresh Investment', formatRupees(data.savingsStage.annualSurplusForFreshInvestments), formatRupees(data.savingsStage.monthlySurplusForFreshInvestments), data.savingsStage.annualSurplusForFreshInvestments >= 0 ? 'Surplus Available' : 'Deficit Commitments Exceed Savings'],
      ['Total Household Assets', formatRupees(data.totalAssets), '-', '100% Asset Base'],
      ['Productive Assets (Financial & Yielding)', formatRupees(data.assetStage.totalProductiveAssets), '-', `${formatPercent(data.productiveAssetsRatioPercent)} of Assets`],
      ['Personal Assets (Home, Car, Jewellery)', formatRupees(data.totalPersonalAssets), '-', `${formatPercent(data.totalAssets > 0 ? (data.totalPersonalAssets / data.totalAssets) * 100 : null)} of Assets`],
      ['Total Liabilities (Debt Outstanding)', formatRupees(data.totalLiabilities), '-', `Debt-to-Asset: ${formatPercent(data.debtToAssetRatioPercent)}`],
      ['Net Worth (Excluding Personal Assets)', formatRupees(data.netWorthExcludingPersonalAssets), '-', 'Actual Productive Net Worth'],
      ['Net Worth (Including Personal Assets)', formatRupees(data.netWorthIncludingPersonalAssets), '-', 'Notional Balance Sheet Net Worth'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: COLOR_NAVY as any,
      textColor: COLOR_WHITE as any,
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      textColor: COLOR_SLATE as any,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'center' },
    },
    margin: { left: marginX, right: marginX },
  });

  // -------------------------------------------------------------
  // PAGE 2: INCOME STATEMENT & EXPENSE STATEMENT
  // -------------------------------------------------------------
  doc.addPage();
  curY = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text('2. Income Statement', marginX, curY);
  curY += 4;

  const incomeBody = data.incomeStage.items.map((item) => [
    item.label,
    formatRupees(item.grossMonthlyAmount),
    formatRupees(item.grossAnnualAmount),
    formatRupees(item.annualDeductions),
    formatRupees(item.netAnnualAmount),
    formatPercent(item.percentOfTotalNetIncome),
  ]);

  autoTable(doc, {
    startY: curY,
    head: [['Income Particulars', 'Monthly Gross (Rs.)', 'Annual Gross (Rs.)', 'Annual Deductions (Rs.)', 'Net Annual (Rs.)', '% Share']],
    body: incomeBody,
    foot: [
      ['Total Household Income', formatRupees(data.incomeStage.totalGrossAnnualIncome / 12), formatRupees(data.incomeStage.totalGrossAnnualIncome), formatRupees(data.incomeStage.totalAnnualDeductions), formatRupees(data.incomeStage.totalNetAnnualIncome), '100.0%'],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLOR_NAVY as any, textColor: COLOR_WHITE as any, fontSize: 8 },
    footStyles: { fillColor: COLOR_LIGHT_BG as any, textColor: COLOR_NAVY as any, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'center' },
    },
    margin: { left: marginX, right: marginX },
  });

  curY = (doc as any).lastAutoTable.finalY + 8;

  // Expense Statement
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text('3. Expense Statement', marginX, curY);

  const isConsolidatedMode = data.expenseStage.expenseEntryMode === 'CONSOLIDATED_TOTAL' || (data.expenseStage.householdMode as string) === 'TOTAL_MODE' || data.expenseStage.householdMode === 'CONSOLIDATED_TOTAL';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(
    `Expense Entry Mode: ${isConsolidatedMode ? 'Consolidated Total Mode' : 'Category Breakdown Mode'}`,
    pageWidth - marginX,
    curY,
    { align: 'right' }
  );
  curY += 4;

  if (isConsolidatedMode) {
    // Consolidated-total mode explanation banner in PDF
    doc.setFontSize(8);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text(
      'Note: Client elected Consolidated Total mode. Single combined amount covers all 5 family expense categories (Household, Lifestyle, Dependents, Insurance Premiums, Loan EMIs).',
      marginX,
      curY + 3
    );
    curY += 6;
  }

  const expenseBody = data.expenseStage.items.map((item) => [
    item.label,
    item.category.replace('_', ' '),
    item.frequency,
    formatRupees(item.enteredAmount),
    formatRupees(item.monthlyAmount),
    formatRupees(item.annualAmount),
    formatPercent(item.percentOfTotalIncome),
  ]);

  autoTable(doc, {
    startY: curY,
    head: [['Expense Particulars', 'Category', 'Frequency', 'Entered (Rs.)', 'Monthly (Rs.)', 'Annual (Rs.)', '% Income']],
    body: expenseBody,
    foot: [
      ['Total Annual Expenses', '', '', '', formatRupees(data.expenseStage.totalMonthlyExpenses), formatRupees(data.expenseStage.totalAnnualExpenses), formatPercent(data.expenseStage.expenseToIncomeRatio)],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLOR_NAVY as any, textColor: COLOR_WHITE as any, fontSize: 8 },
    footStyles: { fillColor: COLOR_LIGHT_BG as any, textColor: COLOR_NAVY as any, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 1.8 },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'center' },
    },
    margin: { left: marginX, right: marginX },
  });

  // -------------------------------------------------------------
  // PAGE 3: SAVINGS, ONGOING INVESTMENTS & SURPLUS PROJECTION
  // -------------------------------------------------------------
  doc.addPage();
  curY = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text('4. Savings & Ongoing Investments', marginX, curY);
  curY += 4;

  const ongoingBody = data.savingsStage.ongoingInvestmentItems.map((inv) => [
    inv.label,
    inv.frequency,
    formatRupees(inv.enteredAmount),
    formatRupees(inv.monthlyAmount),
    formatRupees(inv.annualAmount),
    formatPercent(inv.percentOfIncome),
  ]);

  autoTable(doc, {
    startY: curY,
    head: [['Ongoing Investment Commitment', 'Frequency', 'Entered Amount', 'Monthly Equiv.', 'Annualized (Rs.)', '% Income']],
    body: ongoingBody.length > 0 ? ongoingBody : [['No ongoing investments entered', '-', '-', '-', '-', '-']],
    foot: [
      ['Total Ongoing Investments', '', '', formatRupees(data.savingsStage.totalOngoingInvestmentsMonthly), formatRupees(data.savingsStage.totalOngoingInvestmentsAnnual), ''],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLOR_NAVY as any, textColor: COLOR_WHITE as any, fontSize: 8 },
    footStyles: { fillColor: COLOR_LIGHT_BG as any, textColor: COLOR_NAVY as any, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'center' },
    },
    margin: { left: marginX, right: marginX },
  });

  curY = (doc as any).lastAutoTable.finalY + 8;

  // Investible Surplus Summary Box
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.roundedRect(marginX, curY, contentWidth, 22, 2, 2, 'F');
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.roundedRect(marginX, curY, contentWidth, 22, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_SLATE[0], COLOR_SLATE[1], COLOR_SLATE[2]);
  doc.text('Annual Savings (Income - Expenses):', marginX + 4, curY + 6);
  doc.text(formatRupees(data.savingsStage.annualSavings), marginX + 75, curY + 6);

  doc.text('Less: Ongoing Commitments:', marginX + 4, curY + 12);
  doc.text(formatRupees(data.savingsStage.totalOngoingInvestmentsAnnual), marginX + 75, curY + 12);

  doc.setFontSize(9.5);
  doc.setTextColor(
    data.savingsStage.annualSurplusForFreshInvestments >= 0 ? COLOR_TEAL[0] : 180,
    data.savingsStage.annualSurplusForFreshInvestments >= 0 ? COLOR_TEAL[1] : 40,
    data.savingsStage.annualSurplusForFreshInvestments >= 0 ? COLOR_TEAL[2] : 40
  );
  doc.text('Net Surplus Available for Fresh Investments:', marginX + 4, curY + 18);
  doc.text(
    `${formatRupees(data.savingsStage.annualSurplusForFreshInvestments)} / year (${formatRupees(data.savingsStage.monthlySurplusForFreshInvestments)} / month)`,
    marginX + 75,
    curY + 18
  );

  curY += 28;

  // Illustrative Surplus Compounding Table (if surplus > 0)
  if (data.savingsStage.surplusProjections.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
    doc.text(`Illustrative Surplus Growth Potential (${data.savingsStage.assumedReturnPercent}% Assumed Return p.a.)`, marginX, curY);
    curY += 3;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text('Simulates disciplined systematic compounding of the available monthly surplus. Projections are purely illustrative and do not represent guaranteed returns.', marginX, curY);
    curY += 3;

    const projBody = data.savingsStage.surplusProjections.map((p) => [
      `${p.year} Years (${p.year * 12} Months)`,
      formatRupees(p.cumulativeContributed),
      formatRupees(p.compoundGain),
      formatRupees(p.projectedCorpus),
    ]);

    autoTable(doc, {
      startY: curY,
      head: [['Investment Horizon', 'Cumulative Contributed', 'Potential Compound Gain', 'Projected Future Corpus']],
      body: projBody,
      theme: 'grid',
      headStyles: { fillColor: COLOR_TEAL as any, textColor: COLOR_WHITE as any, fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: marginX, right: marginX },
    });
  }

  // -------------------------------------------------------------
  // PAGE 4: ASSETS SCHEDULE (6 Classes + Owner Attribution)
  // -------------------------------------------------------------
  doc.addPage();
  curY = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text('5. Assets Schedule (6 Classes & Ownership)', marginX, curY);
  curY += 4;

  const selfColLabel = clientName.split(' ')[0] || 'Self';
  const spouseColLabel = spouseName ? spouseName.split(' ')[0] : 'Spouse';
  const childrenColLabel = 'Children';

  const assetBody = data.assetStage.items.map((ast) => [
    ast.label,
    ast.assetClass.replace('_', ' '),
    formatRupees(ast.selfAmount),
    formatRupees(ast.spouseAmount),
    formatRupees(ast.childrenAmount),
    formatRupees(ast.totalValue),
    formatPercent(ast.percentOfTotalAssets),
    ast.purposeGoal || '-',
  ]);

  autoTable(doc, {
    startY: curY,
    head: [['Asset Holding', 'Class', selfColLabel, spouseColLabel, childrenColLabel, 'Total (Rs.)', '% Share', 'Purpose / Goal']],
    body: assetBody,
    foot: [
      ['Total Assets', '', formatRupees(data.assetStage.totalSelfAssets), formatRupees(data.assetStage.totalSpouseAssets), formatRupees(data.assetStage.totalChildrenAssets), formatRupees(data.totalAssets), '100.0%', ''],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLOR_NAVY as any, textColor: COLOR_WHITE as any, fontSize: 7.5 },
    footStyles: { fillColor: COLOR_LIGHT_BG as any, textColor: COLOR_NAVY as any, fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 6.8, cellPadding: 1.6 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'center' },
    },
    margin: { left: marginX, right: marginX },
  });

  // -------------------------------------------------------------
  // PAGE 5: LIABILITIES, NET WORTH BREAKDOWN & NOTES
  // -------------------------------------------------------------
  doc.addPage();
  curY = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text('6. Liabilities Schedule', marginX, curY);
  curY += 4;

  const liaBody = data.liabilityStage.items.map((lia) => [
    lia.label,
    lia.type.replace('_', ' '),
    formatRupees(lia.selfAmount),
    formatRupees(lia.spouseAmount),
    formatRupees(lia.childrenAmount),
    formatRupees(lia.totalOutstanding),
    formatPercent(lia.percentOfTotalLiabilities),
    lia.purposeGoal || '-',
  ]);

  autoTable(doc, {
    startY: curY,
    head: [['Liability Obligation', 'Type', selfColLabel, spouseColLabel, childrenColLabel, 'Outstanding (Rs.)', '% Debt', 'Purpose / Goal']],
    body: liaBody.length > 0 ? liaBody : [['No liabilities entered', '-', '-', '-', '-', '-', '-', '-']],
    foot: [
      ['Total Liabilities', '', formatRupees(data.liabilityStage.totalSelfLiabilities), formatRupees(data.liabilityStage.totalSpouseLiabilities), formatRupees(data.liabilityStage.totalChildrenLiabilities), formatRupees(data.totalLiabilities), '100.0%', ''],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLOR_NAVY as any, textColor: COLOR_WHITE as any, fontSize: 7.5 },
    footStyles: { fillColor: COLOR_LIGHT_BG as any, textColor: COLOR_NAVY as any, fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 6.8, cellPadding: 1.6 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'center' },
    },
    margin: { left: marginX, right: marginX },
  });

  curY = (doc as any).lastAutoTable.finalY + 8;

  // Final Net Worth Table & Solvency Indicators
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text('7. Net Worth & Solvency Diagnostic', marginX, curY);
  curY += 4;

  autoTable(doc, {
    startY: curY,
    head: [['Balance Sheet Measure', 'Amount (Rs.)', 'Analytical Definition & Methodological Purpose']],
    body: [
      ['Total Household Assets', formatRupees(data.totalAssets), 'Aggregate value of all liquid, debt, equity, gold, property and personal holdings.'],
      ['Less: Total Liabilities', formatRupees(data.totalLiabilities), 'Sum of all outstanding secured and unsecured debt obligations.'],
      ['Net Worth (Including Personal Assets)', formatRupees(data.netWorthIncludingPersonalAssets), 'Notional accounting net worth. Includes primary residence, vehicles, and personal jewellery.'],
      ['Less: Total Personal Assets', formatRupees(data.totalPersonalAssets), 'Consists of self-occupied home, family vehicles, and personal ornaments (consumption assets).'],
      ['Net Worth (Excluding Personal Assets)', formatRupees(data.netWorthExcludingPersonalAssets), 'Actual Productive Net Worth. Measures liquid, debt, equity, gold and investment real estate available to fund retirement and life goals.'],
      ['Solvency: Debt-to-Asset Ratio', formatPercent(data.debtToAssetRatioPercent), 'Target: < 35%. Ratio of total debt obligations relative to entire asset base.'],
      ['Liquidity: Emergency Runway', data.liquidAssetsRunwayMonths !== null ? `${data.liquidAssetsRunwayMonths.toFixed(1)} Months` : 'N/A', 'Target: 3–6 Months. Number of months of household living costs covered by liquid cash reserves.'],
      ['Productive Asset Ratio', formatPercent(data.productiveAssetsRatioPercent), 'Target: > 50%. Proportion of household wealth deployed in financial markets and yielding assets.'],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLOR_NAVY as any, textColor: COLOR_WHITE as any, fontSize: 8 },
    styles: { fontSize: 7.2, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 35 },
      2: { cellWidth: contentWidth - 90 },
    },
    margin: { left: marginX, right: marginX },
  });

  curY = (doc as any).lastAutoTable.finalY + 8;

  // Discussion Notes Section
  if (data.metadata.discussionNotes && data.metadata.discussionNotes.trim() !== '') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
    doc.text('Discussion Notes & Follow-up Actions:', marginX, curY);
    curY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_SLATE[0], COLOR_SLATE[1], COLOR_SLATE[2]);
    const splitNotes = doc.splitTextToSize(data.metadata.discussionNotes, contentWidth);
    doc.text(splitNotes, marginX, curY);
    curY += splitNotes.length * 4 + 4;
  }

  // Statutory Disclosures & Methodological Limitations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text('Methodology, Scope & Regulatory Disclosures:', marginX, curY);
  curY += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  const disclaimerText =
    `This Personal Finance Statement is prepared solely on the basis of entries and classifications provided by the client/preparer and has not been independently verified or audited. Calculations and projections are for financial-planning discussion purposes only and do not constitute an audit, legal certification, formal valuation, tax advice, or guaranteed investment return. ` +
    `${BUSINESS_PROFILE.regulatory.distributorRoleText}. ${BUSINESS_PROFILE.regulatory.sebiRIAStatusNotice} ` +
    `${BUSINESS_PROFILE.disclosures.mutualFundRisk} Mutual fund investments are subject to market risks, read all scheme related documents carefully.`;

  const splitDisclaimer = doc.splitTextToSize(disclaimerText, contentWidth);
  doc.text(splitDisclaimer, marginX, curY);

  // Apply running header and footer across all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderAndFooter(i);
  }

  // Replace total pages placeholder
  if (typeof doc.putTotalPages === 'function') {
    doc.putTotalPages(totalPagesExp);
  }

  const safeClientName = clientName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Personal-Finance-Statement-${safeClientName}-${displayStatementDate}.pdf`;

  const blob = doc.output('blob');
  return { blob, filename };
}
