import { ItemLista } from "./item.model";

enum StatusLista {
  AGUARDANDO = 'Aguardando',
  FINALIZADA = 'Finalizada',
  CANCELADA = 'Cancelada'
}

export interface ListaModel {
  id: string;
  usuarioId: string;
  nome: string;
  totalItens: number;
  valorTotal: number;
  itensLista: ItemLista[];
  version: number;
  statusLista: StatusLista;
  createdDate: Date;
  modifiedDate: Date;
}
