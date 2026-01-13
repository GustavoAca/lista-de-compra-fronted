# Projeto Angular - Lista de Compras

Este projeto é uma aplicação Angular para gerenciar uma lista de compras. Ele foi estruturado seguindo as melhores práticas de arquitetura de software, com foco em escalabilidade e manutenibilidade.

## Arquitetura do Projeto

A estrutura de pastas é baseada em funcionalidades (*feature-based*), o que significa que o código é organizado em torno das funcionalidades que ele implementa, e não pelo tipo de arquivo.

A estrutura principal dentro de `src/app` é:

```
src/app/
├── core/
│   └── (services, interceptors, guards)
├── features/
│   └── lista/
│       ├── components/
│       ├── models/
│       ├── pages/
│       └── services/
└── shared/
    └── (components, directives, pipes)
```

### Pasta `core`

Contém a lógica central e serviços que são únicos em toda a aplicação (*singletons*).

- **`services`**: Serviços como `auth.service.ts` ou `analytics.service.ts`.
- **`interceptors`**: Interceptadores de requisições HTTP para adicionar cabeçalhos (como tokens de autenticação) ou para tratar erros de forma global.
- **`guards`**: Guardas de rota para proteger o acesso a certas partes da aplicação.

### Pasta `shared`

Contém elementos que são reutilizados em diferentes funcionalidades. Se um componente, pipe ou diretiva precisa ser usado em mais de uma *feature*, ele deve morar aqui para evitar duplicação de código.

- **`components`**: Componentes reutilizáveis como botões customizados, modais, spinners de loading, etc.
- **`pipes`**: Pipes customizados para formatação de dados (ex: `moeda.pipe.ts`).
- **`directives`**: Diretivas customizadas para manipulação do DOM.

### Pasta `features`

Esta é a pasta mais importante. Cada subpasta aqui dentro representa uma funcionalidade da aplicação. No nosso caso, começamos com a feature `lista`.

Dentro de `features/lista`:
- **`models`**: Define a estrutura dos dados (DTOs) para esta funcionalidade. O arquivo `item.model.ts` é a interface que representa um item da lista de compras.
- **`services`**: Contém os serviços específicos desta funcionalidade. O `lista-compra.service.ts` é responsável por toda a comunicação com a API para obter, criar, atualizar e deletar itens.
- **`pages` ou `containers`**: Componentes "inteligentes" que representam uma página. Eles utilizam os serviços para buscar e enviar dados.
- **`components`**: Componentes "burros" ou de apresentação. Eles apenas exibem os dados recebidos via `@Input` e não têm lógica de negócio.

## Camada de Serviço (Consumo de API)

A comunicação com a API é centralizada nos serviços. O `lista-compra.service.ts` usa o `HttpClient` do Angular para interagir com o backend. Ele abstrai a lógica HTTP, de modo que os componentes apenas precisam chamar métodos como `getItens()` ou `addItem()`, sem se preocupar com os detalhes da requisição.

## Próximos Passos

1.  **Configurar o `HttpClientModule`**: Para que o `HttpClient` funcione, você precisa fornecer os provedores dele para a aplicação. Em aplicações standalone (Angular 17+), você faz isso no arquivo `app.config.ts`, adicionando `provideHttpClient()` ao array de `providers`.

    ```typescript
    // src/app/app.config.ts
    import { ApplicationConfig } from '@angular/core';
    import { provideRouter } from '@angular/router';
    import { provideHttpClient } from '@angular/common/http'; // Importe aqui
    import { routes } from './app.routes';

    export const appConfig: ApplicationConfig = {
      providers: [
        provideRouter(routes),
        provideHttpClient() // Adicione aqui
      ]
    };
    ```

2.  **Criar o Componente da Página**: Crie um componente na pasta `features/lista/pages/`, por exemplo, `lista-compra.component.ts`. Este componente irá injetar o `ListaCompraService`, chamar seus métodos (ex: `getItens()`) e exibir os dados no template.

3.  **Configurar Rotas**: No arquivo `app.routes.ts`, crie uma rota para o seu novo componente de página para que ele seja acessível através de uma URL (ex: `/lista`).