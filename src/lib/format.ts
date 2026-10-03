const moneyFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Formats a Decimal string or number as BDT (taka sign). */
export function formatMoney(value: string | number): string {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? moneyFormatter.format(amount) : "-";
}

function toDate(value: string | number | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | number | Date): string {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : "-";
}

export function formatDateTime(value: string | number | Date): string {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : "-";
}
