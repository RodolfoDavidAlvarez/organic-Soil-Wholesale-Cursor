export const stripNonDigits = (phone: string): string => phone.replace(/\D/g, '');

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return phone;
  const cleaned = stripNonDigits(phone);
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

export const getPhoneNumberForTel = (phone: string): string => {
  if (!phone) return phone;
  let cleaned = stripNonDigits(phone);
  if (cleaned.length === 11 && cleaned.startsWith('1')) cleaned = cleaned.slice(1);
  return cleaned.length === 10 ? `+1${cleaned}` : phone;
};
