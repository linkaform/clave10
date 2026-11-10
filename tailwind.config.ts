import type { Config } from "tailwindcss";
import twColors from "tailwindcss/colors";

// ---- Modo oscuro: paleta remapeada a variables (ver src/app/theme-palette.css) ----
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const TINT_HUES = ["blue", "red", "green", "yellow", "amber", "orange", "emerald", "indigo", "sky", "purple", "teal", "violet", "pink", "rose", "cyan", "lime"] as const;

// gray/slate: toda la escala sale de variables (texto, borde, ring...).
const neutral = (hue: "gray" | "slate") =>
  Object.fromEntries(SHADES.map((s) => [s, v(`${hue}-${s}`)]));
// Fondos gray/slate 700..950 se quedan fijos: ya son oscuros (botones, tooltips).
const neutralBg = (hue: "gray" | "slate") => ({
  ...neutral(hue),
  ...Object.fromEntries(["700", "800", "900", "950"].map((s) => [s, twColors[hue][s as "700"]])),
});
const tints = (kind: "bg" | "tx" | "bd", shades: string[]) =>
  Object.fromEntries(
    TINT_HUES.map((h) => [h, Object.fromEntries(shades.map((s) => [s, v(`${h}-${kind}-${s}`)]))]),
  );


const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		backgroundColor: {
  			white: v("bg-white"),
  			gray: neutralBg("gray"),
  			slate: neutralBg("slate"),
  			...tints("bg", ["50", "100", "200"]),
  		},
  		textColor: {
  			...tints("tx", ["500", "600", "700", "800", "900"]),
  			// Texto gris tenue: en oscuro sube un poco para que se lea.
  			gray: { 200: v("gray-tx-200"), 300: v("gray-tx-300") },
  			slate: { 200: v("slate-tx-200"), 300: v("slate-tx-300") },
  		},
  		borderColor: tints("bd", ["50", "100", "200", "300"]),
  		ringColor: tints("bd", ["50", "100", "200", "300"]),
  		// Degradados claros (from-blue-50 to-white...) igual que los fondos.
  		gradientColorStops: {
  			white: v("bg-white"),
  			...tints("bg", ["50", "100", "200"]),
  		},
  		colors: {
  			gray: neutral("gray"),
  			slate: neutral("slate"),
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			button: {
  				primary: 'var(--button-primary)',
  				'primary-hover': 'var(--button-primary-hover)'
  			},
  			// Sistema de diseño Clave 10 — migración parcial (ver comentario en
  			// globals.css junto a --c10-border / --c10-text-primary). Continuar
  			// agregando aquí conforme se importen más tokens de
  			// lkf-claude/Design_System/tokens/colors.css.
  			c10: {
  				border: 'var(--c10-border)',
  				// text-c10-text: texto de interfaz (#171717 / #E5E7EB)
  				text: 'var(--c10-text-primary)',
  				'canvas': 'var(--c10-canvas)',
  				'surface': 'var(--c10-surface)',
  				'panel': 'var(--c10-panel)',
  				'sunken': 'var(--c10-sunken)',
  				'skeleton': 'var(--c10-skeleton)',
  				'line': 'var(--c10-line)',
  				'line-card': 'var(--c10-line-card)',
  				'line-strong': 'var(--c10-line-strong)',
  				'blue-subtle': 'var(--c10-blue-subtle)',
  				'blue-light': 'var(--c10-blue-light)',
  				'blue-border': 'var(--c10-blue-border)',
  				'red-subtle': 'var(--c10-red-subtle)',
  				'title': 'var(--c10-title)',
  				'label': 'var(--c10-label)',
  				'secondary': 'var(--c10-secondary)',
  				'meta': 'var(--c10-meta)',
  				'faint': 'var(--c10-faint)',
  				'grip': 'var(--c10-grip)',
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
};
export default config;
