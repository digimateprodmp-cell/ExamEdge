export function pickLocalized(
  en: string | null | undefined,
  hi: string | null | undefined,
  locale: string,
): string {
  if (locale === 'hi' && hi) return hi;
  return en ?? hi ?? '';
}

export function formatInr(amount: string | number) {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (!value) return 'Free';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    value,
  );
}
