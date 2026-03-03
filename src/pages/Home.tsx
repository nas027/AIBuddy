import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mascot } from '../components/UI';
import { CheckCircle, ShoppingBag, LogOut, Star } from 'lucide-react';
import { getCurrentUser, getNextLevelXP, claimQuestReward, User, setCurrentUser } from '../services/storage';
import { motion } from 'motion/react';
import { useTheme } from '../services/theme';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Home() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setCurrentUser(null);
    window.location.href = '/';
  };

  const handleClaimReward = (questId: string) => {
    claimQuestReward(questId);
    setUser(getCurrentUser()); // Refresh UI
  };

  if (!user) return null;

  const nextLevelXP = getNextLevelXP(user.level);
  const xpPercentage = Math.min(100, (user.xp / nextLevelXP) * 100);

  return (
    <div className="min-h-screen p-4 pb-24 max-w-md mx-auto relative overflow-hidden transition-colors duration-300 font-body">
      
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="ออกจากระบบ"
        message="คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 bg-white/80 backdrop-blur-sm p-3 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border-2 border-[var(--color-primary)] shrink-0">
            {/* Avatar Placeholder */}
            <div className="w-full h-full flex items-center justify-center bg-[var(--color-primary)] text-white font-bold text-xl">
              {user.name.charAt(0)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-[var(--text-heading)]">{user.name}</h2>
              <span className="text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full">Lv.{user.level}</span>
            </div>
            {/* XP Bar */}
            <div className="w-24 h-3 bg-gray-200 rounded-full mt-1 relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
                style={{ width: `${xpPercentage}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-500 text-right mt-0.5">{user.xp}/{nextLevelXP} XP</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/store')}
              className="bg-yellow-100 p-2 rounded-full border border-yellow-300 shadow-sm text-yellow-700 hover:bg-yellow-200 transition-colors"
              title="ร้านค้า"
            >
              <ShoppingBag size={16} />
            </button>
            <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-300 shadow-sm">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-yellow-700">{user.coins}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 mt-1">
            <LogOut size={12} /> ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Center Mascot */}
      <div className="flex flex-col items-center justify-center mb-8 relative z-10 py-8">
        <motion.div 
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            // Play sound or animation logic here
          }}
          className="cursor-pointer"
        >
          <Mascot 
            size="xl" 
            mood="happy" 
            level={user.level} 
            skin={user.equipped.skin || 'default'} 
          />
        </motion.div>
        
        {/* Speech Bubble */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white px-4 py-2 rounded-xl rounded-tl-none shadow-md border border-gray-100 mt-2 max-w-[200px] text-center"
        >
          <p className="text-sm text-gray-600 font-handwriting">
            "สวัสดี {user.name}! วันนี้เรามาติวเรื่องอะไรกันดี?"
          </p>
        </motion.div>
      </div>

      {/* Daily Quests */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-[var(--text-heading)]">
          <CheckCircle className="text-green-500" /> ภารกิจรายวัน
        </h3>
        <div className="space-y-3">
          {user.dailyQuests.map((quest) => (
            <div key={quest.id} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-gray-700">{quest.title}</p>
                <div className="w-32 h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-green-400 transition-all" 
                    style={{ width: `${(quest.current / quest.target) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                {quest.completed && !quest.claimed ? (
                  <button 
                    onClick={() => handleClaimReward(quest.id)}
                    className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full animate-bounce shadow-sm"
                  >
                    รับรางวัล
                  </button>
                ) : quest.claimed ? (
                  <span className="text-xs text-green-500 font-bold flex items-center gap-1">
                    <CheckCircle size={12} /> สำเร็จ
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">
                    {quest.current}/{quest.target}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
