export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function isValidUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return !!url.hostname;
  } catch {
    return false;
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
