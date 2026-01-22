export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  priceEstimated: number;
  priceActual: number;
  checked: boolean;
  onSale: boolean;
}
