export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function validateGSTIN(value = "") {
  if (!value) return true;
  return GSTIN_PATTERN.test(value.trim().toUpperCase());
}

export function normalizeText(value) {
  return typeof value === "string" ? value.trim() : value;
}

export function formatCurrency(value = 0, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function getInvoiceTotals(items = [], discountPercent = 0, isInterState = false) {
  const subTotal = items.reduce((sum, item) => {
    return sum + Number(item.quantity || 0) * Number(item.unitPrice ?? item.rate ?? 0);
  }, 0);
  const discountAmount = (subTotal * Number(discountPercent || 0)) / 100;
  const taxableAmount = Math.max(subTotal - discountAmount, 0);

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  items.forEach((item) => {
    const lineTotal = Number(item.quantity || 0) * Number(item.unitPrice ?? item.rate ?? 0);
    const lineDiscount = subTotal ? (lineTotal / subTotal) * discountAmount : 0;
    const lineTaxable = Math.max(lineTotal - lineDiscount, 0);
    const tax = (lineTaxable * Number(item.gstRate || 0)) / 100;

    if (isInterState) {
      igstAmount += tax;
    } else {
      cgstAmount += tax / 2;
      sgstAmount += tax / 2;
    }
  });

  return {
    subTotal,
    discountAmount,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    grandTotal: taxableAmount + cgstAmount + sgstAmount + igstAmount,
  };
}

export function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");
}
