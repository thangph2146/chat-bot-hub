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
  			primary: {
  				'50': '#FFE5E5',
  				'100': '#FFCCCC',
  				'200': '#FF9999',
  				'300': '#FF6666',
  				'400': '#FF3333',
  				'500': '#FF0000',
  				'600': '#E60000',
  				'700': '#CC0000',
  				'800': '#990000',
  				'900': '#660000',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': '#FFFFFF',
  				'100': '#F5F5F5',
  				'200': '#EBEBEB',
  				'300': '#E0E0E0',
  				'400': '#D6D6D6',
  				'500': '#CCCCCC',
  				'600': '#C2C2C2',
  				'700': '#B8B8B8',
  				'800': '#ADADAD',
  				'900': '#A3A3A3',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				'50': '#FDF8E6',
  				'100': '#FAF0CD',
  				'200': '#F5E8B4',
  				'300': '#F0E09B',
  				'400': '#EBD882',
  				'500': '#E6D069',
  				'600': '#E1C850',
  				'700': '#DCC037',
  				'800': '#C9A62F',
  				'900': '#B58C27',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
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
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
  		},
  		boxShadow: {
  			soft: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.05)',
  			medium: '0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  		},
  		keyframes: {
  			'draw-line': {
  				'0%': {
  					strokeDashoffset: '100'
  				},
  				'100%': {
  					strokeDashoffset: '0'
  				}
  			},
  			blob: {
  				'0%': {
  					transform: 'scale(1)'
  				},
  				'33%': {
  					transform: 'scale(1.1)'
  				},
  				'66%': {
  					transform: 'scale(0.9)'
  				},
  				'100%': {
  					transform: 'scale(1)'
  				}
  			},
  			'bounce-gentle': {
  				'0%, 100%': {
  					transform: 'translateY(0)'
  				},
  				'50%': {
  					transform: 'translateY(-5px)'
  				}
  			},
  			typing: {
  				'from': {
  					width: '0'
  				},
  				'to': {
  					width: '100%'
  				}
  			},
  			blink: {
  				'from, to': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0'
  				}
  			},
  			'spin-slow': {
  				'to': {
  					transform: 'rotate(360deg)'
  				}
  			}
  		},
  		animation: {
  			'draw-line': 'draw-line 1.5s ease-in-out forwards',
  			'blob': 'blob 7s infinite alternate',
  			'blob-delay': 'blob 7s infinite alternate 2s',
  			'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
  			'spin-slow': 'spin-slow 8s linear infinite',
  			'blink': 'blink 1s step-end infinite',
  			'typing': 'typing 3.5s steps(40, end)'
  		},
  		transitionDelay: {
  			'1500': '1500ms',
  			'2000': '2000ms',
  			'2500': '2500ms'
  		},
  		screens: {
  			xs: '480px'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
