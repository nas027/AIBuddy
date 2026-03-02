import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ShoppingCart, Star, Shirt, Image as ImageIcon, Zap, Check, Lock, Sparkles } from 'lucide-react';
import { STORE_ITEMS, buyItem, getCurrentUser, User, equipItem } from '../services/storage';
import { Button, Card, Mascot } from '../components/UI';
import confetti from 'canvas-confetti';

export default function Store() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeCategory, setActiveCategory] = useState<'A' | 'B' | 'C'>('A');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleBuy = async (item: typeof STORE_ITEMS[0]) => {
    if (!user) return;
    
    if (user.coins < item.price) {
      alert("เหรียญไม่พอจ้า! ไปทำภารกิจหรือเรียนเพิ่มก่อนนะ");
      return;
    }

    setPurchasingId(item.id);
    
    // Simulate network delay for effect
    await new Promise(resolve => setTimeout(resolve, 600));

    const success = buyItem(item.id, item.price);
    if (success) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setUser(getCurrentUser()); // Refresh user state
    } else {
      alert("ซื้อไม่ได้จ้า มีของนี้อยู่แล้วหรือเปล่า?");
    }
    setPurchasingId(null);
  };

  const handleEquip = (item: typeof STORE_ITEMS[0]) => {
    if (!user) return;
    
    if (item.type === 'skin' || item.type === 'frame' || item.type === 'accessory') {
      equipItem(item.type, item.id);
      setUser(getCurrentUser()); // Refresh to update equipped status
    }
  };

  const getCategoryIcon = (cat: 'A' | 'B' | 'C') => {
    switch (cat) {
      case 'A': return <Shirt size={20} />;
      case 'B': return <ImageIcon size={20} />;
      case 'C': return <Zap size={20} />;
    }
  };

  const getCategoryLabel = (cat: 'A' | 'B' | 'C') => {
    switch (cat) {
      case 'A': return 'แฟชั่นน้องบัดดี้';
      case 'B': return 'ตกแต่งโปรไฟล์';
      case 'C': return 'สกิลตัวช่วย';
    }
  };

  if (!user) return <div className="p-4">Loading...</div>;

  const filteredItems = STORE_ITEMS.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#FFF9F0] pb-20">
      {/* Header */}
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="text-[#A78BFA]" />
              ร้านค้าบัดดี้
            </h1>
          </div>
          <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-200">
            <Star className="text-yellow-500 fill-yellow-500" size={16} />
            <span className="font-bold text-yellow-700">{user.coins}</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        {/* Mascot Preview (Only for Category A) */}
        {activeCategory === 'A' && (
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                 {/* This is a simplified preview. Ideally, we pass the equipped skin to Mascot component */}
                 <Mascot size="lg" mood="happy" />
              </div>
              {user.equipped.skin !== 'skin_default' && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-gray-100 whitespace-nowrap">
                  ใส่ชุด: {STORE_ITEMS.find(i => i.id === user.equipped.skin)?.name || 'Unknown'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {(['A', 'B', 'C'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all
                ${activeCategory === cat 
                  ? 'bg-[#A78BFA] text-white shadow-md transform scale-105' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}
              `}
            >
              {getCategoryIcon(cat)}
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
              const isOwned = user.inventory.includes(item.id);
              const isEquipped = user.equipped.skin === item.id || user.equipped.frame === item.id || user.equipped.accessory === item.id;
              const isConsumable = item.type === 'consumable';
              const quantity = isConsumable && item.consumableType ? (user.consumables[item.consumableType] || 0) : 0;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`bg-white rounded-2xl p-4 border-2 ${isEquipped ? 'border-[#34D399] bg-green-50' : 'border-gray-100'} shadow-sm relative overflow-hidden`}
                >
                  {isEquipped && (
                    <div className="absolute top-0 right-0 bg-[#34D399] text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl">
                      สวมใส่อยู่
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl shadow-inner ${isOwned ? 'bg-gray-50' : 'bg-gray-100 grayscale opacity-80'}`}>
                      {/* Placeholder Icons based on ID/Type */}
                      {item.id.includes('sunglasses') && '🕶️'}
                      {item.id.includes('wizard') && '🧙‍♂️'}
                      {item.id.includes('astronaut') && '👨‍🚀'}
                      {item.id.includes('golden') && '✨'}
                      {item.id.includes('donut') && '🍩'}
                      {item.id.includes('space') && '🌌'}
                      {item.id.includes('rgb') && '🌈'}
                      {item.id.includes('neon') && '🌃'}
                      {item.id.includes('chocomint') && '🍫'}
                      {item.id.includes('hint') && '💡'}
                      {item.id.includes('streak') && '🛡️'}
                      {item.id.includes('skip') && '⏩'}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{item.description}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        {isConsumable ? (
                          <div className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                            มีอยู่: {quantity} ชิ้น
                          </div>
                        ) : (
                          isOwned ? (
                            <div className="text-xs font-bold text-[#34D399] flex items-center gap-1">
                              <Check size={14} /> เป็นเจ้าของแล้ว
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-yellow-600 font-bold">
                              <Star size={14} className="fill-yellow-500 text-yellow-500" />
                              {item.price}
                            </div>
                          )
                        )}

                        {/* Action Button */}
                        {!isOwned || isConsumable ? (
                          <button
                            onClick={() => handleBuy(item)}
                            disabled={purchasingId === item.id || user.coins < item.price}
                            className={`
                              px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-1
                              ${user.coins >= item.price 
                                ? 'bg-[#A78BFA] text-white hover:bg-[#9061F9] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none border border-black' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                            `}
                          >
                            {purchasingId === item.id ? (
                              <Sparkles className="animate-spin" size={16} />
                            ) : (
                              <>ซื้อ {item.price}</>
                            )}
                          </button>
                        ) : (
                          !isConsumable && (
                            <button
                              onClick={() => handleEquip(item)}
                              disabled={isEquipped}
                              className={`
                                px-4 py-1.5 rounded-full text-sm font-bold transition-all border border-black
                                ${isEquipped 
                                  ? 'bg-gray-100 text-gray-400 cursor-default' 
                                  : 'bg-white text-gray-800 hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none'}
                              `}
                            >
                              {isEquipped ? 'ใส่อยู่' : 'ใส่เลย'}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
