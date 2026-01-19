import { ItemOferta } from "./item-oferta.model";

export interface ItemListaDTO {
  tempId?: string;   // <-- adicionar aqui
  id?: string;
  listaCompraId?: string;
  itemOferta: ItemOferta;
  quantidade: number;
}
