import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
        /* === Brand palette === */
  			brand: {
  				orange: '#EA580C',
  				'orange-light': '#F97316',
  				'orange-dark': '#C2410C',
  				teal: '#00938C',
  				'teal-light': '#14B8A6',
  				canvas: '#FAF9F5',    /* warm ivory page background */
  				surface: '#FFFFFF',   /* card / panel white */
  				sub: '#F5F2ED',       /* inset row / chip fill */
  				ink: '#0F172A',       /* primary text charcoal */
  				muted: '#64748B',     /* secondary text */
  				line: '#E4E7EF',      /* border / divider */
  			},
        /* Legacy tokens kept for backward compat */
        bakong: '#00938C',
  			semantic: {
  				success: '#10B981',
  				warning: '#F59E0B',
  				danger:  '#EF4444',
  				info:    '#3B82F6',
  			},
        /* Tailwind CSS variable bridge */
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))',
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))',
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))',
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))',
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))',
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))',
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))',
  			},
  			border:  'hsl(var(--border))',
  			input:   'hsl(var(--input))',
  			ring:    'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))',
  			},
  		},
  		backgroundImage: {
  			'gradient-orange': 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
  			'gradient-teal':   'linear-gradient(135deg, #00938C 0%, #14B8A6 100%)',
  			'gradient-hero':   'linear-gradient(135deg, #EA580C 0%, #F97316 60%, #FBBF24 100%)',
  		},
  		boxShadow: {
  			card: '0 1px 3px 0 rgba(15,23,42,0.06), 0 1px 2px -1px rgba(15,23,42,0.04)',
  			panel: '0 4px 16px -2px rgba(15,23,42,0.08)',
  			'orange-glow': '0 0 24px -4px rgba(234, 88, 12, 0.30)',
  			'teal-glow':   '0 0 24px -4px rgba(0, 147, 140, 0.25)',
  			soft: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
  		},
  		borderRadius: {
  			lg:   'var(--radius)',
  			md:   'calc(var(--radius) - 2px)',
  			sm:   'calc(var(--radius) - 4px)',
  			xl:   '18px',
  			'2xl': '24px',
  			'3xl': '28px',
  			pill: '999px',
  		},
      fontFamily: {
        sans:  ['Inter', 'Kantumruy Pro', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        khmer: ['Kantumruy Pro', 'Inter', 'sans-serif'],
      },
  	},
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
