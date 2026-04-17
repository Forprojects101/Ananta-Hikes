export const HIKE_TYPE_NAMES: Record<string, string> = {
  "1": "Day Hike",
  "2": "Overnight Hike",
  "3": "Multi-day Expedition",
};

export function calculateGuideFee(basePrice: number) {
  return Math.round(basePrice);
}

export function calculateBookingTotal(params: {
  basePrice: number;
  participants: number;
  addOnsTotal: number;
}) {
  const {
    basePrice,
    participants,
    addOnsTotal,
  } = params;

  const guideFee = calculateGuideFee(basePrice);
  const guideTotal = guideFee * participants;
  const totalPrice = guideTotal + addOnsTotal;

  return {
    guideFee,
    guideTotal,
    addOnsTotal,
    totalPrice,
  };
}
