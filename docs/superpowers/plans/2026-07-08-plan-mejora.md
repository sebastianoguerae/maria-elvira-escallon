# Plan de Mejora — Sitio MEE (auditoría 2026-07-08)

Tres auditorías paralelas: técnica, contenido/i18n, SEO/accesibilidad.
Estado build: limpio, 89 páginas, dist = 142 MB.

## P0 — Bugs que rompen navegación y SEO

1. **Bug `switchLanguage` (causa raíz de ~307 hreflang rotos + selector de idioma 404)**
   `src/i18n/utils.ts:85-97` — la entrada `'/'` del routeMap matchea toda ruta vía
   `startsWith('/')`, así que las demás entradas son inalcanzables. El switcher y los
   hreflang solo cambian el prefijo de idioma manteniendo el slug localizado
   (`/en/obra/aerolito/` → 404; real: `/en/works/aerolito/`).
   Fix: matchear la ruta más larga primero (excluir `'/'` salvo match exacto).
   Además: emitir hreflang solo para páginas que existen en cada idioma.

2. **Dominio equivocado en JSON-LD** — 50 archivos referencian
   `https://mariaelviraescallon.com` (no sirve el sitio). Fuentes:
   `ArtworkSchema.astro`, `ArtistSchema.astro`, `ExhibitionSchema.astro` +
   hardcodeado en los 21 `es/obra/*.astro`, `contacto.astro`, `prensa.astro`.
   Fix: usar `import.meta.env.SITE`.

3. **Sin canonical en 88/89 páginas** — agregar `rel="canonical"` en Layout.astro.

4. **Sin página 404** — crear `src/pages/404.astro` (GitHub Pages la sirve automático).

## P1 — Contenido desactualizado (lo que la artista notaría)

5. **Exposiciones EN/FR/ZH sin las Bienales 2025** — BIAM, I Bienal de Bogotá y
   VIII Mercosur solo están en ES. ZH además tiene "Encuentros en la fábrica de polvo"
   mal clasificada (colectiva en vez de individual).
6. **Bios FR/ZH terminan en 2019** — falta Premio Nacional de Fotografía 2024;
   usan un texto curatorial distinto al canónico ES y listan 7/11 colecciones.
7. **Homepages FR/ZH solo muestran obras pre-2018** — sin Polvo eres, Precipitaciones,
   Encuentros.
8. **la-travesia.astro conflates dos obras** — mezcla "En el fértil suelo" (2017) con
   "La Travesía" (2019); aclarar límites entre ambas páginas (ES y EN).
9. Resuelto en auditoría: el portafolio tiene 21 obras (numeración salta 10-11);
   el sitio está completo. Parity ES↔EN de las 21 obras verificada OK.

## P2 — Performance (dist 142 MB)

10. **Imágenes sin optimizar** — 0 usos de `<Image>` de astro:assets; 411 `<img>` crudos;
    40 MB de originales copiados verbatim. Migrar a `<Image>` con responsive sizes.
11. **Videos 100 MB en public/** — aerolito 35 MB, encuentros 35 MB, polvo-eres 25 MB.
    Recomprimir (H.264 CRF ~28 → ~5-8 MB c/u) y `preload="none"` fuera de viewport.
12. **og:image / twitter:card ausentes en 89/89** — agregar a Layout (usa imagen de obra).
13. Autoplay hero videos sin `prefers-reduced-motion` (WCAG 2.2.2) — agregar media query.

## P3 — Mantenibilidad

14. **Duplicación 4× entre idiomas** — obra/works indexes y 21 detalles ×2 idiomas
    copy-paste. Migrar a content collections (una fuente de datos, layouts compartidos).
15. **149 base paths hardcodeados** (`/maria-elvira-escallon`) vs 8 usos de BASE_URL —
    reemplazar con helper.
16. Limpieza: gsap sin usar (package.json), AudioPlayer.tsx, BeforeAfterComparator.tsx,
    SchemaOrg.astro sin referencias; exports muertos en i18n/utils.ts.
17. Root redirect va a /en/ pese a que ES es canónico — confirmar intención con Sebastián.
18. DustParticles carga React en todas las páginas para un canvas decorativo —
    opcional: vanilla JS.

## Verificado OK (no tocar)

- Meta descriptions 88/89 sin duplicados; alt en 508/508 imágenes; un h1 por página;
  lang correcto; robots.txt y sitemap correctos; build limpio.
- Textos de las 21 obras ES fieles al portafolio 2025; EN fiel a ES.

## Ledger de ejecución (loop 2026-07-08)
- [x] P0.2 dominio JSON-LD: sed global aplicado (89 occurrencias) — quedan solo emails @mariaelviraescallon.com (pregunta abierta al usuario)
- [x] P3.16a: borrados AudioPlayer.tsx, BeforeAfterComparator.tsx; gsap desinstalado. SchemaOrg.astro SÍ se usa (auditor se equivocó) — se queda.
- [x] P2.11 videos: ya están 720p ~700kbps (videos de arte largos, no recomprimir); obra pages ya usan preload="metadata"; heroes son chicos. Resuelto sin cambios.
- [ ] P0.1/P0.3/P0.4 (switchLanguage, canonical, 404) — agente en curso
- [ ] P1.5-8 (exposiciones/bios/homes FR-ZH, la-travesia) — agente en curso
- [ ] Pendiente fase 2: imágenes <Image>, og:image, prefers-reduced-motion, base-path helper, root redirect decision
- [x] Fase 1 commit 9595f2c: P0 completo (switchLanguage, hreflang, canonical, 404, dominio) + P1 completo (exposiciones/bios/homes FR-ZH, la-travesia) — verificado en dist
- [x] P2.12 og:image/og:url/og:locale/twitter:card en Layout (default polvo-eres-01, obra pages pasan su hero via agente)
- [x] P2.13 prefers-reduced-motion script en Layout
- [x] P3.17 root redirect → /es/ (canónico), instantáneo (JS + meta refresh 0), noindex + canonical
- [x] Minor: sitemap excluye root stub; defaultLocale es
- [ ] P2.10 imágenes <Image> — agente en curso
- Decisiones: NO recomprimir videos de arte (calidad > peso, lazy ya ok); NO content collections ni base-path helper ni Astro 7 (riesgo > beneficio en sitio ya correcto); emails @mariaelviraescallon.com pendientes de confirmar con el usuario
- [x] P2.10 imágenes: 409 <img> → <Image> en 61 archivos (srcset 480/900/1400 + cards 400/800); ogImage por obra (42 páginas); dist 144M→136M y transferencia por página mucho menor
- [x] Extra: 13 links internos rotos detectados y corregidos (View-in-English a páginas EN inexistentes ×8, las-caminantes ×3, nuevas-floras-versalles ×2, publicaciones slug null); checker dist = 0 rotos
- Declinado: self-host de fonts (preconnect+swap ya aceptable)
- [x] Deploy manual npm run deploy (gh-pages) ejecutado — el push a main NO despliega solo
- [x] Verificado en producción: root→/es/ instantáneo, og:image, canonical, hreflang→/en/works/, srcset, 404, Bienales 2025 en EN/FR/ZH
- PLAN COMPLETO — quedan solo: emails @mariaelviraescallon.com (confirmar con usuario) y lista de exposiciones faltantes (esperar a la artista)
