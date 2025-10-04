# Alumni Platform Backend

Node.js + Express.js backend API for the Alumni Association Platform.

## Features

- RESTful API with Express.js
- MongoDB database with Mongoose ODM
- JWT authentication and authorization
- Real-time messaging with Socket.io
- File upload with Multer
- Security middleware (Helmet, CORS, Rate limiting)
- Role-based access control
- Input validation and sanitization

## Getting Started

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Set up environment variables:**
   Copy \`.env.example\` to \`.env\` and update the values:
   \`\`\`
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/alumni-platform
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=development
   \`\`\`

3. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Start the production server:**
   \`\`\`bash
   npm start
   \`\`\`

## Project Structure

\`\`\`
backend/
├── config/
│   └── database.js      # Database connection
├── controllers/         # Route controllers
├── middleware/         # Custom middleware
├── models/            # Mongoose models
├── routes/            # API routes
├── utils/             # Utility functions
├── uploads/           # File uploads directory
├── server.js          # Main server file
└── package.json
\`\`\`

## API Endpoints

### Authentication
- \`POST /api/auth/register\` - Register new user
- \`POST /api/auth/login\` - User login
- \`GET /api/auth/me\` - Get current user
- \`POST /api/auth/forgot-password\` - Forgot password

### Users
- \`GET /api/users/directory\` - Get alumni directory
- \`GET /api/users/profile\` - Get user profile
- \`PUT /api/users/profile\` - Update user profile
- \`PUT /api/users/settings\` - Update user settings

### Jobs
- \`GET /api/jobs\` - Get job listings
- \`POST /api/jobs\` - Create job listing
- \`POST /api/jobs/:id/apply\` - Apply for job

### Events
- \`GET /api/events\` - Get events
- \`POST /api/events\` - Create event
- \`POST /api/events/:id/rsvp\` - RSVP to event

### Stories
- \`GET /api/stories\` - Get success stories
- \`POST /api/stories\` - Create success story
- \`POST /api/stories/:id/like\` - Like story

### Chat
- \`GET /api/chat/conversations\` - Get conversations
- \`POST /api/chat/conversations\` - Create conversation
- \`GET /api/chat/conversations/:id/messages\` - Get messages
- \`POST /api/chat/conversations/:id/messages\` - Send message

### Admin
- \`GET /api/admin/stats\` - Get dashboard stats
- \`GET /api/admin/users\` - Manage users
- \`GET /api/admin/reports\` - Get reports

## Environment Variables

- \`PORT\` - Server port (default: 5000)
- \`MONGO_URI\` - MongoDB connection string
- \`JWT_SECRET\` - JWT signing secret
- \`NODE_ENV\` - Environment (development/production)

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization
- Role-based access control

## Real-time Features

- Socket.io for real-time messaging
- Live notifications
- Online status tracking
\`\`\`

\`\`\`

\`\`\`
