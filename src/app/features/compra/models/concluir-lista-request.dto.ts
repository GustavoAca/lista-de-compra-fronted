import { ItemListaConcluirRequest } from "./item-lista-concluir.model";

export interface ConcluirListaRequestDTO {
    id: string;
    valorTotal: number;
    nome: string;
    totalItens: number;
    version: number;
    itensLista: ItemListaConcluirRequest[];
}
