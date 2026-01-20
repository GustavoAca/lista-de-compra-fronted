import { ItemOfertaConcluirRequest } from "./item-oferta-concluir.model";

export interface ItemListaConcluirRequest {
    id: string;
    quantidade: number;
    version: number;
    itemOferta: ItemOfertaConcluirRequest;
    listaCompraId: string;
}
