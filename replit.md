# SmartCater - Intelligent Airline Catering Operations Platform

## Overview

SmartCater is an enterprise operations platform designed for GateGroup to optimize airline catering operations through AI-powered smart execution. The system focuses on four core modules: automated bottle handling with computer vision, real-time trolley verification, flight reliability prediction based on weather data, and dynamic resource replanning. Built as a mission-critical tool, it prioritizes operational efficiency, high information density, and real-time decision support for catering staff managing flight preparations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server with HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing instead of React Router
- React Query (TanStack Query) for server state management with automatic caching and refetching

**UI Component Strategy**
- Shadcn/ui component library built on Radix UI primitives for accessibility
- Tailwind CSS for utility-first styling with custom design tokens
- Design system inspired by Linear's clarity, Material Design's enterprise patterns, and Notion's modularity
- Custom CSS variables for theming with light/dark mode support
- Typography uses Inter for interface text and JetBrains Mono for metrics/data

**State Management Approach**
- Server state managed via React Query with configured stale times and refetch policies
- Local UI state handled through React hooks (useState, useReducer)
- Form state managed by React Hook Form with Zod schema validation
- Toast notifications for user feedback via shadcn/ui toast system

**Key Design Principles**
- Information density over decorative elements (mission-critical operations tool)
- Consistent spacing system using Tailwind units (2, 4, 6, 8)
- Responsive grid layouts adapting from mobile to desktop
- Real-time data visualization using Recharts library

### Backend Architecture

**Server Framework**
- Express.js REST API with TypeScript
- Modular route registration pattern for endpoint organization
- Custom middleware for request logging and JSON body parsing with raw buffer access
- Error handling middleware for consistent API responses

**Data Layer Pattern**
- Storage abstraction interface (IStorage) for database operations
- In-memory implementation (MemStorage) for MVP/development
- Designed for future PostgreSQL migration via Drizzle ORM
- Schema definitions shared between client and server via `/shared` directory

**API Design**
- RESTful endpoints organized by resource (`/api/flights`, `/api/bottles`, `/api/trolleys`, `/api/rules`)
- POST endpoints for analysis operations (bottle analysis, trolley verification)
- Validation using Zod schemas from shared schema definitions
- Metrics aggregation endpoints for dashboard data

**AI Integration Strategy**
- OpenAI GPT-5 (latest model) for vision-based analysis
- Bottle analysis: Computer vision on base64 images to detect bottle type and fill level
- Trolley verification: Image comparison against golden layouts to detect discrepancies
- Configurable thresholds per airline for business rule enforcement
- Structured JSON responses for consistent parsing

### Data Storage Solutions

**Current Implementation**
- In-memory Maps and Arrays for development/prototyping
- No persistence layer in current MVP state
- Data reset on server restart

**Production Migration Path**
- Drizzle ORM configured for PostgreSQL dialect
- Schema definitions already created in `/shared/schema.ts` with pgTable syntax
- Neon Database serverless driver ready for integration
- Migration directory configured at `./migrations`
- Environment variable `DATABASE_URL` for connection configuration

**Schema Design**
- Flights: Core entity tracking flight details, status, planned vs actual loads, reliability scores
- Airline Rules: Per-airline configuration for bottle handling thresholds
- Bottle Analyses: Historical record of bottle inspections with AI recommendations
- Trolley Verifications: Audit trail of trolley checks with error detection results
- Reassignments: Complete audit trail of food/bottle reassignments with airline restrictions
- Dashboard Metrics: Aggregated analytics for operational performance

### Automatic Reassignment System

**GateGroup Pick & Pack Integration**
- Follows real-world airline segregation protocols: food can ONLY be reassigned within same airline
- Aligned with Smart Execution track requirements for HackMTY 2025
- Prevents cross-airline contamination of fresh food inventory

**Reassignment Rules**
1. **Airline Restriction**: Food from delayed/cancelled flights can only go to flights of the same airline
   - Airline code extracted from flight number (e.g., AM245 → AM, AA789 → AA)
   - Prevents scenarios like AeroMexico food going to Delta flights
2. **Time Window**: Target flights must depart within 6 hours of original flight
3. **Priority**: Closest departure time gets priority for reassignment
4. **Status Tracking**:
   - `success`: Same-airline flight found and food reassigned
   - `pending`: Awaiting manual confirmation
   - `no_flight`: No compatible same-airline flight available (food expires)

**API Endpoints**
- `GET /api/reassignments` - Returns complete reassignment history with audit trail
- `POST /api/reassignments/process` - Batch processes all delayed/cancelled flights

**UI Features**
- Real-time reassignment processing via "Procesar Reasignaciones" button
- Color-coded status indicators:
  - 🟢 Green (Exitoso): Successfully reassigned to same airline
  - 🟡 Yellow (Pendiente): Awaiting confirmation
  - 🔴 Red (Sin Vuelo): No compatible flight, food will expire
- Visible airline codes and flight numbers in logs for transparency
- Rules documentation section explaining same-airline constraint

**Demo Data**
- Multiple flights per airline enable realistic testing:
  - AeroMexico: AM651, AM245 (delayed), AM892
  - American Airlines: AA789 (delayed), AA456
  - Delta: DL456, DL321 (cancelled, no compatible flight)
- Demonstrates successful same-airline reassignments and "no flight" edge cases

### External Dependencies

**AI Services**
- OpenAI API (GPT-5 model) for vision analysis
- Required: `OPENAI_API_KEY` environment variable
- Used for: Bottle image analysis, trolley layout verification
- Structured prompts for consistent JSON responses

**Weather Integration**
- Mock implementation in current MVP
- Designed for OpenWeatherMap or WeatherAPI integration
- Calculates flight reliability percentage based on weather conditions
- Factors: temperature, wind speed, precipitation, visibility, weather conditions

**Third-Party UI Libraries**
- Radix UI: Accessible component primitives (dialogs, popovers, dropdowns, etc.)
- Recharts: Data visualization for dashboard charts (bar, line, pie charts)
- date-fns: Date formatting and manipulation
- Lucide React: Icon library for consistent iconography
- cmdk: Command palette component (if implemented)

**Development Tools**
- Replit-specific plugins: Runtime error modal, cartographer, dev banner
- ESBuild for server-side bundle creation in production
- PostCSS with Tailwind and Autoprefixer for CSS processing

**Session Management**
- connect-pg-simple: PostgreSQL session store for Express
- Cookie-based session tracking (when implemented)