import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './components/AuthPage';
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <SignedOut>
          <AuthPage />
        </SignedOut>

        <SignedIn>
          <Routes>
            <Route path="/" element={<Home />}>
              <Route index element={<HomePage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="ai" element={<AIPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            <Route path="/project/:projectId" element={<SingleProjectPage />}>
              <Route index element={<Navigate to="task" replace />} />
              <Route path="task" element={<TaskPage />} />
              <Route path="ai" element={<ProjectAIPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="peoples" element={<PeoplePage />} />
              <Route path="stats" element={<StatsPage />} />
            </Route>
          </Routes>
        </SignedIn>
      </div>
    </BrowserRouter>
  );
}