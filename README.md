# Nuxt Quasar Form Builder

Módulo Nuxt para criar, configurar e visualizar formulários com Quasar, FormKit e Pinia.

O módulo registra Quasar, Pinia, FormKit, estilos globais, componentes públicos do builder, composables e inputs FormKit baseados em Quasar. O projeto consumidor precisa instalar o módulo, adicioná-lo ao `nuxt.config.ts` e usar a rota pronta ou os componentes exportados.

## Recursos

- Construtor visual de formulários com painéis de elementos, árvore e propriedades.
- Renderização final do formulário por schema FormKit.
- Componentes Quasar registrados como inputs FormKit.
- Estruturas de layout, como abas, passos, grid, tabela, container e lista.
- Persistência de campos no navegador e tema claro/escuro em cookie compatível com SSR.
- Rota pronta opcional para publicar o builder sem criar páginas extras.
- Personalização do layout por propriedades, encaixes (`slots`) e `app.config.ts`.

## Requisitos

- Nuxt `>= 4.0.0`.
- Node e pnpm compatíveis com o projeto consumidor.
- Um projeto Nuxt com suporte a módulos.

O módulo instala e registra as integrações internas necessárias. O projeto consumidor não precisa copiar configurações de Quasar, Pinia ou FormKit.

## Instalação

Instale o pacote:

```bash
pnpm add nuxt-quasar-form-builder
```

Adicione o módulo ao `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-quasar-form-builder'],
})
```

Depois de reiniciar o servidor Nuxt, os componentes públicos ficam disponíveis por auto import.

## Uso Rápido

Use a rota pronta quando o projeto precisa expor o construtor completo com o mínimo de configuração:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-quasar-form-builder'],

  formBuilder: {
    route: '/form-builder',
  },
})
```

Acesse `/form-builder` para abrir o construtor.

## Componentes Públicos

O prefixo padrão dos componentes é `Qfb`.

| Componente | Uso |
| --- | --- |
| `QfbBuilderShell` | Interface completa do construtor, com layout, painéis laterais, tema, histórico e pré-visualização. |
| `QfbFormBuilder` | Área de edição do formulário para uso dentro de uma página própria. |
| `QfbFormViewer` | Renderização do formulário final a partir de um schema FormKit. |
| `QfbElementsDrawer` | Painel esquerdo com catálogo de elementos e árvore do formulário. |
| `QfbPropertiesDrawer` | Painel direito com propriedades do formulário e do item selecionado. |

Você pode alterar o prefixo com a opção `prefix`.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-quasar-form-builder'],

  formBuilder: {
    prefix: 'Acme',
  },
})
```

Com essa configuração, os componentes públicos passam a ser `AcmeBuilderShell`, `AcmeFormBuilder`, `AcmeFormViewer`, `AcmeElementsDrawer` e `AcmePropertiesDrawer`.

## Criar Uma Página Própria

Use `QfbBuilderShell` diretamente para montar a experiência padrão em uma página do projeto:

```vue
<template>
  <QfbBuilderShell />
</template>
```

O shell já protege a área de edição com `ClientOnly`, porque o builder usa APIs do navegador para drag and drop, `localStorage` e histórico local.

Quando você precisa controlar o conteúdo central do shell, use o encaixe (`slot`) padrão:

```vue
<template>
  <QfbBuilderShell>
    <ClientOnly>
      <QfbFormBuilder />
    </ClientOnly>
  </QfbBuilderShell>
</template>
```

O shell também aceita propriedades para ajustar o layout pronto:

```vue
<template>
  <QfbBuilderShell
    title="Editor de Cadastros"
    :show-header="true"
    :show-theme-toggle="false"
    :show-floating-controls="true"
  />
</template>
```

Use os encaixes nomeados para adicionar ações sem recriar todo o layout:

```vue
<script setup lang="ts">
const controls = useQfbBuilderControls()

async function saveForm() {
  await $fetch('/api/forms', {
    method: 'POST',
    body: controls.formStore.formFields,
  })
}
</script>

<template>
  <QfbBuilderShell title="Meu construtor">
    <template #header-before>
      <q-btn flat dense icon="arrow_back" label="Voltar" @click="$router.back()" />
    </template>

    <template #header-after>
      <q-btn color="primary" label="Salvar" @click="saveForm" />
    </template>

    <template #right-drawer-after="{ formFields }">
      <div class="q-pa-md text-caption">
        Campos no formulário: {{ formFields.length }}
      </div>
    </template>
  </QfbBuilderShell>
</template>
```

Os encaixes disponíveis no shell são: `header`, `header-before`, `header-title`, `header-after`, `center`, `left-drawer-before`, `left-drawer-after`, `left-drawer-empty`, `right-drawer-before`, `right-drawer-after` e `floating-controls`.

## Criar Um Layout Próprio

Use os componentes públicos separadamente quando o projeto precisar controlar toda a tela. O exemplo abaixo mantém o painel esquerdo, o editor central e o painel direito, mas coloca o cabeçalho e os botões no layout da aplicação.

```vue
<script setup lang="ts">
const controls = useQfbBuilderControls()
const leftDrawer = controls.isElementsDrawerOpened
const rightDrawer = controls.isPropertiesDrawerOpened
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header bordered class="bg-dark text-white">
      <q-toolbar>
        <q-btn flat dense icon="arrow_back" @click="$router.back()" />
        <q-toolbar-title>Layout do projeto</q-toolbar-title>
        <q-btn color="primary" label="Salvar" />
      </q-toolbar>
    </q-header>

    <QfbElementsDrawer v-model="leftDrawer" />
    <QfbPropertiesDrawer v-model="rightDrawer" />

    <q-page-container>
      <q-page>
        <ClientOnly>
          <QfbFormBuilder />
        </ClientOnly>
      </q-page>
    </q-page-container>
  </q-layout>
</template>
```

O composable `useQfbBuilderControls()` expõe os controles usados pelo layout pronto: tema, modo de edição ou pré-visualização, abertura dos painéis, campos do formulário, desfazer, refazer e limpar formulário.

## Exibir Um Formulário

Use `QfbFormViewer` para exibir o formulário final com mapeamento de valores e função de submissão.

```vue
<script setup lang="ts">
const values = ref({})

const formFields = [
  {
    $formkit: 'q-input',
    name: 'name',
    label: 'Nome',
    inputType: 'text',
    validation: 'required',
  },
]

function submitForm(data: unknown) {
  console.log(data)
}

function saveDraft(payload: { values: Record<string, unknown> }) {
  localStorage.setItem('formulario-rascunho', JSON.stringify(payload.values))
}
</script>

<template>
  <QfbFormViewer
    v-model="values"
    :form-fields="formFields"
    @update-model-values="saveDraft"
    @submit="submitForm"
  />
</template>
```

`QfbFormViewer` não grava dados automaticamente. Use os eventos do componente para salvar os valores no local mais adequado ao projeto, como armazenamento local do navegador, IndexedDB, Pinia ou uma API própria.

Eventos disponíveis:

| Evento | Quando acontece | Dados enviados |
| --- | --- | --- |
| `@update-model-values` | Sempre que os valores do formulário mudam. | Valores atuais, valores anteriores, campos alterados e horário da atualização. |
| `@field-change` | Para cada campo de primeiro nível alterado em uma atualização. | Nome do campo, valor atual, valor anterior, valores completos e horário da atualização. |
| `@viewer-ready` | Uma vez, depois que o visualizador é montado. | Valores iniciais, quantidade de itens renderizados e horário da montagem. |
| `@submit-invalid` | Quando o usuário tenta enviar um formulário inválido. | Valores atuais, nó FormKit do formulário e horário da tentativa. |
| `@submit` | Quando o formulário é enviado com sucesso. | Valores finais do formulário. |

Use a prop `readonly` para exibir os campos sem permitir edição ou submissão.

```vue
<template>
  <QfbFormViewer
    v-model="values"
    :form-fields="formFields"
    readonly
  />
</template>
```

## Opções Do Módulo

Configure o módulo pela chave `formBuilder`.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-quasar-form-builder'],

  formBuilder: {
    route: '/form-builder',
    prefix: 'Qfb',
    includeCss: true,
    autoImport: true,
    storage: {
      formFieldsKey: 'form-fields',
      themeCookieName: 'theme',
    },
  },
})
```

| Opção | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `route` | `false \| string` | `false` | Registra uma página pronta do construtor quando recebe uma rota. |
| `prefix` | `string` | `Qfb` | Define o prefixo dos componentes públicos exportados pelo módulo. |
| `includeCss` | `boolean` | `true` | Inclui os estilos globais do builder, ajustes do Quasar e estilos dos campos. |
| `autoImport` | `boolean` | `true` | Registra os apelidos públicos dos componentes. Mantenha ligado quando usar `QfbBuilderShell`, `QfbFormBuilder`, `QfbFormViewer`, `QfbElementsDrawer` ou `QfbPropertiesDrawer` direto nas páginas. |
| `storage.formFieldsKey` | `string` | `form-fields` | Define a chave usada para persistir os campos do formulário no `localStorage`. |
| `storage.themeCookieName` | `string` | `theme` | Define o nome do cookie usado pelo tema claro/escuro. |

## Aparência Padrão

Configure a aparência padrão em `app.config.ts`. Essa configuração é reativa durante o desenvolvimento e pode ser sobrescrita por propriedades no `QfbBuilderShell`.

```ts
export default defineAppConfig({
  formBuilder: {
    title: 'Construtor interno',
    layout: {
      showHeader: true,
      showThemeToggle: true,
      showFloatingControls: true,
      showLeftDrawer: true,
      showRightDrawer: true,
    },
    labels: {
      clearForm: 'Limpar tudo',
      undo: 'Desfazer',
      redo: 'Refazer',
    },
    ui: {
      header: 'minha-classe-de-cabecalho',
      page: 'minha-classe-de-pagina',
    },
  },
})
```

O módulo usa a cor primária do Quasar (`primary`) sempre que possível. Se o projeto consumidor define sua própria paleta primária, os botões, abas ativas e destaques do construtor acompanham essa configuração.

## SSR E Persistência

O módulo funciona em SSR. O shell do builder mantém a estrutura renderizável no servidor e isola a área de edição que depende de APIs do navegador com `ClientOnly`.

O tema claro/escuro usa `useCookie`, então o Nuxt consegue ler o valor durante a renderização no servidor. Os campos do builder usam `localStorage` apenas no cliente e respeitam a chave configurada em `storage.formFieldsKey`.

Ao criar uma tela própria, proteja qualquer trecho que usa o editor visual:

```vue
<template>
  <ClientOnly>
    <QfbFormBuilder />
  </ClientOnly>
</template>
```

`QfbFormViewer` pode exibir em SSR quando recebe um schema estável por props.

## FormKit

O módulo registra a configuração FormKit automaticamente. Não crie um `formkit.config.ts` no projeto consumidor para usar os campos fornecidos pelo builder.

Os tipos FormKit registrados incluem:

- `q-input`, `q-select`, `q-checkbox`, `q-toggle`, `q-option-group`.
- `q-btn`, `q-btn-toggle`, `q-editor`, `q-file`, `q-signature`.
- `q-date`, `q-date-multiple`, `q-date-range`, `q-datetime`, `q-time`.
- `q-slider`, `q-range`, `q-separator`, `q-matrix`.
- `q-container`, `q-grid`, `q-table-structure`, `q-list-structure`.
- `q-tabs`, `q-stepper`.

## Layout E Estilos

Por padrão, `includeCss` adiciona os estilos globais do módulo ao Nuxt. Mantenha essa opção ligada na maioria dos projetos, porque os componentes do builder dependem desses estilos para grid responsivo, overlays, estruturas e estados de edição.

Desative `includeCss` somente quando o projeto consumidor fornecer uma camada própria de estilos compatível:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-quasar-form-builder'],

  formBuilder: {
    includeCss: false,
  },
})
```

## Desenvolvimento Do Módulo

Instale as dependências:

```bash
pnpm install
```

Prepare os tipos e o stub do módulo:

```bash
pnpm dev:prepare
```

Rode o playground em `http://localhost:3000`:

```bash
pnpm dev
```

O playground em `.playground` consome `src/module.ts` diretamente. Esse fluxo simula o uso real por outro projeto Nuxt.

## Validação Para Produção

Execute os comandos abaixo antes de publicar:

```bash
pnpm lint
pnpm build
pnpm build:module
pnpm test:e2e
```

Para testar o pacote em outro projeto antes do publish, gere um tarball local:

```bash
pnpm pack
```

Depois instale o arquivo gerado no projeto consumidor:

```bash
pnpm add ./nuxt-quasar-form-builder-0.0.1.tgz
```

## Publicação

O pacote exporta `dist/module.mjs` e os tipos gerados em `dist/types.d.mts`. Rode `pnpm build:module` antes de publicar para garantir que `dist` esteja atualizado.

```bash
npm publish --access public
```

Use tags semânticas e Conventional Commits para orientar versionamento e changelog.

## Migração Do Uso Como Layer

Antes, o projeto podia ser consumido como layer:

```ts
export default defineNuxtConfig({
  extends: ['nuxt-quasar-form-builder'],
})
```

Agora, use o pacote como módulo:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-quasar-form-builder'],

  formBuilder: {
    route: '/form-builder',
  },
})
```

Remova configurações duplicadas de Quasar, Pinia e FormKit no projeto consumidor, exceto quando o projeto tiver uma necessidade explícita de sobrescrever comportamento global.

## Solução De Problemas

### Os componentes não aparecem

Reinicie o servidor Nuxt depois de instalar o módulo. Se estiver desenvolvendo o módulo localmente, rode `pnpm dev:prepare`.

### O builder não abre corretamente em SSR

Use `QfbBuilderShell` ou envolva `QfbFormBuilder` com `ClientOnly`. O editor visual depende de APIs disponíveis apenas no navegador.

### Os campos não persistem

Verifique se o navegador permite `localStorage` e confirme a chave configurada em `formBuilder.storage.formFieldsKey`.

### O tema não mantém a escolha do usuário

Verifique se cookies estão habilitados e confirme a chave configurada em `formBuilder.storage.themeCookieName`.
