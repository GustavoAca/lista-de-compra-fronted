import { ItemOferta } from "./item-oferta.model";

export interface ItemListaModel {
  tempId?: string;   // <-- adicionar aqui
  id?: string;
  listaCompraId?: string;
  itemOferta: ItemOferta;
  quantidade: number;
  version?: number;
}
