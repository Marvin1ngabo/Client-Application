# School Management System - Client Backend

Backend API for the School Management System client application (Parents & Students).

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (access + refresh tokens)
- **Password Hashing**: SHA-512 with salt
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: express-validator
- **API Docs**: Swagger

## Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm or yarn

## Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd school-client-app/backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database connection string
- JWT secrets
- CORS origin
- Other settings

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Database Management
```bash
# Open Prisma Studio (GUI for database)
npm run prisma:studio

# Create a new migration
npm run prisma:migrate

# Generate Prisma client after schema changes
npm run prisma:generate
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## API Documentation

Once the server is running, access Swagger documentation at:
```
http://localhost:5000/api/docs
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new user (Student/Parent)
- `POST /api/auth/login` - Login with device verification
- `POST /api/auth/logout` - Logout and clear session
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user profile

### Device Verification
- `POST /api/devices/register` - Register device
- `GET /api/devices/status` - Check device verification status

### Fees
- `GET /api/fees/balance` - Get fee balance
- `GET /api/fees/history` - Get transaction history
- `POST /api/fees/deposit` - Make fee payment
- `POST /api/fees/withdraw` - Request refund

### Grades
- `GET /api/grades/my` - View own grades

### Attendance
- `GET /api/attendance/my` - View own attendance

### Timetable
- `GET /api/timetable/my` - Get class timetable

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read

## Architecture

### Layered Pattern
```
Route → Middleware → Controller → Service → Model → DTO → Response
```

### Folder Structure
```
/backend
  /src
    /config       - Database, Swagger setup
    /routes       - Express routes
    /controllers  - Request handlers
    /services     - Business logic
    /models       - Prisma schema
    /middlewares  - Auth, rate-limit, error handler
    /dtos         - Data Transfer Objects
    /utils        - Helpers (crypto, JWT, response)
    /validators   - Input validation
  /prisma
    schema.prisma - Database schema
  app.js          - Express app setup
  server.js       - Server entry point
```

## Security Features

- **Password Hashing**: SHA-512 with unique salt per user
- **JWT Authentication**: Access (15min) + Refresh (7d) tokens
- **Device Verification**: Admin approval required for new devices
- **Rate Limiting**: 100 req/15min (general), 10 req/15min (auth)
- **Account Locking**: 5 failed attempts → 30min lock
- **Input Validation**: All inputs sanitized and validated
- **DTOs**: Sensitive fields never exposed in responses
- **CORS**: Configured allowed origins
- **Helmet**: Security headers

## Business Rules

### Fee Management
- Deposit amount must be > 0 with max 2 decimal places
- Withdrawals require admin approval
- Balance cannot go negative
- Transaction references must be unique

### Authentication
- Email must be unique
- Password: min 8 chars, 1 uppercase, 1 number, 1 special char
- Device must be verified before accessing protected routes
- Max 5 failed login attempts

### Academic Records
- Students can only view their own records
- Parents can only view their children's records

## Environment Variables

See `.env.example` for all required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `CORS_ORIGIN` - Allowed frontend origin
- `PORT` - Server port (default: 5000)

## Assumptions

- PostgreSQL is used as the primary database
- Device verification is mandatory for security
- Fee transactions in RWF (Rwandan Franc)
- Single timezone for all operations

## Known Limitations

- Refresh token blacklisting not implemented (consider Redis for production)
- File uploads not supported yet
- Email notifications not implemented
- Real-time features require WebSocket implementation

## Contributing

Follow conventional commit guidelines:
- `feat:` - New features
- `fix:` - Bug fixes
- `chore:` - Maintenance tasks
- `test:` - Test additions/changes
- `docs:` - Documentation updates

## License

ISC
