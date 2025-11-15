# Real-Time Activity Tracking System

## Overview

A comprehensive real-time activity tracking and management system integrated into the Flow project management platform. Track work time, manage breaks, view team member status, and get instant Microsoft Teams notifications.

## ✨ Features

### 1. **Today's Activity Dashboard**

-  **Work Time Tracking**: Automatically tracks time spent working
-  **Live Status Indicator**: Shows if user is 🟢 Active or 🔴 On Break
-  **Last Break Time**: Displays when the user last took a break
-  **Tasks Completed Today**: Count of tasks finished today
-  **Active Projects**: Number of projects user is currently working on

### 2. **Smart Break Management**

-  **One-Click Toggle**: "Take a Break" / "Resume Work" button
-  **Automatic Time Calculation**: Work time is calculated and saved on break
-  **Status Persistence**: Status survives page refreshes
-  **Intelligent Suggestions**: System recommends breaks based on work duration
   -  2+ hours: "Keep focused" 🎯
   -  3+ hours: "Break soon" ⚠️
   -  4+ hours: "Take a break!" 🛑

### 3. **Profile Status Display**

-  **Animated Status Dot**: Green (active) or red (on break) with pulse animation
-  **Status Badge**: Clear tag showing "Active" or "On Break"
-  **Activity Metrics**: Full dashboard visible on profile pages
-  **Real-Time Updates**: Status refreshes every 30 seconds

### 4. **Microsoft Teams Integration**

-  **Status Change Notifications**: Alerts when users start/stop working
-  **Rich Message Cards**: Includes avatars, work time, and profile links
-  **Task Completion Alerts**: Notify channel when tasks are done (optional)
-  **Daily Summaries**: End-of-day activity reports (optional)
-  **Non-blocking**: Doesn't slow down the application

### 5. **Database & Backend**

-  **User Activity Columns**:
   -  `currentStatus`: 'active' or 'break'
   -  `workTimeToday`: Total minutes worked
   -  `lastBreakTime`: Timestamp of last break
   -  `lastStatusChange`: When status was last updated
   -  `workSessionStart`: Current session start time
-  **Activity Logs Table**: Historical tracking of all status changes
-  **RESTful API Endpoints**:
   -  `POST /api/users/:id/status` - Toggle break status
   -  `GET /api/users/:id/activity` - Get today's activity
   -  `POST /api/users/reset-daily-work` - Reset daily counters (cron job)

## 🚀 Getting Started

### Prerequisites

-  Node.js v14+
-  npm or yarn
-  SQLite3
-  Microsoft Teams account (optional, for Teams integration)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd "Flow"
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables** (for Teams integration)

   ```bash
   cd ../backend
   cp .env.example .env
   # Edit .env and add your Teams webhook URL
   ```

5. **Initialize the database**

   ```bash
   # The database will auto-initialize when you start the backend
   cd backend
   npm start
   ```

6. **Start the frontend**
   ```bash
   cd ../frontend
   npm run dev
   ```

## 📖 Usage Guide

### For End Users

#### Taking a Break

1. Navigate to the **Projects** page
2. Scroll to the **Today's Activity** section
3. Click the **"Take a Break"** button
4. Your status changes to 🔴 On Break
5. Work time is automatically saved
6. (Optional) Teams notification sent to your channel

#### Resuming Work

1. Click the **"Resume Work"** button
2. Status changes back to 🟢 Active
3. New work session starts
4. (Optional) Teams notification sent

#### Viewing Your Activity

-  **Projects Page**: See dashboard at the top
-  **Profile Page**: View your own activity metrics
-  **Other Profiles**: See status and activity of team members

### For Administrators

#### Setting Up Teams Notifications

Follow the detailed guide in `TEAMS_INTEGRATION.md`:

1. Create an Incoming Webhook in Teams
2. Add webhook URL to `.env` file
3. Restart backend server
4. Test by toggling break status

#### Resetting Daily Statistics

Schedule a cron job to call:

```bash
curl -X POST http://localhost:3000/api/users/reset-daily-work
```

Or use `node-cron` in your backend (see TEAMS_INTEGRATION.md).

## 🏗️ Architecture

### Frontend Components

**ProfilePage.jsx**

-  Displays status indicator (dot + badge)
-  Shows Today's Activity dashboard
-  Polls for updates every 30 seconds
-  Formatted time displays (hours:minutes format)

**ProjectsPage.jsx**

-  Real-time activity tracking dashboard
-  "Take a Break" / "Resume Work" button
-  Intelligent break suggestions
-  Integrated with backend API

### Backend Components

**Database Schema** (`backend/database/initDb.js`)

-  Users table with activity tracking columns
-  ActivityLogs table for historical data
-  Automatic column addition for existing databases
-  Indexed for performance

**Controllers** (`backend/controllers/userControllers.js`)

-  `toggleUserStatus`: Handle status changes
-  `getUserActivity`: Fetch current activity data
-  `resetDailyWorkTime`: Reset counters at midnight
-  Integrated with Teams notifications

**Services** (`backend/services/teamsService.js`)

-  TeamsService class with webhook integration
-  Rich message card formatting
-  Error handling and logging
-  Non-blocking async operations

### API Endpoints

| Method | Endpoint                      | Description                |
| ------ | ----------------------------- | -------------------------- |
| GET    | `/api/users/:id`              | Get user profile           |
| GET    | `/api/users/:id/activity`     | Get today's activity       |
| POST   | `/api/users/:id/status`       | Toggle active/break status |
| POST   | `/api/users/reset-daily-work` | Reset daily work time      |

## 🎨 UI/UX Features

### Color Coding

-  🟢 Green: Active status (working)
-  🔴 Red: Break status
-  🔵 Blue: Informational cards
-  🟠 Orange: Warning suggestions
-  🟡 Yellow: Break soon suggestions

### Responsive Design

-  Mobile-friendly activity cards
-  2-column grid on mobile, 4-column on desktop
-  Adaptive font sizes (text-xl on mobile, text-2xl on desktop)
-  Touch-friendly buttons

### Real-Time Updates

-  30-second polling for status changes
-  Immediate UI updates on action
-  Toast notifications for feedback
-  Animated pulse on status dots

## 🔧 Configuration

### Environment Variables

```env
# Microsoft Teams Integration
TEAMS_WEBHOOK_URL=https://yourteam.webhook.office.com/...

# Frontend URL for links
FRONTEND_URL=http://localhost:5173

# Backend Port
PORT=3000
```

### Work Time Suggestions

Customize in `ProjectsPage.jsx` → `getSuggestion()`:

```javascript
if (workedMinutes >= 240) { // 4+ hours
    return { text: 'Take a break!', ... }
}
```

### Polling Intervals

Adjust in component useEffect:

```javascript
// Change from 30 seconds to your preference
const activityInterval = setInterval(() => {
   fetchUserActivity();
}, 30000); // milliseconds
```

## 📊 Data Flow

1. **User clicks "Take a Break"**
   ↓
2. **Frontend calls** `POST /api/users/:id/status { status: 'break' }`
   ↓
3. **Backend calculates** work time from session start
   ↓
4. **Database updates** user status and work time
   ↓
5. **ActivityLog entry** created for history
   ↓
6. **Teams notification** sent (if configured)
   ↓
7. **Frontend updates** UI with new status
   ↓
8. **Toast notification** confirms action
   ↓
9. **Polling refreshes** status on other pages

## 🧪 Testing

### Manual Testing Checklist

-  [ ] Click "Take a Break" button → Status changes to "On Break"
-  [ ] Work time is saved correctly
-  [ ] Click "Resume Work" → Status changes to "Active"
-  [ ] New session starts tracking time
-  [ ] Profile page shows correct status
-  [ ] Status dot is animated and correct color
-  [ ] Activity metrics update in real-time
-  [ ] Last break time displays correctly
-  [ ] Tasks completed count is accurate
-  [ ] Active projects count is correct
-  [ ] Teams notification received (if configured)
-  [ ] Mobile responsive design works
-  [ ] Status persists on page refresh

### Automated Testing (Future Enhancement)

```javascript
// Example Jest test
describe("Activity Tracking", () => {
   test("should toggle user status", async () => {
      const response = await request(app)
         .post("/api/users/1/status")
         .send({ status: "break" });
      expect(response.status).toBe(200);
      expect(response.body.user.currentStatus).toBe("break");
   });
});
```

## 🐛 Troubleshooting

### Status not updating

-  Check if backend is running
-  Verify user is logged in
-  Check browser console for errors
-  Ensure database has new columns

### Work time not calculating

-  Verify `workSessionStart` is set when active
-  Check time zone handling
-  Ensure no errors in console

### Teams notifications not working

-  Verify webhook URL in `.env`
-  Test webhook with curl
-  Check Teams channel connector is active
-  Review server logs for errors

## 🚦 Future Enhancements

-  [ ] WebSocket integration for instant updates (no polling)
-  [ ] Break reminders/notifications
-  [ ] Work time analytics and charts
-  [ ] Team productivity leaderboard
-  [ ] Pomodoro timer integration
-  [ ] Custom work/break schedules
-  [ ] Export activity reports (PDF/CSV)
-  [ ] Integration with calendar apps
-  [ ] Mobile push notifications
-  [ ] Slack/Discord integrations

## 📝 License

This feature is part of the Flow project and follows the same license.

## 👥 Contributors

-  Real-time activity tracking system
-  Microsoft Teams integration
-  Profile status indicators
-  Break management features

## 📞 Support

For issues or questions:

1. Check this README
2. Review `TEAMS_INTEGRATION.md` for Teams setup
3. Check server logs
4. Inspect browser console
5. Verify API responses with Postman/curl

---

**Built with** ❤️ **for productive collaboration**
