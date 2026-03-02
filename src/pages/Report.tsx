import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, PieChart, Activity, Calendar, Award } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { motion } from 'motion/react';
import { getCurrentUser, getSessions, User, StudySession } from '../services/storage';

export default function Report() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [studyData, setStudyData] = useState<any[]>([]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    const currentSessions = getSessions();
    
    if (currentUser) {
      setUser(currentUser);
      processMoodData(currentUser);
    }
    setSessions(currentSessions);
    processStudyData(currentSessions);
  }, []);

  const processMoodData = (userData: User) => {
    if (!userData.moodHistory) return;
    
    // Take last 7 entries
    const recentMoods = userData.moodHistory.slice(-7);
    const data = recentMoods.map(m => ({
      date: new Date(m.date).toLocaleDateString('th-TH', { weekday: 'short' }),
      score: m.mood === 'happy' ? 3 : m.mood === 'neutral' ? 2 : 1,
      mood: m.mood
    }));
    setMoodData(data);
  };

  const processStudyData = (sessionData: StudySession[]) => {
    // Group by topic
    const topicCounts: Record<string, number> = {};
    sessionData.forEach(s => {
      const topic = s.topic || 'General';
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    const data = Object.keys(topicCounts).map(topic => ({
      name: topic,
      value: topicCounts[topic]
    }));
    setStudyData(data);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A78BFA'];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart2 className="text-[#A78BFA]" /> Report Architect
        </h1>
      </header>

      <main className="p-4 space-y-6 max-w-4xl mx-auto">
        
        {/* User Stats Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
              <Award className="text-yellow-500" /> Architect Level
            </h2>
            <span className="text-sm text-gray-500">Level {user?.level}</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
            <div 
              className="bg-[#A78BFA] h-4 rounded-full transition-all duration-1000"
              style={{ width: `${(user?.xp || 0) % 100}%` }} // Simplified XP calculation
            ></div>
          </div>
          <p className="text-right text-xs text-gray-500">{user?.xp} XP Total</p>
        </motion.div>

        {/* Mood Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Activity className="text-pink-500" /> Mood History
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis hide domain={[0, 4]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [value === 3 ? 'Happy 😊' : value === 2 ? 'Neutral 😐' : 'Sad 😢', 'Mood']}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#A78BFA" 
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#A78BFA', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Study Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <PieChart className="text-green-500" /> Study Topics
          </h2>
          <div className="h-64 w-full">
            {studyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={studyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {studyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                ยังไม่มีข้อมูลการเรียน
              </div>
            )}
          </div>
        </motion.div>

        {/* Weekly Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Calendar className="text-blue-500" /> Weekly Summary
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl text-center">
              <div className="text-3xl font-bold text-blue-600">{sessions.length}</div>
              <div className="text-sm text-blue-400">Sessions</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl text-center">
              <div className="text-3xl font-bold text-purple-600">{user?.coins || 0}</div>
              <div className="text-sm text-purple-400">Coins Earned</div>
            </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
