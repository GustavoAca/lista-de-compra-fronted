# Requisitos de Evolução do Backend - Módulo Lista

Este documento registra as melhorias e ajustes necessários no backend para suportar a nova experiência de UI/UX do Frontend.

## 1. Endpoint de Alteração de Itens (`PUT /listas-compras/{id}/alterar-itens`)
- **Mudança:** Aceitar quantidade `0` como comando de remoção do item da lista.
- **Motivo:** Facilita o salvamento automático (auto-save) vindo do front, permitindo enviar um lote de alterações onde o usuário "zerou" alguns itens em vez de disparar múltiplos DELETEs individuais.
- **Resposta:** Idealmente, retornar o objeto `ListaCompra` atualizado (especialmente o `valorTotal` e `totalItens`) para evitar que o front precise recalcular ou fazer um novo GET.

## 2. Endpoint de Busca de Lista (`GET /listas-compras/{id}`)
- **Melhoria:** Garantir que o campo `version` (Optimistic Locking) seja retornado de forma consistente para evitar conflitos no `PUT` de salvar nome da lista.

## 3. Listagem Geral de Listas (`GET /listas-compras`)
- **Mudança:** Retornar um DTO resumido (Summary) contendo apenas: `id`, `nome`, `valorTotal`, `totalItens`, `statusLista` e `modifiedDate`.
- **Motivo:** Aumentar a performance da Home ao evitar carregar todos os dados de relacionamento de todas as listas simultaneamente.
- **Ordenação Padrão:** `modifiedDate, DESC`.

## 4. Criação de Lista (`POST /listas-compras`)
- **Resposta:** Ao criar uma lista com sucesso, retornar o objeto completo (incluindo o `id` gerado) para que o front possa navegar imediatamente para a rota de edição `/lista/edit/{id}`.

## 5. Preferências do Usuário (`PATCH /usuarios/preferencias`)
- **Novo Campo:** Adicionar um campo `configuracoes` (JSON ou colunas específicas) na tabela de usuários.
- **Propriedade:** `darkMode: boolean`.
- **Motivo:** Persistir a escolha de tema do usuário entre diferentes dispositivos.

## 6. WebSockets ou Server-Sent Events (Opcional/Futuro)
- **Sugestão:** Notificar o frontend se outra sessão alterou a mesma lista, permitindo um "Live Edit" real.
