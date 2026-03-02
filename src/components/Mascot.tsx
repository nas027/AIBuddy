import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../services/theme';

export interface MascotProps {
  mood?: 'happy' | 'thinking' | 'sad' | 'excited';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  level?: number;
  className?: string;
  skin?: string;
}

export const Mascot: React.FC<MascotProps> = ({ 
  mood = 'happy',
  size = 'md',
  level = 1,
  className = '',
  skin = 'default'
}) => {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64'
  };

  // Determine Evolution Stage
  let stage = 'egg';
  if (level >= 16) stage = 'god';
  else if (level >= 6) stage = 'child';

  // Animation variants
  const floatAnimation = {
    y: [0, -10, 0],
    transition: { repeat: Infinity, duration: 3 }
  };

  const excitedAnimation = {
    y: [0, -15, 0],
    rotate: [0, -5, 5, 0],
    scale: [1, 1.1, 1],
    transition: { repeat: Infinity, duration: 0.5, repeatDelay: 0.5 }
  };

  return (
    <div className={`relative ${sizeClasses[size]} inline-block ${className}`}>
      <motion.div 
        animate={mood === 'excited' ? excitedAnimation : floatAnimation}
        className="w-full h-full"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg overflow-visible">
          
          {/* --- STAGE 1: EGG (Lv 1-5) --- */}
          {stage === 'egg' && (
            <>
              {/* Egg Body */}
              <path d="M 50 15 Q 80 15 80 55 Q 80 90 50 90 Q 20 90 20 55 Q 20 15 50 15 Z" 
                fill="#FFF9F0" stroke="#4B5563" strokeWidth="3" />
              
              {/* Cracks/Details */}
              <path d="M 30 30 L 40 40 L 35 50" fill="none" stroke="#E5E7EB" strokeWidth="2" />
              
              {/* Face */}
              <circle cx="40" cy="55" r="3" fill="#4B5563" />
              <circle cx="60" cy="55" r="3" fill="#4B5563" />
              
              {mood === 'happy' && <path d="M 45 65 Q 50 68 55 65" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />}
              {mood === 'sad' && <path d="M 45 68 Q 50 65 55 68" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />}
              {mood === 'thinking' && <circle cx="75" cy="30" r="2" fill="#F472B6" className="animate-ping" />}
              
              {/* Cheeks */}
              <circle cx="35" cy="60" r="3" fill="#F472B6" opacity="0.5" />
              <circle cx="65" cy="60" r="3" fill="#F472B6" opacity="0.5" />
            </>
          )}

          {/* --- STAGE 2: CHILD (Lv 6-15) --- */}
          {stage === 'child' && (
            <>
              {/* Body (Round Robot/Buddy) */}
              <circle cx="50" cy="55" r="35" fill="#FFF9F0" stroke="#4B5563" strokeWidth="3" />
              
              {/* Antenna */}
              <path d="M 50 20 L 50 10" stroke="#4B5563" strokeWidth="3" />
              <circle cx="50" cy="10" r="5" fill="#34D399" className={mood === 'thinking' ? 'animate-pulse' : ''} />
              
              {/* Arms */}
              <path d="M 15 55 Q 10 45 20 40" fill="none" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
              <path d="M 85 55 Q 90 45 80 40" fill="none" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />

              {/* Face */}
              <circle cx="38" cy="50" r="4" fill="#4B5563" />
              <circle cx="62" cy="50" r="4" fill="#4B5563" />
              
              {mood === 'happy' && <path d="M 40 60 Q 50 70 60 60" fill="none" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />}
              {mood === 'excited' && <path d="M 40 60 Q 50 75 60 60" fill="#F472B6" stroke="none" />}
              {mood === 'thinking' && <path d="M 45 65 L 55 65" stroke="#4B5563" strokeWidth="2" />}
              
              {/* Accessory (Skin) */}
              {(skin === 'glasses' || skin === 'skin_sunglasses') && (
                <g>
                  <circle cx="38" cy="50" r="10" fill="#1F2937" fillOpacity="0.8" stroke="#1F2937" strokeWidth="2" />
                  <circle cx="62" cy="50" r="10" fill="#1F2937" fillOpacity="0.8" stroke="#1F2937" strokeWidth="2" />
                  <line x1="48" y1="50" x2="52" y2="50" stroke="#1F2937" strokeWidth="2" />
                  <path d="M 28 50 L 15 45" stroke="#1F2937" strokeWidth="2" />
                  <path d="M 72 50 L 85 45" stroke="#1F2937" strokeWidth="2" />
                </g>
              )}

              {skin === 'skin_wizard' && (
                <g transform="translate(0, -15)">
                  <path d="M 20 25 L 80 25 L 50 -20 Z" fill="#4C1D95" stroke="#FCD34D" strokeWidth="2" />
                  <ellipse cx="50" cy="25" rx="35" ry="5" fill="#5B21B6" stroke="#FCD34D" strokeWidth="2" />
                  <path d="M 30 10 L 35 15 L 40 5 L 45 15 Z" fill="#FCD34D" />
                  <circle cx="60" cy="5" r="3" fill="#FCD34D" className="animate-pulse" />
                </g>
              )}

              {skin === 'skin_astronaut' && (
                <g>
                  {/* Helmet Glass */}
                  <circle cx="50" cy="50" r="28" fill="#60A5FA" fillOpacity="0.3" stroke="#93C5FD" strokeWidth="2" />
                  {/* Reflection */}
                  <path d="M 60 35 Q 65 40 60 45" fill="none" stroke="white" strokeWidth="2" opacity="0.6" />
                  {/* Suit Details */}
                  <rect x="35" y="75" width="30" height="10" rx="2" fill="#E5E7EB" stroke="#9CA3AF" />
                  <circle cx="40" cy="80" r="2" fill="#EF4444" />
                  <circle cx="45" cy="80" r="2" fill="#3B82F6" />
                </g>
              )}
            </>
          )}

          {/* --- STAGE 3: GOD (Lv 16+) OR Golden Skin --- */}
          {(stage === 'god' || skin === 'skin_golden') && (
            <>
              {/* Wings (Only for God stage, unless golden skin also gets wings? Let's give golden skin wings too for value) */}
              <path d="M 15 40 Q 5 20 30 30" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2" />
              <path d="M 85 40 Q 95 20 70 30" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2" />
              
              {/* Halo */}
              <ellipse cx="50" cy="15" rx="20" ry="5" fill="none" stroke="#FCD34D" strokeWidth="3" />

              {/* Body (Golden Robot) */}
              <rect x="25" y="30" width="50" height="50" rx="10" fill={skin === 'skin_golden' ? "url(#goldGradient)" : "#FFF9F0"} stroke="#F59E0B" strokeWidth="3" />
              
              {/* Defs for Gold Gradient */}
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FCD34D" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
              </defs>
              
              {/* Face Screen */}
              <rect x="30" y="35" width="40" height="30" rx="5" fill="#4B5563" />
              
              {/* Digital Eyes */}
              <rect x="38" y="45" width="5" height="5" fill="#34D399" className="animate-pulse" />
              <rect x="57" y="45" width="5" height="5" fill="#34D399" className="animate-pulse" />
              
              {/* Mouth */}
              {mood === 'happy' && <path d="M 42 55 Q 50 58 58 55" stroke="#34D399" strokeWidth="2" fill="none" />}
              
              {/* Crown/Jewel */}
              <path d="M 50 30 L 45 25 L 50 20 L 55 25 Z" fill="#F472B6" />
            </>
          )}

        </svg>
      </motion.div>
    </div>
  );
};

