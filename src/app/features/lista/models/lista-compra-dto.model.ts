import { ItemListaModel } from './item-lista.model';

export interface ListaCompraDTO {
  id?: string;
  usuarioId?: string;
  nome: string;
  valorTotal: number;
  totalItens: number;
  itensLista: ItemListaModel[];
}

export interface ListaCompraCriacao {
  nome: string;
  itensLista: { itemOfertaId: string; quantidade: number }[];
  valorTotal: number;
}
