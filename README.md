# Pirate Battle

Jogo de batalha naval 2D com visão top-down, desenvolvido para o desafio **Frontend Game Developer da Jungle Gaming**, com React, TypeScript e PixiJS.

O jogador controla um navio, enfrenta inimigos com comportamentos distintos e acumula pontos durante partidas configuráveis. A aplicação inclui controles de teclado e touch, áudio, ranking, histórico, API simulada com MSW e testes Playwright.

**Endereço de publicação informado:** [Pirate Battle](https://pirate-battle-sand.vercel.app/). A disponibilidade e a correspondência do deploy com este código não foram verificadas nesta revisão.

Este documento reúne uso, reprodução de cenários, testes e resultados de performance. [ARCHITECTURE.md](./ARCHITECTURE.md) detalha a integração React/PixiJS, os sistemas, os contratos HTTP e o gerenciamento de recursos.

## Tecnologias

- React 19, TypeScript, PixiJS 8 e Vite 8.
- Axios e TanStack Query 5 para HTTP e estado das consultas.
- MSW para simulação de API no navegador.
- Playwright para testes end-to-end e regressão visual.
- ESLint e Prettier para análise e formatação.

As versões declaradas e os scripts estão em [package.json](./package.json); o lockfile registra as versões resolvidas.

## Execução local

### Pré-requisitos e instalação

Utilize Node.js compatível com o Vite instalado: `^20.19.0 || >=22.12.0`, além de npm. O projeto não declara uma versão própria de Node em `engines`.

Na raiz do projeto, instale as dependências do lockfile e o navegador usado nos testes:

```bash
npm ci
npx playwright install chromium
```

`npm install` também está disponível para instalação convencional. Os dois projetos Playwright configurados utilizam Chromium; não é necessário instalar Firefox ou WebKit para a suíte atual.

### Comandos

| Objetivo              | Comando                   | Comportamento                                                                 |
| --------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| Desenvolvimento       | `npm run dev`             | Inicia o Vite                                                                 |
| Build                 | `npm run build`           | Executa `tsc -b` e, se passar, `vite build`                                   |
| Preview               | `npm run preview`         | Serve o build existente em `dist/`; execute o build antes                     |
| Lint                  | `npm run lint`            | Executa `eslint .`                                                            |
| Verificação de tipos  | `npx tsc -b`              | Verifica os projetos referenciados pelo `tsconfig.json`, sem gerar JavaScript |
| Playwright            | `npm run test:e2e`        | Executa a suíte E2E e visual                                                  |
| Playwright interativo | `npm run test:e2e:ui`     | Abre a interface de execução                                                  |
| Relatório Playwright  | `npm run test:e2e:report` | Abre o relatório HTML já gerado                                               |

Não existe script `typecheck`. `tsc -b` cobre `src/` e `vite.config.ts`; os testes e `playwright.config.ts` não fazem parte desses projetos TypeScript. O modo build grava metadados incrementais em `node_modules/.tmp/`.

O MSW é iniciado antes da montagem do React, tanto em desenvolvimento quanto em produção. Não há backend externo ou variável de ambiente obrigatória para a API simulada. O navegador precisa permitir Service Workers em contexto seguro, como localhost ou HTTPS.

## Como jogar

Selecione **PLAY**, aguarde o carregamento dos assets e pressione **START** na etapa **READY?**. Se o carregamento falhar, a interface apresenta **FAILED TO LOAD** e **RETRY**.

### Controles

| Ação                     | Teclado            |
| ------------------------ | ------------------ |
| Mover para frente        | `W` / `ArrowUp`    |
| Girar para esquerda      | `A` / `ArrowLeft`  |
| Girar para direita       | `D` / `ArrowRight` |
| Disparo frontal          | `Space`            |
| Disparo lateral esquerdo | `Q`                |
| Disparo lateral direito  | `E`                |
| Pausar                   | `Escape`           |

O jogador não possui movimento de ré. Os botões na tela usam eventos de ponteiro para movimento, rotação e ataques, permitindo comandos simultâneos. Disparos são acionados ao pressionar: manter a tecla ou o botão pressionado não produz fogo automático.

### Regras e balanceamento

- O jogador começa com **100 pontos de vida**; Chasers e Shooters têm **50** cada.
- O disparo frontal cria um projétil e tem cooldown de **0,7 s**. Cada lateral cria três projéteis e tem cooldown de **1,2 s**, independente da outra lateral e do frontal.
- Projéteis do jogador e dos inimigos causam **15 de dano** por acerto.
- O **Chaser** persegue o jogador, causa **20 de dano** por contato e é removido nessa colisão, sem conceder pontos.
- O **Shooter** se aproxima ou recua para manter distância de combate e dispara quando está ao alcance, com cooldown de **1,5 s**.
- Cada inimigo destruído pelos ataques do jogador concede **um ponto**.
- A preparação tenta criar um Chaser e um Shooter. Durante a partida, cada spawn sorteia um dos tipos com probabilidade de 50%; a criação depende de encontrar posição segura.
- Há uma ilha com área de colisão retangular. O jogador é limitado à arena; projéteis são removidos ao acertar alvos, obstáculos ou sair da arena.

A partida termina por tempo esgotado (`timeUp`) ou vida zerada (`shipDestroyed`). Se ambos ocorrerem no mesmo frame, a destruição do jogador tem prioridade.

A tela **BATTLE COMPLETE** mostra pontuação, tempo efetivamente jogado, motivo do término e estado do registro, com ações para repetir o envio, jogar outra vez ou retornar ao menu. Data, jogador, ID e configuração aparecem no histórico após o registro; esses detalhes não são exibidos na tela de resultado.

### Configuração e pausa

| Opção              | Padrão | Limites  | Incremento na interface |
| ------------------ | -----: | -------- | ----------------------: |
| Duração da partida |  120 s | 60–180 s |                    10 s |
| Intervalo de spawn |    5 s | 2–15 s   |                     1 s |

As alterações em **OPTIONS** são salvas imediatamente em `localStorage`. **PLAY** copia as opções atuais para a sessão. Alterações durante a pausa não afetam a partida em andamento. **PLAY AGAIN** e o retry de carregamento reutilizam a configuração dessa sessão; para aplicar novas opções, volte ao menu e selecione **PLAY**.

A pausa pode ser acionada por `Escape` ou pelo botão na tela e ocorre automaticamente em `blur` ou quando o documento fica oculto. Tempo, movimento, spawn e cooldowns deixam de avançar. Inputs são limpos na pausa e retomada; recuperar foco não retoma a partida automaticamente. Renderização e animações visuais podem continuar, e a remoção temporizada de destroços não usa o relógio da simulação.

### Feedback visual, áudio e responsividade

Texturas dos navios mudam conforme a vida restante: dano intermediário com 60% ou menos, crítico com 30% ou menos e naufrágio na destruição. O fogo fica oculto acima de 60%, moderado acima de 30% até 60% e mais intenso com 30% ou menos. Há explosões, HUD de vida, pontos e tempo, além de barras de vida dos inimigos. A arquitetura registra uma limitação do fogo nos inimigos da primeira preparação.

O áudio inclui disparos do jogador, impactos, colisões, destruição, pontuação, início, pausa, retomada, encerramento e ambientação oceânica. A ambientação pausa com o jogo e para no encerramento. Falhas de reprodução são ignoradas para não interromper o gameplay. Nem todos os arquivos sonoros fornecidos são utilizados, e não há opção de volume ou mute na interface.

O canvas acompanha o tamanho do contêiner. Em altura inicial de até 500 px, o jogo aplica escala de 0,6 aos navios e a parâmetros espaciais de movimento e combate. A experiência mobile prioriza **landscape**; não há arena lógica fixa com proporções preservadas, e mudar o tamanho durante a partida não reconstrói o mundo nem recalcula essa escala.

Há botões semânticos, labels nos controles, identificação de diálogos e mensagens de registro com `aria-live`. Esses recursos não constituem uma auditoria completa de acessibilidade.

## Ranking, histórico e persistência

Ranking e histórico apresentam carregamento, estado vazio, erro e nova tentativa. O ranking lista **partidas ordenadas por pontuação**, sem agregar pontuações por jogador, com cinco entradas por página. O histórico usa quatro entradas por página e mostra data, jogador, ID, pontos, duração, motivo do término e configuração. Entradas de `Captain Jack` recebem destaque; a identidade é demonstrativa, sem autenticação.

As consultas usam Axios com timeout de **5 s** e TanStack Query com `staleTime` de **30 s**, uma repetição automática em caso de falha de consulta e refetch ao recuperar foco para dados desatualizados. Página e tamanho fazem parte da chave de cache. Após registro confirmado, todas as páginas de ranking e histórico são invalidadas. O cache das consultas fica em memória.

| Chave de `localStorage`                | Conteúdo                            |
| -------------------------------------- | ----------------------------------- |
| `pirate-battle-options`                | Opções do jogo                      |
| `pirate-battle-last-completed-session` | Payload da última partida concluída |
| `pirate-battle-pending-session`        | Um payload pendente de registro     |

Ao terminar uma partida, a aplicação salva o resultado e o pendente antes de enviar `POST /api/sessions`. Se o envio falhar, é possível repetir na tela de resultado. Ao montar a aplicação, um pendente armazenado é enviado automaticamente. As mutations não têm retry automático.

Cada nova partida recebe um UUID; a recuperação reutiliza o ID original. O mock retorna o registro existente para um ID repetido, sem inserir outra entrada. Após sucesso, o pendente é removido somente se seu ID corresponder à resposta. Abandonar uma partida em andamento não gera resultado concluído.

O armazenamento comporta **apenas uma pendência**: outra partida concluída pode sobrescrevê-la. A última partida permanece armazenada após refresh, mas não restaura a tela de resultado nem é mesclada ao histórico remoto. Os registros do MSW ficam em memória e voltam aos dados iniciais ao recarregar; apenas uma pendência ainda existente pode ser reenviada nessa montagem.

## Cenários MSW: selecionar, reproduzir e resetar

Selecione um cenário pelo parâmetro `mockScenario`, por exemplo `/?mockScenario=network-error`. Ausência do parâmetro ou valor desconhecido seleciona `success`. Os handlers consultam a URL a cada requisição.

| Valor                      | Escopo                              | Comportamento                                                         |
| -------------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| `success`                  | API                                 | Leituras e registro com atraso de 300 ms                              |
| `empty`                    | Ranking e histórico                 | Lista vazia com `total: 0`; não apaga as sessões                      |
| `latency`                  | Ranking e histórico                 | Atraso de 2.500 ms                                                    |
| `variable-latency`         | Ranking e histórico                 | Página 1: 1.200 ms; demais páginas: 150 ms                            |
| `network-error`            | Ranking e histórico                 | Erro de rede após o atraso padrão                                     |
| `client-error`             | Ranking e histórico                 | HTTP 400 após o atraso padrão                                         |
| `server-error`             | Ranking e histórico                 | HTTP 500 após o atraso padrão                                         |
| `registration-timeout`     | Registro                            | Aguarda 10 s e retorna 504; Axios expira em 5 s, sem inserir a sessão |
| `registration-unavailable` | Registro                            | HTTP 503 após 300 ms, sem inserir a sessão                            |
| `asset-error`              | GET em `/assets/png/default/:path*` | HTTP 500 para assets abrangidos pelo handler                          |

Os cenários de leitura não provocam falhas no POST; os de registro não provocam falhas nas consultas. `asset-error` não abrange áudio, SVGs ou todo o conteúdo estático, e assets já em cache podem não gerar nova requisição.

### Reprodução manual

1. **Consultas:** abra a URL com o cenário e entre em **RANKING** ou **MATCH HISTORY**. Para observar loading, use `latency`; para estado vazio, use `empty`. Erros de consulta são repetidos automaticamente uma vez antes do estado final de erro.
2. **Registro:** abra `/?mockScenario=registration-timeout` ou `/?mockScenario=registration-unavailable`, selecione **PLAY**, depois **START**, e termine a partida. Confira a mensagem de falha e a chave pendente no armazenamento do navegador.
3. **Assets:** abra `/?mockScenario=asset-error` em uma página recém-carregada e selecione **PLAY**. Aguarde **FAILED TO LOAD**. Se necessário, desative o cache HTTP nas ferramentas do navegador para evitar reutilizar imagens.

Para encerrar uma partida rapidamente durante a reprodução em desenvolvimento, após **START**, execute no console do navegador:

```js
window.__PIRATE_BATTLE_E2E__?.setTimeRemaining(0.1);
```

Essa instrumentação não é exposta no build de produção. Para reproduzir respostas fora de ordem, abra `variable-latency`, aguarde o menu e execute duas consultas simultâneas:

```js
await Promise.all(
	[1, 2].map(async (page) => {
		const response = await fetch(`/api/ranking?page=${page}&pageSize=5`);
		console.log(await response.json());
	}),
);
```

A página 2 deve responder antes da 1. Esse cenário aplica atrasos diferentes; não injeta dados incorretos nas respostas.

### Recuperação sem recarregar

No console do navegador, mude o cenário para sucesso preservando os dados em memória:

```js
const url = new URL(window.location.href);
url.searchParams.set('mockScenario', 'success');
window.history.replaceState(null, '', url);
```

Em seguida, use **Try Again** no ranking, **TRY AGAIN** no histórico ou resultado, ou **RETRY** no erro de carregamento. O botão sozinho não remove o cenário de falha. Uma consulta já iniciada ainda pode terminar com o cenário anterior; repita após sua conclusão.

### Reset dos dados

Não existe endpoint ou botão de reset. Recarregar reinicia o cache de queries e as sessões do mock, mas preserva `localStorage` e dispara a recuperação de uma pendência existente.

Para uma reprodução a partir dos padrões, remova somente as três chaves do projeto e recarregue em sucesso. Isso apaga opções e resultados locais:

```js
localStorage.removeItem('pirate-battle-options');
localStorage.removeItem('pirate-battle-last-completed-session');
localStorage.removeItem('pirate-battle-pending-session');
const url = new URL(window.location.href);
url.searchParams.delete('mockScenario');
window.location.assign(url.href);
```

## Testes automatizados

A suíte está em [tests/e2e](./tests/e2e), configurada por [playwright.config.ts](./playwright.config.ts). Executa em `desktop-chromium` (Desktop Chrome) e `mobile-chromium` (Pixel 7 landscape), contra `http://127.0.0.1:5173`. O Playwright inicia `npm run dev -- --host 127.0.0.1` e pode reutilizar um servidor existente fora de CI. Não executa contra o build de produção.

Os testes são paralelos; em CI, usam um worker e até duas repetições. O relatório é HTML, screenshots são coletados em falhas e traces na primeira repetição. O relatório depende de uma execução anterior.

| Arquivos                                     | Cenários presentes                                                                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `navigation.spec.ts`, `captains-log.spec.ts` | Menu, opções, navegação, dados, estados vazios e erros HTTP 400/500                                                    |
| `gameplay.spec.ts`                           | Movimento, limites, ilha, cooldown frontal, spawn seguro, Shooter, Chaser, pontuação, término, pausa e controles touch |
| `match-flow.spec.ts`                         | Último resultado após refresh e abandono sem registro                                                                  |
| `data-flow.spec.ts`                          | Registro refletido nas listas, paginação do ranking e retry de timeout                                                 |
| `session-persistence.spec.ts`                | Recuperação de pendente após refresh e preservação local em indisponibilidade                                          |
| `asset-loading.spec.ts`                      | READY e recuperação após erro de assets                                                                                |
| `mock-scenarios.spec.ts`                     | Consultas diretas com respostas fora de ordem                                                                          |
| `visual.spec.ts`                             | Menu, ranking, arena pausada e resultado                                                                               |

Os snapshots visuais existentes são referências **Windows/Chromium**, nos dois projetos. A captura da arena contém o overlay de pausa. Os testes visuais de gameplay fixam o sorteio, posicionam e congelam inimigos; usam a renderização real com condições controladas.

`window.__PIRATE_BATTLE_E2E__` permite consultar snapshots, posicionar e congelar inimigos, alterar tempo restante, causar dano ao jogador e congelar cooldowns das armas. Congelar inimigos interrompe seu comportamento e disparos, mas não desativa spawn, contato com Chasers ou projéteis já existentes.

A cobertura descrita é baseada na leitura dos testes, sem afirmar aprovação da suíte nesta revisão. Não há suíte unitária configurada. Não foram encontrados testes específicos de áudio, profiling, todos os cooldowns laterais, paginação do histórico, recuperação manual dos erros de leitura ou validação completa do layout em dispositivos reais. O teste touch dispara eventos sintéticos e verifica a interface, sem comprovar todos os efeitos simultâneos na simulação. O teste de timeout confirma uma entrada após retry, mas não exercita o caso de o servidor ter gravado antes de a resposta se perder.

## Performance

O alvo definido para o gameplay é **60 FPS**. Os resultados abaixo foram preservados da documentação original como **registros históricos de medições manuais em Chromium durante o desenvolvimento**. O ambiente utilizado foi Windows 11 Home, AMD Ryzen 7 9700X, AMD Radeon RX 9060 XT, 31 GB de RAM e Microsoft Edge 154. Os resultados não foram reproduzidos nesta revisão, e os arquivos brutos das medições, incluindo séries de amostras e heap snapshots, não estão disponíveis para confirmar os valores.

### FPS e frame time

Uma medição de 60 segundos utilizando `requestAnimationFrame` registrou:

| Métrica           | Resultado observado |
| ----------------- | ------------------: |
| Meta              |              60 FPS |
| FPS médio         |           75,02 FPS |
| Frame time médio  |            13,33 ms |
| p95 do frame time |            13,50 ms |
| Frames observados |               4.501 |

A frequência registrada ficou acima da meta e pode refletir a taxa de atualização do ambiente. Uma coleta por `requestAnimationFrame` não mede isoladamente o custo de atualização de `Game` nem comprova desempenho de GPU ou de todos os cenários de combate.

### Entidades

O registro descreve uma sessão de **180 segundos**, com intervalo de spawn de **2 segundos**, coletando aproximadamente uma amostra por segundo. Movimento e comportamento dos inimigos foram congelados pela instrumentação, enquanto o spawn permaneceu ativo, para evitar término antecipado. Foram registradas **176 amostras**, com a última em **179,52 segundos**.

| Métrica                     | Resultado registrado |
| --------------------------- | -------------------: |
| Pico de entidades dinâmicas |                   92 |
| Inimigos no momento do pico |                   91 |
| Projéteis do jogador        |                    0 |
| Projéteis inimigos          |                    0 |
| Momento do pico             |             178,51 s |

Nesse levantamento, entidades dinâmicas incluem jogador, inimigos ativos e projéteis ativos. O cenário avalia crescimento de entidades sob condições controladas; não representa combate ativo com todas as entidades simuladas. O mecanismo de congelamento existe no código, mas os números não podem ser confirmados sem as amostras originais.

### Memória

O registro descreve heap snapshots antes e depois de **cinco ciclos completos de criação e destruição da partida**, com coleta de lixo após o quinto ciclo:

| Medição            |    Heap |
| ------------------ | ------: |
| Antes dos ciclos   | 56,1 MB |
| Após 5 ciclos + GC | 55,2 MB |

A conclusão registrada foi ausência de crescimento persistente observado nesse experimento. Os dois valores não demonstram ausência de todos os vazamentos nem incluem necessariamente memória de GPU, texturas e áudio. O cache de texturas é intencionalmente preservado entre partidas; consumo e desempenho podem variar entre dispositivos, navegadores e cenários.

## Limitações e pontos não confirmados

- API em memória com MSW, sem banco remoto, autenticação ou persistência do histórico após refresh. O ranking inicial usa dados demonstrativos, com pontuações que não representam o balanceamento atual.
- Uma única pendência local, sem fila de resultados. Falhas de acesso ou escrita em `localStorage` não têm tratamento; o formato dos resultados lidos não recebe validação estrutural completa.
- Mobile prioriza landscape. Resize não recalcula o mundo; colisões usam retângulos e não há navegação dos inimigos ao redor de obstáculos.
- A pausa não congela todos os efeitos visuais. Limitações de limpeza assíncrona e de recursos estão detalhadas em [ARCHITECTURE.md](./ARCHITECTURE.md).
- Não há confirmação nesta revisão de áudio em dispositivos reais, acessibilidade completa, aprovação atual dos testes, disponibilidade do deploy ou reprodução das métricas históricas.
- A revisão documental não incluiu uma nova comparação integral com o enunciado oficial do desafio; a conformidade com todos os critérios de aceite não foi reavaliada nesta etapa.
