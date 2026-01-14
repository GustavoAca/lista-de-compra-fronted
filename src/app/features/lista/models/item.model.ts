export interface Item {
  id: string | number;
  nome: string;
  isAtivo: boolean;
}

export interface ItemLista {
  id: string | number;
  listaCompraId: string | number;
  itemOfertaId: string | number;
  quantidade: number;
}
