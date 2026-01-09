# Soower - Recurring Donation Management Platform

Soower is a full-stack application that enables organizations to manage recurring donations for their projects. Donors can sign up, browse projects, and set up recurring donations with flexible payment intervals.

## Features

### For Donors
- **User Registration & Authentication**: Secure signup and login
- **Browse Projects**: View active projects seeking donations
- **Flexible Recurring Donations**: Weekly, Monthly, Quarterly, Annually, or Custom intervals
- **Subscription Management**: Pause, resume, or cancel subscriptions
- **Payment History**: View all past donations
- **Notifications**: Receive payment reminders and confirmations

### For Admins
- **Dashboard**: Overview of total donors, revenue, and subscriptions
- **Project Management**: Create, edit, and manage donation projects
- **Donor Management**: View and manage registered donors
- **Subscription Tracking**: Monitor all active subscriptions
- **Payment Tracking**: View all payment transactions
- **Analytics**: Revenue charts and performance metrics

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL (via Prisma ORM)
- **Payment Gateway**: Paystack
- **Authentication**: JWT

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Paystack account (for payment processing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd soower
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example environment file and update with your values:
   ```bash
   cp backend/.env.example backend/.env
   ```

   Update the following in `backend/.env`:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random string for JWT signing
   - `PAYSTACK_SECRET_KEY`: Your Paystack secret key
   - `PAYSTACK_PUBLIC_KEY`: Your Paystack public key
   - `FRONTEND_URL`: Your frontend URL (for callbacks)

4. **Set up the database**
   ```bash
   npm run db:setup
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   This will start both the backend (port 5000) and frontend (port 3000).

### Deployment on Replit

1. Import this repository to Replit
2. Add your Replit PostgreSQL database URL to Secrets
3. Add your Paystack keys to Secrets
4. Run `npm run db:setup` in the Shell
5. Click "Run" to start the application

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `JWT_EXPIRES_IN` | JWT expiration (e.g., "7d") |
| `PAYSTACK_SECRET_KEY` | Paystack secret key |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `SMTP_HOST` | Email SMTP host (optional) |
| `SMTP_PORT` | Email SMTP port (optional) |
| `SMTP_USER` | Email SMTP username (optional) |
| `SMTP_PASS` | Email SMTP password (optional) |
| `PORT` | Server port (default: 5000) |
| `FRONTEND_URL` | Frontend URL for callbacks |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new donor
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project (admin)
- `PUT /api/projects/:id` - Update project (admin)
- `DELETE /api/projects/:id` - Delete project (admin)

### Subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions` - Get user's subscriptions
- `POST /api/subscriptions/:id/pause` - Pause subscription
- `POST /api/subscriptions/:id/resume` - Resume subscription
- `POST /api/subscriptions/:id/cancel` - Cancel subscription

### Payments
- `GET /api/payments/verify` - Verify payment callback
- `POST /api/payments/webhook` - Paystack webhook
- `GET /api/payments` - Get user's payments

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/donors` - List all donors
- `GET /api/admin/analytics/revenue` - Revenue analytics

## Creating the First Admin

After setting up the database, you'll need to create an admin account. You can do this by:

1. First registering as a regular user
2. Then updating the user's role in the database:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
   ```

Or use the API endpoint (requires an existing admin):
```bash
POST /api/auth/admin
```

## License

MIT
