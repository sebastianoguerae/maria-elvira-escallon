# Revisión Party Mode — Sitio Web María Elvira Escallón
## Auditoría completa: 65 páginas en 4 idiomas

---

## RESUMEN EJECUTIVO

| Severidad | Cantidad | Temas clave |
|-----------|----------|-------------|
| **CRÍTICO** | 12 | Fechas incorrectas, links rotos, navegación rota en EN/FR/ZH |
| **ALTO** | 16 | 50+ imágenes placeholder, acentos faltantes, menú móvil roto, componentes solo en español |
| **MEDIO** | 24 | CSS duplicado 25+ veces, inconsistencias de nombres, inline styles excesivos |
| **BAJO** | 18 | Imports no usados, schema faltante, formato de fechas, z-index |
| **TOTAL** | **70 issues** | |

---

## CRÍTICOS — Corregir inmediatamente

### C-1. FECHAS INCORRECTAS en publicaciones
- **Archivos:** `publicaciones/coleccion-seguros-bolivar.astro`, `publicaciones/polvo-eres-libro.astro`
- "Desde adentro (2009)" → debe ser **2003**
- "In Vitro (2012)" → debe ser **1997**
- **Solución:** Corregir las fechas en ambos archivos.

### C-2. MUSEO INCORRECTO en prensa
- **Archivo:** `prensa.astro`
- Dice "Museo de Arte Moderno de Medellín (MAMU)" → debe ser **Museo de Arte Miguel Urrutia (MAMU), Bogotá**
- Curador incorrecto: dice "Emiliano Valdés" → debe ser **Ana María Lozano Rocha**
- **Solución:** Corregir nombre de museo y curadora.

### C-3. LINKS ROTOS internos
- `/es/obra/pequeno-museo-del-aerolito/` → no existe, debe ser `/es/obra/aerolito/`
- `/es/obra/la-herida/` → no existe (obra no tiene página)
- **Solución:** Corregir slugs. Decidir si crear página para "La herida" o eliminar referencia.

### C-4. NAVEGACIÓN ROTA en EN/FR/ZH
- **Archivo:** `Nav.astro` — paths hardcodeados en español (`/obra/`, `/biografia/`, `/exposiciones/`)
- Al navegar en inglés genera `/en/obra/` (404) en vez de `/en/works/`
- Afecta TODOS los links de navegación para 3 idiomas
- **Solución:** Crear mapa de rutas por idioma en Nav.astro.

### C-5. HREFLANG ROTO en Layout.astro
- Asume que todos los idiomas usan la misma estructura de URL
- `/en/works/in-vitro/` genera hreflang francés `/fr/works/in-vitro/` (404)
- **Solución:** Implementar mapa de equivalencias de rutas entre idiomas, o usar estructura de URL uniforme.

### C-6. LANGUAGE SWITCHER ROTO
- **Archivo:** `Nav.astro` — mismo problema que C-5
- Cambiar de `/en/works/` a FR lleva a `/fr/works/` (404)
- **Solución:** Misma solución que C-5.

### C-7. FECHA INCORRECTA de "In Memoriam" en texto de Roca
- **Archivo:** `textos/jose-roca-columna-arena-53.astro`
- Dice "In Memoriam (2000)" → debe ser **2001**
- **Solución:** Corregir fecha.

### C-8. FECHA INCONSISTENTE de "Precipitación de arenas"
- **Archivo:** `obra/index.astro` dice "2024" → debe ser **2022–2024**
- **Solución:** Corregir en el índice.

### C-9. LINKS ROTOS EN — /en/texts/ y /en/publications/ no existen
- 4 páginas EN de obras enlazan a rutas que no existen
- **Solución:** Crear páginas EN para textos y publicaciones, o eliminar los links.

### C-10. NO EXISTEN páginas de obras individuales en FR y ZH
- Los índices FR y ZH enlazan a 14 páginas cada uno que no existen
- **Solución:** Crear páginas de obras en FR/ZH (al menos las principales), o marcar los links como "próximamente".

### C-11. TIMELINE hardcodeada a rutas españolas
- `window.location.href = /es/obra/${slug}/` — siempre navega a ES
- **Solución:** Pasar prop `lang` al componente Timeline.

### C-12. NO EXISTEN páginas de exposiciones detalladas en EN/FR/ZH
- Los índices de exposiciones en todos los idiomas enlazan a páginas inexistentes
- **Solución:** Crear al menos las exposiciones clave en EN, o remover los links.

---

## ALTOS — Resolver antes de publicar

### H-1. ACENTOS FALTANTES en prensa.astro (5+ archivos)
- Todo el texto de prensa, contacto, textos curatoriales carece de acentos españoles
- "Escallon", "escultoricos", "fotografia", "Bogota", "Galeria"
- Afecta biografías descargables que periodistas copiarán textualmente
- **Solución:** Agregar todos los acentos en prensa.astro, contacto.astro, y los 6 archivos de textos/.

### H-2. ACENTOS FALTANTES en páginas francesas
- Mismo problema: "formee", "frontiere", "hopitaux", "batiments"
- **Solución:** Revisar y corregir acentos en los 4 archivos FR.

### H-3. 50+ IMÁGENES PLACEHOLDER
- 11 de 14 obras sin imágenes reales
- Todas las exposiciones sin fotos de montaje
- 2 de 3 portadas de libros sin imagen
- **Solución:** Depende de María Elvira. Mientras tanto, mejorar los placeholders con texto más descriptivo.

### H-4. MENÚ HAMBURGER NO FUNCIONA
- En móvil los links de nav se ocultan, el botón hamburger no tiene JS
- **Solución:** Agregar funcionalidad de menú móvil al Nav o en script global.

### H-5. COMPONENTES INTERACTIVOS SOLO EN ESPAÑOL
- Timeline: "OBRA", "PREMIO", "EXPOSICIÓN", "Click para ver obra"
- WorldMap: "INDIVIDUAL", "COLECTIVA", "COLECCIÓN"
- BeforeAfterComparator: "Desliza para comparar"
- AudioPlayer: "AUDIO PRÓXIMAMENTE"
- **Solución:** Pasar prop `lang` a cada componente y usar diccionario de traducciones.

### H-6. FUENTES CHINAS NO SE CARGAN
- tokens.css define Noto Serif SC/Noto Sans SC pero:
  - tokens.css nunca se importa (global.css duplica las variables sin el override zh)
  - Google Fonts no carga Noto Serif SC
- **Solución:** Importar tokens.css o mover el override ZH a global.css, y agregar Noto fonts al link de Google Fonts.

### H-7. LINKS DE PRENSA TODOS SON "#"
- prensa.astro: 8 artículos con url='#'
- Páginas de exposiciones: links de prensa todos "#"
- **Solución:** Agregar URLs reales de los artículos (Artishock, El Espectador, El Tiempo, etc. — ya investigados).

### H-8. FORMULARIO DE CONTACTO NO FUNCIONA
- `action="#"` — el form no envía a ningún lado
- **Solución:** Configurar Netlify Forms (agregar `netlify` attribute) o un endpoint.

### H-9. PLACEHOLDER IMAGES sin accesibilidad
- Divs sin `role="img"` ni `aria-label`
- Screen readers leen el texto literal con corchetes
- **Solución:** Agregar `role="img"` y `aria-label` a todos los placeholder divs.

### H-10. TÍTULOS DE OBRAS inconsistentes entre EN y FR/ZH
- EN traduce títulos (FROM WITHIN, NEW FLORAS)
- FR y ZH mantienen títulos en español sin anotación
- **Solución:** Decisión editorial — o todos traducen o todos mantienen español. Recomendación: mantener español con traducción entre paréntesis.

---

## MEDIOS — Mejorar calidad

### M-1. CSS DUPLICADO 25+ veces
- Estilos `.work-page` copiados en 14 archivos de obras
- Estilos `.exhibition-page` copiados en 8 archivos de exposiciones
- **Solución:** Extraer a componentes Astro compartidos (WorkPageLayout, ExhibitionPageLayout).

### M-2. INLINE STYLES excesivos
- `style="margin-top: var(--s2);"` aparece docenas de veces
- **Solución:** Crear clases utilitarias CSS (.mt-2, .mb-3, etc.) — algunas ya existen en global.css.

### M-3. INCONSISTENCIA: "Encuentros" vs "Encuentro" con seres notables
- Obra usa plural, exposición usa singular
- **Solución:** Verificar con la artista cuál es el nombre oficial.

### M-4. COPYRIGHT 2024 hardcodeado
- El año actual es 2026
- **Solución:** Generar dinámicamente con `new Date().getFullYear()`.

### M-5. HEADING HIERARCHY — h2 como primer heading en índices
- obra/index, exposiciones/index, textos/index usan `<h2>` sin `<h1>` previo
- **Solución:** Cambiar a `<h1>` o agregar h1 al page header.

### M-6. FONT CARGADA DOS VECES
- Google Fonts cargado en Layout.astro `<link>` Y en global.css `@import`
- **Solución:** Eliminar el `@import` de global.css (el `<link>` es más eficiente).

### M-7. "Escenas de Caza", "La herida", "Urgencias" sin páginas de obra
- Referenciadas en biografía/exposiciones pero no tienen página propia
- **Solución:** Crear páginas mínimas o notas indicando que son obras sin documentación completa.

### M-8. FORMATO DE FECHAS inconsistente
- Mezcla: "Julio 23, 2000" (americano), "2003" (solo año), etc.
- **Solución:** Estandarizar a formato español: "23 de julio de 2000".

### M-9. TYPO: "reproduccciones" en polvo-eres-libro.astro
- Triple 'c' — debe ser "reproducciones"
- **Solución:** Corregir typo.

### M-10. QuoteBlock: `<cite>` dentro de `<blockquote>` es semánticamente incorrecto
- **Solución:** Mover `<cite>` fuera del `<blockquote>` en el componente.

### M-11. TOKENS.CSS nunca importado
- Existe pero no es usado por nada
- **Solución:** Importar en Layout.astro o consolidar con global.css.

### M-12. BIOGRAFÍA contradice PRENSA sobre docencia
- Biografía: "2007–presente" (activa)
- Prensa: "fue docente" (pasado)
- **Solución:** Verificar con la artista y unificar.

---

## BAJOS — Polish

| # | Issue | Solución |
|---|-------|----------|
| L-1 | QuoteBlock importado pero no usado en 8 páginas | Eliminar imports no usados |
| L-2 | AudioPlayer sin archivos de audio reales | Esperado — placeholder funcional |
| L-3 | Schema.org solo en 5 de 65 páginas | Agregar ArtworkSchema a las 14 obras, ExhibitionSchema a las 8 exposiciones |
| L-4 | "Próximamente" sin acento en textos/index | Corregir |
| L-5 | DustParticles z-index: 9999 sobre el nav | Reducir a 1 |
| L-6 | `image` property no usada en EN home | Eliminar dead code |
| L-7 | Alt text no localizado en FR/ZH | Traducir alt text |
| L-8 | aria-label="Menú" hardcodeado español en Nav | Localizar |

---

## PLAN DE MEJORA PRIORIZADO

### FASE 1: CRÍTICOS (1–2 días)

| # | Tarea | Archivos | Esfuerzo |
|---|-------|----------|----------|
| 1 | Corregir fechas incorrectas (2009→2003, 2012→1997, 2000→2001) | 3 archivos | 15 min |
| 2 | Corregir museo y curadora en prensa | 1 archivo | 10 min |
| 3 | Corregir links rotos (aerolito, la-herida) | 2 archivos | 10 min |
| 4 | **Refactorizar Nav.astro con mapa de rutas por idioma** | Nav.astro + utils.ts | 1 hora |
| 5 | **Arreglar hreflang en Layout.astro** | Layout.astro | 1 hora |
| 6 | **Arreglar language switcher** | Nav.astro | (incluido en #4) |
| 7 | Corregir fecha Precipitación en índice | 1 archivo | 5 min |
| 8 | Remover links rotos a /en/texts/ y /en/publications/ | 4 archivos EN | 20 min |
| 9 | Remover links a obras inexistentes en FR/ZH o marcar "próximamente" | 2 archivos | 30 min |
| 10 | Pasar `lang` a Timeline para rutas correctas | Timeline.tsx + page | 30 min |

### FASE 2: ALTOS (2–3 días)

| # | Tarea | Archivos | Esfuerzo |
|---|-------|----------|----------|
| 11 | **Agregar acentos españoles a prensa, contacto, textos (6 archivos)** | 6 archivos | 2 horas |
| 12 | Agregar acentos franceses | 4 archivos | 1 hora |
| 13 | **Implementar menú hamburger mobile** | Nav.astro + JS | 1 hora |
| 14 | **Internacionalizar componentes interactivos** (Timeline, Map, Comparator, AudioPlayer) | 4 componentes | 3 horas |
| 15 | Cargar fuentes chinas (Noto Serif SC) | Layout.astro + global.css | 30 min |
| 16 | Agregar URLs reales a links de prensa | 3 archivos | 1 hora |
| 17 | Configurar Netlify Forms en contacto | 1 archivo | 15 min |
| 18 | Agregar accesibilidad a placeholders (role="img") | Todos los archivos con placeholders | 1 hora |
| 19 | Estandarizar títulos de obras (ES + traducción entre paréntesis) | Todos FR/ZH | 2 horas |

### FASE 3: MEDIOS (3–5 días)

| # | Tarea | Archivos | Esfuerzo |
|---|-------|----------|----------|
| 20 | **Extraer CSS duplicado a componentes compartidos** | 25+ archivos | 3 horas |
| 21 | Reemplazar inline styles con clases utilitarias | 30+ archivos | 2 horas |
| 22 | Verificar nombre oficial "Encuentros/Encuentro" con artista | 3 archivos | 5 min |
| 23 | Copyright dinámico | ui.ts + Footer.astro | 15 min |
| 24 | Corregir heading hierarchy (h1 en índices) | 3 archivos | 15 min |
| 25 | Eliminar carga duplicada de fonts | global.css | 5 min |
| 26 | Crear páginas mínimas para obras faltantes | 3 nuevos archivos | 1 hora |
| 27 | Estandarizar formato de fechas a español | 10+ archivos | 1 hora |
| 28 | Corregir typo "reproduccciones" | 1 archivo | 1 min |
| 29 | Mover `<cite>` fuera de `<blockquote>` | QuoteBlock.astro | 10 min |
| 30 | Consolidar tokens.css con global.css | 2 archivos | 20 min |

### FASE 4: POLISH (2 días)

| # | Tarea | Archivos | Esfuerzo |
|---|-------|----------|----------|
| 31 | Eliminar imports no usados | 8 archivos | 20 min |
| 32 | Agregar Schema.org a todas las obras y exposiciones | 22 archivos | 2 horas |
| 33 | Reducir z-index de DustParticles | 1 archivo | 1 min |
| 34 | Localizar alt text en FR/ZH | 8 archivos | 30 min |
| 35 | Localizar aria-label en Nav | 1 archivo | 10 min |
| 36 | Eliminar dead code | 3 archivos | 10 min |

---

## ESTIMACIÓN TOTAL

| Fase | Issues | Tiempo estimado |
|------|--------|-----------------|
| Fase 1: Críticos | 10 | 4–5 horas |
| Fase 2: Altos | 9 | 12–15 horas |
| Fase 3: Medios | 11 | 10–12 horas |
| Fase 4: Polish | 6 | 3–4 horas |
| **TOTAL** | **36 tareas** | **~30–35 horas** |

---

## NOTA DEL EQUIPO

**JOSÉ ROCA:** Los errores de fechas son imperdonables en una web de artista. Corregirlos es lo primero. Los textos curatoriales sin acentos son inaceptables para publicación.

**EL DISEÑADOR:** El menú móvil roto es crítico — más del 60% del tráfico de arte es mobile. Sin menú, la mitad de los visitantes no pueden navegar.

**EL ESTRATEGA:** Los hreflang rotos significan que Google no puede conectar las versiones por idioma. Estamos perdiendo SEO multilingüe completo.

**MARIA ELVIRA:** Las fechas correctas de mis obras son sagradas. Cada fecha tiene una historia. 2003 no es 2009.

**EL GALERISTA:** Los links de prensa en "#" son una oportunidad perdida. Cada periodista que visita la web debería poder encontrar las fuentes inmediatamente.
