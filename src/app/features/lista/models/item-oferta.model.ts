import { Item } from './item.model';
import { Vendedor } from './vendedor.model';

export interface ItemOferta {
  id: string;
  dataInicioPromocao: string;
  dataFimPromocao: string;
  hasPromocaoAtiva: boolean;
  preco: number;
  vendedor: Vendedor;
  item: Item;
}
