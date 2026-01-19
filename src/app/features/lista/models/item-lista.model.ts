import { ItemOferta } from "./item-oferta.model";

export interface ItemListaDTO {
  id?: string;
  listaCompraId?: string;
  itemOferta: ItemOferta;
  quantidade: number;
}
