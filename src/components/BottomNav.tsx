import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, GraduationCap, Calendar, Library, Clock, BarChart2 } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'หน้าแรก' },
    { path: '/study', icon: BookOpen, label: 'ติวสอบ' },
    { path: '/tutor', icon: GraduationCap, label: 'ติวเข้ม' },
    { path: '/homework', icon: Calendar, label: 'การบ้าน' },
    { path: '/library', icon: Library, label: 'คลังความรู้' },
    { path: '/focus', icon: Clock, label: 'Focus' },
    { path: '/report', icon: BarChart2, label: 'Report' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex overflow-x-auto py-2 px-2 gap-2 no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[4.5rem] flex-shrink-0 ${
              location.pathname === item.path 
                ? 'text-[#F472B6] bg-pink-50 font-bold' 
                : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            <item.icon size={24} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
            <span className="text-[10px] mt-1 whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
