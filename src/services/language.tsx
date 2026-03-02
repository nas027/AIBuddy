import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'th' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
  th: {
    'app.title': 'สมุดจดของฉัน 📖',
    'app.subtitle': 'วันนี้มาเติมสีสันให้การเรียนกัน!',
    'menu.study': 'สรุป & เก็งข้อสอบ',
    'menu.study.desc': 'สรุปบทเรียนและสร้างแบบทดสอบ',
    'menu.tutor': 'พี่บัดดี้ ติวทุกวิชา',
    'menu.tutor.desc': 'ส่งโจทย์มาเลย เดี๋ยวพี่ช่วยใบ้ให้!',
    'menu.homework': 'การบ้าน',
    'menu.homework.desc': 'วางแผนงาน',
    'menu.library': 'คลังความรู้',
    'menu.library.desc': 'ประวัติการติว',
    'daily.mission': 'ภารกิจวันนี้',
    'daily.pending': 'มี {count} งานที่ต้องส่งนะ สู้ๆ!',
    'daily.free': 'เย้! ไม่มีงานค้าง พักผ่อนได้',
    'logout': 'ออกจากระบบ',
    'theme': 'เปลี่ยนธีม',
    'guest': 'Guest',
    'member': 'Member',
    'start.title': 'เริ่มติวเข้ม! 🚀',
    'input.topic': 'หัวข้อเรื่องที่เรียน',
    'input.topic.placeholder': 'เช่น ระบบสุริยะ, Past Simple Tense',
    'input.content': 'เนื้อหาที่อยากให้สรุป',
    'input.content.placeholder': 'วางเนื้อหาบทเรียนที่นี่...',
    'btn.start': 'Go! เริ่มเลย',
    'loading.reading': 'กำลังอ่านหนังสือ... 📖',
    'loading.quiz': 'กำลังออกข้อสอบ... ✍️',
    'loading.drawing': 'กำลังวาดรูป... 🎨',
    'result.summary': 'สรุปย่อ',
    'result.infographic': 'Infographic',
    'result.quiz': 'เกมตอบคำถาม',
    'result.save_image': 'บันทึกรูปภาพ',
    'result.save_image_content': 'บันทึกรูปภาพ (พร้อมเนื้อหา)',
    'quiz.score': 'คะแนน',
    'quiz.next': 'ข้อต่อไป',
    'quiz.result': 'ดูผลคะแนน',
    'quiz.retry': 'ลองใหม่',
    'quiz.home': 'กลับหน้าหลัก',
    'quiz.finished': 'จบเกมแล้ว! 🎉',
  },
  en: {
    'app.title': 'My Notebook 📖',
    'app.subtitle': 'Let\'s add some color to learning!',
    'menu.study': 'Summary & Quiz',
    'menu.study.desc': 'Summarize lessons and create quizzes',
    'menu.tutor': 'Buddy Tutor',
    'menu.tutor.desc': 'Send me a problem, I\'ll give you a hint!',
    'menu.homework': 'Homework',
    'menu.homework.desc': 'Plan your tasks',
    'menu.library': 'Library',
    'menu.library.desc': 'Study history',
    'daily.mission': 'Daily Mission',
    'daily.pending': 'You have {count} tasks due. Fight on!',
    'daily.free': 'Yay! No pending tasks. Time to relax.',
    'logout': 'Logout',
    'theme': 'Change Theme',
    'guest': 'Guest',
    'member': 'Member',
    'start.title': 'Start Studying! 🚀',
    'input.topic': 'Topic',
    'input.topic.placeholder': 'e.g. Solar System, Past Simple Tense',
    'input.content': 'Content to summarize',
    'input.content.placeholder': 'Paste lesson content here...',
    'btn.start': 'Go! Start',
    'loading.reading': 'Reading content... 📖',
    'loading.quiz': 'Creating quiz... ✍️',
    'loading.drawing': 'Drawing infographic... 🎨',
    'result.summary': 'Summary',
    'result.infographic': 'Infographic',
    'result.quiz': 'Quiz Game',
    'result.save_image': 'Save Image',
    'result.save_image_content': 'Save Image (with content)',
    'quiz.score': 'Score',
    'quiz.next': 'Next',
    'quiz.result': 'See Result',
    'quiz.retry': 'Retry',
    'quiz.home': 'Back Home',
    'quiz.finished': 'Game Over! 🎉',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('buddy_language') as Language) || 'th';
  });

  useEffect(() => {
    localStorage.setItem('buddy_language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['th']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
