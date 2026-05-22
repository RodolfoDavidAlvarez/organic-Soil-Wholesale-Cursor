import { randomBytes } from "crypto";

export type VoiceCartItem = {
  productId: number;
  productName: string;
  productSlug: string;
  format: string;
  unit: string;
  unitPrice: number;
  quantity: number;
};

export type VoiceCustomer = {
  name: string | null;
  phone: string | null;
  email: string | null;
};

export type VoiceSession = {
  sessionId: string;
  conversationId: string | null;
  createdAt: number;
  lastTouchedAt: number;
  cart: VoiceCartItem[];
  pickupAt: string | null;
  pickupKind: "standard" | "coordinated" | null;
  customer: VoiceCustomer;
};

const SESSION_TTL_MS = 15 * 60 * 1000;
const sessions = new Map<string, VoiceSession>();

function purgeExpired() {
  const cutoff = Date.now() - SESSION_TTL_MS;
  Array.from(sessions.entries()).forEach(([id, s]) => {
    if (s.lastTouchedAt < cutoff) sessions.delete(id);
  });
}

export function createSession(): VoiceSession {
  purgeExpired();
  const sessionId = randomBytes(18).toString("base64url");
  const now = Date.now();
  const session: VoiceSession = {
    sessionId,
    conversationId: null,
    createdAt: now,
    lastTouchedAt: now,
    cart: [],
    pickupAt: null,
    pickupKind: null,
    customer: { name: null, phone: null, email: null },
  };
  sessions.set(sessionId, session);
  return session;
}

export function getSession(sessionId: string): VoiceSession | null {
  const s = sessions.get(sessionId);
  if (!s) return null;
  if (Date.now() - s.lastTouchedAt > SESSION_TTL_MS) {
    sessions.delete(sessionId);
    return null;
  }
  s.lastTouchedAt = Date.now();
  return s;
}

export function attachConversation(sessionId: string, conversationId: string): VoiceSession | null {
  const s = getSession(sessionId);
  if (!s) return null;
  s.conversationId = conversationId;
  return s;
}

export function addItem(sessionId: string, item: VoiceCartItem): VoiceSession | null {
  const s = getSession(sessionId);
  if (!s) return null;
  const existing = s.cart.find(
    (i) => i.productId === item.productId && i.format === item.format,
  );
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    s.cart.push({ ...item });
  }
  return s;
}

export function setQuantity(
  sessionId: string,
  productId: number,
  format: string,
  quantity: number,
): VoiceSession | null {
  const s = getSession(sessionId);
  if (!s) return null;
  if (quantity <= 0) {
    s.cart = s.cart.filter(
      (i) => !(i.productId === productId && i.format === format),
    );
  } else {
    const item = s.cart.find(
      (i) => i.productId === productId && i.format === format,
    );
    if (item) item.quantity = quantity;
  }
  return s;
}

export function removeItem(
  sessionId: string,
  productId: number,
  format: string,
): VoiceSession | null {
  const s = getSession(sessionId);
  if (!s) return null;
  s.cart = s.cart.filter(
    (i) => !(i.productId === productId && i.format === format),
  );
  return s;
}

export function clearCart(sessionId: string): VoiceSession | null {
  const s = getSession(sessionId);
  if (!s) return null;
  s.cart = [];
  return s;
}

export function setPickupAt(sessionId: string, isoTime: string | null, kind: "standard" | "coordinated" = "standard"): VoiceSession | null {
  const s = getSession(sessionId);
  if (!s) return null;
  s.pickupAt = isoTime;
  s.pickupKind = isoTime ? kind : null;
  return s;
}

export function setCustomerInfo(
  sessionId: string,
  patch: Partial<VoiceCustomer>,
): VoiceSession | null {
  const s = getSession(sessionId);
  if (!s) return null;
  if (patch.name !== undefined) s.customer.name = patch.name?.trim() || null;
  if (patch.phone !== undefined) s.customer.phone = patch.phone?.trim() || null;
  if (patch.email !== undefined) s.customer.email = patch.email?.trim() || null;
  return s;
}

export function hasLargeQuantity(s: VoiceSession, threshold = 50): boolean {
  return s.cart.some((i) => i.quantity > threshold);
}

export function cartTotal(s: VoiceSession): number {
  return s.cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}

export function activeSessionsToday(): number {
  purgeExpired();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startTs = startOfDay.getTime();
  let count = 0;
  Array.from(sessions.values()).forEach((s) => {
    if (s.createdAt >= startTs) count++;
  });
  return count;
}
