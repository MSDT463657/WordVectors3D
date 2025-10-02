# AI Word Vector Visualizer

## Overview

This is an educational web application that visualizes word embeddings and semantic similarity using OpenAI's text-embedding-3-small model. The application allows users to input 2-4 words, generates vector embeddings for each word, calculates cosine similarity between word pairs, and displays the relationships in an interactive 3D visualization. The project is built as a full-stack TypeScript application with a React frontend and Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type safety and modern component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for lightweight client-side routing (alternative to React Router)
- Component structure organized in `/client/src` with pages, components, hooks, and lib utilities

**UI Component System**
- shadcn/ui component library with Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling with custom design tokens
- Custom theming system supporting light/dark modes via CSS variables
- Responsive design patterns with mobile-first approach

**3D Visualization**
- React Three Fiber (@react-three/fiber) for declarative 3D rendering using Three.js
- @react-three/drei for helper components (OrbitControls, Text)
- PCA (Principal Component Analysis) implementation for dimensionality reduction from 1536D to 3D
- Interactive controls for camera manipulation and point visualization

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management and caching
- Custom API client wrapper for type-safe HTTP requests
- Form handling with React Hook Form and Zod validation
- Toast notifications for user feedback

### Backend Architecture

**Server Framework**
- Express.js server with TypeScript for API endpoints
- ESM module system (type: "module" in package.json)
- Custom middleware for request logging and JSON parsing with raw body capture
- Development and production build pipelines using tsx and esbuild

**API Design**
- RESTful endpoint structure with `/api` prefix
- POST `/api/analyze` - Main endpoint accepting words and API key, returns embeddings, similarities, and 3D coordinates
- Request/response validation using Zod schemas defined in shared directory
- Error handling with appropriate HTTP status codes

**OpenAI Integration**
- OpenAI SDK for generating text embeddings
- Uses text-embedding-3-small model (1536 dimensions per embedding)
- Client-provided API key pattern (no server-side key storage)
- Embedding generation for each input word with batch processing

**Mathematical Operations**
- Server-side cosine similarity calculation for word pairs
- PCA implementation for dimensionality reduction (1536D → 3D)
- Matrix operations for covariance calculation and eigenvalue decomposition
- Vector normalization and distance calculations

### Data Storage Solutions

**No Persistent Database**
- Application operates entirely in-memory with no persistent data storage
- All embeddings are generated fresh from OpenAI API on each request
- Session state managed entirely on the client side
- Stateless server architecture for horizontal scalability

**Rationale**: The application is designed as an educational tool for real-time analysis, not requiring historical data or user accounts. This architectural decision simplifies deployment and eliminates database management overhead.

### External Dependencies

**OpenAI API**
- Primary dependency for text embedding generation
- Model: text-embedding-3-small (specified in requirements)
- Client provides their own API key for requests
- Vector dimensions: 1536 per word

**UI Component Libraries**
- Radix UI primitives: Complete set of accessible, unstyled components (accordion, dialog, dropdown, select, toast, etc.)
- Class Variance Authority (CVA): For managing component variants and styling
- clsx & tailwind-merge: Utility for conditional className composition

**3D Rendering Stack**
- Three.js: Core 3D graphics library
- React Three Fiber: React renderer for Three.js
- @react-three/drei: Helper components and abstractions

**Development Tools**
- Vite plugins for Replit integration (cartographer, dev-banner, runtime-error-modal)
- TypeScript for type safety across the entire stack
- ESBuild for production bundling
- PostCSS with Tailwind and Autoprefixer

**Validation & Type Safety**
- Zod for runtime schema validation
- Shared schema definitions between client and server (`/shared/schema.ts`)
- TypeScript path aliases for clean imports (`@/`, `@shared/`)

**Typography**
- Google Fonts: Inter (sans-serif), JetBrains Mono (monospace), Architects Daughter, DM Sans, Fira Code, Geist Mono
- Custom font loading via CDN in HTML