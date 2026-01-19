// src/app/features/compra/models/item-compra.model.ts

// Reutilizar ou adaptar modelos existentes de 'lista'.
// Assumindo que você tem algo como ItemListaModel e VendedorModel
import { ItemListaModel } from '@app/features/lista/models/item-lista.model';
import { VendedorModel } from '@app/features/lista/models/vendedor.model';

/**
 * Representa um item da lista de compras com informações detalhadas
 * e o estado mutável durante o processo de compra.
 */
export interface ItemCompra extends ItemListaModel {
  // item-lista.model.ts já deve ter: id, nome, quantidade, unidadeMedida, observacao, listaId, ...
  // Supondo que ItemListaModel já tem 'precoOriginal' e 'emPromocao' se necessário,
  // ou podemos adicioná-los aqui se forem específicos da fase de compra.
  // Properties from ItemListaModel (assuming it has these for now, will confirm later if errors persist):
  id?: string;
  listaCompraId?: string;
  // itemOferta: ItemOferta; (This should come from ItemListaModel)
  quantidade: number;
  // name, unidadeMedida and observacao might not be in ItemListaModel based on previous error, adding here
  nome: string;
  unidadeMedida: string;
  observacao?: string;
  precoOriginal?: number; // Add if not in ItemListaModel and used for initial price

  vendedor: VendedorModel; // Detalhes do vendedor - now correctly imported as VendedorModel

  // Estado mutável durante a compra
  estaNoCarrinho: boolean; // Indica se o usuário pegou o produto (checkbox)
  precoAtual: number;      // Preço unitário atual (pode ser editado)
  emOfertaNaLoja: boolean; // Indica se o item está em promoção no momento da compra
  valorOferta: number | null; // Valor da oferta, se aplicável
  valorOriginalNaLoja: number | null; // Preço original na loja antes da oferta
}

/**
 * Representa a estrutura de dados de uma lista de compras detalhada
 * para o início do processo de compra.
 */
export interface ListaCompraDetalhada {
  id: string;
  nome: string;
  itens: ItemCompra[];
}