import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Mascot } from '../components/UI';
import { ArrowLeft, BookOpen, Trash2, RotateCcw, Plus, Edit2, Search, X, Check } from 'lucide-react';
import { getSessions, StudySession, deleteSession, updateSession } from '../services/storage';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../services/theme';

export default function Library() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTopicName, setEditTopicName] = useState('');

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('ลบประวัติการติวนี้ไหม?')) {
      deleteSession(id);
      setSessions(getSessions());
    }
  };

  const startEditing = (e: React.MouseEvent, session: StudySession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTopicName(session.topic);
  };

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId && editTopicName.trim()) {
      const sessionToUpdate = sessions.find(s => s.id === editingId);
      if (sessionToUpdate) {
        const updatedSession = { ...sessionToUpdate, topic: editTopicName.trim() };
        updateSession(updatedSession);
        setSessions(getSessions());
      }
    }
    setEditingId(null);
    setEditTopicName('');
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTopicName('');
  };

  const filteredSessions = sessions.filter(session => 
    session.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto relative transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-4">
        <div className="flex items-center">
          <button onClick={() => navigate('/')} className="bg-[var(--color-surface)] p-2 rounded-full shadow-sm hover:bg-black/5 border border-[var(--border-color)]/20 text-[var(--text-main)] transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold ml-4 font-handwriting text-[var(--text-heading)]">คลังความรู้ 📚</h1>
        </div>
        <Button 
          onClick={() => navigate('/study')} 
          className="px-3 py-2 text-sm flex items-center gap-1 shadow-pop"
        >
          <Plus size={16} />
          เพิ่มหัวข้อ
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="ค้นหาหัวข้อ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[var(--border-color)]/20 bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-body text-[var(--text-main)]"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-main)] opacity-40" size={20} />
      </div>

      {/* Bookshelf Layout */}
      <div className="space-y-4 pb-24">
        {filteredSessions.length === 0 ? (
          <div className="text-center mt-20 opacity-60">
            <Mascot mood="thinking" size="md" />
            <p className="mt-4 font-handwriting text-xl text-[var(--text-main)]">
              {searchTerm ? 'ไม่พบหัวข้อที่ค้นหา' : 'ยังไม่มีหนังสือเลย ไปเริ่มติวกันเถอะ!'}
            </p>
            {!searchTerm && <Button onClick={() => navigate('/study')} className="mt-4 shadow-pop">ไปติวเลย</Button>}
          </div>
        ) : (
          <AnimatePresence>
            {filteredSessions.map((session, index) => (
              <motion.div 
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div 
                  onClick={() => navigate(`/result/${session.id}`)}
                  className={`
                    bg-[var(--color-surface)] rounded-2xl border-2 border-[var(--border-color)]/20 shadow-sm p-5 relative cursor-pointer hover:shadow-md transition-all group hover:-translate-y-1 overflow-hidden
                    ${theme === 'cyber' ? 'hover:shadow-[0_0_15px_var(--color-primary)] clip-cyber' : ''}
                  `}
                >
                  {/* Decorative Elements */}
                  {theme === 'doodle' && (
                    <div className={`absolute -top-3 -left-3 w-16 h-16 rounded-full opacity-20 ${['bg-purple-400', 'bg-pink-400', 'bg-green-400'][index % 3]}`}></div>
                  )}
                  {theme === 'cyber' && (
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[var(--color-primary)]/20 to-transparent clip-cyber-corner"></div>
                  )}
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex-1 mr-4">
                      {editingId === session.id ? (
                        <div className="flex items-center gap-2 mb-2" onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTopicName}
                            onChange={(e) => setEditTopicName(e.target.value)}
                            className="w-full border-b-2 border-[var(--color-primary)] bg-transparent focus:outline-none font-handwriting text-xl"
                            autoFocus
                          />
                          <button onClick={saveEdit} className="text-green-500 hover:bg-green-50 p-1.5 rounded-full"><Check size={18} /></button>
                          <button onClick={cancelEdit} className="text-red-500 hover:bg-red-50 p-1.5 rounded-full"><X size={18} /></button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                              session.mode === 'problem' 
                                ? 'bg-orange-100 text-orange-700' 
                                : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                            }`}>
                              {session.mode === 'problem' ? 'โจทย์ปัญหา' : 'บทเรียน'}
                            </span>
                            <span className="text-[var(--text-main)] opacity-50 text-xs font-mono flex items-center gap-1">
                              {new Date(session.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <h3 className="font-bold text-xl text-[var(--text-heading)] line-clamp-1 font-handwriting mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                            {session.topic}
                          </h3>
                        </div>
                      )}
                      
                      {/* Summary Snippet */}
                      <p className="text-sm text-[var(--text-main)] opacity-70 font-body line-clamp-2 leading-relaxed mb-3">
                        {session.summary.summary[0]}...
                      </p>

                      {/* Stats / Tags */}
                      <div className="flex items-center gap-3">
                        {session.quizScore !== undefined && (
                          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border ${
                            session.quizScore === session.quiz.length 
                              ? 'bg-green-100 text-green-700 border-green-200' 
                              : 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-color)]/20'
                          }`}>
                            <span>🏆 {session.quizScore}/{session.quiz.length}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-[var(--text-main)] opacity-50">
                          <BookOpen size={12} />
                          <span>{session.summary.keywords.length} คำศัพท์</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons (Visible on Hover/Focus) */}
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-0 bottom-0 bg-gradient-to-l from-[var(--color-surface)] via-[var(--color-surface)] to-transparent pl-8 pr-4 py-4 justify-center">
                      <button 
                        onClick={(e) => startEditing(e, session)}
                        className="p-2 text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-[var(--color-primary)] hover:text-white rounded-full transition-all shadow-sm border border-[var(--border-color)]/10"
                        title="แก้ไขชื่อ"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, session.id)}
                        className="p-2 text-red-400 bg-[var(--bg-main)] hover:bg-red-500 hover:text-white rounded-full transition-all shadow-sm border border-[var(--border-color)]/10"
                        title="ลบ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
