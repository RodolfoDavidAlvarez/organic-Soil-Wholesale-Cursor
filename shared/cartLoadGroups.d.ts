export const CART_LOAD_GROUP_LABELS: {
  readonly offers: "Offers";
  readonly bags: "Bags & small items";
  readonly flatbed: "Flatbed load";
  readonly walkingFloor: "Walking-floor delivery";
};

export const CART_LOAD_GROUP_HINTS: {
  readonly offers: "Pickup or delivery at checkout";
  readonly bags: "Pickup or delivery at checkout";
};

export type PayCartLoadGroups<T> = {
  offerItems: T[];
  walkingFloorItems: T[];
  flatbedItems: T[];
  yardItems: T[];
  otherItems: T[];
};

export function partitionPayCartItems<T>(payItems?: T[] | null): PayCartLoadGroups<T>;
