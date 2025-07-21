# Timetracker API Documentation

This document provides comprehensive documentation for the Timetracker backend API endpoints.

## Base URL
```
http://localhost:3000/api
```

## Authentication

All protected endpoints require authentication via JWT tokens stored in HTTP-only cookies. The authentication is handled automatically by the browser after successful login.

### Authentication Flow
1. User logs in via `/api/auth/login`
2. Server sets HTTP-only cookie with JWT token
3. Subsequent requests automatically include the cookie
4. User logs out via `/api/auth/logout` to clear the cookie

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
Login user and create session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "role": "EMPLOYEE",
      "profile": {
        "fullName": "John Doe",
        "province": "ON",
        "vacationBalance": 15
      }
    }
  },
  "message": "Login successful"
}
```

#### POST /api/auth/logout
Logout user and clear session.

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### POST /api/auth/register
Register new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "fullName": "Jane Smith",
  "province": "BC"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "newuser@example.com",
      "role": "EMPLOYEE",
      "profile": {
        "fullName": "Jane Smith",
        "province": "BC",
        "vacationBalance": 15
      }
    }
  },
  "message": "User registered successfully"
}
```

#### GET /api/auth/me
Get current user profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "role": "EMPLOYEE",
      "profile": {
        "fullName": "John Doe",
        "province": "ON",
        "vacationBalance": 15
      }
    }
  }
}
```

### Timesheet Endpoints

#### GET /api/timesheets
Get timesheets with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (DRAFT, SUBMITTED, APPROVED, REJECTED)
- `userId` (optional): Filter by user ID (managers/admins only)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "timesheet-id",
      "weekEnding": "2024-01-07T00:00:00.000Z",
      "status": "SUBMITTED",
      "totalHours": 40,
      "submittedAt": "2024-01-08T09:00:00.000Z",
      "user": {
        "id": "user-id",
        "email": "user@example.com",
        "profile": {
          "fullName": "John Doe"
        }
      },
      "entries": [
        {
          "id": "entry-id",
          "date": "2024-01-01T00:00:00.000Z",
          "hoursWorked": 8,
          "description": "Regular work day"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### POST /api/timesheets
Create new timesheet.

**Request Body:**
```json
{
  "weekEnding": "2024-01-07",
  "entries": [
    {
      "date": "2024-01-01",
      "hoursWorked": 8,
      "description": "Regular work day"
    },
    {
      "date": "2024-01-02",
      "hoursWorked": 8,
      "description": "Project meeting and development"
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "timesheet-id",
    "weekEnding": "2024-01-07T00:00:00.000Z",
    "status": "DRAFT",
    "totalHours": 16,
    "entries": [...]
  },
  "message": "Timesheet created successfully"
}
```

#### GET /api/timesheets/[id]
Get specific timesheet by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "timesheet-id",
    "weekEnding": "2024-01-07T00:00:00.000Z",
    "status": "SUBMITTED",
    "totalHours": 40,
    "entries": [...]
  }
}
```

#### PUT /api/timesheets/[id]
Update timesheet (only DRAFT status).

**Request Body:**
```json
{
  "entries": [
    {
      "date": "2024-01-01",
      "hoursWorked": 9,
      "description": "Updated work day"
    }
  ]
}
```

#### DELETE /api/timesheets/[id]
Delete timesheet (only DRAFT status).

**Response (200):**
```json
{
  "success": true,
  "message": "Timesheet deleted successfully"
}
```

#### POST /api/timesheets/[id]/approve
Approve or reject timesheet (managers/admins only).

**Request Body:**
```json
{
  "action": "APPROVE",
  "approverComments": "Looks good, approved!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "timesheet-id",
    "status": "APPROVED",
    "approvedAt": "2024-01-08T10:00:00.000Z",
    "approverComments": "Looks good, approved!"
  },
  "message": "Timesheet approved successfully"
}
```

### Vacation Request Endpoints

#### GET /api/vacation/requests
Get vacation requests with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (PENDING, APPROVED, REJECTED)
- `userId` (optional): Filter by user ID (managers/admins only)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "request-id",
      "startDate": "2024-02-01T00:00:00.000Z",
      "endDate": "2024-02-05T00:00:00.000Z",
      "requestType": "VACATION",
      "status": "PENDING",
      "daysRequested": 5,
      "reason": "Family vacation",
      "submittedAt": "2024-01-15T09:00:00.000Z",
      "user": {
        "id": "user-id",
        "email": "user@example.com",
        "profile": {
          "fullName": "John Doe",
          "province": "ON"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

#### POST /api/vacation/requests
Create new vacation request.

**Request Body:**
```json
{
  "startDate": "2024-02-01",
  "endDate": "2024-02-05",
  "requestType": "VACATION",
  "reason": "Family vacation"
}
```

**Request Types:**
- `VACATION`: Paid vacation time
- `SICK`: Sick leave
- `PERSONAL`: Personal time off
- `BEREAVEMENT`: Bereavement leave
- `MATERNITY`: Maternity leave
- `PATERNITY`: Paternity leave

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "request-id",
    "startDate": "2024-02-01T00:00:00.000Z",
    "endDate": "2024-02-05T00:00:00.000Z",
    "requestType": "VACATION",
    "status": "PENDING",
    "daysRequested": 5,
    "reason": "Family vacation"
  },
  "message": "Vacation request submitted successfully"
}
```

#### GET /api/vacation/requests/[id]
Get specific vacation request by ID.

#### PUT /api/vacation/requests/[id]
Update vacation request (only PENDING status).

#### DELETE /api/vacation/requests/[id]
Delete vacation request (only PENDING status).

#### POST /api/vacation/requests/[id]/approve
Approve or reject vacation request (managers/admins only).

**Request Body:**
```json
{
  "action": "APPROVE",
  "reviewComments": "Approved for the requested dates"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "request-id",
    "status": "APPROVED",
    "reviewedAt": "2024-01-16T10:00:00.000Z",
    "reviewComments": "Approved for the requested dates"
  },
  "message": "Vacation request approved successfully"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid input data",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Manager role required."
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "You already have a vacation request for overlapping dates"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Role-Based Access Control

### Employee Role
- Can view/create/update/delete their own timesheets (DRAFT only)
- Can view/create/update/delete their own vacation requests (PENDING only)
- Cannot approve timesheets or vacation requests
- Cannot view other users' data

### Manager Role
- All Employee permissions
- Can view all timesheets and vacation requests
- Can approve/reject timesheets and vacation requests
- Cannot approve their own requests

### Admin Role
- All Manager permissions
- Full system access
- Can manage user accounts (future feature)

## Email Notifications

The system automatically sends email notifications for:

### Timesheet Events
- **Submission**: Notifies managers when employee submits timesheet
- **Approval**: Notifies employee when timesheet is approved
- **Rejection**: Notifies employee when timesheet is rejected

### Vacation Request Events
- **Submission**: Notifies managers when employee submits vacation request
- **Approval**: Notifies employee when vacation request is approved
- **Rejection**: Notifies employee when vacation request is rejected

## Database Setup

Before using the API, ensure the database is set up:

```bash
# Install dependencies
npm install

# Set up database (PostgreSQL)
npm run db:setup

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

## Environment Variables

Required environment variables (see `.env.example`):

```env
# Database
DATABASE_URL="postgresql://timetracker:password@localhost:5432/timetracker"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@timetracker.com"
```

## Frontend Integration Notes

### Authentication State Management
- Check authentication status on app load with `/api/auth/me`
- Handle 401 responses by redirecting to login
- Store user data in React state/context

### Error Handling
- All API responses follow consistent format
- Check `success` field in response
- Display `error` message to users
- Handle validation errors from `details` array

### Date Handling
- API expects dates in ISO format (YYYY-MM-DD)
- API returns dates in ISO 8601 format
- Convert dates appropriately in frontend

### Pagination
- Use `page` and `limit` query parameters
- Response includes pagination metadata
- Implement pagination controls in UI

This completes the comprehensive backend API implementation for the Timetracker application.