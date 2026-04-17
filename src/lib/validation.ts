export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateEmail(email: string): boolean {
  return isValidEmail(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+63|0)[0-9]{9,10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

export function validatePhoneNumber(phone: string): boolean {
  return isValidPhoneNumber(phone);
}

export function validateDate(date: string): boolean {
  if (!date) return false;
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
}

export function validateParticipants(count: number): boolean {
  return count > 0 && count <= 20;
}
