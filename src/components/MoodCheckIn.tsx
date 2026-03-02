import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smile, Meh, Frown, Send } from 'lucide-react';
import { getCurrentUser, saveMood, User } from '../services/storage';
import { generateMoodResponse } from '../services/gemini';
import { Mascot } from './UI';

interface MoodCheckInProps {
  onClose: () => void;
}

export default function MoodCheckIn({ onClose }: MoodCheckInProps) {
  const [step, setStep] = useState<'select' | 'note' | 'result'>('select');
  const [selectedMood, setSelectedMood] = useState<'happy' | 'neutral' | 'sad' | null>(null);
  const [note, setNote] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleMoodSelect = (mood: 'happy' | 'neutral' | 'sad') => {
    setSelectedMood(mood);
    setStep('note');
  };

  const handleSubmit = async () => {
    if (!selectedMood) return;

    setIsLoading(true);
    saveMood(selectedMood, note);

    // Generate AI response
    try {
      const message = await generateMoodResponse(selectedMood, note);
      setAiMessage(message);
    } catch (error) {
      console.error("AI Error:", error);
      setAiMessage("สู้ๆ นะ! พี่บัดดี้เป็นกำลังใจให้เสมอ");
    } finally {
      setIsLoading(false);
      setStep('result');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border-4 border-[#A78BFA] relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold font-handwriting text-gray-800">
            สวัสดี {user?.name}! 👋
          </h2>
          <p className="text-gray-500">วันนี้เป็นยังไงบ้าง?</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div 
              key="select"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="grid grid-cols-3 gap-4"
            >
              <button 
                onClick={() => handleMoodSelect('happy')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-green-50 hover:bg-green-100 border-2 border-transparent hover:border-green-300 transition-all"
              >
                <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center text-4xl shadow-sm">
                  😊
                </div>
                <span className="font-bold text-green-700">แฮปปี้</span>
              </button>

              <button 
                onClick={() => handleMoodSelect('neutral')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-yellow-50 hover:bg-yellow-100 border-2 border-transparent hover:border-yellow-300 transition-all"
              >
                <div className="w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center text-4xl shadow-sm">
                  😐
                </div>
                <span className="font-bold text-yellow-700">เฉยๆ</span>
              </button>

              <button 
                onClick={() => handleMoodSelect('sad')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 border-2 border-transparent hover:border-blue-300 transition-all"
              >
                <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center text-4xl shadow-sm">
                  😢
                </div>
                <span className="font-bold text-blue-700">เหนื่อย/เศร้า</span>
              </button>
            </motion.div>
          )}

          {step === 'note' && (
            <motion.div 
              key="note"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-4"
            >
              <div className="text-center text-6xl mb-4">
                {selectedMood === 'happy' ? '😊' : selectedMood === 'neutral' ? '😐' : '😢'}
              </div>
              
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="อยากเล่าอะไรให้พี่บัดดี้ฟังไหม? (ไม่บังคับ)"
                className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#A78BFA] min-h-[100px]"
              />

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-[#A78BFA] text-white py-3 rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none border-2 border-black flex items-center justify-center gap-2"
              >
                {isLoading ? 'กำลังส่ง...' : <><Send size={18} /> บันทึกความรู้สึก</>}
              </button>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div 
              key="result"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6"
            >
              <div className="flex justify-center">
                <Mascot mood={selectedMood === 'sad' ? 'thinking' : 'happy'} size="lg" />
              </div>
              
              <div className="bg-[#FFF9F0] p-4 rounded-xl border-2 border-[#A78BFA] relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#A78BFA] text-white px-3 py-1 rounded-full text-xs font-bold">
                  พี่บัดดี้บอกว่า...
                </div>
                <p className="text-gray-700 font-handwriting text-lg mt-2">
                  "{aiMessage}"
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                ไปหน้าหลัก
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
