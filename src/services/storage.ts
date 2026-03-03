import { HomeworkTask, QuizQuestion, StudySummary, InfographicData } from './gemini';

export type { HomeworkTask, QuizQuestion, StudySummary, InfographicData };

export interface MoodEntry {
  date: string;
  mood: 'happy' | 'neutral' | 'sad';
  note?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string; // Optional for guest
  name: string;
  avatar?: string;
  isGuest: boolean;
  joinedDate: string;
  
  // Gamification
  xp: number;
  level: number;
  coins: number;
  inventory: string[]; // List of unlocked item IDs
  consumables: {
    hint: number;
    streak_freeze: number;
    skip_logic: number;
  };
  equipped: {
    skin?: string;
    frame?: string;
    accessory?: string;
  };
  dailyQuests: DailyQuest[];
  lastLoginDate: string;
  moodHistory: MoodEntry[];
}

export interface DailyQuest {
  id: string;
  title: string;
  target: number;
  current: number;
  reward: { type: 'xp' | 'coin'; amount: number };
  completed: boolean;
  claimed: boolean;
}

export interface StudySession {
  id: string;
  date: string;
  topic: string;
  content: string; // Original text
  summary: StudySummary;
  quiz: QuizQuestion[];
  infographic: InfographicData;
  infographicImage?: string; // Base64 image
  mindMap?: any;
  quizScore?: number;
  tutorResponse?: string;
  mode?: 'lesson' | 'problem';
}

const STORAGE_KEYS = {
  HOMEWORK: 'buddy_homework',
  SESSIONS: 'buddy_sessions',
  USER_NAME: 'buddy_username',
  USERS: 'buddy_users',
  CURRENT_USER: 'buddy_current_user'
};

// --- Gamification Logic ---

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, // 1-10
  3250, 3850, 4500, 5200, 5950, 6750 // 11-16+
];

export const getLevelFromXP = (xp: number): number => {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
};

export const getNextLevelXP = (level: number): number => {
  if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * 1.5; // Cap or scale
  return LEVEL_THRESHOLDS[level]; // Threshold for next level (index = level)
};

export const INITIAL_QUESTS: DailyQuest[] = [
  { id: 'login', title: 'เข้าสู่ระบบรายวัน', target: 1, current: 0, reward: { type: 'coin', amount: 10 }, completed: false, claimed: false },
  { id: 'study', title: 'ติวหนังสือ 1 เรื่อง', target: 1, current: 0, reward: { type: 'xp', amount: 20 }, completed: false, claimed: false },
  { id: 'homework', title: 'ทำการบ้านเสร็จ 1 งาน', target: 1, current: 0, reward: { type: 'xp', amount: 15 }, completed: false, claimed: false },
];

// --- User Management ---

// Helper to migrate legacy user data
const migrateUser = (user: any): User => {
  return {
    ...user,
    xp: user.xp || 0,
    level: user.level || 1,
    coins: user.coins || 0,
    inventory: user.inventory || ['skin_default'],
    consumables: user.consumables || { hint: 0, streak_freeze: 0, skip_logic: 0 },
    equipped: user.equipped || { skin: 'skin_default' },
    dailyQuests: user.dailyQuests || [...INITIAL_QUESTS],
    lastLoginDate: user.lastLoginDate || new Date().toISOString(),
    moodHistory: user.moodHistory || []
  };
};

export const getUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  const users = data ? JSON.parse(data) : [];
  return users.map(migrateUser);
};

export const saveUser = (user: User) => {
  const users = getUsers();
  const index = users.findIndex(u => u.username === user.username);
  if (index !== -1) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  
  // Update current user if it matches
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.username === user.username) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }
};

export const registerUser = (username: string, password: string, name: string): User | null => {
  const users = getUsers();
  if (users.find(u => u.username === username)) {
    return null; // User already exists
  }
  const newUser: User = {
    id: Date.now().toString(),
    username,
    password,
    name,
    isGuest: false,
    joinedDate: new Date().toISOString(),
    xp: 0,
    level: 1,
    coins: 0,
    inventory: ['skin_default'],
    consumables: { hint: 0, streak_freeze: 0, skip_logic: 0 },
    equipped: { skin: 'skin_default' },
    dailyQuests: [...INITIAL_QUESTS],
    lastLoginDate: new Date().toISOString(),
    moodHistory: []
  };
  saveUser(newUser);
  return newUser;
};

export const loginUser = (username: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    // Check daily login reset
    const today = new Date().toDateString();
    const lastLogin = new Date(user.lastLoginDate).toDateString();
    if (today !== lastLogin) {
      user.dailyQuests = INITIAL_QUESTS.map(q => ({...q})); // Reset quests
      // Auto complete login quest
      const loginQuest = user.dailyQuests.find(q => q.id === 'login');
      if (loginQuest) {
        loginQuest.current = 1;
        loginQuest.completed = true;
      }
      user.lastLoginDate = new Date().toISOString();
      saveUser(user);
    }
  }
  return user ? migrateUser(user) : null;
};

export const loginGuest = (name: string): User => {
  const guestUser: User = {
    id: 'guest-' + Date.now(),
    username: 'guest-' + Date.now(),
    name,
    isGuest: true,
    joinedDate: new Date().toISOString(),
    xp: 0,
    level: 1,
    coins: 0,
    inventory: ['skin_default'],
    consumables: { hint: 0, streak_freeze: 0, skip_logic: 0 },
    equipped: { skin: 'skin_default' },
    dailyQuests: [...INITIAL_QUESTS],
    lastLoginDate: new Date().toISOString(),
    moodHistory: []
  };
  // Auto complete login quest for guest
  const loginQuest = guestUser.dailyQuests.find(q => q.id === 'login');
  if (loginQuest) {
    loginQuest.current = 1;
    loginQuest.completed = true;
  }
  return guestUser;
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!data) return null;
  const user = JSON.parse(data);
  return migrateUser(user);
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    saveUserName(user.name); // Keep compatibility with old code
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

// --- Gamification Actions ---

export const addXP = (amount: number) => {
  const user = getCurrentUser();
  if (!user) return;
  
  user.xp += amount;
  const newLevel = getLevelFromXP(user.xp);
  if (newLevel > user.level) {
    // Level Up!
    user.level = newLevel;
    // Could trigger a modal or notification here
  }
  saveUser(user);
};

export const addCoins = (amount: number) => {
  const user = getCurrentUser();
  if (!user) return;
  
  user.coins += amount;
  saveUser(user);
};

export const updateQuestProgress = (questId: string, amount: number = 1) => {
  const user = getCurrentUser();
  if (!user) return;
  
  const quest = user.dailyQuests.find(q => q.id === questId);
  if (quest && !quest.completed) {
    quest.current += amount;
    if (quest.current >= quest.target) {
      quest.current = quest.target;
      quest.completed = true;
      // Auto claim or wait for user? Let's auto claim for simplicity or let user click.
      // Requirements say "Login daily +10 coins".
    }
    saveUser(user);
  }
};

export const claimQuestReward = (questId: string) => {
  const user = getCurrentUser();
  if (!user) return;
  
  const quest = user.dailyQuests.find(q => q.id === questId);
  if (quest && quest.completed && !quest.claimed) {
    quest.claimed = true;
    saveUser(user); // Save claimed status first to prevent overwriting
    
    if (quest.reward.type === 'xp') addXP(quest.reward.amount);
    if (quest.reward.type === 'coin') addCoins(quest.reward.amount);
  }
};

export const buyItem = (itemId: string, cost: number) => {
  const user = getCurrentUser();
  if (!user) return false;
  
  if (user.coins >= cost) {
    // Check if it's a consumable
    const item = STORE_ITEMS.find(i => i.id === itemId);
    if (item?.type === 'consumable' && item.consumableType) {
      user.coins -= cost;
      user.consumables[item.consumableType] = (user.consumables[item.consumableType] || 0) + 1;
      saveUser(user);
      return true;
    }

    // Regular item
    if (!user.inventory.includes(itemId)) {
      user.coins -= cost;
      user.inventory.push(itemId);
      saveUser(user);
      return true;
    }
  }
  return false;
};

export const useConsumable = (type: 'hint' | 'streak_freeze' | 'skip_logic'): boolean => {
  const user = getCurrentUser();
  if (!user) return false;

  if (user.consumables[type] > 0) {
    user.consumables[type]--;
    saveUser(user);
    return true;
  }
  return false;
};

export const equipItem = (type: 'skin' | 'frame' | 'accessory', itemId: string) => {
  const user = getCurrentUser();
  if (!user) return;
  
  // Allow un-equipping by passing 'default' or empty string if needed, 
  // but for now we assume we are switching to a valid item in inventory.
  // Special case: 'skin_default' is always available.
  if (itemId === 'skin_default' || user.inventory.includes(itemId)) {
    user.equipped[type] = itemId;
    saveUser(user);
  }
};

// --- Store Data ---

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'skin' | 'frame' | 'accessory' | 'consumable';
  consumableType?: 'hint' | 'streak_freeze' | 'skip_logic';
  category: 'A' | 'B' | 'C';
}

export const STORE_ITEMS: StoreItem[] = [
  // Category A: Mascot Skins
  { id: 'skin_sunglasses', name: 'แว่นกันแดดสุดเท่', description: 'เพิ่มความคูลให้น้องบัดดี้', price: 100, type: 'skin', category: 'A' },
  { id: 'skin_wizard', name: 'หมวกพ่อมด', description: 'ร่ายเวทมนตร์แห่งการเรียนรู้', price: 250, type: 'skin', category: 'A' },
  { id: 'skin_astronaut', name: 'ชุดนักบินอวกาศ', description: 'พาน้องบัดดี้ไปดวงจันทร์', price: 500, type: 'skin', category: 'A' },
  { id: 'skin_golden', name: 'Golden Buddy', description: 'สกินสีทองสุดแรร์', price: 1000, type: 'skin', category: 'A' },

  // Category B: Profile Decoration
  { id: 'frame_donut', name: 'กรอบรูปโดนัท', description: 'หวานๆ น่ากิน', price: 150, type: 'frame', category: 'B' },
  { id: 'frame_space', name: 'กรอบรูปอวกาศ', description: 'ท่องไปในจักรวาล', price: 200, type: 'frame', category: 'B' },
  { id: 'frame_rgb', name: 'กรอบรูปไฟ RGB', description: 'เกมเมอร์ตัวจริง', price: 300, type: 'frame', category: 'B' },
  { id: 'theme_neon', name: 'Dark Mode Neon', description: 'ธีมสีมืดพร้อมแสงนีออน', price: 250, type: 'accessory', category: 'B' },
  { id: 'theme_chocomint', name: 'Choco Mint Theme', description: 'สีเขียวมิ้นต์ตัดช็อกโกแลต', price: 250, type: 'accessory', category: 'B' },

  // Category C: Power-Ups
  { id: 'powerup_hint', name: 'หลอดไฟ (Hint)', description: 'ตัดช้อยส์ผิดออก 2 ข้อใน Quiz', price: 50, type: 'consumable', consumableType: 'hint', category: 'C' },
  { id: 'powerup_streak', name: 'โล่กันแตก (Streak Freeze)', description: 'ป้องกันสถิติขาดหาย 1 วัน', price: 200, type: 'consumable', consumableType: 'streak_freeze', category: 'C' },
  { id: 'powerup_skip', name: 'บัตรผ่านด่วน (Skip Logic)', description: 'สรุปเนื้อหาสั้นลง 50%', price: 30, type: 'consumable', consumableType: 'skip_logic', category: 'C' },
];

// --- Existing Functions (Updated to use Current User if needed, but keeping simple for now) ---

export const saveUserName = (name: string) => {
  localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
};

export const getUserName = (): string => {
  const currentUser = getCurrentUser();
  return currentUser ? currentUser.name : (localStorage.getItem(STORAGE_KEYS.USER_NAME) || "นักเรียน");
};

export const getHomework = (): HomeworkTask[] => {
  const data = localStorage.getItem(STORAGE_KEYS.HOMEWORK);
  return data ? JSON.parse(data) : [];
};

export const saveHomework = (tasks: HomeworkTask[]) => {
  localStorage.setItem(STORAGE_KEYS.HOMEWORK, JSON.stringify(tasks));
};

export const addHomework = (task: HomeworkTask) => {
  const tasks = getHomework();
  tasks.push(task);
  saveHomework(tasks);
};

export const updateHomework = (updatedTask: HomeworkTask) => {
  const tasks = getHomework();
  const index = tasks.findIndex(t => t.id === updatedTask.id);
  if (index !== -1) {
    tasks[index] = updatedTask;
    saveHomework(tasks);
  }
};

export const deleteHomework = (id: string) => {
  const tasks = getHomework();
  const newTasks = tasks.filter(t => t.id !== id);
  saveHomework(newTasks);
};

export const getSessions = (): StudySession[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  return data ? JSON.parse(data) : [];
};

export const saveSession = (session: StudySession) => {
  const sessions = getSessions();
  sessions.unshift(session); // Add to top
  
  // Limit to last 10 sessions to prevent storage quota issues
  if (sessions.length > 10) {
    sessions.length = 10;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.warn("Storage quota exceeded, attempting to cleanup images from old sessions");
    // If quota exceeded, try removing images from older sessions (keep current one)
    // Keep images for top 3, remove for others
    for (let i = 3; i < sessions.length; i++) {
      delete sessions[i].infographicImage;
    }
    
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (e2) {
      console.error("Storage full even after cleanup. Removing oldest sessions.");
      // Drastic measure: keep only top 3
      const minimalSessions = sessions.slice(0, 3);
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(minimalSessions));
    }
  }
};

export const updateSession = (session: StudySession) => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index !== -1) {
    sessions[index] = session;
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.warn("Storage quota exceeded during update");
      // If update fails, try to clear images from other sessions
      for (let i = 0; i < sessions.length; i++) {
        if (sessions[i].id !== session.id) {
           delete sessions[i].infographicImage;
        }
      }
      try {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      } catch (e2) {
        alert("หน่วยความจำเต็ม ไม่สามารถบันทึกรูปภาพได้");
      }
    }
  }
};

export const getSessionById = (id: string): StudySession | undefined => {
  const sessions = getSessions();
  return sessions.find(s => s.id === id);
};

export const updateSessionScore = (id: string, score: number) => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index !== -1) {
    sessions[index].quizScore = score;
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }
};

export const deleteSession = (id: string) => {
  const sessions = getSessions();
  const newSessions = sessions.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(newSessions));
};

export const saveMood = (mood: 'happy' | 'neutral' | 'sad', note?: string) => {
  const user = getCurrentUser();
  if (!user) return;
  
  const today = new Date().toISOString().split('T')[0];
  const existingEntryIndex = user.moodHistory.findIndex(m => m.date.startsWith(today));
  
  const newEntry: MoodEntry = {
    date: new Date().toISOString(),
    mood,
    note
  };

  if (existingEntryIndex !== -1) {
    user.moodHistory[existingEntryIndex] = newEntry;
  } else {
    user.moodHistory.push(newEntry);
  }
  saveUser(user);
};
