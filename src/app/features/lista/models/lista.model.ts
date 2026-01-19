import { ItemLista } from "./item.model";

export interface ListaModel {
  id: string;
  usuarioId: string;
  nome: string;
  totalItens: number;
  valorTotal: number;
  itensLista: ItemLista[];
}
