import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import StudyInput from './pages/StudyInput';
import StudyResult from './pages/StudyResult';
import Homework from './pages/Homework';
import Library from './pages/Library';
import Tutor from './pages/Tutor';
import Store from './pages/Store';
import Focus from './pages/Focus';
import Report from './pages/Report';
import SnapMap from './pages/SnapMap';
import Welcome from './components/Welcome';
import Login from './components/Login';
import MoodCheckIn from './components/MoodCheckIn';
import { getCurrentUser, setCurrentUser } from './services/storage';
import { LanguageProvider } from './services/language';

import BottomNav from './components/BottomNav';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);

  // Check for existing session
  useEffect(() => {
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
      checkMoodStatus(storedUser);
    }
  }, []);

  const checkMoodStatus = (userData: any) => {
    const today = new Date().toISOString().split('T')[0];
    const hasCheckedIn = userData.moodHistory?.some((m: any) => m.date.startsWith(today));
    if (!hasCheckedIn) {
      // Delay slightly to let app load
      setTimeout(() => setShowMoodCheckIn(true), 1000);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setCurrentUser(userData);
    checkMoodStatus(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentUser(null);
  };

  if (isLoading) {
    return <Welcome onComplete={() => setIsLoading(false)} />;
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="pb-20"> {/* Add padding for bottom nav */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/study" element={<StudyInput />} />
            <Route path="/result/:id" element={<StudyResult />} />
            <Route path="/homework" element={<Homework />} />
            <Route path="/library" element={<Library />} />
            <Route path="/tutor" element={<Tutor />} />
            <Route path="/store" element={<Store />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/report" element={<Report />} />
            <Route path="/snap-map" element={<SnapMap />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        
        <BottomNav />

        {showMoodCheckIn && (
          <MoodCheckIn onClose={() => setShowMoodCheckIn(false)} />
        )}
      </BrowserRouter>
    </LanguageProvider>
  );
}
