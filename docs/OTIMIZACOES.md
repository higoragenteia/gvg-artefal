# Otimizações de desempenho — 08/11/2026

Branch de trabalho: `perf/otimizacao-mobile`  
Ponto de restauração: tag `pre-perf-20261108`  
Produção: **v122, publicada em 10/11/2026** (otimizações da v90 preservadas)  
Status: **publicado** — branch integrada à `main`; ponto de restauração preservado.

## 1. Arquitetura encontrada

- GitHub Pages (`docs/`) serve o shell PWA e registra o service worker.
- O shell abre o painel do Apps Script em um iframe.
- O painel abre cada módulo em outro iframe:
  - Pedidos: `?modulo=pedidos`
  - Gastos: `?modulo=gastos`
  - Fornecedores: `?modulo=fornecedores`
  - Máquinas: `?modulo=maquinas`
- Os módulos usam Google Apps Script + Google Sheets.
- Não há framework SPA, bundler ou biblioteca de terceiros no painel.
- O PWA já existia (manifest e service worker), mas o service worker não possuía cache.

## 2. Problemas identificados

| Problema | Evidência |
|---|---|
| HTML do painel muito grande | 366 KB, sendo ~208 KB de imagens em base64 |
| HTML do Pedidos muito grande | 268 KB, sendo ~152 KB de imagens/áudio em base64 |
| Imagens superdimensionadas no celular | Hero 4K de 390 KB, placa PNG de 189 KB e ícones de 600 px (~301 KB) |
| Todos os módulos abertos permaneciam carregados | 4 iframes e ~29,4 MB de heap JS após GC no celular emulado |
| Módulos recarregados sem necessidade | Evento de sessão com o mesmo token recarregava o iframe do Pedidos |
| Resumos externos consultados a cada 30 s | Apesar do cache de 15 min no servidor |
| Relógio e animação do hero rodando escondidos | Atualizações de DOM e timers em segundo plano |
| Catálogo do Pedidos renderizava os 297 produtos de uma vez | 5.016 nós DOM e 39.819 px de altura inicial |
| Service worker sem cache | Shell PWA não abria offline |
| Validação de estrutura das abas em toda chamada | `abasGestao_()` conferia 3 abas e cabeçalhos em cada execução |
| Resumo do painel duplicado por usuário | Cada usuário lia PEDIDOS/CONFIG a cada 30 s |

## 3. Otimizações realizadas

### Imagens e payload

- A imagem visual do login saiu do HTML (137 KB em base64) e virou WebP responsivo:
  - `login-visual-720.webp`
  - `login-visual-1080.webp`
- O hero do Pedidos saiu do CSS (92 KB em base64) e virou `pedidos-hero-826.webp`.
- O hero do painel ganhou variantes `1280`, `1920`, `2560` e `3840` com `srcset`.
- A placa GVG&ARTEFAL ganhou WebP com fallback PNG.
- Os ícones dos módulos ganharam variantes `256` e `384` com `srcset`, mantendo a original de 600 px como candidata para telas de alta densidade.
- Todos os arquivos novos foram copiados para `docs/assets/`, que é a pasta publicada pelo GitHub Pages.

### Navegação e memória

- No celular (largura até 900 px), no máximo **dois módulos** ficam carregados:
  - Pedidos é preservado quando já foi aberto;
  - o outro é o módulo atual;
  - os demais voltam para `about:blank`.
- No desktop, todos os módulos continuam carregados e a troca continua instantânea.
- O painel só recarrega os iframes quando o token de sessão realmente muda.
- O relógio só atualiza quando a aba está visível.
- A animação de digitação do hero só roda quando o layout escuro está visível.
- Atualizações de indicadores e atividades evitam reescrever o DOM quando o conteúdo não mudou.

### Catálogo do Pedidos

- Renderização progressiva com `IntersectionObserver`:
  - 36 produtos no celular;
  - 96 no desktop;
  - novos lotes entram automaticamente ao rolar.
- Busca, categorias, carrinho, quantidades e unidades continuam iguais.
- A lista completa continua acessível; o contador segue mostrando “297 de 297 produtos”.
- Interruptor de segurança: `PROGRESSIVE_CATALOG=false` em `src/index.html` volta ao comportamento antigo.

### Cache e PWA

- `docs/sw.js` agora mantém o cache versionado `gvg-shell-v1`:
  - navegação: rede primeiro, cache como fallback;
  - arquivos estáticos do shell: cache primeiro e atualização em segundo plano;
  - nenhum dado operacional ou conteúdo de `script.google.com` é armazenado.
- Foram adicionados `preconnect` para `script.google.com` e `www.gstatic.com`.
- O manifest e os ícones de instalação não foram alterados.

### Google Apps Script e Sheets

- `abasGestao_()` usa um cache de 5 minutos para a validação da estrutura das abas.
- O resumo de PEDIDOS/CONFIG do painel passou a usar um cache compartilhado de 30 s.
- O cache é invalidado ao registrar pedido e ao confirmar entrega.
- O cache de catálogo de 5 minutos e o cache de resumos externos de 15 minutos foram preservados.
- Nenhuma alteração em autenticação, permissões, estrutura das planilhas ou regras de negócio.

## 4. Resultados medidos

Ambiente: Playwright 1.65, Chromium 158 headless, emulação Pixel 5 e desktop 1440×900.  
Rede real da máquina de teste, sem simulador de 3G/4G.  
Não houve teste em aparelho físico Android/iPhone.

### HTML e transferência

| Item | Antes (v83) | Depois (v88 de teste) | Variação |
|---|---:|---:|---:|
| HTML do painel, sem compressão | 366.093 B | 236.607 B | −35,4% |
| HTML do painel, comprimido | 206.081 B | 99.243 B | −51,8% |
| HTML do Pedidos, sem compressão | 268.230 B | 177.650 B | −33,8% |
| HTML do Pedidos, comprimido | 159.800 B | 88.311 B | −44,7% |
| Imagens do dashboard no celular | 879.675 B | 213.338 B | −75,7% |
| Imagens do dashboard no desktop | 879.675 B | 195.906 B | −77,7% |
| Login completo no celular (HTML + imagens) | 365.997 B | 301.684 B | −17,6% |

### Tempo de abertura

| Medição | Antes (v83) | Depois | Variação |
|---|---:|---:|---:|
| Pedidos: clique no menu até o primeiro produto | 9.838 ms (mediana de 2) | 6.813 ms (mediana de 2) | −30,7% |
| Painel: carregamento total até o dashboard | 6.558 ms (mediana de 2) | 6.080 ms (mediana de 2) | −7,3% |
| Painel: tela de login visível | 3.056 ms | 3.081 ms | sem diferença relevante |
| Painel: login até o dashboard | 3.503 ms | 3.000 ms | −14,4% |

Os tempos absolutos variam com a latência do Apps Script e do Sheets. A medição do Pedidos foi feita na implantação de teste, que servia as imagens novas por um host local; por isso a variação de tempo é indicativa, enquanto os tamanhos de HTML, DOM e memória são medições diretas.

### Catálogo e DOM

| Item | Antes (v83) | Depois | Variação |
|---|---:|---:|---:|
| Produtos renderizados inicialmente no celular | 297 | 36 | −87,9% |
| Nós DOM iniciais do Pedidos no celular | 5.016 | 815 | −83,8% |
| Altura inicial da página do catálogo | 39.819 px | 5.498 px | −86,2% |
| Produtos após rolagem no celular | 297 | 180 (e continua carregando) | carregamento sob demanda |

### Memória no celular

Após abrir os quatro módulos e forçar GC:

| Item | Antes (v83) | Depois | Variação |
|---|---:|---:|---:|
| Iframes de módulos carregados | 4 | 2 | −50% |
| Heap JS do processo | 29,4 MB | 20,5 MB | −30,3% |
| Nós DOM somados | 6.366 | 6.013 | −5,5% |

### Requisições e recarregamentos

- Em 65 s parado na visão geral:
  - antes: 3 chamadas após o login (incluindo `getPainelExternos` repetido);
  - depois: 2 chamadas (`getPainelInicial` a cada 30 s).
- `getPainelExternos` passou de uma chamada a cada 30 s para no máximo uma a cada 5 min no cliente.
- Evento de sessão com o mesmo token:
  - antes: o iframe do Pedidos era recarregado;
  - depois: o iframe permaneceu carregado e o marcador interno sobreviveu.
- O cache de estrutura das abas evita a conferência de 3 abas e cabeçalhos a cada chamada por 5 min.
- O resumo do painel passou a ser compartilhado entre usuários por 30 s, em vez de ser lido separadamente por usuário.

### PWA

- Service worker registrado no escopo correto.
- Cache `gvg-shell-v1` com 8 entradas do shell.
- Recarga offline serviu o shell do painel.
- Nenhum conteúdo do Apps Script ou dado operacional foi colocado no cache.
- A instalação no Android/iPhone não foi testada em aparelho físico; manifest, ícones e registro do service worker foram preservados.

## 5. Funcionalidades validadas

- Login de administrador e de operador.
- Menu e permissões: operador vê somente Pedidos; Gestão permanece oculta.
- Painel, visão geral e troca de módulos.
- Pedidos: catálogo, busca, categorias, carrinho, quantidades e unidades.
- Gestão do Pedidos: atualização automática de 120 s, formulário de produto preservado e conferência de entrega aberta.
- Inclusão e remoção de pedido de teste; contagem da visão geral voltou ao valor original.
- Saída do painel: tokens removidos e iframes em `about:blank`.
- Service worker e recarga offline do shell.
- Nenhum erro de JavaScript nas páginas testadas.

## 6. Limitações e riscos

- Não foi possível testar em aparelho físico Android, iPhone ou Safari. A emulação cobre viewport, densidade e user agent, mas não reproduz o comportamento real de memória, timers e PWA do iOS.
- Os tempos absolutos do Apps Script variam bastante; a melhoria de tempo do Pedidos deve ser tratada como indicativa, não como garantia.
- O heap JS não representa toda a memória do navegador (GPU, imagens decodificadas etc.).
- No celular, o limite de dois iframes pode recarregar um terceiro módulo inativo. A sessão é restaurada, mas dados de formulário não salvos nesse módulo podem ser perdidos. Pedidos fica preservado e os módulos são recarregados sob demanda.
- A renderização progressiva muda apenas a forma de desenhar a lista; todos os produtos continuam acessíveis. Para voltar ao desenho antigo, basta usar `PROGRESSIVE_CATALOG=false`.
- O PWA continua sem dados operacionais offline por decisão de segurança.
- O service worker precisa ter a versão do cache atualizada a cada publicação que altere o shell.

## 7. Reversão

A produção está na v90. Para voltar à v83:

1. Reapontar a implantação oficial do Apps Script para a versão 83.
2. Reverter no Git o commit de publicação e enviar a `main`.
3. Aguardar o GitHub Pages atualizar.

O ponto de restauração local é a tag `pre-perf-20261108` (main anterior, v83). Ela não foi apagada.

Reversões pontuais:

- Catálogo antigo: `PROGRESSIVE_CATALOG=false` em `src/index.html`.
- Iframes sempre carregados: remover a chamada `limitLoadedModules(view)` em `src/Painel.html`.
- Service worker antigo: restaurar `docs/sw.js` da versão anterior.
- Caches do backend: restaurar `src/Code.gs` da versão anterior.

## 8. Publicação realizada

Em 08/11/2026:

1. Os novos assets foram enviados ao GitHub Pages.
2. O Apps Script foi publicado na implantação oficial.
3. A branch `perf/otimizacao-mobile` foi integrada à `main`.
4. A versão 89 foi substituída pela v90 após corrigir o botão Sair no fluxo de atualização de sessão.
5. Os testes de fumaça em produção passaram: login, dashboard, catálogo progressivo, módulos, Gestão com 120 s, service worker e logout.
6. As implantações temporárias de teste foram removidas.
