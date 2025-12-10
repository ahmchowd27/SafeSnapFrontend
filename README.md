# SafeSnap Frontend

## Overview

SafeSnap is a comprehensive incident reporting and management system built with React, TypeScript, and modern web technologies. It provides separate interfaces for workers to report incidents and managers to review, analyze, and manage them using AI-powered Root Cause Analysis.

## Features

### For Workers
- **Incident Reporting**: Create detailed incident reports with photos, audio recordings, and location data
- **Location Services**: Pin incidents on interactive maps with geolocation support
- **Media Upload**: Upload photos and audio recordings directly to AWS S3
- **Real-time Updates**: Track the status of reported incidents
- **Edit Capability**: Modify incidents while they're still open

### For Managers
- **Dashboard & Analytics**: Comprehensive overview with metrics and charts
- **Incident Management**: Review, assign, and update incident statuses
- **AI-Powered RCA**: Automated Root Cause Analysis with five-whys methodology
- **Team Oversight**: View all team incidents with filtering and search
- **Performance Metrics**: Track resolution times and incident trends

### Technical Features
- **Image Analysis**: AI-powered safety hazard detection using Google Vision API
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Data**: React Query for efficient data fetching and caching
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Modern UI**: shadcn/ui components with Tailwind CSS styling
- **Interactive Maps**: React Leaflet integration for location services

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: React Query for server state management
- **Routing**: React Router DOM for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Maps**: React Leaflet for interactive maps
- **Charts**: Recharts for data visualization
- **HTTP Client**: Axios for API communication

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend API server running (SafeSnap backend)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Update the `.env` file with your backend API URL:
```
VITE_API_BASE=http://localhost:8080/api
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── api/           # API client and service functions
├── components/    # Reusable UI components
├── contexts/      # React contexts (Auth, etc.)
├── lib/          # Utility functions and configurations
├── pages/        # Page components
├── types.ts      # TypeScript type definitions
├── App.tsx       # Main application component
├── main.tsx      # Application entry point
└── index.css     # Global styles and Tailwind imports
```

## Key Components

### Authentication
- JWT-based authentication with role-based access control
- Automatic token refresh and logout on expiration
- Protected routes for different user roles

### API Integration
- Centralized API client with request/response interceptors
- Comprehensive error handling and rate limiting support
- Presigned URL support for S3 file uploads

### User Interfaces

#### Worker Dashboard
- Quick incident reporting
- Personal incident history
- Status tracking and updates

#### Manager Dashboard
- Team overview with metrics
- Incident management tools
- AI-powered insights and analytics

## Environment Configuration

The application uses environment variables for configuration:

- `VITE_API_BASE`: Backend API base URL

## Development

### Code Style
- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting (recommended)

### Key Dependencies
- `@tanstack/react-query`: Server state management
- `react-router-dom`: Client-side routing
- `react-hook-form`: Form handling
- `zod`: Schema validation
- `axios`: HTTP client
- `leaflet`: Map functionality
- `recharts`: Data visualization
- `lucide-react`: Icon library

## API Integration

The frontend communicates with the SafeSnap backend API for:
- User authentication and authorization
- Incident CRUD operations
- File upload/download with S3
- AI-powered image analysis
- Root cause analysis generation
- Business metrics and statistics

## Browser Support

- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)

## Contributing

1. Follow the established code style and structure
2. Use TypeScript for all new code
3. Add proper error handling and loading states
4. Test components with different user roles
5. Ensure responsive design works on all screen sizes

## License

This project is licensed under the MIT License.
