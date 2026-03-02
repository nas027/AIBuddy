import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Mascot } from '../components/UI';
import { ArrowLeft, Rocket, Camera, Type, Image as ImageIcon, X, BookOpen, Calculator, Cloud, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { summarizeLesson, generateQuiz, generateInfographicData, askTutor, validateImageContent, generateMindMap, StudySummary, QuizQuestion, InfographicData } from '../services/gemini';
import { saveSession, StudySession, updateQuestProgress } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from '../services/theme';

export default function StudyInput() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [mode, setMode] = useState<'lesson' | 'problem'>('lesson');
  const [text, setText] = useState('');
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกินไปนะ (ขอไม่เกิน 4MB จ้า)');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setImageData({ base64: base64Data, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File Read Error:', error);
      alert('ขอโทษนะ อ่านไฟล์ไม่ได้ ลองใหม่อีกครั้งนะ');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setImageData(null);
  };

  const handleStart = async () => {
    if ((!text.trim() && !imageData) || !topic.trim()) return;

    setIsLoading(true);
    try {
      // 1. Validate Image Content if present
      if (imageData) {
        setLoadingStep('กำลังตรวจสอบรูปภาพ... 🔍');
        const validation = await validateImageContent(imageData.base64, imageData.mimeType);
        
        if (!validation.isValid) {
          setIsLoading(false);
          alert(`รบกวนอัปโหลดภาพใหม่ เนื่องจาก: ${validation.reason || "ไม่พบเนื้อหาที่น่าจะสรุปได้"}\n\nลองเลือกรูปที่เห็นตัวหนังสือชัดๆ อีกทีนะครับ! 📸`);
          return;
        }
      }

      let summaryData: StudySummary = { summary: [], keywords: [] };
      let quizData: QuizQuestion[] = [];
      let infographicData: InfographicData = { title: '', emoji: '', description: '', keyPoints: [] };
      let mindMapData: any = null;
      let tutorResponse = '';

      if (mode === 'lesson') {
        setLoadingStep('กำลังอ่านหนังสือ... 📖');
        summaryData = await summarizeLesson(text, imageData?.base64, imageData?.mimeType);
        
        setLoadingStep('กำลังออกข้อสอบ... ✍️');
        quizData = await generateQuiz(text, imageData?.base64, imageData?.mimeType);
        
        setLoadingStep('กำลังวาดรูป... 🎨');
        infographicData = await generateInfographicData(text, imageData?.base64, imageData?.mimeType);

        setLoadingStep('กำลังสร้าง Mind Map... 🧠');
        try {
          mindMapData = await generateMindMap(text, imageData?.base64, imageData?.mimeType);
        } catch (e) {
          console.warn("Mind Map generation failed", e);
        }
      } else {
        setLoadingStep('กำลังวิเคราะห์โจทย์... 🧮');
        const tutorResult = await askTutor(text, imageData?.base64, imageData?.mimeType);
        tutorResponse = tutorResult.explanation;
        summaryData.keywords = tutorResult.keywords || [];
      }

      const newSession: StudySession = {
        id: uuidv4(),
        date: new Date().toISOString(),
        topic: topic,
        content: text || (imageData ? '[Image Content]' : ''),
        summary: summaryData,
        quiz: quizData,
        infographic: infographicData,
        mindMap: mindMapData,
        tutorResponse: tutorResponse,
        mode: mode
      };

      saveSession(newSession);
      updateQuestProgress('study');
      navigate(`/result/${newSession.id}`);
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับน้องบัดดี้ ลองใหม่อีกครั้งนะ!');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors duration-300 bg-[var(--bg-main)]">
        <Mascot mood="thinking" size="lg" />
        <h2 className="text-3xl font-handwriting mt-8 mb-4 animate-bounce text-[var(--color-primary)]">
          {loadingStep}
        </h2>
        <p className="font-body text-[var(--text-main)] opacity-70">น้องบัดดี้กำลังทำงานอย่างหนัก...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto relative overflow-hidden transition-colors duration-300 bg-[var(--bg-main)] font-body"
         style={{
           backgroundImage: `
             linear-gradient(#E5E7EB 1px, transparent 1px),
             linear-gradient(90deg, #E5E7EB 1px, transparent 1px)
           `,
           backgroundSize: '20px 20px'
         }}
    >
      {/* Header */}
      <div className="flex items-center mb-8 mt-2">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-700">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold ml-2 font-handwriting text-gray-800">เริ่มติวเข้ม! 🚀</h1>
      </div>

      {/* Main Card */}
      <div className="relative bg-white border-[3px] border-black rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
        {/* Pink Tape */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-pink-200 opacity-80 rotate-[-1deg]"></div>

        <div className="space-y-6 mt-2">
          {/* Topic Input */}
          <div>
            <label className="block font-bold mb-2 text-gray-700 font-handwriting text-xl">หัวข้อเรื่องที่เรียน</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="เช่น ระบบสุริยะ, Past Simple Tense"
              className="w-full p-4 border-2 border-gray-200 rounded-2xl font-body focus:border-[#F472B6] focus:outline-none transition-colors bg-[#FFF9F0] text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* Content Input */}
          <div>
            <label className="block font-bold mb-2 text-gray-700 font-handwriting text-xl">
              เนื้อหาที่อยากให้สรุป
            </label>
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="วางเนื้อหาบทเรียนที่นี่..."
                className="w-full h-48 p-4 border-2 border-gray-200 rounded-2xl font-body focus:border-[#F472B6] focus:outline-none transition-colors resize-none bg-[#FFF9F0] text-gray-700 placeholder-gray-400"
                style={{ lineHeight: '1.6' }}
              />
              
              {/* Image Preview Overlay */}
              {imageData && (
                <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center z-10 border-2 border-[#F472B6] border-dashed m-1">
                  <div className="relative">
                    {imageData.mimeType.startsWith('image/') ? (
                      <img 
                        src={`data:${imageData.mimeType};base64,${imageData.base64}`} 
                        alt="Preview" 
                        className="h-32 object-contain rounded-lg shadow-md"
                      />
                    ) : (
                      <div className="h-32 w-32 flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-gray-200 shadow-sm">
                        <FileText size={48} className="text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500 font-medium">PDF File</span>
                      </div>
                    )}
                    <button 
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="mt-2 text-sm font-bold text-[#F472B6] flex items-center gap-1">
                    <ImageIcon size={16} /> แนบไฟล์แล้ว
                  </p>
                </div>
              )}

              {/* Camera Button inside Textarea */}
              <div className="absolute bottom-3 right-3 z-20">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*,application/pdf" 
                  onChange={handleFileSelect}
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full bg-white border-2 border-gray-200 text-gray-400 hover:text-[#F472B6] hover:border-[#F472B6] transition-all shadow-sm"
                  title="ถ่ายรูป / อัปโหลดรูป"
                >
                  <Camera size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="flex justify-center mb-12">
        <button 
          onClick={handleStart}
          disabled={(!text && !imageData) || !topic}
          className={`
            w-full py-4 rounded-full font-bold text-xl font-handwriting text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-[3px] border-black transition-all
            ${(!text && !imageData) || !topic 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-[#F472B6] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1'}
          `}
        >
          🚀 Go! เริ่มเลย
        </button>
      </div>

      {/* Cloud Mascot */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-24 h-16 bg-white border-[3px] border-black rounded-[50%] flex items-center justify-center relative shadow-md">
              <div className="absolute -top-4 left-4 w-10 h-10 bg-white border-t-[3px] border-black rounded-full"></div>
              <div className="absolute -top-2 right-4 w-8 h-8 bg-white border-t-[3px] border-r-[3px] border-black rounded-full"></div>
              <div className="flex gap-2 z-10 mt-1">
                <div className="w-2 h-2 bg-black rounded-full"></div>
                <div className="w-2 h-2 bg-black rounded-full"></div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-2 w-2 h-1 bg-black rounded-full"></div>
              <div className="absolute top-1/2 left-2 mt-2 w-2 h-1.5 bg-pink-300 rounded-full opacity-50"></div>
              <div className="absolute top-1/2 right-2 mt-2 w-2 h-1.5 bg-pink-300 rounded-full opacity-50"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
