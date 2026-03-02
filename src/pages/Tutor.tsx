import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Mascot } from '../components/UI';
import { ArrowLeft, Send, Image as ImageIcon, X, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import { askTutor } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../services/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  image?: string;
  timestamp: Date;
}

export default function Tutor() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'สวัสดีจ้า! พี่บัดดี้เองครับ ☁️\n\nไม่ว่าจะวิชาเลข วิทย์ อังกฤษ หรืออะไรก็ถามมาได้เลย! พี่พร้อมช่วยติวให้เข้าใจง่ายๆ ส่งรูปโจทย์หรือถามมาได้เลยนะ!',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกินไปนะ (ขอไม่เกิน 4MB จ้า)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      setSelectedImage({ data: base64Data, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      image: selectedImage ? `data:${selectedImage.mimeType};base64,${selectedImage.data}` : undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await askTutor(userMessage.text, currentImage?.data, currentImage?.mimeType);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.explanation,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'ขอโทษทีนะ พี่บัดดี้มึนหัวนิดหน่อย ลองส่งใหม่อีกทีนะ 😵‍💫',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative transition-colors duration-300">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 sticky top-0 z-20 bg-[var(--color-surface)]/80 backdrop-blur-sm border-b-2 border-dashed border-[var(--border-color)]/20">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-black/5 rounded-full transition-colors text-[var(--text-main)]">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-[var(--color-secondary)]/20 p-1 rounded-full border-2 border-[var(--color-secondary)]/30">
            <Mascot mood="thinking" size="sm" />
          </div>
          <div>
            <h1 className="font-bold text-lg font-handwriting text-[var(--text-heading)]">พี่บัดดี้ ติวทุกวิชา 🎓</h1>
            <p className="text-xs text-[var(--color-secondary)] font-bold font-handwriting">Online</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-6 pb-24">
        {messages.map((msg) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${
              msg.role === 'user' 
                ? 'bg-[var(--color-primary)] text-white rounded-tr-none' 
                : 'bg-[var(--color-surface)] text-[var(--text-main)] border-2 border-[var(--border-color)]/20 rounded-tl-none'
              } ${theme === 'cyber' ? 'clip-cyber rounded-none' : 'rounded-[2rem]'} p-5 shadow-sm relative`}
            >
              {msg.image && (
                <div className="p-1 bg-[var(--color-surface)] rounded-xl rotate-1 shadow-sm mb-2">
                  <img src={msg.image} alt="User upload" className="w-full rounded-lg" />
                </div>
              )}
              <div className="font-body text-sm leading-relaxed whitespace-pre-wrap">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
              <span className={`text-[10px] opacity-50 absolute -bottom-5 ${msg.role === 'user' ? 'right-2' : 'left-2'} text-[var(--text-main)] font-handwriting`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`bg-[var(--color-surface)] ${theme === 'cyber' ? 'clip-cyber rounded-none' : 'rounded-[2rem] rounded-tl-none'} p-4 shadow-sm border-2 border-[var(--border-color)]/20`}>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[var(--text-main)] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[var(--text-main)] rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-[var(--text-main)] rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 sticky bottom-0 z-20 bg-[var(--color-surface)]/80 backdrop-blur-md border-t-2 border-dashed border-[var(--border-color)]/20">
        {selectedImage && (
          <div className="mb-2 flex items-center gap-2 bg-[var(--bg-main)] p-2 rounded-xl w-fit rotate-1 border-2 border-[var(--border-color)]/20">
            <span className="text-xs text-[var(--text-main)] font-handwriting">แนบรูปแล้วจ้า</span>
            <button onClick={() => setSelectedImage(null)} className="text-[var(--text-main)] hover:text-red-500">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileSelect} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-[var(--color-surface)] border-2 border-[var(--border-color)]/20 rounded-2xl text-[var(--text-main)] hover:bg-black/5 transition-colors shadow-sm active:scale-95"
          >
            <ImageIcon size={24} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="ถามโจทย์วิชาอะไรก็ได้..."
            className="flex-1 bg-[var(--color-surface)] border-2 border-[var(--border-color)]/20 rounded-2xl px-4 focus:outline-none focus:border-[var(--color-primary)] transition-colors font-body shadow-inner text-[var(--text-main)] placeholder-[var(--text-main)]/50"
          />
          <button 
            onClick={handleSend}
            disabled={(!inputText.trim() && !selectedImage) || isLoading}
            className="p-3 bg-[var(--color-primary)] text-white rounded-2xl shadow-pop-sm hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[var(--border-color)]"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
