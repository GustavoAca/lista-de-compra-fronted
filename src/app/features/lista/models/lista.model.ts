import { ItemLista } from "./item.model";

export interface Lista {
  id: string;
  usuarioId: string;
  nome: string;
  totalItens: number;
  valorTotal: number;
  itensLista: ItemLista[];
}
