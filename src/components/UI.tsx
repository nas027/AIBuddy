import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../services/theme';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon,
  className = '',
  ...props 
}) => {
  const { theme } = useTheme();

  // Base styles using CSS variables
  const baseStyles = "font-handwriting font-bold transition-all flex items-center justify-center gap-2 relative overflow-hidden";
  
  // Theme specific shape/border
  const themeStyles = {
    doodle: "rounded-[var(--radius-btn)] border-[length:var(--border-width)] border-[color:var(--border-color)] active:scale-95 active:shadow-none shadow-[var(--shadow-card)]",
    cyber: "clip-cyber border-[length:var(--border-width)] border-[color:var(--border-color)] hover:shadow-[0_0_15px_var(--color-primary)] active:scale-95 text-transform:uppercase tracking-wider",
    cozy: "rounded-[var(--radius-btn)] shadow-sm hover:shadow-md active:translate-y-[1px]"
  };

  const variants = {
    primary: {
      doodle: "bg-[var(--color-primary)] text-white",
      cyber: "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)] hover:bg-[var(--color-primary)]/40",
      cozy: "bg-[var(--color-primary)] text-white"
    },
    secondary: {
      doodle: "bg-[var(--color-secondary)] text-black",
      cyber: "bg-[var(--color-secondary)]/20 text-[var(--color-secondary)] border-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/40",
      cozy: "bg-[var(--color-secondary)] text-white"
    },
    accent: {
      doodle: "bg-[var(--color-accent)] text-white",
      cyber: "bg-[var(--color-accent)]/20 text-[var(--color-accent)] border-[var(--color-accent)] hover:bg-[var(--color-accent)]/40",
      cozy: "bg-[var(--color-accent)] text-white"
    },
    outline: {
      doodle: "bg-white text-black",
      cyber: "bg-transparent text-[var(--text-main)] border-[var(--text-main)]",
      cozy: "bg-white text-[var(--text-main)] border border-gray-200"
    }
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-lg",
    lg: "px-8 py-4 text-xl",
  };

  // Resolve variant style based on theme
  const variantStyle = variants[variant][theme];

  return (
    <motion.button
      whileHover={theme === 'doodle' ? { scale: 1.05, rotate: [-1, 1, -1, 0] } : { scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseStyles} ${themeStyles[theme]} ${variantStyle} ${sizes[size]} ${className}`}
      {...props}
    >
      {/* Shine effect for Doodle */}
      {theme === 'doodle' && (
        <div className="absolute top-2 left-4 w-1/3 h-1/2 bg-white opacity-20 rounded-full blur-md pointer-events-none"></div>
      )}
      
      {icon && <span className="w-6 h-6">{icon}</span>}
      {children}
    </motion.button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; color?: string; rotate?: number }> = ({ 
  children, 
  className = '',
  color,
  rotate = 0
}) => {
  const { theme } = useTheme();

  // Determine background color based on theme if not explicitly provided
  const bgStyle = color || 'bg-[var(--color-surface)]';
  
  // Theme specific card styles
  const themeCardStyles = {
    doodle: `border-[length:var(--border-width)] border-[color:var(--border-color)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)]`,
    cyber: `border-[length:var(--border-width)] border-[color:var(--border-color)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)] backdrop-blur-md bg-opacity-80`,
    cozy: `rounded-[var(--radius-card)] shadow-[var(--shadow-card)] border border-gray-100`
  };

  return (
    <div 
      className={`${bgStyle} ${themeCardStyles[theme]} p-6 relative ${className}`}
      style={{ transform: theme === 'doodle' ? `rotate(${rotate}deg)` : 'none' }}
    >
      {children}
    </div>
  );
};

export { Mascot } from './Mascot';
