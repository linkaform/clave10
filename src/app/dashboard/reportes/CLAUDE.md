# Reportes

Reglas para crear o modificar reportes en `src/app/dashboard/reportes/`.

## Estructura

```
reportes/
  page.tsx                  tarjetas de /reportes (aquí se da de alta un reporte nuevo)
  components/
    shared/                 piezas comunes a todos los reportes  ← usar primero
    asistencia/             vistas propias del reporte de asistencias
    concesionados/          vistas propias del reporte de concesionados (EcoPanel, DetallePanel)
  reporte_<nombre>/
    page.tsx                solo arma las piezas: estado, filtros, layout
    layout.tsx              BasicLayout + metadata
    lib/                    cálculos y llamada al back del reporte
```

- Un reporte nuevo vive en `reporte_<nombre>/`. Lo que sea visual y solo suyo va en
  `components/<nombre>/`.
- Antes de crear un componente, busca en `components/shared/`. Si ya existe algo
  parecido, úsalo; no hagas una copia con otro nombre.
- `shared/` no importa nada de un reporte concreto (`reporte_*` ni `components/asistencia`).
  Si algo depende de los datos de un reporte, no es compartido.

## Qué hay en `components/shared/`

| Archivo | Exporta | Para qué |
|---|---|---|
| `ui.tsx` | `SegTabs`, `KpiChip`, `Empty`, `Avatar`, `Checkbox`, `matches`, `useOutside` | Tabs unidos, chip del encabezado, vacío, búsqueda sin acentos, cerrar al hacer clic fuera |
| `filtros/MultiCombo.tsx` | `MultiCombo` | Selección múltiple con búsqueda, para el panel de filtros |
| `filtros/QuickFilters.tsx` | `QuickFilters`, `QuickPill` | Botones de estatus con conteo (varios activos a la vez). `todos` muestra también los que están en 0. `pildora` los pinta grises (activo azul sólido), como van dentro del panel |
| `filtros/Seccion.tsx` | `Seccion` | Sección del panel de filtros: separador, título y contador opcional |
| `filtros/PanelAnim.tsx` | `PanelAnim` | Abre y cierra el panel de filtros con animación (ancho en línea, deslizado en pantalla angosta) |
| `periodo/PeriodNav.tsx` | `PeriodNav` | "Hoy · ‹ periodo ▾ ›" con calendario |
| `periodo/MiniCalendar.tsx` | `MiniCalendar` | Calendario de día, semana, quincena, mes o año. Mide 316px |
| `periodo/FechaPicker.tsx` | `FechaPicker` | Campo "Fecha" del panel: abre el `MiniCalendar` en un portal fijo (no lo recorta el scroll del panel) |
| `periodo/period.ts` | `PeriodView`, `periodRange`, `shiftPeriod`, `periodLabel`, `toISO`, `fromISO`, `MESES`, `DIAS`… | Fechas y periodos |
| `tabla/ReportTable.tsx` | `ReportTable` | Tabla a partir de un `TableSpec`: pestañas verticales si hay varias, primera columna fija, orden A–Z, filas de grupo plegables, paginación |
| `tabla/Pager.tsx` | `Pager`, `usePaged`, `T` | Paginación (25/50/100/250) y clases de tabla, para tablas hechas a mano |
| `tabla/ResizeHandle.tsx` | `ResizeHandle`, `usePcw`, `pcwVar`, `PCW` | Ancho arrastrable de la primera columna, guardado en el navegador |
| `tabla/ScrollBox.tsx` | `ScrollBox` | Scroll horizontal que difumina el borde si queda contenido a la derecha |
| `tabla/tipos.ts` | `Cell`, `TableSpec` | Datos de una tabla |
| `graficas/Charts.tsx` | `ChartCard`, `OnSelect` | Barras horizontales y verticales, línea y mapa de calor, con tooltip, a partir de un `Card`. Con `onSelect`, las filas de barras horizontales que traen `sel` se pueden clicar (nombre, barra o tramo) |
| `graficas/tipos.ts` | `Card`, `HCard`, `VCard`, `LCard`, `HeatCard`, `Tip`, `Serie`… | Datos de una gráfica |
| `drawer/drawerParts.tsx` | `DrawerShell`, `Field`, `Fields`, `Card`, `Warn`, `CloseButton`, `EvidencePhotos` | Panel lateral de detalle. `DrawerShell` acepta `lead` (opcional) para un avatar a la izquierda del título |
| `excel.ts` | `descargarExcel(tablas, nombre)` | Una hoja por `TableSpec`; los números se guardan como números |
| `formato.ts` | `n` | Número con separador de miles (es-MX) |
| `fotos.ts` | `thumbUrl` | URL de la miniatura que LinkaForm sube con cada foto |

### Gráficas y tablas: datos, no componentes

`ChartCard` y `ReportTable` solo pintan. El reporte calcula en `lib/` objetos `Card` y
`TableSpec` (datos puros) y se los pasa. Así una gráfica nueva casi nunca pide un
componente nuevo. `reporte_concesionados/lib/` es el ejemplo completo.

Lo mismo con el panel de detalle que se abre al hacer clic en una gráfica: en concesionados,
`lib/paneles.ts` arma un `PanelSpec` y `components/concesionados/DetallePanel.tsx` lo pinta
dentro del `DrawerShell`. Un panel nuevo se arma con los tres tipos de sección que ya existen
(`stats` tarjeta de datos, `items` lista de préstamos, `bars` lista con barras), sin componente nuevo.

## Cómo cambiar algo de `shared/`

Asistencias y concesionados ya lo usan, y la app de producción depende de asistencias.

- No cambies cómo se ve ni cómo funciona por defecto. Si un reporte necesita otra cosa,
  agrega una prop opcional cuyo valor por defecto sea el comportamiento actual.
- Después de tocar `shared/`, revisa las páginas de los dos reportes, no solo la tuya.
- Los archivos viejos `components/asistencia/ui.tsx`, `components/drawerParts.tsx`,
  `reporte_asistencias/lib/period.ts` y `thumbUrl` en `reporte_asistencias/lib/employees.ts`
  solo reexportan desde `shared/` para no cambiar los imports de asistencias. En código nuevo
  importa directo de `shared/`, y si cambias una pieza compartida, cámbiala en `shared/`: en
  los archivos viejos ya no hay código.

## Patrones del diseño

- **Panel de filtros:** aside fijo de 280px a la izquierda, pegado arriba (`sticky`), con
  encabezado "Filtros · contador · Limpiar". No uses el `FloatingFiltersDrawer` de
  bitácoras. Hoy cada página lo arma a mano (ver asistencias y concesionados); está
  pendiente extraerlo a `shared/`.
- **Vistas de gráficas y galería:** sin tarjeta blanca envolvente; cada gráfica o tarjeta va
  directo sobre el fondo. Periodo (píldoras), Fecha (`FechaPicker`) y Estatus
  (`QuickFilters pildora`) van dentro del panel de filtros, cada uno en su `Seccion`, arriba
  de los demás filtros. Las vistas de tabla y calendario conservan su barra arriba.
- **Popovers dentro del panel:** el panel tiene scroll y recorta lo que se sale por los
  lados. Algo más ancho que el panel, como el `MiniCalendar`, se pinta en un portal con
  `position: fixed` (ver `FechaPicker` en `reporte_concesionados/page.tsx`).
- **Colores:** usa los tokens `c10` de Tailwind (`bg-c10-surface`, `text-c10-title`,
  `border-c10-line`, `bg-button-primary`…), no colores sueltos. Así funciona el modo oscuro.
- **Textos de la interfaz:** en español.

## Unificación

- **Combo de filtros y botones de estatus:** ya están unificados. Los dos reportes usan
  `MultiCombo` y `QuickFilters`; no crees otros.
- **Panel de filtros:** sigue armado a mano en cada página (pendiente un `FilterPanel` común).

## Datos y alta

- **Datos:** el back es un script de LinkaForm que se llama por `API_ENDPOINTS.runScript`
  con `script_name`, envuelto en un hook de react-query dentro de `lib/`. Un script nuevo
  va como `*_sdk.py` en lkf-sanic-apps. No se toca `addons` sin permiso explícito.
- **Alta:** agrega la tarjeta en `reportes/page.tsx`, en el arreglo `REPORTS`. El menú y
  los permisos van aparte.

## Entorno local

- Si cambias `tailwind.config.ts` o las dependencias, hay que reconstruir el contenedor:
  `docker compose build clave10` y luego `docker compose up -d clave10`. Si no, las
  clases nuevas no se generan.
