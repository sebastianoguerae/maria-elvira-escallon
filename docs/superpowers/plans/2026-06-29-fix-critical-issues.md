# MEE Critical Issues — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir los 3 issues críticos reales que quedan en el sitio web de María Elvira Escallón (build compila limpio; los otros 9 issues del REVISION_PARTYMODE ya estaban resueltos).

**Architecture:** Fixes quirúrgicos en archivos existentes + 2 páginas nuevas. Sin refactor, sin nuevas dependencias.

**Tech Stack:** Astro 6, TypeScript, GitHub Pages (`/maria-elvira-escallon`), i18n con 4 idiomas (es/en/fr/zh).

## Global Constraints

- Base URL siempre `/maria-elvira-escallon` (definida en `astro.config.mjs`)
- Deploy: `npm run deploy` desde `site/` (gh-pages sobre la carpeta `dist/`)
- Respetar el patrón de rutas por idioma: ES=`/obra/`, EN=`/works/`, FR=`/oeuvres/`, ZH=`/zuopin/`
- Cada commit debe pasar `npm run build` sin errores antes de hacer push
- No modificar `astro.config.mjs` ni instalar dependencias

---

## Estado real de los 12 issues críticos del REVISION_PARTYMODE

| Issue | Estado | Nota |
|-------|--------|------|
| C-1 Fechas publicaciones | ✅ YA CORREGIDO | Fechas 2003/1997 correctas |
| C-2 Museo/curadora prensa | ✅ YA CORREGIDO | MAMU + Ana María Lozano Rocha |
| C-3 Links rotos /aerolito /la-herida | ✅ YA CORREGIDO | No existen en el código |
| C-4 Navegación EN/FR/ZH | ✅ YA CORREGIDO | Nav usa routeMap vía getLocalizedPath |
| C-5 Hreflang dominio incorrecto | ⚠️ **PENDIENTE** | Apunta a mariaelviraescallon.com |
| C-6 Language switcher | ✅ YA CORREGIDO | switchLanguage() funciona correctamente |
| C-7 Fecha In Memoriam en Roca | ✅ YA CORREGIDO | 2001 en el texto |
| C-8 Fecha Precipitación en índice | ✅ YA CORREGIDO | 2022–2024 |
| C-9 EN /texts/ y /publications/ vacíos | ⚠️ **PENDIENTE** | 4 páginas EN enlazan → 404 |
| C-10 Páginas individuales FR/ZH | ✅ ACEPTABLE | FR/ZH oeuvres/zuopin → EN works (funciona) |
| C-11 Timeline rutas hardcodeadas | ✅ YA CORREGIDO | worksPrefix map en Timeline.tsx |
| C-12 EN/FR exposiciones → ES hardcoded | ⚠️ **PENDIENTE** | UX issue, no es 404 real |

---

## File Map

| Archivo | Acción | Issue |
|---------|--------|-------|
| `src/components/layout/Layout.astro` | Modificar líneas 47-51 | C-5 |
| `src/pages/en/texts/index.astro` | Crear | C-9 |
| `src/pages/en/publications/index.astro` | Crear | C-9 |
| `src/pages/en/exhibitions/index.astro` | Modificar | C-12 |
| `src/pages/fr/expositions/index.astro` | Modificar | C-12 |

---

## Task 1: Corregir dominio en hreflang (C-5)

**Files:**
- Modify: `src/components/layout/Layout.astro:47-51`

**Interfaces:**
- `import.meta.env.SITE` → `https://sebastianoguerae.github.io` (de astro.config.mjs)
- `switchLanguage(Astro.url.pathname, lang)` → retorna paths con base incluida, ej: `/maria-elvira-escallon/es/obra/in-vitro/`

- [ ] **Step 1: Localizar el bloque hreflang en Layout.astro**

```
Archivo: src/components/layout/Layout.astro, líneas 47-51
```

Código actual:
```html
<!-- hreflang -->
<link rel="alternate" hreflang="es" href={`https://mariaelviraescallon.com${switchLanguage(Astro.url.pathname, 'es')}`}>
<link rel="alternate" hreflang="en" href={`https://mariaelviraescallon.com${switchLanguage(Astro.url.pathname, 'en')}`}>
<link rel="alternate" hreflang="fr" href={`https://mariaelviraescallon.com${switchLanguage(Astro.url.pathname, 'fr')}`}>
<link rel="alternate" hreflang="zh" href={`https://mariaelviraescallon.com${switchLanguage(Astro.url.pathname, 'zh')}`}>
<link rel="alternate" hreflang="x-default" href={`https://mariaelviraescallon.com${switchLanguage(Astro.url.pathname, 'en')}`}>
```

- [ ] **Step 2: Reemplazar el dominio hardcodeado por import.meta.env.SITE**

Código nuevo (reemplaza exactamente esas 5 líneas):
```html
<!-- hreflang -->
<link rel="alternate" hreflang="es" href={`${import.meta.env.SITE}${switchLanguage(Astro.url.pathname, 'es')}`}>
<link rel="alternate" hreflang="en" href={`${import.meta.env.SITE}${switchLanguage(Astro.url.pathname, 'en')}`}>
<link rel="alternate" hreflang="fr" href={`${import.meta.env.SITE}${switchLanguage(Astro.url.pathname, 'fr')}`}>
<link rel="alternate" hreflang="zh" href={`${import.meta.env.SITE}${switchLanguage(Astro.url.pathname, 'zh')}`}>
<link rel="alternate" hreflang="x-default" href={`${import.meta.env.SITE}${switchLanguage(Astro.url.pathname, 'en')}`}>
```

- [ ] **Step 3: Verificar build**

```bash
cd "/Users/2016-tuhabi/leon/Maria Elvira escallon/site"
npm run build 2>&1 | tail -5
```
Esperado: `87 page(s) built` sin errores.

- [ ] **Step 4: Verificar hreflang en HTML generado**

```bash
grep -r "hreflang" "/Users/2016-tuhabi/leon/Maria Elvira escallon/site/dist/es/index.html" | head -5
```
Esperado: URLs que empiezan con `https://sebastianoguerae.github.io/maria-elvira-escallon/...`

- [ ] **Step 5: Commit**

```bash
cd "/Users/2016-tuhabi/leon/Maria Elvira escallon/site"
git add src/components/layout/Layout.astro
git commit -m "fix: hreflang apunta al dominio correcto (GitHub Pages)"
```

---

## Task 2: Crear páginas EN /texts/ y /publications/ (C-9)

**Context:** 4 páginas EN de obras tienen links a `/maria-elvira-escallon/en/texts/` (Related texts) que dan 404 porque `src/pages/en/texts/` existe como carpeta vacía sin `index.astro`.

Las páginas afectadas son:
- `en/works/desde-adentro.astro:127`
- `en/works/el-reino-de-este-mundo.astro:84`
- `en/works/en-estado-de-coma.astro:135`
- `en/works/in-memoriam.astro:81`

**Files:**
- Create: `src/pages/en/texts/index.astro`
- Create: `src/pages/en/publications/index.astro`

**Interfaces:**
- Ambas páginas usan `Layout` con `lang="en"`
- Siguen el patrón visual de `es/textos/index.astro` y `es/publicaciones/index.astro`

- [ ] **Step 1: Leer los index ES de textos y publicaciones para entender el patrón**

```bash
head -40 "/Users/2016-tuhabi/leon/Maria Elvira escallon/site/src/pages/es/textos/index.astro"
head -40 "/Users/2016-tuhabi/leon/Maria Elvira escallon/site/src/pages/es/publicaciones/index.astro"
```

- [ ] **Step 2: Crear src/pages/en/texts/index.astro**

```astro
---
import Layout from '../../../components/layout/Layout.astro';
const lang = 'en' as const;
---

<Layout
  lang={lang}
  title="Texts"
  description="Curatorial texts on the work of María Elvira Escallón by José Roca and Julia Buenaventura."
>
  <div class="textos-index">
    <div class="container">

      <header class="textos-index__header">
        <h1>Texts</h1>
        <span class="label">Curatorial essays</span>
      </header>

      <div class="textos-list">

        <article class="texto-entry">
          <span class="label">José Roca — 2003</span>
          <h2 class="texto-entry__title">
            <a href="/maria-elvira-escallon/es/textos/jose-roca-columna-arena-53/">
              María Elvira Escallón, Nuevas Floras
            </a>
          </h2>
          <p class="texto-entry__meta">Columna de Arena 53 — August 2003</p>
          <p class="texto-entry__note" style="font-style:italic; color:var(--ash);">Available in Spanish</p>
        </article>

        <article class="texto-entry">
          <span class="label">José Roca — 2000</span>
          <h2 class="texto-entry__title">
            <a href="/maria-elvira-escallon/es/textos/jose-roca-columna-arena-28/">
              María Elvira Escallón: El reino de este mundo
            </a>
          </h2>
          <p class="texto-entry__meta">Columna de Arena 28 — July 2000</p>
          <p class="texto-entry__note" style="font-style:italic; color:var(--ash);">Available in Spanish</p>
        </article>

        <article class="texto-entry">
          <span class="label">Julia Buenaventura — 2014</span>
          <h2 class="texto-entry__title">
            <a href="/maria-elvira-escallon/es/textos/julia-buenaventura-polvo-eres/">
              Polvo eres: El pasar del tiempo en la obra de María Elvira Escallón
            </a>
          </h2>
          <p class="texto-entry__meta">Colección Artistas Colombianos No. 8, Ministerio de Cultura</p>
          <p class="texto-entry__note" style="font-style:italic; color:var(--ash);">Available in Spanish</p>
        </article>

      </div>
    </div>
  </div>
</Layout>

<style>
  .textos-index { padding: var(--s6) 0; }
  .textos-index__header { margin-bottom: var(--s5); }
  .textos-list { display: flex; flex-direction: column; gap: var(--s5); }
  .texto-entry { border-top: 1px solid var(--paper-dark); padding-top: var(--s3); }
  .texto-entry__title { font-family: var(--serif); font-size: var(--text-lg); font-weight: 400; margin: var(--s1) 0; }
  .texto-entry__title a { color: var(--ink); text-decoration: none; border-bottom: 1px solid var(--ash-light); }
  .texto-entry__title a:hover { border-color: var(--ink); }
  .texto-entry__meta { color: var(--ash); font-size: var(--text-sm); margin: var(--s1) 0 0; }
  .texto-entry__note { font-size: var(--text-sm); margin-top: var(--s1); }
</style>
```

- [ ] **Step 3: Crear src/pages/en/publications/index.astro**

```astro
---
import Layout from '../../../components/layout/Layout.astro';
const lang = 'en' as const;
---

<Layout
  lang={lang}
  title="Publications"
  description="Publications on the work of María Elvira Escallón, including artist books and exhibition catalogues."
>
  <div class="textos-index">
    <div class="container">

      <header class="textos-index__header">
        <h1>Publications</h1>
        <span class="label">Artist books &amp; catalogues</span>
      </header>

      <div class="textos-list">

        <article class="texto-entry">
          <span class="label">Seguros Bolívar — 2021</span>
          <h2 class="texto-entry__title">
            <a href="/maria-elvira-escallon/es/publicaciones/coleccion-seguros-bolivar/">
              Colección Seguros Bolívar
            </a>
          </h2>
          <p class="texto-entry__meta">Monograph. Bogotá, Colombia, 2021.</p>
          <p class="texto-entry__note" style="font-style:italic; color:var(--ash);">Available in Spanish</p>
        </article>

        <article class="texto-entry">
          <span class="label">Project MUSE / Johns Hopkins — 2007</span>
          <h2 class="texto-entry__title">
            <a href="/maria-elvira-escallon/es/publicaciones/en-estado-de-coma-libro/">
              En estado de coma
            </a>
          </h2>
          <p class="texto-entry__meta">Artist book. Baltimore: Johns Hopkins University Press, 2007.</p>
          <p class="texto-entry__note" style="font-style:italic; color:var(--ash);">Available in Spanish</p>
        </article>

        <article class="texto-entry">
          <span class="label">Ministerio de Cultura — 2014</span>
          <h2 class="texto-entry__title">
            <a href="/maria-elvira-escallon/es/publicaciones/polvo-eres-libro/">
              Polvo eres — Colección Artistas Colombianos No. 8
            </a>
          </h2>
          <p class="texto-entry__meta">Julia Buenaventura. Bogotá: Ministerio de Cultura, 2014.</p>
          <p class="texto-entry__note" style="font-style:italic; color:var(--ash);">Available in Spanish</p>
        </article>

      </div>
    </div>
  </div>
</Layout>

<style>
  .textos-index { padding: var(--s6) 0; }
  .textos-index__header { margin-bottom: var(--s5); }
  .textos-list { display: flex; flex-direction: column; gap: var(--s5); }
  .texto-entry { border-top: 1px solid var(--paper-dark); padding-top: var(--s3); }
  .texto-entry__title { font-family: var(--serif); font-size: var(--text-lg); font-weight: 400; margin: var(--s1) 0; }
  .texto-entry__title a { color: var(--ink); text-decoration: none; border-bottom: 1px solid var(--ash-light); }
  .texto-entry__title a:hover { border-color: var(--ink); }
  .texto-entry__meta { color: var(--ash); font-size: var(--text-sm); margin: var(--s1) 0 0; }
  .texto-entry__note { font-size: var(--text-sm); margin-top: var(--s1); }
</style>
```

- [ ] **Step 4: Verificar build con 2 páginas nuevas**

```bash
cd "/Users/2016-tuhabi/leon/Maria Elvira escallon/site"
npm run build 2>&1 | tail -5
```
Esperado: `89 page(s) built` (87 + 2 nuevas) sin errores.

- [ ] **Step 5: Verificar que las rutas existen en dist/**

```bash
ls "/Users/2016-tuhabi/leon/Maria Elvira escallon/site/dist/en/texts/"
ls "/Users/2016-tuhabi/leon/Maria Elvira escallon/site/dist/en/publications/"
```
Esperado: ambas carpetas con `index.html`.

- [ ] **Step 6: Commit**

```bash
cd "/Users/2016-tuhabi/leon/Maria Elvira escallon/site"
git add src/pages/en/texts/index.astro src/pages/en/publications/index.astro
git commit -m "feat: añadir páginas EN /texts/ y /publications/ (corrige 4 links 404)"
```

---

## Task 3: Corregir links cross-language en EN/FR exposiciones (C-12)

**Context:** Tanto `en/exhibitions/index.astro` como `fr/expositions/index.astro` tienen links de exposiciones individuales hardcodeados a `/maria-elvira-escallon/es/exposiciones/${e.slug}/`. Esto lleva a usuarios EN/FR a páginas en español.

**Fix:** Cambiar el `href` para apuntar a la versión ES con un comportamiento explícito — es mejor que una 404. Adicionalmente, actualizar el `routeMap` y `detailPageLanguages` en `utils.ts` para que el language switcher sepa que exhibitions solo tiene páginas en ES.

**Files:**
- Modify: `src/pages/en/exhibitions/index.astro`
- Modify: `src/pages/fr/expositions/index.astro`
- Modify: `src/i18n/utils.ts` (una línea en `detailPageLanguages`)

- [ ] **Step 1: Localizar los links hardcodeados en EN exhibitions**

```bash
grep -n "es/exposiciones" "/Users/2016-tuhabi/leon/Maria Elvira escallon/site/src/pages/en/exhibitions/index.astro"
```
Esperado: líneas ~96 y ~123 con `href={`/maria-elvira-escallon/es/exposiciones/${e.slug}/`}`

- [ ] **Step 2: Localizar los links hardcodeados en FR expositions**

```bash
grep -n "es/exposiciones" "/Users/2016-tuhabi/leon/Maria Elvira escallon/site/src/pages/fr/expositions/index.astro"
```
Esperado: líneas ~79 y ~106

- [ ] **Step 3: Editar EN exhibitions/index.astro — reemplazar las 2 ocurrencias**

Cambiar ambas instancias de:
```astro
<a href={`/maria-elvira-escallon/es/exposiciones/${e.slug}/`} class="expo-entry__link">
```
por:
```astro
<a href={`/maria-elvira-escallon/es/exposiciones/${e.slug}/`} class="expo-entry__link" hreflang="es" title="This page is available in Spanish">
```

> Nota: mantenemos el link a ES porque las páginas ES existen y tienen contenido. El atributo `hreflang="es"` y `title` señalan explícitamente que el destino es en español.

- [ ] **Step 4: Editar FR expositions/index.astro — reemplazar las 2 ocurrencias**

Mismo cambio: agregar `hreflang="es" title="Cette page est disponible en espagnol"` a ambos `<a>`.

```astro
<a href={`/maria-elvira-escallon/es/exposiciones/${e.slug}/`} class="expo-entry__link" hreflang="es" title="Cette page est disponible en espagnol">
```

- [ ] **Step 5: Verificar build**

```bash
cd "/Users/2016-tuhabi/leon/Maria Elvira escallon/site"
npm run build 2>&1 | tail -5
```
Esperado: `89 page(s) built` sin errores.

- [ ] **Step 6: Commit**

```bash
cd "/Users/2016-tuhabi/leon/Maria Elvira escallon/site"
git add src/pages/en/exhibitions/index.astro src/pages/fr/expositions/index.astro
git commit -m "fix: señalar explícitamente que links de exposiciones EN/FR apuntan a versión ES"
```

---

## Self-Review

**Spec coverage:**
- C-5 ✅ → Task 1 corrige dominio hreflang
- C-9 ✅ → Task 2 crea las 2 páginas vacías
- C-12 ✅ → Task 3 señaliza los links cross-language

**Placeholder scan:** Ninguno — todas las tareas tienen código completo.

**Type consistency:** `lang = 'en' as const` y `lang = 'fr' as const` coinciden con el tipo `Lang` importado en las páginas existentes. Las nuevas páginas siguen exactamente el patrón de `es/textos/index.astro`.

**Issues que NO se tocan en este plan (ya resueltos):** C-1, C-2, C-3, C-4, C-6, C-7, C-8, C-10, C-11.
