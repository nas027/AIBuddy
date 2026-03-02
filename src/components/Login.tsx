import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button, Card, Mascot } from './UI';
import { useTheme } from '../services/theme';
import { loginGuest, loginUser, registerUser } from '../services/storage';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

type AuthMode = 'menu' | 'guest' | 'login' | 'signup';

export default function Login({ onLoginSuccess }: LoginProps) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<AuthMode>('menu');
  
  // Form States
  const [guestName, setGuestName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleGuestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    const user = loginGuest(guestName);
    onLoginSuccess(user);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = loginUser(username, password);
    if (user) {
      onLoginSuccess(user);
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !fullName) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }
    const user = registerUser(username, password, fullName);
    if (user) {
      onLoginSuccess(user);
    } else {
      setError('ชื่อผู้ใช้นี้มีคนใช้แล้ว');
    }
  };

  const resetForm = () => {
      setError('');
      setUsername('');
      setPassword('');
      setFullName('');
      setGuestName('');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-main)] transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="text-center p-8 relative overflow-hidden bg-[var(--color-surface)]" rotate={theme === 'doodle' ? -1 : 0}>
           {/* Decorative Elements */}
           {theme === 'doodle' && (
            <>
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-200/50 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            </>
          )}

          <div className="relative z-10">
            <div className="mb-6 flex justify-center">
              <Mascot mood="happy" size="lg" />
            </div>
            
            <h1 className="text-3xl font-bold mb-2 font-handwriting text-[var(--text-heading)]">
              ยินดีต้อนรับ!
            </h1>
            <p className="text-[var(--text-main)] mb-8 font-body opacity-80">
              เข้าสู่ระบบเพื่อเริ่มการเรียนรู้กับพี่บัดดี้
            </p>

            {mode === 'menu' && (
                <div className="space-y-3">
                    <Button onClick={() => { setMode('guest'); resetForm(); }} className="w-full" variant="outline">
                        เข้าใช้งานแบบ Guest (ไม่ต้องสมัคร)
                    </Button>
                    <Button onClick={() => { setMode('login'); resetForm(); }} className="w-full">
                        เข้าสู่ระบบ
                    </Button>
                    <Button onClick={() => { setMode('signup'); resetForm(); }} className="w-full" variant="secondary">
                        สมัครสมาชิกใหม่
                    </Button>
                </div>
            )}

            {mode === 'guest' && (
                <form onSubmit={handleGuestLogin} className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="ชื่อเล่นของคุณ..." 
                        value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-[var(--border-color)]/20 bg-[var(--bg-main)] text-[var(--text-main)] outline-none focus:border-[var(--color-primary)] font-handwriting text-lg text-center"
                        autoFocus
                    />
                    <Button type="submit" className="w-full" disabled={!guestName.trim()}>
                        เริ่มเลย! 🚀
                    </Button>
                    <button type="button" onClick={() => setMode('menu')} className="text-sm text-[var(--text-main)] opacity-50 hover:opacity-100 underline">ย้อนกลับ</button>
                </form>
            )}

            {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="ชื่อผู้ใช้ (Username)" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-[var(--border-color)]/20 bg-[var(--bg-main)] text-[var(--text-main)] outline-none focus:border-[var(--color-primary)] font-body"
                    />
                    <input 
                        type="password" 
                        placeholder="รหัสผ่าน (Password)" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-[var(--border-color)]/20 bg-[var(--bg-main)] text-[var(--text-main)] outline-none focus:border-[var(--color-primary)] font-body"
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button type="submit" className="w-full">
                        เข้าสู่ระบบ
                    </Button>
                    <button type="button" onClick={() => setMode('menu')} className="text-sm text-[var(--text-main)] opacity-50 hover:opacity-100 underline">ย้อนกลับ</button>
                </form>
            )}

            {mode === 'signup' && (
                <form onSubmit={handleSignup} className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="ชื่อเล่น (ที่จะให้พี่บัดดี้เรียก)" 
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-[var(--border-color)]/20 bg-[var(--bg-main)] text-[var(--text-main)] outline-none focus:border-[var(--color-primary)] font-handwriting"
                    />
                    <input 
                        type="text" 
                        placeholder="ตั้งชื่อผู้ใช้ (Username)" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-[var(--border-color)]/20 bg-[var(--bg-main)] text-[var(--text-main)] outline-none focus:border-[var(--color-primary)] font-body"
                    />
                    <input 
                        type="password" 
                        placeholder="ตั้งรหัสผ่าน (Password)" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-[var(--border-color)]/20 bg-[var(--bg-main)] text-[var(--text-main)] outline-none focus:border-[var(--color-primary)] font-body"
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button type="submit" className="w-full" variant="secondary">
                        สมัครสมาชิก
                    </Button>
                    <button type="button" onClick={() => setMode('menu')} className="text-sm text-[var(--text-main)] opacity-50 hover:opacity-100 underline">ย้อนกลับ</button>
                </form>
            )}

          </div>
        </Card>
      </motion.div>
    </div>
  );
}
