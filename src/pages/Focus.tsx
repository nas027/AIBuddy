import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, Pause, RotateCcw, Lock, AlertTriangle } from 'lucide-react';
import { Mascot } from '../components/UI';
import { getCurrentUser, User } from '../services/storage';

export default function Focus() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive && mode === 'focus') {
        // User left the app!
        setShowWarning(true);
        // Pause timer? Or keep running but show warning on return?
        // Let's keep running but show warning.
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, mode]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Play sound
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play().catch(e => console.log("Audio play failed", e));

    if (mode === 'focus') {
      alert("เก่งมาก! จบช่วงโฟกัสแล้ว พัก 5 นาทีนะ");
      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      alert("หมดเวลาพักแล้ว! พร้อมลุยต่อไหม?");
      setMode('focus');
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMode('focus');
    setTimeLeft(25 * 60);
    setShowWarning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'focus' 
    ? ((25 * 60 - timeLeft) / (25 * 60)) * 100 
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${mode === 'focus' ? 'bg-red-50' : 'bg-green-50'} flex flex-col`}>
      {/* Header */}
      <header className="p-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <h1 className="text-xl font-bold font-handwriting text-gray-800">Focus Mode 🍅</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Warning Overlay */}
        <AnimatePresence>
          {showWarning && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white p-8 text-center backdrop-blur-sm"
            >
              <AlertTriangle size={64} className="text-yellow-400 mb-4 animate-bounce" />
              <h2 className="text-3xl font-bold font-handwriting mb-2">กลับมาเดี๋ยวนี้นะ!</h2>
              <p className="text-lg mb-6">น้องบัดดี้เห็นนะว่าแอบไปเล่นแอปอื่น! กลับมาตั้งใจเรียนก่อน จะจบแล้ว!</p>
              <button 
                onClick={() => setShowWarning(false)}
                className="bg-[#A78BFA] text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:bg-[#9061F9] transition-colors"
              >
                กลับมาโฟกัสแล้วครับ/ค่ะ
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mascot */}
        <div className="mb-8 relative">
          <Mascot 
            size="xl" 
            mood={isActive ? (mode === 'focus' ? 'thinking' : 'happy') : 'happy'} 
            skin={user?.equipped.skin || 'default'}
          />
          {isActive && mode === 'focus' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -right-12 top-0 bg-white px-3 py-2 rounded-xl rounded-bl-none shadow-md border border-gray-100 text-sm font-handwriting"
            >
              สู้ๆ นะ! ✌️
            </motion.div>
          )}
        </div>

        {/* Timer Circle */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-10">
          {/* SVG Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke={mode === 'focus' ? '#FECACA' : '#BBF7D0'} 
              strokeWidth="8" 
            />
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke={mode === 'focus' ? '#EF4444' : '#22C55E'} 
              strokeWidth="8" 
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * progress) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          <div className="text-center z-10">
            <div className={`text-6xl font-bold font-mono tracking-wider ${mode === 'focus' ? 'text-red-500' : 'text-green-500'}`}>
              {formatTime(timeLeft)}
            </div>
            <p className="text-gray-500 font-handwriting mt-2 text-lg">
              {mode === 'focus' ? '🔥 เวลาโฟกัส' : '☕ เวลาพัก'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleTimer}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${isActive ? 'bg-yellow-400' : 'bg-[#A78BFA]'}`}
          >
            {isActive ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}
          </button>
          
          <button 
            onClick={resetTimer}
            className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="mt-8 text-center text-gray-400 text-sm">
          <p className="flex items-center justify-center gap-2">
            <Lock size={14} /> App Blocker Active
          </p>
          <p>ห้ามสลับหน้าจอนะ น้องบัดดี้จับตาดูอยู่!</p>
        </div>

      </main>
    </div>
  );
}
