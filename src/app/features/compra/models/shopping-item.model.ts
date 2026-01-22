// src/app/features/compra/models/shopping-item.model.ts
import { ItemListaModel } from '@app/features/lista/models/item-lista.model';

export interface ShoppingItem extends ItemListaModel {
  checked: boolean;
  onSale: boolean;
  priceActual: number; // The actual price user entered or promotional price
  priceEstimated: number; // The original estimated price (from itemOferta.preco)
  name: string; // The name of the item from itemOferta.item.nome
  unit: string; // Unit like "kg", "un", etc. (Assuming 'un' for now if not available)
}
