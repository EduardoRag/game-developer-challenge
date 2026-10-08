# Arquitetura — Pirate Battle

Este documento descreve a implementação em `src/`, seus contratos e limites. Instruções de instalação, controles, cenários MSW, testes e resultados históricos de profiling estão no [README.md](./README.md).

## Visão geral e organização

React administra telas e estado de interface. PixiJS administra a renderização e a simulação da partida. Axios realiza chamadas HTTP, TanStack Query mantém o estado das consultas e MSW simula a API no navegador.

```text
main.tsx: MSW → StrictMode → QueryClientProvider → App
  ├── Menu, opções, ranking e histórico
  │                  └── TanStack Query → Axios → /api → MSW
  └── GameCanvas → Game → Application (PixiJS)
                     ├── InputManager
                     ├── Player / Enemy / Projectile
                     ├── Sistemas de simulação e colisão
                     ├── WorldRenderer / efeitos / barras de vida
                     └── AudioManager
```

| Caminho                               | Responsabilidade                                                |
| ------------------------------------- | --------------------------------------------------------------- |
| `src/main.tsx`                        | Inicialização do MSW e montagem dos providers                   |
| `src/App.tsx`, `src/app/`             | Telas, configuração de sessão, UUID e conclusão da partida      |
| `src/features/options/`               | Opções e persistência                                           |
| `src/features/controls/`              | Instruções de controle                                          |
| `src/features/ranking/`               | Contrato, query e tela de ranking                               |
| `src/features/history/`               | Contrato, query, histórico e armazenamento de resultados        |
| `src/game/core/Game.ts`               | Coordenação da partida                                          |
| `src/game/entities/`                  | Estado e sprites de jogador, inimigos e projéteis               |
| `src/game/systems/`                   | Movimento, armas, spawn, inimigos, projéteis, colisão e combate |
| `src/game/input/`                     | Estado das teclas e comandos de ponteiro                        |
| `src/game/rendering/`                 | Integração do canvas, mundo, HUD, overlays, controles e efeitos |
| `src/game/audio/`                     | Reprodução e descarte de áudio                                  |
| `src/game/config/`, `src/game/types/` | Parâmetros e contratos da simulação                             |
| `src/infrastructure/api/`             | Axios, QueryClient e mutation de registro                       |
| `src/infrastructure/mocks/`           | Worker, cenários, handlers e dados em memória                   |
| `src/shared/components/`              | Componentes de interface compartilhados                         |
| `tests/e2e/`                          | Testes funcionais e snapshots visuais Playwright                |

Vite usa o plugin React. Os projetos TypeScript referenciados verificam `src/` e `vite.config.ts`, com `noEmit` e verificações de símbolos não utilizados; não incluem os testes. ESLint aplica regras TypeScript, React Hooks e React Refresh. Não há configuração de backend ou proxy HTTP no Vite.

## Integração React/PixiJS e ciclo de vida

`main.tsx` importa o worker e aguarda `worker.start()` antes de montar React em `StrictMode`, dentro de `QueryClientProvider`. A inicialização é incondicional, inclusive em produção. Uma rejeição nessa etapa não tem fallback de interface implementado.

`App` seleciona telas por estado local, sem roteador. **PLAY** cria um UUID com `crypto.randomUUID()`, copia as opções para `sessionConfig` e incrementa `gameKey`. **PLAY AGAIN** cria novo UUID e nova instância, mas conserva a configuração da sessão anterior.

O efeito de `GameCanvas` cria `Game`, registra o listener de snapshots e chama `initialize()`. A sequência de preparação é:

1. Inicializar `Application` com `resizeTo` apontando para o contêiner e inserir seu canvas no DOM.
2. Calcular a escala inicial e carregar o mundo.
3. Carregar/criar o jogador e tentar criar um Chaser e um Shooter em posições seguras.
4. Carregar a textura dos projéteis e as texturas de explosão e fogo.
5. Criar o efeito de dano do jogador e emitir o snapshot inicial.
6. Entregar a API de controles ao React e mostrar **READY?**.

`start()` é chamado por **START**. Ele ativa listeners de teclado, foco e visibilidade, inicia áudio e adiciona a atualização do jogo ao ticker. O estado interno já é `playing` durante a preparação, mas a simulação só é ligada nesse momento. Áudio tem preload próprio, sem espera de carregamento integrada ao READY.

O cleanup do efeito marca a inicialização como cancelada, remove a API de debug correspondente e chama `Game.destroy()`. Os callbacks assíncronos não atualizam React depois do cancelamento. `Game` verifica `destroyed` após etapas da preparação; se a aplicação Pixi terminar de inicializar depois do descarte, ela é destruída nesse retorno. Isso trata a montagem/desmontagem adicional do StrictMode, sem garantir a limpeza de toda alocação assíncrona.

Se a preparação falhar, `GameCanvas` sinaliza erro. A instância só é destruída ao desmontar ou trocar `gameKey`, como no **RETRY**; o catch não a descarta imediatamente.

### Snapshots e interface

`GameSnapshot` contém vida, vida máxima, pontuação, tempo restante, tempo jogado, estado e motivo do fim. `emitSnapshot()` arredonda tempo restante para cima e tempo jogado para baixo, compara todos os campos com o último snapshot e só notifica React quando algo muda. Movimento e colisões não dependem de renders React; posições por frame não são enviadas ao HUD.

O resultado visual apresenta pontos, tempo, motivo e estado da mutation. ID, nome, configuração e data pertencem ao fluxo de registro e histórico, e não ao overlay de resultado.

## Game loop e simulação

O callback do ticker converte `deltaMS` para segundos e chama `update()`. A implementação usa passo variável; não há acumulador de passo fixo ou subdivisão de frames para colisões.

Em uma atualização de `playing`, a ordem é:

1. Verificar `Escape` e interromper o frame se houver pausa.
2. Atualizar cronômetro, limitando o incremento de tempo jogado ao tempo ainda disponível.
3. Atualizar cooldowns, movimento e ataques do jogador.
4. Atualizar spawn, comportamento dos inimigos, contatos com Chasers e disparos dos Shooters.
5. Mover projéteis, resolver acertos e remover projéteis inválidos.
6. Remover inimigos mortos, somar pontos e atualizar o efeito de dano do jogador.
7. Verificar vida zerada antes de tempo esgotado; emitir snapshot e limpar presses do frame.

Movimento e cooldowns usam delta, mas isso não elimina as limitações de colisão discreta sob frames longos. Mesmo no frame em que o cronômetro chega a zero, as demais etapas são executadas antes da decisão de encerramento.

| Sistema            | Responsabilidade                                                                     |
| ------------------ | ------------------------------------------------------------------------------------ |
| `PlayerSystem`     | Rotação, deslocamento separado por eixo, bloqueio por obstáculos e limite do jogador |
| `WeaponSystem`     | Três cooldowns independentes, disparo frontal e laterais                             |
| `SpawnSystem`      | Relógio de spawn, bloqueio de criação concorrente e busca de posição                 |
| `EnemySystem`      | Comportamentos, disparos, barras de vida e efeitos dos inimigos                      |
| `ProjectileSystem` | Deslocamento, coleção e destruição de projéteis                                      |
| `CollisionSystem`  | Interseção de retângulos alinhados aos eixos                                         |
| `CombatSystem`     | Dano de projéteis e identificação de contatos com Chasers                            |

`Game` coordena remoção por contato, naufrágios, pontuação e encerramento. Os Chasers em contato são removidos antes da contagem de inimigos mortos por projéteis e não geram pontos.

### Entrada, pausa e encerramento

`InputManager` mantém conjuntos de teclas pressionadas e recém-pressionadas. Movimento consulta o primeiro; disparos consultam o segundo. Os botões React chamam `press` e `release`, liberando também em cancelamento ou saída do ponteiro.

Pausa manual, `blur` e documento oculto alteram o estado para `paused`. A atualização retorna antes de avançar a simulação, mas o ticker não é parado. Inputs são limpos na pausa e retomada; foco recuperado não retoma automaticamente. `AnimatedSprite` usa sua atualização automática, e os destroços usam `setTimeout`; esses efeitos não são congelados pelo estado da partida. Um spawn assíncrono já iniciado também não é cancelado pela pausa.

Em `gameOver`, a simulação deixa de avançar e a ambientação para. A aplicação Pixi e os listeners permanecem até o descarte da instância, mantendo o cenário atrás do resultado.

## Arena, colisões e spawn

`WorldRenderer` constrói oceano com `TilingSprite` e **uma ilha**, formada por duas camadas de tiles 3×3. Sua área de colisão é um retângulo com padding, independente dos pixels transparentes da imagem.

`CollisionSystem` compara AABBs obtidas dos sprites com retângulos dos obstáculos. Não há colisão por pixel, teste contínuo de trajetória ou resolução física entre todos os navios. Movimento contra a ilha é revertido por eixo para o jogador e para a posição anterior nos inimigos; não há pathfinding. Shooters não causam dano de contato. Inimigos não são restringidos às bordas pelo mesmo método usado no jogador.

Projéteis do jogador acertam inimigos; os inimigos acertam o jogador. Um acerto aplica dano e remove o projétil. A remoção por obstáculo ou saída da arena ocorre depois da resolução de acertos; não há ordenação de impactos ao longo da trajetória. Isso limita a precisão em frames longos e em sobreposições.

A busca de spawn tenta até **50 posições**, com margem de **50 px** nas bordas, distância mínima de **250 px** do jogador e padding de **40 px** nos obstáculos. Esses valores não são multiplicados pela escala mobile. Se não encontrar posição, retorna `null` e a criação é omitida; o intervalo é reiniciado mesmo quando a tentativa periódica não produz inimigo. Não há separação de spawn entre inimigos.

### Redimensionamento

O renderer acompanha o contêiner por `resizeTo`, mas mundo e escala são calculados na inicialização. Altura de até 500 px seleciona escala 0,6; acima disso, 1. A escala afeta dimensões dos navios e parâmetros espaciais de movimento, armas e comportamento dos inimigos, mas não todos os elementos: margem de spawn, tamanho visual do projétil e barras de vida têm tratamentos próprios.

Resize não reconstrói oceano, ilha ou obstáculos nem reposiciona entidades. Não existe um mundo lógico de dimensões fixas reduzido proporcionalmente ao viewport. A prioridade mobile é landscape, e rotações/redimensionamentos durante a sessão exigem validação adicional.

## Recursos, renderização e áudio

Texturas são carregadas via `Assets.load`, com reutilização pelo cache do Pixi. Fogo, explosões e barras de vida guardam referências estáticas às texturas. A destruição da aplicação usa `children: true`, `texture: false` e `textureSource: false`: destrói filhos da árvore de cena e preserva texturas compartilhadas para outras partidas. Não há `Assets.unload` no encerramento.

Explosões são removidas e destruídas ao terminar a animação. Inimigos removidos têm barra, efeito e sprite destruídos; projéteis são removidos da coleção ao serem destruídos. Destroços inimigos são sprites de naufrágio removidos após **2 s** por `setTimeout`, com verificação de `destroyed`. O jogador troca sua própria textura ao morrer.

`Game.destroy()` remove listeners, interrompe input, destrói áudio e efeito do jogador, remove seu callback do ticker e destrói a aplicação Pixi quando inicializada. Há limites nessa limpeza:

- Não há descarte global explícito das coleções de `EnemySystem` e `ProjectileSystem`; objetos anexados ao stage são destruídos pela árvore de cena.
- Timers de destroços não são cancelados, embora seus callbacks evitem destruir novamente sprites já destruídos.
- Carregamentos de assets não são abortados. O mundo pode receber objetos enquanto ainda não está anexado ao stage, e criação assíncrona de inimigos pode alocar barras fora da árvore antes de retornar.
- No retorno de um spawn após descarte, o código destrói o sprite do inimigo, mas não executa o descarte completo de barra, coleção e efeitos. A criação periódica é chamada sem tratamento explícito de rejeição.
- Os efeitos de dano dos dois inimigos iniciais são criados antes de `FireEffect.loadTextures()`. Na primeira carga, podem ficar sem fogo; texturas dos navios e barras continuam independentes desse efeito. Partidas posteriores podem reutilizar as texturas estáticas já carregadas.

Esses pontos impedem afirmar limpeza completa de todos os recursos em qualquer interrupção assíncrona. O experimento histórico de heap do README não substitui uma análise dessas situações.

`AudioManager` cria `HTMLAudioElement`s com preload automático, reutiliza elementos e alterna variantes em sequência. Não usa Web Audio nem um pool para sobrepor repetidamente o mesmo som. A reprodução reinicia o elemento escolhido; rejeições de `play()` são ignoradas. A ambientação oceânica é um loop com volume 0,25, pausado/retomado com a partida e parado com posição de reprodução zerada no encerramento.

Sons de combate e transição são chamados por `Game`, sem sons de navegação do menu implementados. O feedback de disparo do jogador depende da quantidade total de projéteis criados no frame: um toca o frontal, três tocam a lateral; combinações simultâneas que geram outras quantidades não recebem esse som. Na destruição, elementos de áudio são pausados, reiniciados, têm `src` limpo e são removidos dos mapas. Falhas de áudio não são reportadas na interface e não há espera de preload ou controles de volume/mute.

## Persistência e configuração de sessão

`optionsStorage` valida números finitos dentro dos limites e usa padrões para campos inválidos ou JSON ilegível. `OptionsScreen` salva cada ajuste imediatamente. `App` copia as opções para a sessão ao iniciar pelo menu; reinício conserva esse snapshot.

`sessionStorage` salva dois payloads `CreateSessionRequest`: último resultado e pendência. O parser trata erro de JSON, mas apenas converte o tipo, sem validação estrutural em runtime. Acesso/escrita em `localStorage` não têm catch para armazenamento indisponível ou quota excedida.

Há uma entrada por chave, sem fila, e nenhuma sessão em andamento é restaurada após refresh. O último resultado é preservado como payload, mas não reconstrói a tela de resultado ou preenche o histórico. As chaves e o procedimento de reset estão no README.

## Contratos HTTP

`apiClient` tem `baseURL: '/api'`, timeout de **5.000 ms** e header `Content-Type: application/json`. Os tipos estão em `infrastructure/api/types.ts` e nas features; os handlers não validam integralmente os payloads em runtime.

| Operação             | Entrada                              | Resposta normal                                             |
| -------------------- | ------------------------------------ | ----------------------------------------------------------- |
| `POST /api/sessions` | `CreateSessionRequest` no corpo JSON | 201 com nova sessão; 200 com sessão existente para mesmo ID |
| `GET /api/ranking`   | `page`, `pageSize` na query string   | 200 com `RankingResponse`                                   |
| `GET /api/history`   | `page`, `pageSize` na query string   | 200 com `GameHistoryResponse`                               |

Payload de registro:

```ts
type CreateSessionRequest = {
	id: string;
	playerName: string;
	score: number;
	duration: number;
	endReason: 'timeUp' | 'shipDestroyed';
	config: {
		sessionDuration: number;
		enemySpawnInterval: number;
	};
};
```

`duration` é expressa em segundos. `App` usa `Math.round(snapshot.elapsedTime)`, mas esse snapshot já contém segundos inteiros arredondados para baixo. A resposta de registro e cada entrada do histórico acrescentam `playedAt: string`, gerado pelo mock com `new Date().toISOString()` no primeiro registro; a data não é salva no payload local e corresponde ao momento do registro, inclusive em recuperação tardia.

Respostas de leitura têm `{ items, page, pageSize, total }`. O item de ranking contém `{ id, playerName, score, playedAt }`; o de histórico tem o formato da sessão registrada. Os valores padrão da API são página 1 e tamanho 10. As telas solicitam cinco itens para ranking e quatro para histórico.

O ranking deriva das sessões, ordenado por score decrescente, sem agregação por jogador. Novas sessões são inseridas no início do histórico; os dados demonstrativos iniciais já vêm ordenados. A identificação visual de jogador atual compara o nome com `Captain Jack`, sem identidade autenticada ou ID de usuário separado.

## Cache, paginação e registro idempotente

`QueryClient` é único na aplicação. Configura `staleTime: 30_000`, `retry: 1` nas consultas, `refetchOnWindowFocus: true` e `retry: 0` nas mutations. Refetch no foco depende de dados desatualizados. Não há persistência de cache, `gcTime` personalizado, retenção explícita de dados da página anterior ou encaminhamento do signal de cancelamento das queries ao Axios.

As chaves são `['ranking', page, pageSize]` e `['history', page, pageSize]`, separando respostas por página no cache. A paginação visual calcula `ceil(total / PAGE_SIZE)` e limita os botões anterior/próximo. Consultas oferecem nova tentativa com `refetch()`.

Ao concluir uma sessão, o efeito de `App`:

1. Usa o UUID da partida e impede nova submissão pelo mesmo efeito com `submittedMatchIdRef`.
2. Cria o payload com jogador demonstrativo, pontos, tempo, motivo e configuração.
3. Salva último resultado e pendência, antes de chamar a mutation.
4. Mantém o payload em uma ref para retry manual na tela de resultado.

Outro efeito tenta enviar uma pendência ao montar `App`, inclusive após refresh. StrictMode pode provocar mais de uma tentativa desse efeito em desenvolvimento; a idempotência do handler protege a inserção na mesma base em memória.

Em sucesso, `sessionMutations` remove a pendência somente quando seu ID coincide com o ID da resposta e aguarda invalidação das chaves raiz de ranking e histórico em paralelo. Consultas ativas podem buscar novamente; páginas inativas ficam invalidadas para uso posterior. Uma falha mantém a pendência; não existe repetição automática da mutation durante a mesma montagem.

O handler procura uma sessão existente pelo `id` após o atraso normal. Se existir, retorna o primeiro registro mesmo que o corpo posterior tenha valores diferentes. A idempotência vale para a base atual do mock; após refresh, essa base é recriada. Não há fila, coordenação entre abas ou proteção contra sobrescrever uma pendência com outra partida concluída.

`registration-timeout` não grava a sessão antes de falhar. Assim, o teste de retry confirma recuperação e uma entrada resultante, mas não simula uma resposta perdida depois de gravação bem-sucedida. Reenvio de ID já existente é tratado pelo código, sem cobertura específica desse caminho na suíte atual.

## MSW e testabilidade

O worker intercepta `/api/sessions`, `/api/ranking`, `/api/history` e o padrão de assets PNG default. `getMockScenario()` lê `window.location.search` a cada requisição, permitindo mudar o cenário com `history.replaceState()` sem recarregar a base. Falhas de leitura, registro e assets têm escopos separados, detalhados no README.

As sessões são um array de módulo inicializado com três registros demonstrativos. Cada página carregada tem sua base; refresh reinicia os dados. Não existe endpoint de reset ou persistência remota. Um reset local precisa considerar o reenvio automático do pendente.

A API `window.__PIRATE_BATTLE_E2E__` é exposta apenas quando `import.meta.env.DEV` está ativo, e seus métodos de alteração também verificam esse flag. Permite preparar cenários controlados sem substituir os sistemas reais. Congelar inimigos pula também a atualização de suas barras/efeitos, mas preserva spawn e resolução de contato.

A configuração Playwright executa o servidor de desenvolvimento em Chromium desktop e mobile landscape. As asserções cobrem fluxos funcionais e capturas visuais, com diferentes níveis de preparação sintética. A referência de arena é pausada, e o teste de latência fora de ordem usa `fetch` direto, sem provar sozinho todo o comportamento da UI em trocas rápidas de página. Cobertura detalhada, comandos, lacunas e métricas históricas ficam no README.

## Limites da revisão e conformidade com o desafio

A documentação foi confrontada com implementação, testes e configurações locais. Isso confirma a existência dos mecanismos descritos, sem comprovar resultados de execução, ausência de vazamentos, compatibilidade em todos os dispositivos ou valores históricos de profiling.

A revisão documental não incluiu uma nova comparação integral com o enunciado oficial do desafio; a conformidade com todos os critérios de aceite não foi reavaliada nesta etapa. Permanecem sem confirmação nesta revisão a disponibilidade do deploy, a aprovação atual da suíte e a reprodução das medições de performance. As limitações de implementação descritas neste documento não foram corrigidas em código nesta revisão documental.
