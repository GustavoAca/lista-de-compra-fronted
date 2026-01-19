import { ItemListaDTO } from './item-lista.model';

export interface ListaCompraDTO {
  id?: string;
  usuarioId?: string;
  nome: string;
  valorTotal: number;
  totalItens: number;
  itensLista: ItemListaDTO[];
}
