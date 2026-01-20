
export interface ItemOfertaConcluirRequest {
    id: string;
    itemId: string;
    vendedorId: string;
    hasPromocaoAtiva: boolean;
    preco: number;
    dataInicioPromocao?: Date;
    dataFinalPromocao?: Date;
    version: number;
}
