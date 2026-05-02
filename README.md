# Hike Booking System

A modern, user-friendly hike booking system for mountains like Mt. Apo and other popular hiking destinations.

## Project Overview

This application guides users through a step-by-step booking process where they can:
- Select from various mountains
- Choose hike types (Day, Overnight, Multi-day)
- Customize their packages
- Calculate real-time pricing
- Add optional services
- Complete booking and payment

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js
- **State Management**: React Context API
- **Payment**: GCash/Bank Transfer integration

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   ├── api/                # API routes
│   ├── booking/            # Booking flow pages
│   └── dashboard/          # Admin dashboard (future)
├── components/
│   ├── common/             # Reusable components
│   ├── booking/            # Booking flow components
│   └── ui/                 # UI components
├── lib/
│   ├── supabase.ts         # Supabase client
│   └── utils.ts            # Utility functions
├── types/
│   └── index.ts            # TypeScript types
└── styles/
    └── globals.css         # Global styles
```

## Features

### Current
- Landing page with hero section
- Mountain selection with cards
- Hike type selection
- Package customization
- Real-time price calculation
- Add-ons selection
- Summary page
- Booking form with validation
- Payment options display
- Confirmation page with reference number

### Coming Soon
- Reviews and ratings
- Weather preview integration
- Photo gallery
- Admin dashboard
- Booking management

## Design Guidelines

- **Primary Color**: Green (#10b981, #16a34a)
- **Secondary Color**: Brown (#92400e, #b45309)
- **Accent**: White (#ffffff)
- **Mobile-first responsive design**

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

## License
