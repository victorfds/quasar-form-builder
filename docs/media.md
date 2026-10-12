# Mídia Persistente

Na versão `0.2.0`, `QfbFormViewer` aceita um `mediaController` para armazenamento durável, previews e preparação de uploads. Sem controlador, `q-file` mantém `File`/`File[]` da sessão. `q-audio-recorder` também pode devolver um `File` local; sua persistência depende do consumidor. Consulte [a migração](migration-0.2.md) para requisitos e incompatibilidades.

## Identidade e Schema Histórico

```ts
import { adoptQfbSchema, cloneQfbSchemaAsTemplate, extractFormData } from 'nuxt-quasar-form-builder/schema'

const { fields, changed } = adoptQfbSchema([
  { $formkit: 'q-file', name: 'photos', label: 'Fotos', multiple: true, gallery: true, mediaKind: 'image' },
])
// Persist the complete adopted definition once before mounting a viewer.
const anotherForm = cloneQfbSchemaAsTemplate(fields)
const answers = extractFormData(fields, { photos: [] }).answers
```

`fieldId` é UUID permanente, distinto do nome e do ID DOM. O store conserva IDs ao renomear, mover, carregar, desfazer e refazer; duplicação regenera IDs e remapeia condições internas. Usar uma definição como modelo para outro formulário regenera identidades com `cloneQfbSchemaAsTemplate`. Renderizar um visualizador não gera IDs.

O store oferece `getFieldById`, `getFieldLocationById`, `replaceFieldIdentity` e `exportSchema`, além dos métodos por nome. Exportação e gravação rejeitam identidades/nomes duplicados e condições não resolvidas. Renomeações são atômicas, conservam literais e atualizam referências reconhecidas em visibilidade, validação, disabled e readonly.

Respostas continuam usando nomes como chaves JSON. Forneça a definição original, com perguntas, opções e regras, sem substituí-la por uma versão posterior durante a edição. O módulo não transfere valores entre nomes nem inventa correspondências para legado.

O extrator acrescenta `fieldId` e `fieldPath`, mantendo `path` como localização visual compatível. O caminho real segue a coleta FormKit: passos são grupos, painéis de abas e células não acrescentam segmentos. Coletores existentes permanecem coletores. Inputs customizados podem fornecer `{ fieldContexts: [{ fieldId, fieldPath }] }` como terceiro argumento. O contexto de mídia usa `node.address` relativo à raiz.

O visualizador usa `preserve` para conservar valores de campos condicionais e abas desmontadas. Ocultar ou desmontar um campo não exclui respostas nem documentos. A validação continua seguindo os nós ativos do FormKit.

## Valores e Adaptadores

```ts
import type { QfbMediaValue } from 'nuxt-quasar-form-builder/media'

const value: QfbMediaValue = {
  version: 1,
  clientId: '2b660229-6473-4a98-bd18-2d99243ab874',
  name: 'photo.png',
  mimeType: 'image/png',
  size: 1024,
}
```

Campo único usa referência ou `null`; múltiplo usa array. Upload confirmado acrescenta `documentId`. Bytes, handles, URLs, progresso e erros ficam fora do valor. Substituição cria outro `clientId`.

`QfbMediaStorageAdapter` fornece `write`, `read`, `has`, `remove` e `source`, sempre com `{ userKey, formId, responseKey }`. A escrita só resolve depois de armazenar o binário. `responseKey` não muda quando surgir `responseId`. `QfbMediaTransportAdapter` fornece `list`, `upload`, `access` e `remove`; upload recebe Blob/URI, campo, chave de idempotência, AbortSignal e progresso.

`createQfbIndexedDbStorage({ databaseName, namespace, databaseVersion })` usa chave composta por usuário, formulário, resposta local e cliente. Padrões: banco/namespace `qfb-media`, versão `1`, object store `media`. Ao compartilhar um banco existente, coordene sua versão/object store com o aplicativo ou implemente outro adaptador. IndexedDB não protege contra limpeza de armazenamento pelo usuário ou sistema.

`createQfbHttpMediaTransport` recebe `urls`, `headers`, `toRemote` e `toAccess`. Aceita também credentials, listFromResponse, filePartName, metadataPartName, metadata e idempotencyHeader. Padrões multipart: `file` e `metadata`; header: `Idempotency-Key`. Headers são consultados em cada requisição. Upload usa XMLHttpRequest; não define boundary/Content-Type multipart e não faz retry automático. URIs nativas exigem transporte próprio.

O conversor classifica DTOs em `linked` ou `unassigned`. Documentos sem associação confiável permanecem anexos gerais, sem UUID inventado. `QfbMediaAttachments` aceita `items` e `mediaController`, readonly por padrão; `removable` habilita o evento `removeRequested`, sem executar exclusão automaticamente.

Fontes têm `{ url, expiresAt?, release() }`. Release libera a fonte transitória, não o arquivo durável. Componentes carregam sob demanda, renovam fontes expiradas e liberam URLs ao desmontar. O consumidor converte URIs nativas em fontes utilizáveis pelo WebView. URLs não entram no JSON da resposta.

## Controlador e Ordem de Persistência

Crie `useQfbMediaController({ scope, policy, storage, transport, concurrency, readonly, initialValues, initialSnapshot, initialRecovery })` e passe a instância ao viewer. Use uma instância por visualizador e escopo imutável. Padrões: readonly falso e dois uploads simultâneos. Política e readonly aceitam valor, ref ou getter.

Política ausente permite leitura, mas bloqueia seleção/captura/staging. Listas de tipos/extensões vazias não autorizam arquivos; use entradas explícitas ou wildcards deliberados. O readonly do viewer prevalece sobre o controlador. Descendentes e métodos de alteração respeitam o bloqueio.

| Ação | Contrato |
| --- | --- |
| `registerField(field, optionsGetter, valueGetter)` | Registra endereço e restrições para uso sem viewer. O viewer e seus inputs fazem isso automaticamente. |
| `stage(field, fileOrCandidate)` | Valida e escreve antes de devolver a referência. |
| `prepare(values)` | Aguarda staging, verifica fontes e devolve snapshot imutável. |
| `uploadPending(responseId, snapshot)` | Retorna `{ results, errors }`, conservando sucessos parciais. |
| `reconcile(responseId)` | Retorna `{ linked, unassigned, errors }`, sem apagar pendências locais. |
| `applyRemote(values, results)` | Produz cópia com documentos correspondentes, sem repor referências descartadas. |
| `markCommitted(values)` | Registra o JSON confirmado externamente. |
| `applyRemovals(responseId, snapshot)` | Exclui após confirmação do JSON sem essas referências; retorna erros. |
| `restore(snapshot)` | Reconstrói estado antes da associação ao viewer; também disponível em initialSnapshot. |
| `rollback()` | Devolve valores confirmados e conserva arquivos novos para recuperação. |
| `confirmRecovered(clientId)` | Revalida e devolve referência para aplicação explícita. |
| `discardRecovered(clientId)` | Descarta explicitamente um candidato local de recuperação. |
| `getSource(value)` | Resolve fonte local ou remota, liberável. |
| `cancel(clientId)` / `dispose()` | Cancela atividades transitórias, sem excluir arquivos duráveis ou documentos. |

`QfbFormViewer.submit()` aciona submissão e validação FormKit. Os eventos existentes permanecem disponíveis. `mediaChange` informa campo, cliente, estado e recuperação; `mediaError` informa código, mensagem, recuperabilidade e contexto. Estados: staging, local, queued, uploading, uploaded, error e removing.

Fluxo obrigatório:

1. Preparar o snapshot no editor e salvá-lo na fila/recuperação durável do aplicativo.
2. Criar/localizar a resposta externamente e guardar a associação responseKey/responseId.
3. Construir um controlador de sincronização separado, com initialSnapshot, mesmo escopo/adaptadores e autorização própria; chamar uploadPending.
4. Produzir o JSON confirmado com applyRemote e salvá-lo externamente.
5. Registrar markCommitted e executar applyRemovals. Conservar erros de remoção na fila com as mesmas chaves.
6. Aplicar resultados ao draft atual somente quando contexto/disponibilidade permitirem e concluir externamente a resposta.

O snapshot contém versão, escopo, identidade, valores, valores confirmados, campos, uploads e remoções. Não contém blobs. Após reinício, restore/initialSnapshot permite enviar sem remontar inputs; os bytes vêm do adaptador. Idempotência distribuída depende do backend. Retry, fila e criação/conclusão da resposta pertencem ao consumidor.

Persista também `controller.recovery.value` ao receber mudanças e restaure via initialRecovery. Bloqueio durante captura/staging autorizado preserva o resultado sem inserir referência no nó. Desbloquear não aplica resultados automaticamente: confirmação revalida política e limites.

Durabilidade não autoriza uso offline. O gmf-app ou outro aplicativo define quando capturar/editar e mantém sua fila. Um consumidor online liga a indisponibilidade ao readonly reativo e bloqueia novas ações ao perder acesso à API. O pacote não cria service worker nem contém credenciais, rotas GMF ou regras de inspeção.

## Arquivos e Gravação

Campos conservam propriedades existentes. `mediaKind` aceita file/image/video/audio; `capture`, user/environment. Política e limites do campo são cumulativos; contagem/tamanho total incluem arquivos remotos. MIME/extensão são verificados no cliente, mas o backend inspeciona o conteúdo real. Seletor e lista são separados: DTOs não são passados ao QFile como File.

Previews incluem imagens raster e áudio/vídeo sem autoplay; formatos incompatíveis oferecem download. SVG/HTML não recebem apresentação inline. Falha de escrita não confirma mídia. `{}` persistido exige nova seleção; não contém bytes recuperáveis.

`q-audio-recorder` e `QfbAudioRecorder` aceitam fieldId/name, label/description, validation, maxDurationSeconds, preferredMimeTypes, maxFileSize, multiple e maxFiles. O wrapper aceita mediaController, readonly e disabled. Padrões: 300 segundos e um áudio; preferências WebM/Opus, Ogg/Opus e MP4, intersectadas com a política.

Microfone é solicitado após clicar. MIME efetivo e extensão seguem o container, sem transcodificação. Pausas não contam na duração. O gravador aguarda dados finais, permite ouvir/confirmar e conserva o áudio anterior até a escrita terminar. Chunk final pode ultrapassar o limite de bytes: staging rejeita o resultado sem truncar o container.

Background encerra captura para recuperação. Navegação comum oferece preservar/descartar. Há somente uma captura por aplicação; tracks, timers, listeners e fontes são liberados. Encerramento abrupto antes da confirmação não garante recuperação. Não há dependência obrigatória Capacitor. `q-signature` conserva seu contrato atual.

## Exemplos e Verificação

No checkout, execute `pnpm dev` e abra `/media?response=<identidade>`. O backend do playground é uma fixture em memória, não persistência de produção.

| Modo/página | Cenário |
| --- | --- |
| mode=legacy | QFile da sessão sem integração. |
| mode=offline | Staging, captura, rascunho, recarga, envio e edição existente. |
| mode=online | Desconexão, bloqueio e recuperação explícita. |
| mode=native | URI recebida por transporte customizado; ponte simulada com IndexedDB. |
| mode=simultaneous | Dois visualizadores isolados. |
| mode=readonly | Leitura remota e SSR sem APIs de captura. |
| mode=historical | Definição respondida ao lado de uma definição posterior. |
| /schema-identity | Identidade, renomeação, cópia e histórico do construtor. |

Execute `pnpm check`. O pacote instalado é verificado em Nuxt 4.5.1/4.6.1, SSR/SPA e Chromium/Firefox/WebKit, incluindo tipos e subpaths. A gravação usa MediaRecorder real onde disponível; a engine WebKit Linux sem captura verifica o erro e a seleção alternativa. Safari e Android real ainda exigem aceite no consumidor. A API GMF precisa persistir schemas, documentos e vínculos: instalar somente o módulo não implementa seu backend.
