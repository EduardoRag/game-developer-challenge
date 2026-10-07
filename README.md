# Pirate Battle

Jogo de batalha naval 2D com visão top-down desenvolvido com **React, TypeScript e PixiJS**.

O projeto combina uma interface construída em React com uma camada de gameplay em PixiJS, incluindo combate naval, diferentes comportamentos de inimigos, partidas configuráveis, controles responsivos, APIs simuladas, ranking, histórico de partidas, testes end-to-end e regressão visual.

## Tecnologias

- React 19
- TypeScript
- PixiJS 8
- Vite
- TanStack Query
- Axios
- Mock Service Worker (MSW)
- Playwright
- ESLint
- Prettier

## Como executar o projeto

### Pré-requisitos

- Node.js
- npm

### Instalação

Instale as dependências:

```bash
npm install
```

Instale os navegadores utilizados pelo Playwright:

```bash
npx playwright install
```

### Ambiente de desenvolvimento

```bash
npm run dev
```

### Build de produção

```bash
npm run build
```

Para executar localmente o build gerado:

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Controles

### Teclado

| Ação | Controle |
| --- | --- |
| Mover para frente | `W` / `Arrow Up` |
| Girar para esquerda | `A` |
| Girar para direita | `D` |
| Disparo frontal | `Space` |
| Disparo lateral esquerdo | `Q` |
| Disparo lateral direito | `E` |
| Pausar | `Escape` |

O navio não possui movimento de ré por decisão de gameplay.

### Touch

Durante a partida também são disponibilizados controles touch para dispositivos móveis, permitindo movimentação, rotação e ataques.

A experiência mobile foi projetada principalmente para **orientação horizontal (landscape)**, permitindo manter a arena e os controles visíveis sem alterar as regras do jogo.

## Gameplay

O jogador controla um navio pirata dentro de uma arena naval com limites definidos.

O objetivo é sobreviver até o fim do tempo da sessão enquanto destrói navios inimigos e evita ilhas, ataques e colisões.

### Jogador

O jogador possui:

- Movimento para frente
- Rotação para esquerda e direita
- Canhão frontal
- Disparo lateral esquerdo
- Disparo lateral direito
- Pontos de vida
- Cooldowns independentes das armas

O canhão frontal dispara um projétil.

Cada ataque lateral dispara três projéteis pelo respectivo lado do navio.

### Inimigos

Existem dois tipos de inimigos.

#### Chaser

O Chaser persegue o jogador e causa dano através de contato.

Quando um Chaser é destruído através da colisão/autodestruição, nenhum ponto é concedido ao jogador.

#### Shooter

O Shooter procura manter distância de combate e ataca o jogador utilizando projéteis.

### Pontuação

Cada inimigo destruído pelos ataques do jogador concede exatamente:

```text
1 ponto
```

Inimigos destruídos através da colisão/autodestruição do Chaser não concedem pontos.

### Fim da partida

Uma partida termina quando:

- O tempo configurado chega a zero; ou
- A vida do jogador chega a zero.

A tela de resultado apresenta:

- Tempo efetivamente jogado
- Data
- Identificação do jogador
- Identificação da partida
- Pontuação
- Duração efetiva
- Motivo do término
- Configuração utilizada na partida (duração da sessão e intervalo de spawn)

## Configurações

A tela de Options permite configurar:

| Configuração | Limites |
| --- | --- |
| Duração da partida | 60–180 segundos |
| Intervalo de spawn dos inimigos | 2–15 segundos |

As configurações são persistidas localmente e permanecem após atualizar a página.

Ao iniciar uma partida, é criado um **snapshot das configurações atuais**.

Dessa forma, alterações realizadas nas opções durante uma partida pausada afetam somente partidas futuras e não modificam as regras da sessão em andamento.

## Pausa

A partida pode ser pausada manualmente e também é pausada automaticamente quando a janela perde o foco ou o documento fica oculto.

Enquanto o jogo está pausado:

- A simulação é interrompida
- O cronômetro da partida não avança
- Os cooldowns das armas não avançam
- O comportamento dos inimigos é interrompido
- O estado dos inputs é limpo

Ao recuperar o foco da janela, a partida não continua automaticamente. O jogador precisa selecionar explicitamente a opção de continuar.

Isso evita que inputs acumulados ou antigos sejam aplicados ao retornar para o jogo.

## Arquitetura

A aplicação separa a interface da simulação em tempo real.

```text
src/
├── app/
├── features/
│   ├── controls/
│   ├── history/
│   ├── options/
│   └── ranking/
├── game/
│   ├── config/
│   ├── core/
│   ├── entities/
│   ├── input/
│   ├── rendering/
│   ├── systems/
│   └── types/
├── infrastructure/
│   ├── api/
│   └── mocks/
└── shared/
```

### React

O React é responsável pela interface e navegação da aplicação, incluindo:

- Menu principal
- Options
- Tela de controles
- Ranking
- Histórico de partidas
- Estados de carregamento
- Interface de pausa
- HUD
- Tela de resultado
- Estados relacionados às requisições da API

### PixiJS

O PixiJS é responsável pela camada de gameplay em tempo real, incluindo:

- Renderização da arena
- Navios
- Projéteis
- Ilhas
- Movimentação
- Simulação dos inimigos
- Colisões
- Combate
- Efeitos visuais

Essa separação evita colocar o React no loop de renderização por frame. O React recebe snapshots do estado necessário para atualizar elementos da interface.

## Game loop e simulação

O gameplay é atualizado através do ticker do PixiJS.

Movimentação, cooldowns e demais elementos temporais utilizam o delta de tempo dos frames em vez de assumir uma taxa fixa de atualização.

Isso mantém o comportamento da simulação consistente mesmo quando a frequência de renderização varia.

A simulação é dividida em responsabilidades como:

- Movimento do jogador
- Comportamento dos inimigos
- Spawn de inimigos
- Armas
- Projéteis
- Colisões
- Tempo da partida
- Efeitos visuais

## Colisões e limites da arena

A arena possui limites visíveis que restringem a área de gameplay.

O tratamento de colisões contempla situações como:

- Jogador contra os limites da arena
- Jogador contra ilhas
- Interações com inimigos
- Contato com Chasers
- Projéteis contra alvos válidos

O sistema de spawn também aplica regras de segurança para evitar o surgimento de inimigos muito próximos ao jogador ou dentro das áreas protegidas dos obstáculos.

## Feedback visual

Os assets fornecidos no desafio são utilizados como base visual do jogo.

O gameplay possui feedback através de:

- Disparos e projéteis
- Explosões
- Feedback de dano
- Indicadores de vida
- Deterioração visual progressiva dos navios

O estado visual de dano dos navios é alterado conforme a vida restante.

Acima de 60% de vida, o efeito adicional de fogo permanece oculto. Entre 30% e 60%, o navio apresenta um efeito moderado de fogo. Com 30% ou menos, o efeito se torna mais intenso.

Navios destruídos utilizam seus respectivos estados visuais de naufrágio.

## Carregamento de assets e lifecycle

Os recursos necessários ao gameplay são carregados antes que o combate seja liberado.

A interface possui estados explícitos para:

- Carregamento
- Jogo pronto
- Falha no carregamento
- Nova tentativa

Texturas reutilizáveis são carregadas antecipadamente quando apropriado.

Quando a instância do jogo deixa de ser utilizada, seus recursos, listeners e elementos associados são destruídos para evitar o acúmulo de instâncias durante o ciclo de vida da aplicação.

## Camada de API

As requisições HTTP utilizam **Axios**.

O gerenciamento de server state do ranking e histórico utiliza **TanStack Query**.

A configuração do Query Client fornece:

- Cache
- `staleTime`
- Retry
- Atualização em background ao recuperar foco
- Invalidação das queries após o registro de uma partida

Quando uma partida é registrada com sucesso, as queries de ranking e histórico são invalidadas para que ambas possam refletir o novo resultado.

## API simulada com MSW

O worker do MSW é inicializado tanto no ambiente de desenvolvimento quanto no build de produção. Dessa forma, a aplicação publicada mantém os endpoints simulados disponíveis e pode ser avaliada sem depender de um backend externo.

A API simulada contempla:

- Registro de partidas
- Ranking
- Histórico
- Paginação
- Registro idempotente de partidas

Os cenários disponíveis incluem:

- Sucesso
- Resposta vazia
- Alta latência
- Latência variável e respostas fora de ordem
- Erro de rede
- Erro HTTP 4xx
- Erro HTTP 5xx
- Timeout no registro da partida
- Serviço de registro indisponível
- Falha no carregamento de assets

Os cenários podem ser selecionados através do parâmetro `mockScenario` da URL.

Exemplo:

```text
/?mockScenario=network-error
```

Outros cenários:

```text
/?mockScenario=empty
/?mockScenario=latency
/?mockScenario=variable-latency
/?mockScenario=client-error
/?mockScenario=server-error
/?mockScenario=registration-timeout
/?mockScenario=registration-unavailable
/?mockScenario=asset-error
```

Sem o parâmetro, a aplicação utiliza o cenário normal de sucesso.

## Persistência e confiabilidade do registro

A aplicação utiliza armazenamento local para:

- Configurações do jogo
- Última partida concluída
- Registro pendente de partida

Ao terminar uma partida, o resultado é persistido localmente antes da tentativa de registro.

Caso a requisição falhe ou exceda o tempo limite, o resultado pendente continua armazenado e pode ser enviado novamente.

A mesma identificação da partida é reutilizada durante o retry. A API simulada trata os IDs das sessões de forma idempotente, evitando que novas tentativas gerem partidas duplicadas.

Após um registro bem-sucedido:

- O registro pendente é removido
- O ranking é invalidado
- O histórico é invalidado

Abandonar uma partida em andamento e retornar ao menu principal não gera um registro de partida concluída.

## Ranking e histórico

### Ranking

A tela de ranking possui:

- Estado de carregamento
- Estado vazio
- Estado de erro
- Retry
- Paginação
- Identificação do jogador atual

### Histórico de partidas

Cada registro do histórico apresenta:

- Data
- Identificação do jogador
- Identificação da partida
- Pontuação
- Duração efetiva
- Motivo do término

As partidas do jogador atual recebem destaque visual.

## Responsividade e acessibilidade

A interface possui suporte para desktop e dispositivos móveis.

O canvas adapta sua apresentação ao viewport preservando as proporções da arena e as regras da simulação.

No mobile, o gameplay foi projetado para orientação landscape.

Também foram considerados aspectos de acessibilidade, incluindo:

- Botões semânticos
- Dialogs identificados
- Labels acessíveis
- Elementos de navegação
- Estados visíveis de carregamento e erro
- Controles por teclado
- Controles touch

## Testes automatizados

Os testes end-to-end utilizam **Playwright**.

Para executar a suíte:

```bash
npm run test:e2e
```

Para abrir a interface interativa do Playwright:

```bash
npm run test:e2e:ui
```

Para visualizar o último relatório:

```bash
npm run test:e2e:report
```

A cobertura E2E inclui fluxos como:

- Movimento do jogador
- Limites da arena
- Colisão com ilhas
- Cooldown das armas
- Pontuação sem duplicação
- Comportamento do Chaser
- Comportamento do Shooter
- Spawn seguro de inimigos
- Fim da partida por tempo
- Fim da partida pela destruição do jogador
- Pausa manual
- Pausa automática por perda de foco
- Controles touch
- Persistência de partida
- Abandono de partida
- Integração entre registro, ranking e histórico
- Paginação
- Timeout e retry do registro
- Prevenção de registros duplicados

### Regressão visual

Os testes de regressão visual do Playwright cobrem os estados exigidos:

- Menu principal
- Arena em estado estável
- Resultado da partida

A tela de ranking também possui cobertura visual adicional.

Nos cenários visuais de gameplay, a instrumentação de testes permite estabilizar elementos não determinísticos enquanto a renderização e as regras reais do jogo continuam sendo utilizadas.

## Performance

O alvo definido para o gameplay é **60 FPS**.

As medições foram realizadas manualmente em um navegador baseado em Chromium durante o desenvolvimento.

### FPS e frame time

Uma medição de 60 segundos utilizando `requestAnimationFrame` apresentou:

| Métrica | Resultado observado |
| --- | ---: |
| Meta | 60 FPS |
| FPS médio | 75,02 FPS |
| Frame time médio | 13,33 ms |
| p95 do frame time | 13,50 ms |
| Frames observados | 4.501 |

A frequência observada ficou acima da meta de 60 FPS e reflete também a taxa de atualização disponível no ambiente utilizado durante a medição.

### Entidades

Foi realizada uma sessão completa configurada para a duração máxima de **180 segundos** e intervalo mínimo de spawn de **2 segundos**, coletando aproximadamente uma amostra por segundo durante o gameplay.

Para impedir que a partida terminasse antecipadamente pela destruição do jogador, o movimento e o comportamento dos inimigos foram congelados através da instrumentação de testes. O sistema de spawn permaneceu ativo durante toda a sessão, permitindo observar o crescimento da quantidade de entidades em um cenário controlado e reproduzível.

Foram coletadas **176 amostras**, com a última medição realizada em **179,52 segundos**.

O maior número observado foi:

| Métrica | Resultado |
| --- | ---: |
| Pico de entidades dinâmicas | 92 |
| Inimigos no momento do pico | 91 |
| Projéteis do jogador | 0 |
| Projéteis inimigos | 0 |
| Momento do pico | 178,51 s |

Para essa medição, entidades dinâmicas incluem o jogador, inimigos ativos e projéteis ativos.

### Memória

Também foi realizada uma investigação utilizando heap snapshots antes e depois de cinco ciclos completos de criação e destruição da partida.

Após o quinto ciclo, foi executada a coleta de lixo antes da comparação final.

| Medição | Heap |
| --- | ---: |
| Antes dos ciclos | 56,1 MB |
| Após 5 ciclos + GC | 55,2 MB |

Não foi observado crescimento persistente do heap durante esse teste.

Essa medição representa uma investigação realizada no ambiente de desenvolvimento e não significa que o consumo de memória será idêntico em todos os dispositivos, navegadores ou cenários.

## Decisões de gameplay e balanceamento

Algumas regras foram definidas como decisões de implementação:

- Duração das partidas limitada entre 60 e 180 segundos
- Intervalo de spawn limitado entre 2 e 15 segundos
- Movimento do navio somente para frente
- Autodestruição/contato do Chaser não concede pontuação
- Experiência mobile priorizando orientação landscape
- Estado READY/START entre o carregamento dos assets e o início da simulação

Essas decisões mantêm as partidas previsíveis sem impedir diferentes configurações de sessão.

## Instrumentação para testes

Em ambiente de desenvolvimento, o jogo disponibiliza uma pequena interface utilizada pelos testes Playwright para tornar cenários dependentes de tempo reproduzíveis.

Essa interface permite operações como:

- Consultar snapshots do estado
- Congelar o movimento dos inimigos
- Posicionar inimigos
- Controlar o tempo restante
- Aplicar dano ao jogador
- Congelar a progressão do cooldown das armas

Essa instrumentação controla apenas o estado necessário para preparar cenários determinísticos. Movimento, colisões, combate, regras e renderização continuam utilizando a implementação real do jogo.

## Limitações conhecidas

- O backend é simulado com MSW e não utiliza um servidor persistente real.
- A identidade do jogador utiliza atualmente o jogador de demonstração `Captain Jack`.
- A experiência mobile de gameplay é otimizada para orientação landscape.
- As medições de performance dependem de hardware, navegador, taxa de atualização da tela e ferramentas de desenvolvimento utilizadas.

## Deploy

URL da aplicação:

```text
Será adicionada após o deploy.
```

A versão publicada mantém a API simulada para que a aplicação possa ser avaliada sem depender de um backend externo.

## Scripts disponíveis

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:report
```