export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

export function generateReferenceNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `HIKE-${timestamp}-${random}`;
}

export function calculateTotalPrice(
  basePrice: number,
  participants: number,
  environmentalFee: number,
  addOns: { price: number; selected: boolean }[]
): number {
  const addOnsTotal = addOns
    .filter((addon) => addon.selected)
    .reduce((sum, addon) => sum + addon.price, 0);

  return basePrice + environmentalFee * participants + addOnsTotal * participants;
}

export function getDateFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+63|0)[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}
