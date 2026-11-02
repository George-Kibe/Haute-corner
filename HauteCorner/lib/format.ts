export function formatPrice(amount: number) {
  return `Kshs. ${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}
