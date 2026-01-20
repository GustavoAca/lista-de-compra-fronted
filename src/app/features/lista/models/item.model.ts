export interface Item {
  id: string;
  nome: string;
  isAtivo: boolean;
}

export interface ItemLista {
  id: string ;
  listaCompraId: string ;
  itemOfertaId: string ;
  quantidade: number;
}
