import { Item } from './item.model';
import { VendedorDTO } from './vendedor.model'; // Change to VendedorDTO

export interface ItemOferta {
  id: string;
  dataInicioPromocao: string;
  dataFimPromocao: string;
  hasPromocaoAtiva: boolean;
  preco: number;
  vendedor: VendedorDTO; // Change to VendedorDTO
  item: Item;
}
