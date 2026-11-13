export function formatPrice(amount: number) {
  return `Kshs. ${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

// "1 item", "3 items".
export const countItems = (count: number) => `${count} ${count === 1 ? 'item' : 'items'}`;
