export type Category = 'Health' | 'Fintech' | 'Web' | 'AI & Bots'

export type Project = {
  id: string
  title: string
  category: Category
  year: string
  accent: string
  summary: string
  highlights: string[]
  stack: string[]
  live?: string
  repo?: string // only for public repositories
  apk?: string // public Android APK download
  platform: 'web' | 'mobile' | 'ai'
}

export const profile = {
  name: 'Kaleab Mekonnen',
  first: 'Kaleab',
  last: 'Mekonnen',
  role: 'Full-Stack Developer',
  role2: 'AI Automation',
  location: 'Ethiopia',
  github: 'https://github.com/archigosee',
  handle: 'archigosee',
  email: 'kaleabmekonnen45@gmail.com',
  quote: 'Programming is 10% coding and 90% figuring out why it is not working.',
}

export const projects: Project[] = [
  {
    id: 'healthextend',
    title: 'HealthExtend AI',
    category: 'Health',
    year: '2026',
    accent: '#22d3ee',
    platform: 'ai',
    summary: 'An AI helper for the health sector, using Google Gemini to support patients and clinicians with fast, contextual answers.',
    highlights: [
      'Gemini-powered assistant built and shipped through Google AI Studio',
      'TypeScript front end with Python and notebook tooling for experiments',
      'Deployed on Vercel for instant global access',
    ],
    stack: ['TypeScript', 'React', 'Gemini API', 'Python', 'Vercel'],
    live: 'https://healthextend-ai.vercel.app',
  },
  {
    id: 'wada',
    title: 'Wada Clinic',
    category: 'Health',
    year: '2026',
    accent: '#34d399',
    platform: 'web',
    summary: 'A fast, accessible and trustworthy website for a family-medicine clinic, with a calm, reassuring visual language.',
    highlights: [
      'Next.js App Router with full TypeScript',
      'Appointment forms validated end to end with React Hook Form and Zod',
      'Accessibility and performance treated as first-class requirements',
    ],
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'React Hook Form', 'Zod'],
    live: 'https://wada-clinic-pi.vercel.app',
  },
  {
    id: 'eyor',
    title: 'Eyor Medical Services',
    category: 'Health',
    year: '2026',
    accent: '#60a5fa',
    platform: 'web',
    summary: 'Patient-facing platform for Iyor Medical Services covering specialists, departments, emergency info and bookings, plus an admin portal for appointments.',
    highlights: [
      'SvelteKit 2 with Supabase Postgres and Auth',
      'Installable Progressive Web App',
      'Admin portal to manage appointments and content',
    ],
    stack: ['SvelteKit', 'Supabase', 'PostgreSQL', 'Tailwind 4', 'PWA'],
  },
  {
    id: 'clinic-ms',
    title: 'Clinic Management System',
    category: 'Health',
    year: '2026',
    accent: '#a78bfa',
    platform: 'web',
    summary: 'A lightweight workflow app for physiotherapy clinics: receptionist, doctor and admin roles share a real-time patient queue and reports.',
    highlights: [
      'Role-based access for reception, doctors and admins',
      'Real-time queue and reporting on Firestore',
      'Firebase Auth and Hosting',
    ],
    stack: ['React', 'Vite', 'Tailwind CSS', 'Firebase', 'Firestore'],
  },
  {
    id: 'faydapay',
    title: 'FaydaPay',
    category: 'Fintech',
    year: '2026',
    accent: '#fbbf24',
    platform: 'mobile',
    summary: 'Turns Ethiopia’s Fayda digital ID into a portable credit profile: sign in with Fayda, get a FaydaScore, approve bank access requests and take an instant micro-loan to a mobile wallet. The live demo uses fictional identities and mock payments.',
    highlights: [
      'Flutter app for Android and web with a FaydaScore gauge, cross-bank debt check and borrowing power',
      'CIBA-style consent prompts so banks only see your score after you approve',
      'Go backend with a Fayda OIDC (eSignet) simulator, risk aggregator, debt registry and audit trail, run with Docker',
      'Standalone demo mode: mock e-KYC and a mock Telebirr rail, with no real money or ID data',
    ],
    stack: ['Flutter', 'Dart', 'Go', 'PostgreSQL', 'Docker', 'OIDC'],
    live: 'https://faydapay-demo.vercel.app',
    apk: 'https://faydapay-demo.vercel.app/downloads/faydapay-demo.apk',
  },
  {
    id: 'car-rental',
    title: 'High Class Car Rent',
    category: 'Web',
    year: '2026',
    accent: '#f97316',
    platform: 'web',
    summary: 'Premium car rental and airport shuttle booking for Addis Ababa, with a fleet showcase and an admin dashboard.',
    highlights: [
      'Airport shuttle and fleet booking flows',
      'Admin dashboard for bookings and fleet management',
      'Bilingual: English and Amharic',
    ],
    stack: ['Next.js', 'TypeScript', 'i18n', 'lowdb', 'Vercel'],
    live: 'https://v0-car-rental-website-sigma-six.vercel.app',
  },
  {
    id: 'coffee',
    title: 'Coffee Supply-Chain Tracker',
    category: 'Web',
    year: '2025',
    accent: '#d97706',
    platform: 'web',
    summary: 'Traceability for Ethiopian coffee: follow lots from farm to export with a data-backed dashboard.',
    highlights: ['Supply-chain records stored in PostgreSQL', 'Dashboard UI with Next.js', 'Shipped on Vercel'],
    stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Vercel'],
  },
  {
    id: 'ethiotech',
    title: 'EthioTech Dashboard',
    category: 'Web',
    year: '2025',
    accent: '#2dd4bf',
    platform: 'web',
    summary: 'An analytics dashboard for an Ethiopian tech organization, backed by a Postgres data layer.',
    highlights: ['Data-dense dashboard layouts', 'SQL-backed metrics', 'Deployed on Vercel'],
    stack: ['Next.js', 'TypeScript', 'PostgreSQL'],
  },
  {
    id: 'zmart',
    title: 'Z-Mart',
    category: 'Web',
    year: '2024',
    accent: '#818cf8',
    platform: 'web',
    summary: 'An e-commerce storefront for Zobel Technology, with product catalogue and cart, plus a separate commerce backend.',
    highlights: ['Next.js storefront', 'Product catalogue and cart', 'Several iterations across JS and TS builds'],
    stack: ['Next.js', 'TypeScript', 'Node.js'],
    live: 'https://z-mart1.vercel.app',
    repo: 'https://github.com/archigosee/z-mart1',
  },
  {
    id: 'amharic-assistant',
    title: 'Amharic Voice Assistant',
    category: 'AI & Bots',
    year: '2023',
    accent: '#e879f9',
    platform: 'ai',
    summary: 'A digital assistant that understands voice commands in Amharic and carries out actions, bringing voice computing to a low-resource language.',
    highlights: ['Speech recognition for Amharic', 'Command parsing mapped to device actions', 'Research roots in AI lab work'],
    stack: ['Python', 'Speech Recognition', 'NLP'],
    repo: 'https://github.com/archigosee/Digital-Assistant',
  },
  {
    id: 'zobelbot',
    title: 'Zobel Bots & Mini Apps',
    category: 'AI & Bots',
    year: '2024',
    accent: '#38bdf8',
    platform: 'ai',
    summary: 'Telegram bots and Telegram Mini Apps that automate customer interactions and read Telegram user data right inside the chat.',
    highlights: ['Telegram Bot API automation in Python and JavaScript', 'Mini App front ends in React and Next.js', 'Deployed on Vercel'],
    stack: ['Telegram API', 'React', 'Next.js', 'Python'],
    repo: 'https://github.com/archigosee/zobelbot',
  },
]

export const layers = [
  {
    key: 'frontend',
    index: '01',
    name: 'Interface Layer',
    caption: 'Web, mobile and Telegram front ends',
    color: '#7c5cff',
    items: ['React', 'Next.js', 'SvelteKit', 'Flutter', 'TypeScript', 'Tailwind CSS', 'Three.js'],
  },
  {
    key: 'api',
    index: '02',
    name: 'API & Automation',
    caption: 'Services, bots and AI workflows',
    color: '#22d3ee',
    items: ['Node.js', 'Go', 'Python', 'REST APIs', 'Gemini API', 'Telegram Bots', 'AI Agents'],
  },
  {
    key: 'data',
    index: '03',
    name: 'Data, Cloud & Security',
    caption: 'Storage, deployment and hardening',
    color: '#34d399',
    items: ['PostgreSQL', 'Supabase', 'Firebase', 'Docker', 'Vercel', 'e-KYC / Auth', 'Security basics'],
  },
]
