# OneBooking Central Dashboard

A unified booking management system that aggregates bookings from multiple adventure park websites (Hanuman World, Flying Hanuman, Hanuman Luge, etc.) into a single dashboard.

## Features

- **Multi-tenant Dashboard**: View and manage bookings from all connected websites
- **Real-time Sync**: Receive bookings from source websites via API
- **Bidirectional Updates**: Changes made in OneBooking sync back to source websites
- **Role-based Access Control**: Superadmin, Admin, and Staff roles
- **Booking Management**: View, edit, and manage booking status
- **Website Management**: Register and configure source websites
- **Sync Logs**: Monitor sync events and debug issues

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses the following tables:

- **websites**: Registered source websites with API keys
- **bookings**: All bookings from all sources (denormalized)
- **sync_logs**: Track sync events for debugging
- **admin_users**: Admin user profiles with roles

## API Endpoints

### Public (API Key Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bookings/sync` | POST | Receive bookings from source websites |

### Protected (Admin Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bookings` | GET | List bookings with filters |
| `/api/bookings/[id]` | GET, PUT | Get/Update booking |
| `/api/websites` | GET, POST | List/Create websites |
| `/api/websites/[id]` | GET, PUT | Get/Update website |

## Source Website Integration

To integrate a source website with OneBooking:

1. Register the website in the dashboard
2. Copy the API key and webhook secret
3. Configure the source website to:
   - POST to `/api/bookings/sync` after payment confirmation
   - Handle incoming webhooks at the configured webhook URL

See the [ONEBOOKING_INTEGRATION.md](./docs/ONEBOOKING_INTEGRATION.md) for detailed integration instructions.

## License

Private - All rights reserved
