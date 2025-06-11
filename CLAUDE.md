# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HR-OSS is a comprehensive Japanese HR SaaS system with employee management, payroll calculation (Japanese labor law compliant), attendance tracking, and real-time analytics dashboard. It's a full-stack TypeScript application with separate frontend and backend services.

## Architecture

### Monorepo Structure
- `backend/` - Node.js/Express API server with Prisma ORM
- `frontend/` - React 18 application with TypeScript and Tailwind CSS
- Shared database via PostgreSQL with multi-tenant architecture (company-based isolation)

### Key Architectural Patterns
- **Multi-tenant Architecture**: All data is scoped by `companyId` for complete tenant isolation
- **Role-based Access Control**: Four user roles (ADMIN, HR_STAFF, MANAGER, EMPLOYEE) with hierarchical permissions
- **Japanese Labor Law Compliance**: Comprehensive payroll calculations with overtime rules, social insurance, and tax withholding
- **Real-time Dashboard**: Live KPI monitoring with auto-refresh and alert systems

### Data Layer
- **Prisma ORM** with PostgreSQL for type-safe database operations
- **Multi-tenant Data Model**: Company → Departments → Employees with position hierarchy
- **Complex Relations**: Attendance records link to payroll calculations, leave balances track across years

## Development Commands

### Backend (`/backend`)
```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to dist/
npm run start        # Start production server
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix

# Database operations
npm run db:generate  # Generate Prisma client types
npm run db:push      # Push schema changes to database
npm run db:migrate   # Create and run migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
```

### Frontend (`/frontend`)
```bash
npm start           # Start React development server
npm run build       # Build for production
npm test            # Run React tests
```

### Root Level
```bash
npm run dev         # Start both frontend and backend concurrently
npm install         # Install dependencies for both services
```

## Environment Setup

### Required Environment Variables (backend/.env)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `NODE_ENV` - development/production
- `PORT` - API server port (default: 3001)
- `FRONTEND_URL` - CORS origin (default: http://localhost:3000)

Copy `backend/.env.example` to `backend/.env` and adjust values.

## Database Schema Key Points

### Multi-tenant Design
All models include `companyId` for tenant isolation. Always filter queries by company context.

### Employee-Centric Relations
```
Company → Department → Employee → Attendance/Payroll/LeaveBalance
```

### Japanese Payroll Specifics
- `Payroll` model includes detailed Japanese social insurance fields (healthInsurance, pensionInsurance, employmentInsurance, longCareInsurance)
- `PayrollItem` for granular salary components (allowances, deductions)
- `SalaryTemplate` for position-based salary structures

## Critical Business Logic

### Payroll Calculation (`/backend/src/utils/payrollCalculation.ts`)
- Implements Japanese labor law overtime rates (25%/50% premiums)
- Calculates social insurance based on 2024 rates
- Handles income tax withholding using Japanese tax tables
- Must use Decimal for precision in financial calculations

### Authentication & Authorization
- JWT-based auth with role hierarchy
- Route-level protection via `requireRole()` middleware
- Company-scoped data access is mandatory

### Attendance Processing
- Automatic overtime calculation with Japanese law compliance
- Break time deduction and late arrival tracking
- Monthly summaries with attendance rate calculations

## API Documentation

Comprehensive Swagger/OpenAPI documentation available at `/api-docs` when backend is running. All endpoints are documented with:
- Request/response schemas
- Authentication requirements
- Role-based access control
- Japanese business logic explanations

## Frontend Architecture

### Component Organization
- Feature-based folder structure (`components/{feature}/`)
- Shared contexts for authentication and global state
- Service layer for API communication with proper error handling

### Key Frontend Patterns
- React Query for server state management
- Form validation with react-hook-form + Zod
- Tailwind CSS for styling with consistent design system
- Role-based UI rendering and navigation

## Testing Strategy

### Backend Tests
- Jest with Supertest for API integration tests
- Database operations should use test database
- Mock external services (email, file uploads)

### Frontend Tests
- React Testing Library for component tests
- Mock API calls in tests

## Key Business Rules

### Japanese Labor Law Compliance
- Standard work hours: 8 hours/day, 40 hours/week
- Overtime premium: 25% for first 60 hours/month, 50% beyond
- Social insurance calculations must use current year rates
- Payroll status workflow: CALCULATED → APPROVED → PAID

### Multi-tenant Security
- All database queries MUST include company filtering
- User actions are limited to their company's data
- Role permissions are hierarchical (ADMIN > HR_STAFF > MANAGER > EMPLOYEE)

## Performance Considerations

### Database Optimization
- Use Prisma's `include` and `select` for efficient queries
- Implement pagination for large datasets
- Index commonly queried fields (employeeId, companyId, date ranges)

### Frontend Performance
- Dashboard implements auto-refresh (5 min intervals)
- Use React.memo for expensive components
- Implement proper loading states for better UX

## Error Handling

### Backend
- Centralized error handling middleware
- Proper HTTP status codes
- Detailed error logging for debugging

### Frontend
- Global error boundaries
- User-friendly error messages in Japanese
- Proper loading and error states