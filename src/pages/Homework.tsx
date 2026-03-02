import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Mascot } from '../components/UI';
import { ArrowLeft, Plus, Trash2, Wand2, CheckSquare, Square, ArrowRight, ArrowLeft as ArrowLeftIcon, Clock, CheckCircle2, Circle } from 'lucide-react';
import { getHomework, addHomework, deleteHomework, updateHomework, HomeworkTask } from '../services/storage';
import { breakdownHomework } from '../services/gemini';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../services/theme';

export default function Homework() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<HomeworkTask[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);

  useEffect(() => {
    const loadedTasks = getHomework().map(t => ({
      ...t,
      status: t.status || (t.completed ? 'done' : 'todo')
    }));
    setTasks(loadedTasks);
  }, []);

  const refreshTasks = () => {
    const loadedTasks = getHomework().map(t => ({
      ...t,
      status: t.status || (t.completed ? 'done' : 'todo')
    }));
    setTasks(loadedTasks);
  };

  const handleAddTask = async (useAI: boolean) => {
    if (!subject || !topic) return;

    setIsPlanning(true);
    let subtasks: { id: string; title: string; completed: boolean }[] = [];

    if (useAI) {
      try {
        const steps = await breakdownHomework(subject, topic);
        subtasks = steps.map(step => ({ id: uuidv4(), title: step, completed: false }));
      } catch (e) {
        console.error(e);
        alert('AI ช่วยวางแผนไม่ได้ในขณะนี้ แต่บันทึกงานให้แล้วนะ!');
      }
    }

    const newTask: HomeworkTask = {
      id: uuidv4(),
      subject,
      topic,
      dueDate,
      subtasks,
      completed: false,
      status: 'todo'
    };

    addHomework(newTask);
    refreshTasks();
    setShowAddModal(false);
    resetForm();
    setIsPlanning(false);
  };

  const resetForm = () => {
    setSubject('');
    setTopic('');
    setDueDate('');
  };

  const updateTaskStatus = (task: HomeworkTask, newStatus: 'todo' | 'in_progress' | 'done') => {
    const updatedTask = { 
      ...task, 
      status: newStatus, 
      completed: newStatus === 'done' 
    };
    updateHomework(updatedTask);
    refreshTasks();
  };

  const toggleSubtask = (task: HomeworkTask, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    
    // Auto update status based on subtasks if needed, but let's keep it manual for flexibility
    // Or maybe auto-move to 'in_progress' if started?
    let newStatus = task.status;
    if (task.status === 'todo' && updatedSubtasks.some(st => st.completed)) {
      newStatus = 'in_progress';
    }
    
    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
    if (allDone && task.status !== 'done') {
       // Optional: Auto-complete? Let's leave it to user to move to Done column
    }

    updateHomework({ ...task, subtasks: updatedSubtasks, status: newStatus, completed: newStatus === 'done' });
    refreshTasks();
  };

  const handleDelete = (id: string) => {
    if (confirm('ลบงานนี้จริงหรอ?')) {
      deleteHomework(id);
      refreshTasks();
    }
  };

  const columns = [
    { id: 'todo', title: 'การบ้านที่สั่ง 📝', color: 'bg-red-100 text-red-800', border: 'border-red-200' },
    { id: 'in_progress', title: 'กำลังทำ ⏳', color: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-200' },
    { id: 'done', title: 'เสร็จแล้ว 🎉', color: 'bg-green-100 text-green-800', border: 'border-green-200' }
  ];

  return (
    <div className="min-h-screen relative max-w-6xl mx-auto flex flex-col transition-colors duration-300 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="bg-[var(--color-surface)] p-2 rounded-full shadow-sm border border-[var(--border-color)]/20 text-[var(--text-main)] hover:bg-black/5 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold font-handwriting text-[var(--text-heading)]">บอร์ดการบ้าน 📌</h1>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex flex-col md:flex-row gap-6 min-w-full md:min-w-0">
          {columns.map(col => (
            <div key={col.id} className="flex-1 min-w-[300px]">
              <div className={`p-3 rounded-t-xl font-bold text-center border-b-4 ${col.color} ${col.border} font-handwriting text-lg`}>
                {col.title}
                <span className="ml-2 bg-white/50 px-2 py-0.5 rounded-full text-sm">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>
              
              <div className="bg-[var(--color-surface)]/50 rounded-b-xl p-3 min-h-[500px] border-x-2 border-b-2 border-[var(--border-color)]/10 space-y-3">
                <AnimatePresence>
                  {tasks.filter(t => t.status === col.id).map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className={`bg-[var(--color-surface)] p-4 rounded-xl shadow-sm border border-[var(--border-color)]/20 hover:shadow-md transition-all group relative overflow-hidden ${theme === 'cyber' ? 'clip-cyber' : ''}`}>
                        {/* Task Content */}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded-md bg-[var(--bg-main)] text-xs font-bold text-[var(--text-main)] mb-1 font-handwriting uppercase border border-[var(--border-color)]/10">
                              {task.subject}
                            </span>
                            <h3 className="font-bold text-[var(--text-heading)] font-handwriting text-lg leading-tight">{task.topic}</h3>
                          </div>
                          <button onClick={() => handleDelete(task.id)} className="text-[var(--text-main)] opacity-30 hover:opacity-100 hover:text-red-400 transition-opacity">
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-[var(--text-main)] opacity-60 mb-3 font-mono">
                            <Clock size={12} />
                            <span>Due: {new Date(task.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        )}

                        {/* Subtasks */}
                        {task.subtasks.length > 0 && (
                          <div className="space-y-1 mb-3">
                            {task.subtasks.map(st => (
                              <div 
                                key={st.id} 
                                className="flex items-center gap-2 cursor-pointer group/item"
                                onClick={() => toggleSubtask(task, st.id)}
                              >
                                {st.completed ? (
                                  <CheckSquare size={14} className="text-[var(--color-secondary)] shrink-0" />
                                ) : (
                                  <Square size={14} className="text-[var(--text-main)] opacity-30 group-hover/item:opacity-60 shrink-0" />
                                )}
                                <span className={`text-xs ${st.completed ? 'line-through opacity-50' : 'opacity-80'} text-[var(--text-main)] truncate`}>{st.title}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--border-color)]/10">
                          {col.id !== 'todo' && (
                            <button 
                              onClick={() => updateTaskStatus(task, col.id === 'done' ? 'in_progress' : 'todo')}
                              className="p-1.5 rounded-full hover:bg-[var(--bg-main)] text-[var(--text-main)] opacity-60 hover:opacity-100 transition-colors"
                              title="ย้อนกลับ"
                            >
                              <ArrowLeftIcon size={16} />
                            </button>
                          )}
                          
                          <div className="flex-1"></div>

                          {col.id !== 'done' && (
                            <button 
                              onClick={() => updateTaskStatus(task, col.id === 'todo' ? 'in_progress' : 'done')}
                              className={`
                                flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm
                                ${col.id === 'todo' 
                                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'}
                              `}
                            >
                              {col.id === 'todo' ? 'เริ่มทำ' : 'เสร็จ!'} <ArrowRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {tasks.filter(t => t.status === col.id).length === 0 && (
                    <div className="text-center py-10 opacity-30 flex flex-col items-center">
                      <div className="mb-2">
                        {col.id === 'todo' ? <Circle size={32} /> : col.id === 'in_progress' ? <Clock size={32} /> : <CheckCircle2 size={32} />}
                      </div>
                      <p className="text-sm font-handwriting">ว่างเปล่า...</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Button */}
      <div className="fixed bottom-6 right-6 z-20">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAddModal(true)}
          className={`bg-[var(--color-accent)] text-white w-16 h-16 shadow-pop flex items-center justify-center border-2 border-[var(--border-color)] ${theme === 'cyber' ? 'clip-cyber' : 'rounded-full'}`}
        >
          <Plus size={32} />
        </motion.button>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className={`bg-[var(--color-surface)] w-full max-w-sm p-6 shadow-2xl border-2 border-[var(--border-color)]/20 ${theme === 'cyber' ? 'clip-cyber' : 'rounded-[2rem]'}`}
            >
              <h2 className="text-2xl font-bold mb-4 font-handwriting text-[var(--text-heading)]">เพิ่มงานใหม่ 📝</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-main)] mb-1 font-handwriting">วิชา</label>
                  <input 
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full border-2 border-[var(--border-color)]/20 rounded-xl p-2 focus:border-[var(--color-primary)] outline-none font-body bg-[var(--bg-main)] text-[var(--text-main)]"
                    placeholder="เช่น คณิตศาสตร์"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-main)] mb-1 font-handwriting">หัวข้อ/งานที่สั่ง</label>
                  <input 
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className="w-full border-2 border-[var(--border-color)]/20 rounded-xl p-2 focus:border-[var(--color-primary)] outline-none font-body bg-[var(--bg-main)] text-[var(--text-main)]"
                    placeholder="เช่น แบบฝึกหัดหน้า 50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-main)] mb-1 font-handwriting">กำหนดส่ง (ถ้ามี)</label>
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full border-2 border-[var(--border-color)]/20 rounded-xl p-2 focus:border-[var(--color-primary)] outline-none font-body bg-[var(--bg-main)] text-[var(--text-main)]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => handleAddTask(false)}
                  disabled={isPlanning}
                >
                  บันทึกปกติ
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1 relative overflow-hidden" 
                  onClick={() => handleAddTask(true)}
                  disabled={isPlanning}
                >
                  {isPlanning ? (
                    <span className="animate-pulse">กำลังคิด...</span>
                  ) : (
                    <>
                      <Wand2 size={18} className="mr-1" /> AI ช่วยวางแผน
                    </>
                  )}
                </Button>
              </div>
              
              <button onClick={() => setShowAddModal(false)} className="w-full mt-4 text-[var(--text-main)] opacity-50 text-sm font-handwriting hover:opacity-100">ยกเลิก</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
