# **DevCollab (Flow) - Complete Documentation for UML Diagram Creation**

## **Project Overview**

**Repository**: https://github.com/AaryaBalan/Flow  
**Name**: DevCollab (Flow)  
**Type**: Unified Collaborative Development Platform  
**Description**: A comprehensive project management and collaboration platform that unifies project management, real-time communication, activity tracking, AI assistance, and GitHub integration into a single interface for technical teams.

---

## **🎯 Project Purpose**

DevCollab solves the problem of context-switching between multiple tools (averaging 8-12 tools per team). It provides:
- **Project Management** with task tracking and status monitoring
- **Real-Time Collaboration** via Socket.io live chat
- **Non-Invasive Activity Tracking** (voluntary and transparent)
- **AI-Powered Assistance** for code analysis and recommendations
- **GitHub Integration** for repository browsing and analysis
- **Team Analytics** with productivity insights
- **Rich Documentation** with note-taking capabilities

---

## **🏗️ System Architecture**

### **Technology Stack**

**Frontend:**
- React 19 + Vite 7
- Tailwind CSS 4
- Socket.io Client
- React Router DOM
- Axios (HTTP client)
- React Quill (Rich text editor)
- React Hot Toast (Notifications)
- Lucide React (Icons)
- Recharts (Data visualization)

**Backend:**
- Node.js 18+
- Express 5
- SQLite3 (Database)
- Socket.io (Real-time communication)
- JWT (Authentication)
- bcryptjs (Password hashing)
- Axios (External API calls)

**External Integrations:**
- OpenRouter API (AI functionality)
- GitHub API (Repository data)
- Microsoft Teams Webhooks (Notifications)

---

## **📊 Database Schema**

### **1. Users Table**
```
Users
├── id (PK, INTEGER, AUTOINCREMENT)
├── name (TEXT, NOT NULL)
├── email (TEXT, UNIQUE, NOT NULL)
├── password (TEXT, NOT NULL - bcrypt hashed)
├── designation (TEXT)
├── company (TEXT)
├── location (TEXT)
├── phone (TEXT)
├── about (TEXT)
├── skills (TEXT)
├── experience (TEXT)
├── github (TEXT)
├── linkedin (TEXT)
├── setupCompleted (INTEGER, DEFAULT 0)
├── currentStatus (TEXT, DEFAULT 'active')
├── workTimeToday (INTEGER, DEFAULT 0)
├── lastBreakTime (DATETIME)
├── lastStatusChange (DATETIME)
├── workSessionStart (DATETIME)
└── createdAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
```

### **2. Projects Table**
```
Projects
├── id (PK, INTEGER, AUTOINCREMENT)
├── title (TEXT, NOT NULL)
├── description (TEXT, NOT NULL)
├── authorId (INTEGER, FK -> Users.id, NOT NULL)
├── authorName (TEXT, NOT NULL)
├── joinCode (TEXT, UNIQUE, NOT NULL)
├── status (TEXT, DEFAULT 'Active')
├── progress (INTEGER, DEFAULT 0)
├── dueDate (DATETIME)
├── githubRepoUrl (TEXT)
├── githubOwner (TEXT)
├── githubRepo (TEXT)
└── createdAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
```

### **3. ProjectMembers Table (Junction Table)**
```
ProjectMembers
├── id (PK, INTEGER, AUTOINCREMENT)
├── projectId (INTEGER, FK -> Projects.id, NOT NULL)
├── userId (INTEGER, FK -> Users.id, NOT NULL)
├── invitationStatus (TEXT, DEFAULT 'approved')
├── joinedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
└── UNIQUE(projectId, userId)
```

### **4. Tasks Table**
```
Tasks
├── id (PK, INTEGER, AUTOINCREMENT)
├── projectId (INTEGER, FK -> Projects.id, NOT NULL)
├── title (TEXT, NOT NULL)
├── description (TEXT)
├── taskAuthor (TEXT, NOT NULL)
├── taskAuthorId (INTEGER, FK -> Users.id, NOT NULL)
├── createdBy (TEXT, NOT NULL)
├── createdById (INTEGER, FK -> Users.id, NOT NULL)
├── completed (INTEGER, DEFAULT 0)
├── completedBy (TEXT)
├── completedById (INTEGER, FK -> Users.id)
├── completionDate (DATETIME)
├── onlyAuthorCanComplete (INTEGER, DEFAULT 0)
├── dueDate (DATETIME)
└── createdAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
```

### **5. Notes Table**
```
Notes
├── id (PK, INTEGER, AUTOINCREMENT)
├── projectId (INTEGER, FK -> Projects.id, NOT NULL)
├── title (TEXT, NOT NULL)
├── content (TEXT, NOT NULL)
├── createdBy (INTEGER, FK -> Users.id, NOT NULL)
├── createdByName (TEXT, NOT NULL)
├── updatedBy (INTEGER, FK -> Users.id)
├── updatedByName (TEXT)
├── isDeleted (INTEGER, DEFAULT 0)
├── createdAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
└── updatedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
```

### **6. NotePermissions Table**
```
NotePermissions
├── id (PK, INTEGER, AUTOINCREMENT)
├── noteId (INTEGER, FK -> Notes.id, NOT NULL)
├── userId (INTEGER, FK -> Users.id, NOT NULL)
├── canEdit (INTEGER, DEFAULT 0)
├── canDelete (INTEGER, DEFAULT 0)
├── grantedBy (INTEGER, FK -> Users.id, NOT NULL)
├── grantedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
└── UNIQUE(noteId, userId)
```

### **7. ActivityLogs Table**
```
ActivityLogs
├── id (PK, INTEGER, AUTOINCREMENT)
├── userId (INTEGER, FK -> Users.id, NOT NULL)
├── activityType (TEXT, NOT NULL)
├── status (TEXT)
├── timestamp (DATETIME, DEFAULT CURRENT_TIMESTAMP)
└── metadata (TEXT - JSON)
```

### **8. ChatMessages Table**
```
ChatMessages
├── id (PK, INTEGER, AUTOINCREMENT)
├── projectId (INTEGER, FK -> Projects.id, NOT NULL)
├── userId (INTEGER, FK -> Users.id, NOT NULL)
├── userName (TEXT, NOT NULL)
├── messageText (TEXT, NOT NULL)
├── messageType (TEXT - 'text', 'system', 'notification')
├── isDeleted (INTEGER, DEFAULT 0)
├── editedAt (DATETIME)
└── createdAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
```

### **9. AIChatMessages Table**
```
AIChatMessages
├── id (PK, INTEGER, AUTOINCREMENT)
├── projectId (INTEGER, FK -> Projects.id, NOT NULL)
├── userId (INTEGER, FK -> Users.id, NOT NULL)
├── messageType (TEXT - 'user', 'ai')
├── messageText (TEXT, NOT NULL)
└── createdAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
```

---

## **🔗 Entity Relationships**

### **One-to-Many Relationships:**
1. **User → Projects** (1:N) - A user can create multiple projects
2. **User → Tasks (as author)** (1:N) - A user can be assigned multiple tasks
3. **User → Tasks (as creator)** (1:N) - A user can create multiple tasks
4. **User → Notes** (1:N) - A user can create multiple notes
5. **User → ActivityLogs** (1:N) - A user has multiple activity entries
6. **User → ChatMessages** (1:N) - A user sends multiple chat messages
7. **User → AIChatMessages** (1:N) - A user has multiple AI conversations
8. **Project → Tasks** (1:N) - A project contains multiple tasks
9. **Project → Notes** (1:N) - A project has multiple notes
10. **Project → ChatMessages** (1:N) - A project has a chat history
11. **Note → NotePermissions** (1:N) - A note can have multiple permissions

### **Many-to-Many Relationships:**
1. **User ↔ Projects** (N:M) via **ProjectMembers** - Users can join multiple projects, projects have multiple members

---

## **🎭 System Components**

### **1. Authentication System**
- **JWT-based authentication**
- **Password hashing** (bcryptjs)
- **Route protection** middleware
- **Session management**
- **Setup completion** tracking

### **2. Project Management Module**
**Components:**
- Project creation with join codes
- Project membership management
- Progress calculation based on due dates
- Status tracking (Active/Completed/Overdue)
- Project invitation system

**Key Features:**
- Unique 6-digit join codes
- Automatic progress calculation
- Member invitation/approval workflow
- Project analytics

### **3. Task Management Module**
**Components:**
- Task creation and assignment
- Task completion tracking
- Priority levels
- Due date management
- Task restrictions (author-only completion)

**Key Features:**
- Multi-user task assignment
- Status indicators (Active/Completed/Overdue)
- Task descriptions
- Completion tracking with timestamps

### **4. Real-Time Chat System**
**Components:**
- Socket.io-based messaging
- Project-specific chat rooms
- User presence tracking
- Typing indicators
- Rate limiting

**Key Features:**
- Real-time message delivery
- Message history with pagination
- Message editing and deletion
- User join/leave notifications
- Idle detection (5 minutes)

**Socket Events:**
- `join-project-chat` - Join a project room
- `send-message` - Send a message
- `start-typing` - Start typing indicator
- `stop-typing` - Stop typing indicator
- `user-joined` - User joined notification
- `user-left` - User left notification
- `new-message` - Receive new message
- `message-deleted` - Message deletion event

### **5. Notes & Documentation System**
**Components:**
- Rich text editor (React Quill)
- Note creation and editing
- Permission-based access control
- Soft deletion

**Permission Levels:**
- **Creator**: Full access (edit, delete, grant permissions)
- **Project Author**: Full access
- **Granted Users**: Specific permissions (canEdit, canDelete)
- **Members**: Read-only by default

### **6. Activity Tracking System**
**Components:**
- Voluntary status tracking
- Work time calculation
- Break management
- Activity history
- Daily reset mechanism

**Features:**
- Real-time status updates (active/break)
- Automatic time tracking
- Smart break suggestions
- Activity timeline
- Microsoft Teams integration
- Non-invasive polling (30 seconds)

**Activity Types:**
- `status_change` - Active ↔ Break
- `work_session` - Work time tracking
- `break_session` - Break duration
- `daily_summary` - End of day report

### **7. AI Assistant Module**
**Components:**
- OpenRouter API integration
- Context-aware responses
- Project-specific conversations
- Message history

**Capabilities:**
- GitHub repository analysis
- Code recommendations
- Project insights
- Technical Q&A

### **8. GitHub Integration**
**Components:**
- Repository linking
- File tree browsing
- Code viewer with syntax highlighting
- Repository statistics
- Caching layer (1-hour TTL)

**Features:**
- Public repository support
- Rate limit management
- Language distribution analysis
- Repository metrics (stars, forks, issues)
- Commit history viewing

---

## **🌐 API Endpoints**

### **User Routes** (`/api/users`)
```
POST   /register                   - Register new user
POST   /login                      - User login
GET    /:id                        - Get user by ID
PUT    /:id                        - Update user profile
POST   /:id/complete-setup         - Complete user setup
POST   /:id/status                 - Toggle work/break status
GET    /:id/activity               - Get user activity
GET    /:id/today-tasks            - Get tasks completed today
GET    /:id/active-projects-count  - Get active projects count
POST   /reset-daily-work           - Reset daily work counters
```

### **Project Routes** (`/api/projects`)
```
POST   /create                     - Create new project
GET    /user/:userId               - Get user's projects
GET    /:projectId                 - Get project details
PUT    /:projectId                 - Update project
DELETE /:projectId                 - Delete project
POST   /join                       - Join project via code
GET    /:projectId/members         - Get project members
DELETE /:projectId/members/:userId - Remove member
POST   /:projectId/invite          - Send invitation
GET    /:projectId/invitations     - Get pending invitations
PUT    /invitations/:invitationId  - Respond to invitation
POST   /:projectId/link-github     - Link GitHub repository
GET    /:projectId/github          - Get linked GitHub repo
DELETE /:projectId/github          - Unlink GitHub repo
GET    /:projectId/stats           - Get project statistics
```

### **Task Routes** (`/api/tasks`)
```
POST   /create                     - Create new task
GET    /project/:projectId         - Get project tasks
GET    /:taskId                    - Get task details
PUT    /:taskId                    - Update task
DELETE /:taskId                    - Delete task
PUT    /:taskId/complete           - Mark task complete
PUT    /:taskId/incomplete         - Mark task incomplete
GET    /user/:userId               - Get user's tasks
GET    /user/:userId/overdue       - Get overdue tasks
```

### **Note Routes** (`/api/notes`)
```
POST   /                           - Create new note
GET    /project/:projectId         - Get project notes
GET    /:noteId                    - Get note details
PUT    /:noteId                    - Update note
DELETE /:noteId                    - Delete note (soft delete)
POST   /:noteId/permissions        - Grant permissions
GET    /:noteId/permissions        - Get note permissions
DELETE /:noteId/permissions/:userId - Revoke permissions
```

### **Chat Routes** (`/api/chat`)
```
GET    /history/:projectId         - Get chat history
POST   /send                       - Send message
PUT    /edit/:messageId            - Edit message
DELETE /delete/:messageId          - Delete message
```

### **AI Chat Routes** (`/api/ai-chat`)
```
GET    /:projectId/messages        - Get AI chat messages
POST   /message                    - Send AI chat message
POST   /analyze-repo               - Analyze GitHub repository
```

### **GitHub Routes** (`/api/github`)
```
GET    /repo/:owner/:repo          - Get repository details
GET    /repo/:owner/:repo/tree     - Get repository tree
GET    /repo/:owner/:repo/file     - Get file content
GET    /repo/:owner/:repo/stats    - Get repository statistics
```

---

## **🔄 Real-Time Communication Flow**

### **Socket.io Architecture**

**Connection Flow:**
1. Client connects to server
2. Server assigns socket ID
3. Client emits `join-project-chat` with credentials
4. Server validates membership
5. User joins project room (`project-${projectId}`)
6. Server broadcasts `user-joined` event

**Message Flow:**
1. User sends message via socket
2. Server validates rate limits
3. Server checks project membership
4. Message saved to database
5. Server broadcasts to room
6. All clients receive `new-message` event

**Typing Indicator Flow:**
1. User starts typing
2. Client emits `start-typing`
3. Server broadcasts to room (excludes sender)
4. Timeout clears typing status (3 seconds)
5. User stops typing explicitly with `stop-typing`

---

## **🔐 Security Features**

1. **Authentication**
   - JWT token-based authentication
   - Password hashing with bcryptjs
   - Token expiration management

2. **Authorization**
   - Project membership verification
   - Note permission system
   - Task completion restrictions
   - API endpoint protection

3. **Input Validation**
   - Express-validator middleware
   - SQL injection prevention
   - XSS protection

4. **Rate Limiting**
   - Chat message rate limiting (5 messages/10 seconds)
   - GitHub API caching (1-hour TTL)
   - Activity tracking throttling (30-second intervals)

5. **Data Privacy**
   - Voluntary activity tracking
   - User-controlled data visibility
   - Soft deletion for sensitive data

---

## **📱 Frontend Architecture**

### **Page Structure**

**Public Routes:**
- `/auth` - Authentication page (Login/Register)
- `/setup` - Initial profile setup

**Protected Routes:**
- `/` - Home dashboard
- `/projects` - Projects listing
- `/ai` - Global AI assistant
- `/profile` - User profile
- `/profile/:userId` - Other user profiles

**Project-Specific Routes:**
- `/project/:projectId/task` - Task management
- `/project/:projectId/notes` - Notes listing
- `/project/:projectId/notes/:noteId` - Note detail
- `/project/:projectId/ai` - Project AI assistant
- `/project/:projectId/chat` - Real-time chat
- `/project/:projectId/peoples` - Project members
- `/project/:projectId/stats` - Project analytics
- `/project/:projectId/github` - GitHub integration

### **State Management**
- **Local State**: Component-level React state
- **Context API**: User authentication state
- **localStorage**: User session persistence
- **Socket.io**: Real-time state synchronization

### **Key Components**

**Layout Components:**
- `Navbar` - Navigation bar
- `Home` - Main layout wrapper
- `SingleProjectPage` - Project layout

**Feature Components:**
- `AuthPage` - Login/Register
- `SetupPage` - Profile setup
- `AiComponent` - AI chat interface
- `AiChatOutput` - AI response rendering
- `GitHubRepoViewer` - Repository browser
- `EditProfileModal` - Profile editing

---

## **📈 Data Flow Diagrams**

### **User Authentication Flow**
```
User → AuthPage → POST /api/users/login → JWT Token → localStorage → Redirect to Home
```

### **Project Creation Flow**
```
User → ProjectsPage → POST /api/projects/create → Database → Return Project + Join Code
```

### **Task Completion Flow**
```
User → TaskPage → PUT /api/tasks/:id/complete → Update Database → Broadcast to Socket → Update UI
```

### **Real-Time Chat Flow**
```
User → ChatPage → Socket.emit('send-message') → Server → Database → Socket.broadcast('new-message') → All Clients
```

### **Activity Tracking Flow**
```
Timer (30s) → POST /api/users/:id/status → Update Database → Activity Log → Teams Webhook (optional)
```

---

## **🎨 UML Diagram Types Recommended**

### **1. Class Diagram**
Show all database entities (Users, Projects, Tasks, Notes, etc.) with their attributes and relationships.

### **2. Use Case Diagram**
Actors: User, Project Creator, Project Member, AI Assistant, GitHub API
Use Cases: Create Project, Join Project, Create Task, Send Message, Track Activity, etc.

### **3. Sequence Diagrams**
- User authentication sequence
- Real-time chat message flow
- Task creation and assignment
- Activity tracking flow
- GitHub repository analysis

### **4. Component Diagram**
Show frontend components, backend services, database, external APIs, Socket.io server.

### **5. Deployment Diagram**
- Frontend (Vercel)
- Backend (Render)
- Database (SQLite)
- External Services (OpenRouter, GitHub API, Teams Webhooks)

### **6. State Diagram**
- User status (active ↔ break)
- Task status (pending → active → completed)
- Project invitation status (pending → approved/rejected)

### **7. Activity Diagram**
- Project creation and joining workflow
- Task lifecycle
- Note permission management
- Break suggestion algorithm

---

## **📊 Key Metrics & Statistics**

**Database Statistics:**
- 9 main tables
- 25+ indexed columns for performance
- Foreign key constraints for data integrity
- Soft deletion support

**API Coverage:**
- 40+ REST endpoints
- 8+ Socket.io event types
- 3 external API integrations

**Features:**
- 7 major modules
- Real-time collaboration
- Activity intelligence
- AI assistance
- GitHub integration

---

## **🚀 Deployment Architecture**

**Frontend:**
- Hosted on **Vercel**
- React production build
- Environment variables for API URL

**Backend:**
- Hosted on **Render**
- Node.js server
- Environment variables for secrets
- SQLite database file persistence

**Database:**
- SQLite3 file-based database
- Persistent storage on Render
- Automatic migrations on startup

---

## **🎯 Key Features Summary**

### **Core Functionality**
1. **User Management**: Registration, login, profile setup, activity tracking
2. **Project Management**: Create, join via code, invite members, track progress
3. **Task Management**: Create, assign, complete, track due dates
4. **Real-Time Chat**: Socket.io messaging, typing indicators, presence
5. **Notes System**: Rich text editing, permissions, collaboration
6. **Activity Tracking**: Voluntary work time tracking, break management
7. **AI Assistant**: Code analysis, recommendations, Q&A
8. **GitHub Integration**: Repository linking, code browsing, statistics

### **Advanced Features**
- Smart break suggestions based on work duration
- Microsoft Teams webhook notifications
- Automatic progress calculation
- Rate limiting for security
- Caching for performance
- Soft deletion for data recovery
- Permission-based access control
- Real-time synchronization

---

## **💡 Business Impact**

**Problem Solved:**
- Teams waste 47% of workday context-switching between 8-12 tools
- No unified platform for project management + collaboration + activity tracking + AI

**Solution:**
- All-in-one platform reducing context switching
- Voluntary, transparent activity tracking
- Real-time collaboration features
- AI-powered assistance
- GitHub integration for code visibility

**Target Users:**
- Development teams (2-50 members)
- Remote/hybrid teams
- Agile/Scrum teams
- Open source projects
- Startups and tech companies

**Value Proposition:**
- Reduce context switching from 47% to under 10%
- 3x team velocity improvement
- Transparent, non-invasive monitoring
- Single source of truth for projects
- AI-powered insights and recommendations

---

## **🔮 Future Roadmap**

### **Short Term**
- Kanban board view
- Slack integration
- Email notifications
- PostgreSQL migration
- Mobile responsive improvements

### **Mid Term**
- Advanced analytics dashboard
- Custom workflows and automation
- API for third-party integrations
- Video/audio calling
- File attachments in chat

### **Long Term**
- Enterprise features (SSO, audit logs)
- Code review platform integration
- Design collaboration tools
- Predictive analytics with ML
- Custom AI models on team data

---

## **📋 Technical Specifications**

### **Performance Metrics**
- Socket.io latency: < 100ms
- API response time: < 200ms average
- Database query optimization with indexes
- Caching layer for GitHub API (1-hour TTL)
- Rate limiting prevents abuse

### **Scalability Considerations**
- SQLite for MVP (< 1000 users)
- PostgreSQL ready for production scaling
- Horizontal scaling with load balancers
- CDN for frontend assets
- Redis for session management (future)

### **Code Quality**
- Modular controller architecture
- Separation of concerns (MVC pattern)
- Error handling middleware
- Input validation
- Security best practices

---

## **🛠️ Development Setup**

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Git

### **Installation Steps**

**Backend:**
```bash
cd backend
npm install
# Create .env file with required variables
npm start
```

**Frontend:**
```bash
cd frontend
npm install
# Create .env file with API URL
npm run dev
```

### **Environment Variables**

**Backend (.env):**
```env
PORT=3000
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=mongodb://localhost:27017/devcollab
OPENROUTER_API_KEY=your_openrouter_key
GITHUB_TOKEN=your_github_token
TEAMS_WEBHOOK_URL=your_teams_webhook_url
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3000
```

---

## **📚 Additional Resources**

### **Documentation Files**
- `HACKATHON_SUBMISSION.md` - Project overview and pitch
- `ACTIVITY_TRACKING_README.md` - Activity tracking system details
- `GITHUB_INTEGRATION.md` - GitHub integration setup guide
- `backend/README.md` - Backend API documentation
- `frontend/README.md` - Frontend development guide

### **API Documentation**
- RESTful API endpoints with request/response examples
- Socket.io event documentation
- Authentication flow diagrams
- Error handling specifications

---

## **🏆 Project Achievements**

### **Technical Accomplishments**
- Full-stack application with 9 database tables
- 40+ REST API endpoints
- Real-time Socket.io integration
- JWT authentication system
- Activity tracking with privacy focus
- GitHub API integration with caching
- AI assistant integration
- Microsoft Teams webhooks

### **Feature Completeness**
- User registration and authentication ✅
- Profile setup and management ✅
- Project creation and joining ✅
- Task management ✅
- Real-time chat ✅
- Notes with permissions ✅
- Activity tracking ✅
- AI assistant ✅
- GitHub integration ✅
- Team analytics ✅

### **Deployment Success**
- Frontend deployed on Vercel ✅
- Backend deployed on Render ✅
- Production-ready database ✅
- Environment configuration ✅
- CORS and security configured ✅

---

This comprehensive documentation provides all the information needed to create detailed UML diagrams for the DevCollab (Flow) project. The system architecture, database schema, API endpoints, data flows, and component relationships are all documented for accurate diagram creation.
