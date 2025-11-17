# DevCollab Backend

A robust backend API for the DevCollab collaborative development platform, built with Node.js and Express.

## 🚀 Features

-  **RESTful API**: Well-structured REST endpoints for all operations
-  **Real-time Communication**: Socket.io integration for live collaboration
-  **Authentication**: JWT-based user authentication and authorization
-  **Database**: SQLite3 for lightweight, file-based data storage
-  **Security**: Password hashing with bcryptjs
-  **CORS Support**: Cross-origin resource sharing enabled
-  **Environment Configuration**: Secure environment variable management

## 🛠️ Tech Stack

-  **Runtime**: Node.js
-  **Framework**: Express 5
-  **Database**: SQLite3
-  **Authentication**: JSON Web Tokens (JWT)
-  **Password Hashing**: bcryptjs
-  **Real-time**: Socket.io
-  **CORS**: cors middleware
-  **Environment**: dotenv

## 📋 Prerequisites

-  Node.js (v18 or higher)
-  npm or yarn

## 🚀 Getting Started

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the backend directory:

   ```env
   PORT=3000
   JWT_SECRET=your_jwt_secret_here
   DATABASE_URL=./database.sqlite
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 📜 Available Scripts

-  `npm run dev` - Start development server with nodemon
-  `npm start` - Start production server
-  `npm run init-db` - Initialize database schema

## 🗄️ Database

The application uses SQLite3 for data persistence. The database file is created automatically when the server starts.

### Database Schema

-  **Users**: User accounts and authentication data
-  **Projects**: Collaborative projects
-  **Files**: Code files within projects
-  **Sessions**: Real-time collaboration sessions

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📡 API Endpoints

### Authentication

-  `POST /api/auth/register` - User registration
-  `POST /api/auth/login` - User login
-  `GET /api/auth/profile` - Get user profile

### Projects

-  `GET /api/projects` - List user projects
-  `POST /api/projects` - Create new project
-  `GET /api/projects/:id` - Get project details
-  `PUT /api/projects/:id` - Update project
-  `DELETE /api/projects/:id` - Delete project

### Files

-  `GET /api/projects/:projectId/files` - List project files
-  `POST /api/projects/:projectId/files` - Create new file
-  `GET /api/files/:id` - Get file content
-  `PUT /api/files/:id` - Update file content
-  `DELETE /api/files/:id` - Delete file

## 🔧 Real-time Features

The backend supports real-time collaboration through Socket.io:

### Events

-  `join-project` - Join a project room
-  `leave-project` - Leave a project room
-  `file-update` - Real-time file content updates
-  `cursor-position` - Live cursor positions
-  `user-joined` - User joined notification
-  `user-left` - User left notification

## 🚀 Deployment

### Deploy to Render

1. **Connect your repository** to Render
2. **Set environment variables** in Render dashboard:
   -  `PORT` (automatically set by Render)
   -  `JWT_SECRET`
   -  `NODE_ENV=production`
3. **Deploy**

### Environment Variables for Production

```env
PORT=10000
JWT_SECRET=your_secure_jwt_secret
NODE_ENV=production
DATABASE_URL=./database.sqlite
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic services
│   ├── utils/          # Utility functions
│   ├── config/         # Configuration files
│   ├── app.js          # Express app setup
│   └── server.js       # Server entry point
├── database/           # Database files
├── .env                # Environment variables
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## 🧪 Testing

```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
