# PriceScan - Barcode Scanning Price Tracker

## Overview

PriceScan is a full-stack web application for scanning product barcodes and tracking price analytics. The system allows users to scan product barcodes using their device camera, view product information, and analyze price trends over time. The application features a mobile-first design with barcode scanning capabilities, product search functionality, and comprehensive analytics dashboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with three main pages (Scanner, Products, Analytics)
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with custom Material Design-inspired theme and CSS variables
- **Mobile Support**: Responsive design with mobile-first approach and camera integration for barcode scanning

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with route-based organization
- **Development**: Hot module reloading with Vite integration in development mode
- **Error Handling**: Centralized error handling middleware with structured JSON responses
- **Request Logging**: Custom middleware for API request/response logging

### Data Storage Solutions
- **Database**: PostgreSQL using Neon serverless database
- **ORM**: Drizzle ORM with type-safe queries and schema management
- **Schema Design**: Three main tables:
  - Products: Core product information with barcode, pricing, and inventory
  - Detail Commande: Price history tracking for analytics
  - Product Scans: User interaction tracking for scan analytics
- **Migrations**: Drizzle Kit for database schema migrations and management

### Authentication and Authorization
- Currently no authentication system implemented - appears to be designed for open access barcode scanning

### API Structure
- **Product Operations**: CRUD operations for products with barcode lookup
- **Search Functionality**: Text-based search with category filtering and pagination
- **Analytics Endpoints**: Price history and product analytics with aggregated statistics
- **Scan Tracking**: Recording and counting barcode scans for usage analytics

### Key Features
- **Barcode Scanner**: Browser-based camera integration with BarcodeDetector API and manual input fallback
- **Price Analytics**: Min/max/average price tracking with visual indicators for price positioning
- **Product Management**: Search, filter, and browse products with stock status tracking
- **Mobile Optimization**: Touch-friendly interface with responsive navigation
- **Real-time Data**: Automatic data refreshing and caching strategies

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **Connection Pooling**: @neondatabase/serverless with WebSocket support

### UI and Styling
- **Radix UI**: Accessible component primitives (@radix-ui/react-*)
- **Tailwind CSS**: Utility-first CSS framework with PostCSS processing
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Component variant management

### Development Tools
- **Vite**: Frontend build tool and development server
- **ESBuild**: Backend bundling for production builds
- **TypeScript**: Type safety across frontend, backend, and shared code
- **Drizzle Kit**: Database schema management and migrations

### Browser APIs
- **MediaDevices**: Camera access for barcode scanning
- **BarcodeDetector**: Native barcode detection (with fallback support)
- **WebSocket**: Real-time database connections through Neon

### Validation and Forms
- **Zod**: Runtime type validation and schema parsing
- **React Hook Form**: Form state management with validation
- **Drizzle-Zod**: Auto-generated Zod schemas from database schema

### Development Environment
- **Replit Integration**: Custom development banner and error overlay
- **Hot Reload**: Development-time code updates without full page refresh