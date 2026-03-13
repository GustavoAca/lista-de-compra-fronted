# Requisitos de Evolução do Backend - Módulo Lista

Este documento registra as melhorias e ajustes necessários no backend para suportar a nova experiência de UI/UX do Frontend.

## 1. Endpoint de Alteração de Itens (`PUT /listas-compras/{id}/alterar-itens`)
- **Mudança:** Aceitar quantidade `0` como comando de remoção do item da lista.
- **Motivo:** Facilita o salvamento automático (auto-save) vindo do front, permitindo enviar um lote de alterações onde o usuário "zerou" alguns itens em vez de disparar múltiplos DELETEs individuais.
- **Resposta:** Idealmente, retornar o objeto `ListaCompra` atualizado (especialmente o `valorTotal` e `totalItens`) para evitar que o front precise recalcular ou fazer um novo GET.

## 2. Endpoint de Busca de Lista (`GET /listas-compras/{id}`)
- **Melhoria:** Garantir que o campo `version` (Optimistic Locking) seja retornado de forma consistente para evitar conflitos no `PUT` de salvar nome da lista.

## 3. WebSockets ou Server-Sent Events (Opcional/Futuro)
- **Sugestão:** Notificar o frontend se outra sessão alterou a mesma lista, permitindo um "Live Edit" real.
