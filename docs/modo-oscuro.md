# Modo oscuro

El tema lo pone `next-themes` (`src/app/providers.tsx`) como clase `.dark` en
`<html>`. Se guarda por dispositivo en `localStorage["c10-theme"]` y sobrevive
al logout. El switch está en Configuración › Mi perfil.

## Regla: nada de colores fijos

Un componente nuevo se ve bien en oscuro **solo si sus colores salen de
variables**. Hay dos caminos válidos:

| Qué usar | Ejemplo | Qué pasa en oscuro |
| --- | --- | --- |
| Tokens `c10-*` (preferido) | `bg-c10-surface text-c10-title border-c10-line` | Toman el valor oscuro del diseño |
| Clases normales de Tailwind | `bg-white text-gray-600 bg-blue-50 border-slate-200` | La paleta está remapeada y se invierte sola |

Lo que **rompe** el modo oscuro:

- Hex en clases: `bg-[#F8FAFC]`, `text-[#0F172A]`.
- Hex en `style`: `style={{ color: "#333" }}`.
- Colores fijos en JS (gráficas, SVG, canvas): usa `var(--c10-*)`.
- Librerías que pintan por su cuenta (selects, date pickers, editores):
  necesitan su CSS oscuro al final de `src/app/theme-palette.css`, como ya
  tienen react-select y multiselect-react-dropdown.

ESLint avisa (`warn`) de los hex en clases y en `style`. Ya hay advertencias
de código anterior al modo oscuro, revisado a mano. **Código nuevo no debe
agregar ninguna.**

### Excepción: algo que debe verse igual en ambos temas

Por ejemplo, la perilla del switch, que es clara siempre. Usa un color
arbitrario que no sea token y explica por qué:

```tsx
// eslint-disable-next-line no-restricted-syntax -- claro en ambos temas
<span className="bg-[#E2E8F0]" />
```

`text-white` no cambia con el tema, y `bg-gray/slate-700…950` tampoco (son
botones y tooltips oscuros en los dos).

## Tokens

Definidos en `src/app/globals.css` (`:root` y `.dark`) y expuestos en
`tailwind.config.ts` → `colors.c10`.

| Token | Uso | Claro | Oscuro |
| --- | --- | --- | --- |
| `canvas` | lienzo de la app | `#F3F5F8` | `#0B1220` |
| `surface` | tarjetas, header, menús | `#FFFFFF` | `#111A2E` |
| `panel` | cuerpo de panel, zona sutil | `#F8FAFC` | `#17223A` |
| `sunken` | botón de ícono, hover | `#F1F5F9` | `#1E2A44` |
| `skeleton` | placeholders de carga | `#EEF2F6` | `#1E2A44` |
| `line` | bordes de control y tabla | `#E2E8F0` | `#26324A` |
| `line-card` | bordes de tarjeta | `#E5E7EB` | `#26324A` |
| `line-strong` | separadores fuertes | `#CBD5E1` | `#3A4762` |
| `blue-subtle` | fondos activos | `#EFF6FF` | `#16284A` |
| `blue-light` | encabezado de tabla, chip | `#DBEAFE` | `#1B3560` |
| `blue-border` | borde azul | `#BFDBFE` | `#24477F` |
| `red-subtle` | fondo de error | `#FEE2E2` | `#3A1A22` |
| `title` | títulos y datos | `#0F172A` | `#F1F5F9` |
| `text` | texto de interfaz | `#171717` | `#E5E7EB` |
| `label` | etiquetas | `#334155` | `#CBD5E1` |
| `secondary` | texto secundario | `#475569` | `#AEB9CA` |
| `meta` | fechas, metadatos | `#64748B` | `#94A3B8` |
| `faint` | placeholder, íconos inactivos | `#94A3B8` | `#7C8AA0` |
| `grip` | ícono de arrastre | `#CBD5E1` | `#475569` |

Sombras de borde: `shadow-[0_0_0_1px_var(--c10-line)]`.

Si falta un token, agrégalo en los tres lugares (`:root`, `.dark` y
`tailwind.config.ts`) en vez de usar un hex.

## Cómo probar

1. En la consola del navegador: `localStorage.setItem("c10-theme", "dark")` y
   recarga (o usa el switch).
2. Recorre la pantalla y sus modales (las rutas con `?action=` abren modales).
3. Corre el detector en la consola. Lista fondos claros colados y texto
   oscuro sobre fondo oscuro:

```js
(() => {
  const lum = (c) => {
    const m = c.match(/[\d.]+/g); if (!m) return null;
    const [r, g, b, a = 1] = m.map(Number); if (a < 0.5) return null;
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const bgOf = (el) => {
    for (; el; el = el.parentElement) {
      const l = lum(getComputedStyle(el).backgroundColor); if (l !== null) return l;
    }
    return 0;
  };
  const out = [];
  document.querySelectorAll("body *").forEach((el) => {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const s = getComputedStyle(el);
    const bg = lum(s.backgroundColor);
    if (bg !== null && bg > 0.8) out.push(["fondo claro", el]);
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (hasText) { const t = lum(s.color); if (t !== null && t < 0.35 && bgOf(el) < 0.3) out.push(["texto oscuro", el]); }
  });
  console.table(out.map(([k, el]) => ({ problema: k, tag: el.tagName, clase: String(el.className).slice(0, 80) })));
  return out;
})();
```

Los mapas de Leaflet se quedan claros a propósito.

## Trampas

- Cambiar `tailwind.config.ts` pide `docker compose build clave10` (la config
  se copia a la imagen en build time). No basta reiniciar.
- Al migrar código viejo, no hagas un reemplazo global de hex a token: el
  mismo hex puede ser fondo en un lado y texto en otro, con valores oscuros
  distintos. Mapea por (utilidad, hex).
