# API Integration Setup

Ang frontend ay nakakonekta na sa Laravel API backend.

## Setup Instructions

### 1. Backend Setup (Laravel)

```bash
cd laravel-api

# Install dependencies (if not done)
composer install

# Run migrations
php artisan migrate

# Seed users
php artisan db:seed

# Create storage link for file uploads
php artisan storage:link

# Start server
php artisan serve
```

Ang API ay magiging available sa `http://localhost:8000/api`

### 2. Frontend Setup

```bash
cd capstone-2-new-category

# Install dependencies (if not done)
npm install

# Create .env file (optional, default is http://localhost:8000/api)
# VITE_API_BASE_URL=http://localhost:8000/api

# Start dev server
npm run dev
```

### 3. Default User Accounts

Ang mga sumusunod na accounts ay naka-seed na:

- **Registrar**: registrar@ptc.edu.ph / registrar123
- **Admin**: admin@ptc.edu.ph / admin123
- **SuperAdmin**: superadmin@ptc.edu.ph / superadmin123
- **Academic**: academic@ptc.edu.ph / academic123
- **Student**: hamaulay@ptc.edu.ph / maulay12345

## API Endpoints

### Authentication
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Tickets
- `GET /api/tickets` - Get all tickets (with filters)
- `GET /api/tickets/{id}` - Get ticket by ID
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/{id}` - Update ticket
- `PUT /api/tickets/{id}/status` - Update ticket status
- `PUT /api/tickets/{id}/priority` - Update ticket priority
- `POST /api/tickets/{id}/appointment` - Set appointment
- `DELETE /api/tickets/{id}` - Delete ticket

### Comments
- `POST /api/tickets/{ticketId}/comments` - Add comment
- `DELETE /api/comments/{id}` - Delete comment

### Documents
- `GET /api/documents` - Get all documents
- `GET /api/documents/{id}` - Get document by ID
- `POST /api/documents` - Upload document
- `PUT /api/documents/{id}/status` - Update document status
- `DELETE /api/documents/{id}` - Delete document

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/{id}/read` - Mark as read
- `DELETE /api/notifications` - Clear all notifications

### Registration Requests
- `GET /api/registration-requests` - Get all requests
- `POST /api/registration-requests` - Submit registration
- `POST /api/registration-requests/{id}/approve` - Approve request
- `POST /api/registration-requests/{id}/reject` - Reject request

## Authentication

Lahat ng API endpoints (maliban sa login) ay nangangailangan ng authentication token. Ang token ay awtomatikong idinadagdag sa request headers ng axios interceptor.

Ang token ay naka-store sa `localStorage` bilang `auth_token`.

## File Structure

- `services/api.ts` - API service functions
- `context/DataContext.tsx` - Updated to use API instead of mock data
- `components/Login.tsx` - Updated to handle async login

## Notes

- Ang frontend ay automatic na naglo-load ng data kapag may logged-in user
- Ang authentication token ay automatic na idinadagdag sa lahat ng API requests
- Kapag 401 (Unauthorized), automatic na naglo-logout at redirect sa login page
- Ang ticket IDs ay nasa format na `TICKET-1`, `TICKET-2`, etc.

