import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AuthPage from './components/AuthPage';
import SetupPage from './pages/SetupPage';
import Home from './components/Home';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import AIPage from './pages/AIPage';
import ProfilePage from './pages/ProfilePage';
import SingleProjectPage from './pages/SingleProjectPage';
import TaskPage from './pages/project/TaskPage';
import ProjectAIPage from './pages/project/AIPage';
import ChatPage from './pages/project/ChatPage';
import PeoplePage from './pages/project/PeoplePage';
import StatsPage from './pages/project/StatsPage';
import AiComponent from './components/AiComponent';

function AppContent() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user exists in localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user or no user.id, only allow /auth route
  if (!user || !user.id) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // If user.setup == 0, only allow /setup route
  if (user.setupCompleted === 0) {
    return (
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  // If user.setup == 1 (or completed), allow all app routes
  return (
    <Routes>
      <Route path="/auth" element={<Navigate to="/" replace />} />
      <Route path="/setup" element={<Navigate to="/" replace />} />
      <Route path="/" element={<Home />}>
        <Route index element={<HomePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="ai" element={<AIPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/:userId" element={<ProfilePage />} />
        <Route path="/abc" element={<AiComponent userInput={'hello'}/>} />

      </Route>
      <Route path="/project/:projectId" element={<SingleProjectPage />}>
        <Route index element={<Navigate to="task" replace />} />
        <Route path="task" element={<TaskPage />} />
        <Route path="ai" element={<ProjectAIPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="peoples" element={<PeoplePage />} />
        <Route path="stats" element={<StatsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <AppContent />
      </div>
    </BrowserRouter>
  );
}