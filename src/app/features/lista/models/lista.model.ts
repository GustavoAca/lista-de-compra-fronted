import { ItemLista } from "./item.model";
import { VendedorModel } from "./vendedor.model"; // Import VendedorModel

enum StatusLista {
  AGUARDANDO = 'AGUARDANDO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA'
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
  vendedor?: VendedorModel; // Added vendedor property
}
