import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, Share2, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { Mascot } from '../components/UI';
import { generateMindMap } from '../services/gemini';

interface MapNode {
  id: string;
  label: string;
  children?: MapNode[];
}

const COLORS = ['#BFDBFE', '#BBF7D0', '#FEF08A', '#FED7AA', '#FECACA', '#E9D5FF'];

// Recursive Node Component
const MindMapNode = ({ node, depth }: { node: MapNode, depth: number }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  
  // Assign color based on depth
  const bgColor = depth === 0 ? '#3B82F6' : COLORS[depth % COLORS.length];
  const textColor = depth === 0 ? 'white' : 'black';

  return (
    <div className="flex flex-col items-center">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`
          relative z-10 px-4 py-2 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all
          flex items-center justify-center text-center font-medium text-sm min-w-[100px] max-w-[180px]
        `}
        style={{ backgroundColor: bgColor, color: textColor }}
        onClick={() => setExpanded(!expanded)}
      >
        {node.label}
        {hasChildren && (
          <div className="absolute -bottom-2 bg-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] text-gray-500 border border-gray-200 shadow-sm">
            {expanded ? '-' : '+'}
          </div>
        )}
      </motion.div>

      {/* Connecting Lines & Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col items-center"
          >
            {/* Vertical Line from Parent to Horizontal Bar */}
            <div className="w-px h-4 bg-gray-300"></div>
            
            {/* Children Container */}
            <div className="flex gap-4 relative pt-4">
              {/* Horizontal Bar connecting children */}
              {node.children!.length > 1 && (
                <div className="absolute top-0 left-[50%] -translate-x-1/2 w-[calc(100%-2rem)] h-px bg-gray-300"></div>
              )}

              {node.children!.map((child, index) => (
                <div key={child.id || index} className="flex flex-col items-center relative">
                  {/* Vertical Line from Horizontal Bar to Child */}
                  <div className="absolute -top-4 w-px h-4 bg-gray-300"></div>
                  {/* Horizontal Connector Fix for First/Last Child */}
                  {node.children!.length > 1 && (
                     <>
                       {index === 0 && <div className="absolute -top-4 right-1/2 w-[50%] h-px bg-white"></div>} 
                       {index === node.children!.length - 1 && <div className="absolute -top-4 left-1/2 w-[50%] h-px bg-white"></div>}
                     </>
                  )}
                  {/* Actually, the horizontal bar logic above is tricky. 
                      Standard way: 
                      - Parent has line down.
                      - Children container has top padding.
                      - Each child has line up.
                      - A horizontal line connects the vertical lines of children.
                  */}
                  <MindMapNode node={child} depth={depth + 1} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function SnapMap() {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapData, setMapData] = useState<MapNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setMapData(null); // Reset map
      };
      reader.readAsDataURL(file);
    }
  };

  const generateMap = async () => {
    if (!image) return;
    setLoading(true);

    try {
      // Extract base64 data
      const base64Data = image.split(',')[1];
      const data = await generateMindMap(base64Data);
      setMapData(data);
    } catch (error) {
      console.error("GenAI Error:", error);
      alert("เกิดข้อผิดพลาดในการสร้างแผนผัง ลองใหม่อีกครั้งนะ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white p-4 shadow-sm flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Share2 className="text-blue-500" /> Snap & Map
          </h1>
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col items-center gap-6 overflow-hidden">
        
        {/* Image Preview / Upload Area */}
        {!mapData && (
          <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-300 overflow-hidden relative min-h-[200px] flex flex-col items-center justify-center">
            {image ? (
              <div className="relative w-full h-full p-4">
                <img src={image} alt="Preview" className="w-full h-48 object-contain rounded-lg" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="text-blue-500" size={32} />
                </div>
                <p className="text-gray-500 mb-4">ถ่ายรูปชีทสรุป หรืออัปโหลดรูปภาพ</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Upload size={18} /> อัปโหลดรูป
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        {image && !mapData && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={generateMap}
            disabled={loading}
            className={`
              px-8 py-3 rounded-full font-bold text-lg shadow-lg flex items-center gap-2
              ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-xl'}
            `}
          >
            {loading ? 'กำลังวิเคราะห์...' : '✨ สร้างแผนผังความคิด'}
          </motion.button>
        )}

        {/* Map Visualization Area */}
        {mapData && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full flex-1 bg-white rounded-3xl shadow-lg border border-gray-200 overflow-auto relative min-h-[500px]"
          >
            <div className="absolute top-4 right-4 flex gap-2 z-20">
              <button 
                onClick={() => setMapData(null)}
                className="p-2 bg-red-100 text-red-500 rounded-lg hover:bg-red-200"
                title="Reset"
              >
                <RefreshCw size={20} />
              </button>
            </div>
            
            <div className="min-w-max min-h-max flex items-center justify-center p-10">
              <MindMapNode node={mapData} depth={0} />
            </div>
          </motion.div>
        )}

      </main>
    </div>
  );
}
