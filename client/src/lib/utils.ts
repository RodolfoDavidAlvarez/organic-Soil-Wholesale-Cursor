import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, "");

  // Check if the input is valid
  if (cleaned.length < 10) return phoneNumber;

  // Format: (XXX) XXX-XXXX
  return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
}

export function getInitials(name: string): string {
  if (!name) return "";

  const nameParts = name.split(" ");

  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }

  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
}

export function getCategoryColor(category: string): {
  bg: string;
  text: string;
} {
  const lowerCategory = category.toLowerCase();

  if (lowerCategory === "compost" || lowerCategory === "amendment") {
    return { bg: "bg-primary", text: "text-white" };
  } else if (lowerCategory === "potting") {
    return { bg: "bg-secondary", text: "text-white" };
  } else {
    return { bg: "bg-accent", text: "text-white" };
  }
}
