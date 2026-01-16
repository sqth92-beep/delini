# replit.md

## Overview

This is an Arabic-language local business directory web application. It allows users to browse, search, and discover local businesses, restaurants, and services. The app features business listings organized by categories, an interactive map view using Leaflet, user reviews and ratings, and active promotional offers. The interface is designed with RTL (right-to-left) support for Arabic text and uses a dark luxurious theme with gold accents.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with custom dark theme, shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Maps**: React-Leaflet for interactive map views
- **Build Tool**: Vite with path aliases (@/ for client/src, @shared/ for shared)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful JSON API with Zod schema validation
- **Development**: tsx for TypeScript execution, Vite dev server integration with HMR

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: shared/schema.ts (shared between frontend and backend)
- **Migrations**: drizzle-kit for database migrations (output to ./migrations)

### Project Structure
```
├── client/           # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route page components
│   │   ├── hooks/        # Custom React hooks (use-directory.ts for API)
│   │   └── lib/          # Utilities and query client
├── server/           # Backend Express application
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database access layer
│   └── db.ts         # Database connection
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Drizzle database schemas
│   └── routes.ts     # API contract definitions
```

### Database Schema
Four main tables:
- **categories**: Business categories (restaurants, cars, mobiles, etc.)
- **businesses**: Business listings with location, contact info, social links
- **reviews**: User-submitted reviews with ratings
- **offers**: Promotional offers linked to businesses

### Key Design Decisions
1. **Shared Schema**: Database types and API contracts are defined in /shared to ensure type safety across the full stack
2. **RTL Support**: The app is designed for Arabic with dir="rtl" on the body and appropriate font families (IBM Plex Sans Arabic, Cairo)
3. **Mobile-First**: Bottom navigation pattern, responsive grid layouts, safe area handling
4. **Dark Theme**: Custom CSS variables for a luxurious dark theme with gold/amber accents

### Important: External Image URLs
When displaying images from external URLs (like stockcake.com), use simple `<img>` tags WITHOUT these attributes:
- **DO NOT use** `crossOrigin="anonymous"` - blocks CORS image loading
- **DO NOT use** `referrerPolicy="no-referrer"` - causes 403 errors from some CDNs
- **DO NOT use** `loading="lazy"` with external images - causes race conditions
- **DO NOT add** cache busters like `?v=3` to URLs
- **DO NOT use** `onError` handlers that change the src - triggers prematurely

**Correct pattern** (same as BusinessDetail.tsx):
```jsx
<img 
  src={imageUrl} 
  alt={name}
  className="w-full h-full object-cover"
/>
```

## External Dependencies

### Database
- PostgreSQL (required, connection via DATABASE_URL environment variable)
- connect-pg-simple for session storage

### Frontend Libraries
- react-leaflet + leaflet: Interactive maps
- framer-motion: Animations
- date-fns: Date formatting with Arabic locale support
- embla-carousel-react: Carousel functionality
- react-hook-form + @hookform/resolvers: Form handling

### UI Components
- Full shadcn/ui component library (Radix UI primitives)
- lucide-react: Icon library
- class-variance-authority + tailwind-merge + clsx: Styling utilities

### Development
- @replit/vite-plugin-runtime-error-modal: Error overlay in development
- @replit/vite-plugin-cartographer: Replit-specific development tools