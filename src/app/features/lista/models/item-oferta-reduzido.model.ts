export interface itemListaReduzido {
  id?: string;
  listaCompraId?: string;
  itemOfertaId: string;
  quantidade: number;
}


export interface ListaCompraCriacao {
  id?: string;
  nome: string;
  usuarioId?: string;
  valorTotal: number;
  totalItens: number;
  itensLista: itemListaReduzido[];
}
