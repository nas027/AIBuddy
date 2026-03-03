import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionById, updateSessionScore, saveSession, updateSession, StudySession, useConsumable, getCurrentUser } from '../services/storage';
import { generateInfographicData, generateInfographicImage, InfographicData, generateMindMap } from '../services/gemini';
import { Button, Card, Mascot } from '../components/UI';
import { ArrowLeft, Download, RefreshCw, Check, X, Share2, Star, Brain, Lightbulb, GraduationCap, Sparkles, Cloud, Image as ImageIcon, Dice5, Zap, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { useTheme } from '../services/theme';
import ConfirmDialog from '../components/ConfirmDialog';

interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

const MindMapRenderer = ({ data }: { data: MindMapNode }) => {
  if (!data) return null;

  return (
    <div className="flex flex-col items-center">
      <div className="bg-[#A78BFA] text-white px-6 py-3 rounded-full font-bold shadow-md border-2 border-white mb-4 relative z-10">
        {data.label}
      </div>
      
      {data.children && data.children.length > 0 && (
        <div className="flex gap-4 items-start justify-center relative">
          {/* Connecting lines would go here in a more complex implementation */}
          {data.children.map((child) => (
            <div key={child.id} className="flex flex-col items-center relative">
              <div className="w-0.5 h-6 bg-gray-300 mb-2"></div>
              <div className="bg-white border-2 border-[#A78BFA] px-4 py-2 rounded-xl shadow-sm text-sm font-medium text-gray-700 mb-4 relative z-10 whitespace-nowrap">
                {child.label}
              </div>
              {child.children && child.children.length > 0 && (
                 <div className="flex gap-2 justify-center relative">
                    {child.children.map((subChild) => (
                      <div key={subChild.id} className="flex flex-col items-center">
                        <div className="w-0.5 h-4 bg-gray-300 mb-1"></div>
                        <div className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg text-xs text-gray-600 shadow-sm whitespace-nowrap">
                          {subChild.label}
                        </div>
                      </div>
                    ))}
                 </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function StudyResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [session, setSession] = useState<StudySession | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'infographic' | 'quiz' | 'mindmap'>('summary');
  const [isGeneratingInfographic, setIsGeneratingInfographic] = useState(false);
  const infographicRef = useRef<HTMLDivElement>(null);
  
  // Quiz State
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      const data = getSessionById(id);
      if (data) {
        setSession(data);
        // Default tab based on mode
        if (data.mode === 'problem') setActiveTab('summary');
        else setActiveTab('summary');
      } else {
        navigate('/');
      }
    }
  }, [id, navigate]);

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return; // Prevent multiple clicks
    setSelectedAnswer(index);
    setShowExplanation(true);

    if (index === session?.quiz[currentQuestion].correctAnswer) {
      setScore(s => s + 1);
      
      const confettiColors = ['#A78BFA', '#F472B6', '#34D399'];

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: confettiColors
      });
    }
  };

  const nextQuestion = () => {
    if (!session) return;
    if (currentQuestion < session.quiz.length - 1) {
      setCurrentQuestion(c => c + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setDisabledOptions([]);
    } else {
      setQuizCompleted(true);
      if (id) updateSessionScore(id, score + (selectedAnswer === session.quiz[currentQuestion].correctAnswer ? 1 : 0));
    }
  };

  const handleUseHint = () => {
    if (!session || !session.quiz || selectedAnswer !== null) return;
    
    // Check if user has hint item
    const user = getCurrentUser();
    if (!user || (user.consumables.hint || 0) <= 0) {
      setShowHintConfirm(true);
      return;
    }

    if (useConsumable('hint')) {
      const currentQ = session.quiz[currentQuestion];
      const wrongIndices = currentQ.options
        .map((_, idx) => idx)
        .filter((_, idx) => idx !== currentQ.correctAnswer);
      
      // Shuffle and pick 2
      const toDisable = wrongIndices.sort(() => 0.5 - Math.random()).slice(0, 2);
      setDisabledOptions(toDisable);
    }
  };

  const retryQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `สรุปเรื่อง ${session?.topic}`,
          text: `มาดูสรุปเรื่อง ${session?.topic} กับพี่บัดดี้กันเถอะ!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('คัดลอกลิงก์แล้ว!');
    }
  };

  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showHintConfirm, setShowHintConfirm] = useState(false);

  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);

  const handleGenerateMindMap = async () => {
    if (!session) return;
    setIsGeneratingMindMap(true);
    try {
      // Use summary or content as context
      const contextText = session.summary?.summary?.length > 0 
        ? `Topic: ${session.topic}. Key points: ${session.summary.summary.join('. ')}`
        : session.content;

      const mindMapData = await generateMindMap(contextText);
      
      const updatedSession = { ...session, mindMap: mindMapData };
      setSession(updatedSession);
      updateSession(updatedSession);
    } catch (error) {
      console.error("Failed to generate mind map", error);
      alert("ขอโทษนะ สร้าง Mind Map ไม่ได้ ลองใหม่อีกครั้งนะ");
    } finally {
      setIsGeneratingMindMap(false);
    }
  };

  const handleGenerateInfographic = async (customPrompt?: string) => {
    if (!session) return;
    setIsGeneratingInfographic(true);
    try {
      // Generate AI Image
      // Use summary for better context if available, otherwise content
      const contextText = session.summary?.summary?.length > 0 
        ? `Topic: ${session.topic}. Key points: ${session.summary.summary.join('. ')}`
        : session.content;

      let base64Image;
      if (customPrompt && session.infographicImage) {
         // Edit existing image
         base64Image = await generateInfographicImage(contextText, undefined, undefined, session.infographicImage, customPrompt);
      } else {
         // Generate new
         base64Image = await generateInfographicImage(contextText);
      }
      
      const updatedSession = { ...session, infographicImage: base64Image };
      setSession(updatedSession);
      updateSession(updatedSession); // Save to storage
      setEditPrompt(''); // Clear prompt after success
      setIsEditing(false);
      
    } catch (error) {
      console.error("Failed to generate infographic image", error);
      alert("ขอโทษนะ สร้างรูปไม่ได้ ลองใหม่อีกครั้งนะ");
    } finally {
      setIsGeneratingInfographic(false);
    }
  };

  const handleDownloadInfographic = async () => {
    if (infographicRef.current && session) {
      try {
        const canvas = await html2canvas(infographicRef.current, {
          scale: 2, // Higher resolution
          backgroundColor: null,
          useCORS: true,
          logging: false,
          allowTaint: true // Allow cross-origin images if needed (though base64 is fine)
        });
        
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `infographic-${session.topic}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Download failed", error);
        alert("บันทึกรูปไม่ได้ ลองใหม่อีกครั้งนะ");
      }
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative transition-colors duration-300 bg-[var(--bg-main)] font-body"
         style={{
           backgroundImage: `
             linear-gradient(#E5E7EB 1px, transparent 1px),
             linear-gradient(90deg, #E5E7EB 1px, transparent 1px)
           `,
           backgroundSize: '20px 20px'
         }}
    >
      <ConfirmDialog
        isOpen={showHintConfirm}
        title="ไอเทมคำใบ้หมด!"
        message="คุณไม่มีไอเทมคำใบ้เหลืออยู่ ต้องการไปซื้อที่ร้านค้าหรือไม่?"
        onConfirm={() => navigate('/store')}
        onCancel={() => setShowHintConfirm(false)}
        confirmText="ไปร้านค้า"
      />

      {/* Header */}
      <div className="p-4 flex items-center justify-between sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg truncate max-w-[200px] font-handwriting text-gray-800">{session.topic}</h1>
        <button onClick={handleShare} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-600">
          <Share2 size={24} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-4 gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'summary', label: 'สรุปย่อ' },
          { id: 'mindmap', label: 'Mind Map' },
          { id: 'infographic', label: 'Infographic' },
          { id: 'quiz', label: 'เกมตอบคำถาม' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              px-4 py-2 rounded-t-2xl font-bold text-sm whitespace-nowrap border-t-2 border-x-2 border-gray-200 transition-all font-handwriting
              ${activeTab === tab.id 
                ? `bg-[#A78BFA] text-white translate-y-1 pb-4 shadow-sm border-[#A78BFA]` 
                : 'bg-white text-gray-500 hover:bg-gray-50'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 bg-white rounded-t-3xl shadow-lg min-h-[500px] relative z-10 -mt-1 border-t-2 border-gray-100">
        
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {session.mode === 'problem' ? (
              // Problem Mode: Tutor Response
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mascot mood="thinking" size="sm" />
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex-1">
                    <p className="font-bold text-[#A78BFA] mb-2 font-handwriting">โจทย์ของคุณ:</p>
                    <p className="text-gray-600 italic">"{session.content}"</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 flex-row-reverse">
                  <Mascot mood="happy" size="md" />
                  <div className="bg-blue-50 p-4 rounded-2xl rounded-tr-none shadow-sm border border-blue-100 flex-1">
                    <h3 className="font-bold text-blue-600 mb-2 font-handwriting flex items-center gap-2">
                      <GraduationCap size={20} /> พี่บัดดี้ช่วยสอน:
                    </h3>
                    <div className="prose prose-sm text-gray-700 font-body leading-relaxed whitespace-pre-wrap">
                      {session.tutorResponse}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Lesson Mode: Summary
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 font-handwriting flex items-center gap-2">
                  <Sparkles className="text-yellow-400 fill-yellow-400" /> สรุปเนื้อหา
                </h2>
                <ul className="space-y-6">
                  {session.summary.summary.map((point, idx) => (
                    <li key={idx} className="flex gap-4 items-start">
                      <span className="text-[#34D399] font-bold text-2xl mt-[-0.25rem]">•</span>
                      <span className="font-body text-lg leading-relaxed text-gray-600">{point}</span>
                    </li>
                  ))}
                </ul>

                {/* Vocabulary Section */}
                <div className="mt-8 border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-[#FFF9F0]">
                  <div className="inline-block bg-[#34D399] text-white text-xs font-bold px-2 py-1 rounded mb-3">NOTE</div>
                  <h3 className="text-xl font-bold text-gray-800 font-handwriting flex items-center gap-2 mb-4">
                    <Star className="text-[#34D399]" size={20} /> คำศัพท์น่ารู้
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {session.summary.keywords.length > 0 ? (
                      session.summary.keywords.map((word, idx) => (
                        <span key={idx} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-gray-600 text-sm shadow-sm font-body">
                          {word}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">ไม่มีคำศัพท์ในบทเรียนนี้</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* MIND MAP TAB */}
        {activeTab === 'mindmap' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full overflow-auto">
             {session.mindMap ? (
               <div className="min-w-[600px] p-4">
                 <MindMapRenderer data={session.mindMap} />
               </div>
             ) : (
               <div className="text-center py-10 opacity-60 flex flex-col items-center">
                 <Network size={48} className="mx-auto mb-4 text-gray-400" />
                 <p className="font-handwriting text-xl text-gray-600 mb-6">ไม่มี Mind Map สำหรับหัวข้อนี้</p>
                 <button 
                   onClick={handleGenerateMindMap}
                   disabled={isGeneratingMindMap}
                   className="bg-[#A78BFA] text-white font-bold py-3 px-6 rounded-full shadow-pop border-2 border-black font-handwriting flex items-center gap-2 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-wait"
                 >
                   {isGeneratingMindMap ? <RefreshCw className="animate-spin" /> : <Brain />}
                   {isGeneratingMindMap ? 'กำลังสร้าง...' : 'สร้าง Mind Map (AI)'}
                 </button>
               </div>
             )}
          </motion.div>
        )}

        {/* INFOGRAPHIC TAB */}
        {activeTab === 'infographic' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full py-4">
            {session.infographic ? (
              <div className="flex flex-col items-center w-full">
                
                {/* HTML Infographic Card with optional Background Image */}
                <div 
                  ref={infographicRef}
                  className="w-full max-w-sm rounded-3xl overflow-hidden shadow-xl border-4 border-white relative mb-6 transition-all duration-500"
                  style={{ 
                    aspectRatio: '3/4',
                    backgroundImage: session.infographicImage ? `url(${session.infographicImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#FFF9F0', // Force hex
                    color: '#1F2937' // Force hex (gray-800)
                  }}
                >
                  {/* Overlay for readability if image exists */}
                  {session.infographicImage && (
                    <div className="absolute inset-0 transition-opacity duration-500" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)' }} />
                  )}

                  {/* Background Pattern (Only if no image) */}
                  {!session.infographicImage && (
                    <div className="absolute inset-0 opacity-10" 
                         style={{ 
                           backgroundImage: 'radial-gradient(#A78BFA 2px, transparent 2px)', 
                           backgroundSize: '20px 20px' 
                         }} 
                    />
                  )}
                  
                  {/* Content Container */}
                  <div className="relative h-full flex flex-col p-6 z-10">
                    {/* Header */}
                    <div className="text-center mb-6">
                      <div className="text-6xl mb-2 drop-shadow-sm">{session.infographic.emoji}</div>
                      <h2 className="text-2xl font-bold font-handwriting leading-tight inline-block px-4 py-1 rounded-full border-2 border-black/5 shadow-sm" style={{ color: '#1F2937', backgroundColor: 'rgba(255,255,255,0.8)' }}>
                        {session.infographic.title}
                      </h2>
                    </div>

                    {/* Description Box */}
                    <div className="border-2 border-black rounded-2xl p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(167,139,250,1)] transform -rotate-1" style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
                      <p className="font-body text-center leading-relaxed text-sm" style={{ color: '#4B5563' }}>
                        {session.infographic.description}
                      </p>
                    </div>

                    {/* Key Points */}
                    <div className="flex-1 flex flex-col justify-center gap-3">
                      {session.infographic.keyPoints.map((point, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 shadow-sm hover:scale-[1.02] transition-transform" style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
                          <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold font-handwriting flex-shrink-0 border-2 border-white shadow-sm" style={{ backgroundColor: '#34D399' }}>
                            {idx + 1}
                          </div>
                          <p className="font-body text-sm font-medium leading-tight" style={{ color: '#374151' }}>{point}</p>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-4 flex justify-center items-center gap-2 opacity-60">
                      <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">B</span>
                      </div>
                      <span className="text-xs font-handwriting font-bold px-2 rounded-full" style={{ color: '#4B5563', backgroundColor: 'rgba(255,255,255,0.5)' }}>สรุปโดย พี่บัดดี้ AI</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 w-full max-w-sm">
                  <div className="flex gap-4 justify-center">
                    <button 
                      onClick={handleDownloadInfographic}
                      className="bg-[#34D399] text-white font-bold py-3 px-6 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:translate-y-1 hover:shadow-none transition-all font-handwriting flex items-center gap-2"
                    >
                      <Download size={20} /> บันทึกรูป
                    </button>
                    <button 
                      onClick={() => handleGenerateInfographic()}
                      disabled={isGeneratingInfographic}
                      className={`
                        bg-white text-gray-700 font-bold py-3 px-6 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black transition-all font-handwriting flex items-center gap-2
                        ${isGeneratingInfographic ? 'opacity-50 cursor-wait' : 'hover:translate-y-1 hover:shadow-none'}
                      `}
                    >
                      <RefreshCw size={20} className={isGeneratingInfographic ? "animate-spin" : ""} /> 
                      {isGeneratingInfographic ? 'กำลังสร้าง...' : (session.infographicImage ? 'เปลี่ยนพื้นหลัง (AI)' : 'สร้างพื้นหลัง (AI)')}
                    </button>
                  </div>

                  {/* Edit Prompt UI */}
                  {session.infographicImage && (
                    <div className="mt-2 bg-white p-3 rounded-2xl border-2 border-gray-100 shadow-sm">
                      <p className="text-xs text-gray-400 mb-2 font-bold ml-1">✨ ปรับแต่งพื้นหลังด้วย AI</p>
                      
                      {/* Style Presets */}
                      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1 items-center">
                        <button
                          onClick={() => {
                            const styles = [
                              'Pixel art style, 8-bit, retro game',
                              'Origami paper craft style, folded paper, texture',
                              'Neon cyberpunk style, glowing lights, dark background',
                              'Chalkboard drawing style, white chalk on black board',
                              'Stained glass window style, colorful, geometric',
                              'Claymation style, plasticine texture, cute',
                              'Vintage poster style, retro colors, texture',
                              'Blueprint style, technical drawing, blue background',
                              'Oil painting style, thick brush strokes, artistic',
                              'Pop art style, comic book, halftone dots'
                            ];
                            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
                            setEditPrompt(randomStyle);
                            handleGenerateInfographic(randomStyle);
                          }}
                          disabled={isGeneratingInfographic}
                          className="px-3 py-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white border border-transparent rounded-full text-xs whitespace-nowrap hover:shadow-lg hover:scale-105 transition-all flex items-center gap-1 font-bold"
                        >
                          <Dice5 size={14} /> สุ่มสไตล์
                        </button>
                        {[
                          { label: '🎨 สีน้ำ', prompt: 'Watercolor painting style, soft, artistic' },
                          { label: '✏️ ลายเส้น', prompt: 'Doodle art style, hand drawn, cute, minimal' },
                          { label: '🌌 อวกาศ', prompt: 'Space theme, stars, galaxy, dark blue tone' },
                          { label: '🌿 ธรรมชาติ', prompt: 'Nature theme, leaves, flowers, green tone' },
                          { label: '🤖 ไซเบอร์', prompt: 'Cyberpunk style, neon lights, futuristic' },
                          { label: '🧱 3D', prompt: '3D render, cute isometric, clay style' },
                        ].map((style) => (
                          <button
                            key={style.label}
                            onClick={() => {
                              setEditPrompt(style.prompt);
                              handleGenerateInfographic(style.prompt);
                            }}
                            disabled={isGeneratingInfographic}
                            className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs whitespace-nowrap hover:bg-[#A78BFA] hover:text-white hover:border-[#A78BFA] transition-colors"
                          >
                            {style.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          placeholder="เช่น ขอโทนสีมืด, เติมดาว, เปลี่ยนเป็นสไตล์การ์ตูน..."
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#A78BFA] transition-colors"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editPrompt.trim() && !isGeneratingInfographic) {
                              handleGenerateInfographic(editPrompt);
                            }
                          }}
                        />
                        <button 
                          onClick={() => handleGenerateInfographic(editPrompt)}
                          disabled={!editPrompt.trim() || isGeneratingInfographic}
                          className="bg-[#A78BFA] text-white p-2 rounded-xl disabled:opacity-50 hover:bg-[#9061F9] transition-colors"
                        >
                          <Sparkles size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                 <p className="text-gray-500 mb-4">ยังไม่มี Infographic</p>
                 <button 
                    onClick={() => handleGenerateInfographic()}
                    disabled={isGeneratingInfographic}
                    className="bg-[#A78BFA] text-white font-bold py-3 px-6 rounded-full shadow-pop border-2 border-black font-handwriting flex items-center gap-2 mx-auto"
                  >
                    {isGeneratingInfographic ? <RefreshCw className="animate-spin" /> : <ImageIcon />}
                    {isGeneratingInfographic ? 'กำลังสร้าง...' : 'สร้างรูปด้วย AI'}
                  </button>
              </div>
            )}
          </motion.div>
        )}

        {/* QUIZ TAB */}
        {activeTab === 'quiz' && (
          <div className="h-full flex flex-col">
            {(!session.quiz || session.quiz.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-60 py-10">
                <Mascot mood="thinking" size="md" />
                <p className="mt-4 font-handwriting text-xl text-gray-600">
                  ไม่มีแบบทดสอบสำหรับหัวข้อนี้จ้า
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  (โหมดโจทย์ปัญหาจะไม่มีแบบทดสอบนะ)
                </p>
              </div>
            ) : !quizCompleted ? (
              <>
                <div className="flex justify-between items-center mb-8">
                  <span className="font-bold text-gray-400 font-handwriting text-lg">คำถาม {currentQuestion + 1}/{session.quiz.length}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleUseHint}
                      disabled={selectedAnswer !== null || disabledOptions.length > 0}
                      className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-bold text-sm font-handwriting shadow-sm flex items-center gap-1 hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-200"
                    >
                      <Lightbulb size={16} /> ตัวช่วย
                    </button>
                    <span className="bg-[#34D399] text-white px-4 py-1 rounded-full font-bold text-sm font-handwriting shadow-sm border border-green-400">
                      คะแนน: {score}
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-8 leading-relaxed font-handwriting text-gray-800 text-center">
                    {session.quiz[currentQuestion].question}
                  </h3>

                  <div className="space-y-4">
                    {session.quiz[currentQuestion].options.map((option, idx) => {
                      let btnStyle = "bg-white border-gray-200 text-gray-600 hover:border-[#A78BFA]";
                      
                      if (disabledOptions.includes(idx)) {
                         btnStyle = "bg-gray-100 border-gray-100 text-gray-300 opacity-50 cursor-not-allowed";
                      } else if (selectedAnswer !== null) {
                        if (idx === session.quiz[currentQuestion].correctAnswer) {
                          btnStyle = "bg-green-50 border-green-500 text-green-700";
                        } else if (idx === selectedAnswer) {
                          btnStyle = "bg-red-50 border-red-500 text-red-700";
                        } else {
                          btnStyle = "bg-gray-50 border-gray-100 text-gray-400 opacity-50";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => !disabledOptions.includes(idx) && handleAnswer(idx)}
                          disabled={selectedAnswer !== null || disabledOptions.includes(idx)}
                          className={`w-full p-4 rounded-2xl border-2 text-left font-body transition-all ${btnStyle} shadow-sm text-lg`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200"
                      >
                        <p className="font-bold text-blue-600 mb-1 font-handwriting">💡 เฉลย:</p>
                        <p className="text-blue-800 text-sm font-body">{session.quiz[currentQuestion].explanation}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {selectedAnswer !== null && (
                  <div className="mt-8">
                    <Button onClick={nextQuestion} className="w-full shadow-pop bg-[#A78BFA] border-black text-white">
                      {currentQuestion < session.quiz.length - 1 ? 'ข้อต่อไป' : 'ดูผลคะแนน'}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center flex flex-col items-center justify-center h-full py-10">
                <h2 className="text-3xl font-bold mb-4 font-handwriting text-[#A78BFA]">จบเกมแล้ว! 🎉</h2>
                <div className="relative mb-8">
                  <Mascot mood={score > session.quiz.length / 2 ? 'excited' : 'happy'} size="lg" />
                  <div className="absolute -bottom-4 -right-4 bg-[#F472B6] text-white font-bold text-2xl w-16 h-16 rounded-full flex items-center justify-center border-4 border-white shadow-lg rotate-12 font-handwriting">
                    {score}/{session.quiz.length}
                  </div>
                </div>
                
                <p className="text-gray-600 font-body mb-8 text-lg">
                  {score === session.quiz.length ? "สุดยอด! เต็ม 10 ไม่หัก" : 
                   score > session.quiz.length / 2 ? "เก่งมาก! พยายามต่อไปนะ" : "ไม่เป็นไรนะ มาลองใหม่กันเถอะ"}
                </p>

                <div className="flex gap-4 w-full">
                  <Button variant="outline" onClick={retryQuiz} className="flex-1" icon={<RefreshCw size={18} />}>
                    ลองใหม่
                  </Button>
                  <Button variant="primary" onClick={() => navigate('/')} className="flex-1">
                    กลับหน้าหลัก
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
