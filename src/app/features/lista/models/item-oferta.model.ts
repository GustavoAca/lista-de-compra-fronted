import { Item } from './item.model';
import { VendedorModel } from './vendedor.model'; // Updated import

export interface ItemOferta {
  id: string;
  dataInicioPromocao: string;
  dataFimPromocao: string;
  hasPromocaoAtiva: boolean;
  preco: number;
  vendedor: VendedorModel; // Updated type
  item: Item;
}
