import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc 
} from 'firebase/firestore';
import { 
  Plus, Trash2, Image as ImageIcon, Type, X, Send, Heart, Settings, LogOut, QrCode, Sparkles
} from 'lucide-react';

// ==========================================
// 1. 系統設定與常數 (Constants)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCIMmHtzgBXGFGYfP5G4IdIvDPwhGocklg",
  authDomain: "bless-to-you.firebaseapp.com",
  projectId: "bless-to-you",
  storageBucket: "bless-to-you.firebasestorage.app",
  messagingSenderId: "739188760816",
  appId: "1:739188760816:web:b8f510f77d8c63db612235"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// LINE BROWN & FRIENDS 風格配色
const STROKE_COLOR = '#4A3320'; 

const COLORS = [
  { name: '熊大棕', bg: 'bg-[#8B5E3C]', border: `border-[${STROKE_COLOR}]`, text: 'text-white' },
  { name: '莎莉黃', bg: 'bg-[#FFD933]', border: `border-[${STROKE_COLOR}]`, text: `text-[#4A3320]` },
  { name: '兔兔粉', bg: 'bg-[#FFBBD3]', border: `border-[${STROKE_COLOR}]`, text: `text-[#4A3320]` },
  { name: '雷納德綠', bg: 'bg-[#85C46C]', border: `border-[${STROKE_COLOR}]`, text: `text-[#4A3320]` },
  { name: '白化熊大', bg: 'bg-[#F2EDE4]', border: `border-[${STROKE_COLOR}]`, text: `text-[#4A3320]` },
];

// ==========================================
// 2. 工具函數 (Utils)
// ==========================================
const compressImageHelper = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ==========================================
// 3. 自訂 Hooks (邏輯分離)
// ==========================================

const useAuth = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    // 既然資料庫設定為「測試模式」(所有人都可以讀寫)，我們其實不需要 Firebase 的身分驗證。
    // 這裡直接給予每個裝置一個隨機的「訪客 ID」，就能完美避開 auth/configuration-not-found 錯誤！
    const guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
    setUser({ uid: guestId });
  }, []);
  return user;
};

const useBlessings = (user) => {
  const [blessings, setBlessings] = useState([]);
  useEffect(() => {
    if (!user) return;
    // 使用專屬資料庫的根目錄
    const blessingsRef = collection(db, 'blessings');
    return onSnapshot(blessingsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBlessings(data.sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => console.error("讀取失敗:", error));
  }, [user]);
  return blessings;
};

const useFloatingBubbles = (blessings) => {
  const [floatingItems, setFloatingItems] = useState([]);
  useEffect(() => {
    setFloatingItems(prev => {
      const prevMap = new Map(prev.map(p => [p.id, p]));
      let result = blessings.map(b => {
        if (prevMap.has(b.id)) return { ...b, ...prevMap.get(b.id) };
        return {
          ...b,
          realId: b.id,
          left: `${Math.random() * 85 + 2}%`,
          duration: `${Math.random() * 25 + 20}s`, 
          delay: `-${Math.random() * 45}s`,
          scale: Math.random() * 0.4 + 0.8, 
          rotate: Math.random() * 40 - 20, 
        };
      });

      if (result.length > 0 && result.length < 15) {
        let duplicates = [];
        let count = 0;
        while (result.length + duplicates.length < 15 && count < 30) {
          result.forEach(r => {
            if (result.length + duplicates.length >= 15) return;
            duplicates.push({
              ...r,
              id: r.id + '_dup_' + count,
              realId: r.realId,
              left: `${Math.random() * 85 + 2}%`,
              duration: `${Math.random() * 25 + 20}s`,
              delay: `-${Math.random() * 45}s`,
              scale: Math.random() * 0.4 + 0.7,
              rotate: Math.random() * 40 - 20,
            });
          });
          count++;
        }
        result = [...result, ...duplicates];
      }
      return result;
    });
  }, [blessings]);
  return floatingItems;
};

// ==========================================
// 4. UI 元件 (Components) - 貼紙插畫風
// ==========================================

const BackgroundCharacters = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute bottom-[-5%] left-[-5%] w-64 h-64 md:w-96 md:h-96 opacity-25 -rotate-12 drop-shadow-[8px_8px_0px_rgba(74,51,32,0.15)]">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="20" cy="25" r="15" fill="#8B5E3C" stroke="#4A3320" strokeWidth="3" />
        <circle cx="80" cy="25" r="15" fill="#8B5E3C" stroke="#4A3320" strokeWidth="3" />
        <circle cx="50" cy="50" r="40" fill="#8B5E3C" stroke="#4A3320" strokeWidth="3" />
        <ellipse cx="50" cy="62" rx="16" ry="12" fill="#E8D1B5" stroke="#4A3320" strokeWidth="2.5" />
        <circle cx="35" cy="46" r="3.5" fill="#4A3320" />
        <circle cx="65" cy="46" r="3.5" fill="#4A3320" />
        <circle cx="50" cy="57" r="3.5" fill="#4A3320" />
        <path d="M 50 61 L 45 66 M 50 61 L 55 66" stroke="#4A3320" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
    <div className="absolute bottom-[8%] right-[2%] w-32 h-32 md:w-48 md:h-48 opacity-25 rotate-12 drop-shadow-[6px_6px_0px_rgba(74,51,32,0.15)]">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="40" fill="#FFD933" stroke="#4A3320" strokeWidth="3" />
        <circle cx="35" cy="45" r="3" fill="#4A3320" />
        <circle cx="65" cy="45" r="3" fill="#4A3320" />
        <path d="M 40 55 Q 50 50 60 55 Q 50 65 40 55" fill="#FF7B00" stroke="#4A3320" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    </div>
    <div className="absolute top-[-5%] right-[-5%] w-56 h-64 md:w-80 md:h-96 opacity-25 rotate-45 drop-shadow-[8px_8px_0px_rgba(74,51,32,0.15)]">
      <svg viewBox="0 0 100 120" className="w-full h-full">
        <path d="M 35 60 C 20 20 20 10 30 10 C 40 10 45 30 50 60" fill="#FFF" stroke="#4A3320" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 65 60 C 80 20 80 10 70 10 C 60 10 55 30 50 60" fill="#FFF" stroke="#4A3320" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 33 50 C 25 25 25 18 30 18 C 35 18 38 25 41 50" fill="#FFBBD3" />
        <path d="M 67 50 C 75 25 75 18 70 18 C 65 18 62 25 59 50" fill="#FFBBD3" />
        <circle cx="50" cy="70" r="38" fill="#FFF" stroke="#4A3320" strokeWidth="3" />
        <circle cx="35" cy="65" r="3.5" fill="#4A3320" />
        <circle cx="65" cy="65" r="3.5" fill="#4A3320" />
        <circle cx="50" cy="72" r="2.5" fill="#4A3320" />
        <path d="M 50 75 Q 45 80 50 80 Q 55 80 50 75" stroke="#4A3320" strokeWidth="2.5" fill="transparent" strokeLinecap="round" />
        <circle cx="25" cy="75" r="6" fill="#FFBBD3" opacity="0.6" />
        <circle cx="75" cy="75" r="6" fill="#FFBBD3" opacity="0.6" />
      </svg>
    </div>
  </div>
);

const Navbar = ({ isAdminMode, setIsAdminMode, setShowAdminLogin, setShowQrModal }) => (
  <nav className="fixed top-4 inset-x-4 md:inset-x-8 z-30 flex justify-between items-center pointer-events-none">
    <div className="bg-white border-[3px] border-[#4A3320] shadow-[4px_4px_0px_#4A3320] rounded-2xl px-5 py-3 flex items-center gap-3 pointer-events-auto">
      <div className="bg-[#FFD933] p-2 rounded-xl border-2 border-[#4A3320]">
        <Sparkles size={24} className="text-[#4A3320]" strokeWidth={2.5} />
      </div>
      <div>
        <h1 className="text-xl md:text-2xl font-black text-[#4A3320] tracking-wider">
          文欣國小畢業祝福牆
        </h1>
      </div>
    </div>
    
    <div className="flex items-center gap-3 pointer-events-auto">
      <button 
        onClick={() => setShowQrModal(true)} 
        className="hidden md:flex items-center gap-2 bg-white border-[3px] border-[#4A3320] shadow-[4px_4px_0px_#4A3320] px-4 py-2 rounded-2xl hover:-translate-y-1 hover:shadow-[4px_6px_0px_#4A3320] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
      >
        <QrCode size={18} className="text-[#4A3320]" strokeWidth={2.5} />
        <span className="text-sm font-bold text-[#4A3320]">掃描一起玩</span>
      </button>
      {isAdminMode ? (
        <button onClick={() => setIsAdminMode(false)} className="font-bold text-white flex items-center gap-1 bg-[#E25C5C] border-[3px] border-[#4A3320] shadow-[4px_4px_0px_#4A3320] px-4 py-2 rounded-2xl hover:-translate-y-1 hover:shadow-[4px_6px_0px_#4A3320] active:translate-y-1 active:shadow-none transition-all">
          <LogOut size={18} strokeWidth={2.5} /> 結束
        </button>
      ) : (
        <button onClick={() => setShowAdminLogin(true)} className="bg-white border-[3px] border-[#4A3320] shadow-[4px_4px_0px_#4A3320] p-2.5 rounded-2xl text-[#4A3320] hover:-translate-y-1 hover:shadow-[4px_6px_0px_#4A3320] active:translate-y-1 active:shadow-none transition-all">
          <Settings size={22} strokeWidth={2.5} />
        </button>
      )}
    </div>
  </nav>
);

const Bubble = ({ item, isAdminMode, onDelete }) => {
  return (
    <div 
      className="bubble-item group z-10"
      style={{
        left: item.left,
        animationDuration: item.duration,
        animationDelay: item.delay,
        '--scale': item.scale,
        '--start-rot': `${item.rotate}deg`,
      }}
    >
      <div className={`w-48 md:w-60 lg:w-72 aspect-square rounded-full flex flex-col justify-center items-center relative transition-transform duration-700 ease-out group-hover:scale-150 ${item.type === 'text' ? item.color?.bg : 'bg-white'} border-[4px] border-[#4A3320] shadow-[6px_6px_0px_rgba(74,51,32,0.2)]`}>
        
        <div className="absolute top-[8%] right-[15%] w-[20%] h-[10%] bg-white/40 rounded-full rotate-[30deg] pointer-events-none z-20"></div>
        <div className="absolute top-[18%] right-[10%] w-[6%] h-[6%] bg-white/40 rounded-full rotate-[30deg] pointer-events-none z-20"></div>
        
        {item.type === 'text' ? (
          <div className={`p-8 w-full h-full flex flex-col items-center justify-center text-center no-scrollbar ${item.color?.text}`}>
            <p className="text-3xl md:text-4xl font-black leading-tight whitespace-pre-wrap break-words">
              {item.content}
            </p>
          </div>
        ) : (
          <div className="w-full h-full relative rounded-full overflow-hidden flex items-center justify-center bg-white p-1">
            <div className="w-full h-full rounded-full overflow-hidden relative border-[3px] border-[#4A3320]">
              <img 
                src={item.photoUrl} 
                alt="Blessing" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400?text=Photo'; }}
              />
              {item.content && (
                <div className="absolute inset-x-0 bottom-0 bg-[#4A3320]/80 p-4 pt-8 text-center text-white z-10">
                  <p className="text-sm md:text-base font-bold line-clamp-2">{item.content}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {isAdminMode && (
          <button 
            onClick={() => onDelete(item.realId)}
            className="absolute top-0 right-0 md:-top-2 md:-right-2 p-3 bg-[#E25C5C] hover:bg-[#D44A4A] text-white rounded-full border-[3px] border-[#4A3320] shadow-[3px_3px_0px_#4A3320] z-30 active:translate-y-1 active:shadow-none transition-all"
          >
            <Trash2 size={18} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
};

const AddModal = ({ isOpen, onClose, user }) => {
  const [newType, setNewType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState(false); 

  if (!isOpen) return null;

  const handlePhotoChange = async (e) => {
    let file = e.target.files[0];
    if (!file) return;

    setIsConverting(true); 

    try {
      if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
        if (!window.heic2any) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        
        const convertedBlob = await window.heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.8
        });
        file = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      }

      const compressed = await compressImageHelper(file);
      setPhotoPreview(compressed);
    } catch (err) { 
      console.error(err);
      alert("圖片處理失敗，請嘗試使用其他照片！"); 
    } finally {
      setIsConverting(false); 
      e.target.value = ''; 
    }
  };

  const handleSubmit = async () => {
    if (!user || isSubmitting) return;
    if (newType === 'text' && !textContent.trim()) return;
    if (newType === 'photo' && !photoPreview) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'blessings'), {
        type: newType, content: textContent, photoUrl: photoPreview, color: selectedColor, authorId: user.uid, createdAt: Date.now()
      });
      setTextContent('');
      setPhotoPreview(null);
      setNewType('text');
      onClose();
    } catch (error) {
      console.error("送出失敗:", error);
      alert("上傳失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4A3320]/60 backdrop-blur-sm p-4 transition-opacity">
      <div className="bg-[#FFF9E6] border-[4px] border-[#4A3320] shadow-[8px_8px_0px_#4A3320] rounded-[2rem] w-full max-w-md overflow-hidden flex flex-col animate-popup relative">
        <div className="px-6 py-5 flex justify-between items-center border-b-[4px] border-[#4A3320] bg-white">
          <h2 className="font-black text-2xl text-[#4A3320] flex items-center gap-2">
            <Heart size={24} className="text-[#E25C5C] fill-[#E25C5C]" /> 寫張貼紙
          </h2>
          <button onClick={onClose} className="p-2 bg-[#F2EDE4] text-[#4A3320] border-[3px] border-[#4A3320] shadow-[2px_2px_0px_#4A3320] hover:bg-[#E5DFD3] rounded-full transition-all active:translate-y-1 active:shadow-none">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="flex bg-[#F2EDE4] border-[3px] border-[#4A3320] p-1.5 rounded-2xl mb-6 shadow-[inset_0px_3px_0px_rgba(0,0,0,0.1)]">
            <button onClick={() => setNewType('text')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-base font-black transition-all border-[3px] ${newType === 'text' ? 'bg-[#FFD933] border-[#4A3320] text-[#4A3320] shadow-[2px_2px_0px_#4A3320]' : 'border-transparent text-[#8B7355] hover:text-[#4A3320]'}`}>
              <Type size={20} strokeWidth={2.5} /> 寫字
            </button>
            <button onClick={() => setNewType('photo')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-base font-black transition-all border-[3px] ${newType === 'photo' ? 'bg-[#FFD933] border-[#4A3320] text-[#4A3320] shadow-[2px_2px_0px_#4A3320]' : 'border-transparent text-[#8B7355] hover:text-[#4A3320]'}`}>
              <ImageIcon size={20} strokeWidth={2.5} /> 照片
            </button>
          </div>

          {newType === 'text' ? (
            <div className="space-y-6 flex flex-col items-center">
              <div className={`w-56 h-56 rounded-full ${selectedColor.bg} border-[4px] border-[#4A3320] flex items-center justify-center p-6 shadow-[inset_0px_-8px_0px_rgba(0,0,0,0.08)] relative`}>
                <div className="absolute top-[10%] right-[15%] w-[20%] h-[10%] bg-white/40 rounded-full rotate-[30deg] pointer-events-none z-20"></div>
                <textarea 
                  value={textContent} onChange={(e) => setTextContent(e.target.value.substring(0, 15))}
                  placeholder="留個言吧！(15字內)"
                  className={`w-full bg-transparent border-none focus:ring-0 text-center font-black text-3xl placeholder:text-current/50 ${selectedColor.text} resize-none outline-none z-10`}
                  rows={3} autoFocus
                />
              </div>
              <div className="flex justify-center gap-4">
                {COLORS.map((c) => (
                  <button key={c.name} onClick={() => setSelectedColor(c)} className={`w-12 h-12 rounded-full border-[3px] border-[#4A3320] transition-all duration-200 ${c.bg} ${selectedColor.name === c.name ? 'scale-125 shadow-[3px_3px_0px_#4A3320]' : 'hover:scale-110 shadow-[2px_2px_0px_#4A3320] opacity-80 hover:opacity-100'}`} />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex flex-col items-center">
              <label className={`block w-56 h-56 bg-white border-[4px] border-dashed border-[#4A3320] rounded-full overflow-hidden relative group ${isConverting ? 'cursor-wait opacity-80' : 'cursor-pointer hover:bg-[#FFF9E6]'} transition-all`}>
                {photoPreview ? (
                  <img src={photoPreview} className="w-full h-full object-cover" alt="預覽" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8B7355]">
                    {isConverting ? (
                      <>
                        <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-[#FFD933] border-t-[#4A3320] mb-3"></div>
                        <p className="font-black text-lg">轉檔中...</p>
                        <p className="text-xs font-bold mt-1 opacity-70">iPhone 照片處理中</p>
                      </>
                    ) : (
                      <>
                        <div className="bg-[#FFD933] border-[3px] border-[#4A3320] shadow-[2px_2px_0px_#4A3320] p-3 rounded-full mb-3 group-hover:-translate-y-1 transition-transform">
                          <ImageIcon size={28} className="text-[#4A3320]" strokeWidth={2.5} />
                        </div>
                        <p className="font-black text-lg">選一張照片</p>
                      </>
                    )}
                  </div>
                )}
                <input type="file" accept="image/jpeg, image/png, image/gif, image/webp, .heic" className="hidden" onChange={handlePhotoChange} disabled={isConverting} />
              </label>
              <input 
                type="text" value={textContent} onChange={(e) => setTextContent(e.target.value.substring(0, 12))}
                placeholder="寫個照片小語... (12字內)"
                className="w-full px-5 py-4 bg-white border-[3px] border-[#4A3320] shadow-[4px_4px_0px_#4A3320] rounded-2xl outline-none focus:translate-y-1 focus:shadow-none text-[#4A3320] font-black transition-all placeholder:text-[#8B7355]"
              />
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t-[4px] border-[#4A3320]">
          <button onClick={handleSubmit} disabled={isSubmitting || (newType === 'text' && !textContent.trim()) || (newType === 'photo' && !photoPreview)} className="w-full bg-[#85C46C] text-[#4A3320] border-[4px] border-[#4A3320] shadow-[4px_6px_0px_#4A3320] py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-[4px_8px_0px_#4A3320] active:translate-y-2 active:shadow-none disabled:opacity-50 disabled:active:translate-y-0 disabled:hover:translate-y-0 transition-all">
            {isSubmitting ? "發送中..." : <><Send size={24} strokeWidth={2.5} /> 貼上牆壁</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminModal = ({ isOpen, onClose, onLogin }) => {
  const [pwd, setPwd] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A3320]/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FFF9E6] border-[4px] border-[#4A3320] shadow-[8px_8px_0px_#4A3320] rounded-[2rem] p-8 w-full max-w-sm relative">
        <div className="text-center mb-6">
          <div className="bg-[#8B5E3C] w-16 h-16 rounded-full border-[3px] border-[#4A3320] shadow-[3px_3px_0px_#4A3320] mx-auto mb-3 flex items-center justify-center">
            <Settings size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-black text-[#4A3320]">管理員</h3>
          <p className="text-sm font-bold text-[#8B7355] mt-1">請輸入密碼解鎖權限</p>
        </div>
        <input 
          type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
          className="w-full px-4 py-4 bg-white border-[3px] border-[#4A3320] shadow-[4px_4px_0px_#4A3320] rounded-xl mb-8 text-[#4A3320] font-black text-lg outline-none focus:translate-y-1 focus:shadow-none transition-all text-center"
          placeholder="密碼"
          onKeyDown={(e) => e.key === 'Enter' && onLogin(pwd)} autoFocus
        />
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-[#F2EDE4] border-[3px] border-[#4A3320] text-[#4A3320] shadow-[4px_4px_0px_#4A3320] font-black rounded-xl active:translate-y-1 active:shadow-none transition-all">取消</button>
          <button onClick={() => onLogin(pwd)} className="flex-1 py-4 bg-[#FFD933] border-[3px] border-[#4A3320] text-[#4A3320] shadow-[4px_4px_0px_#4A3320] font-black rounded-xl active:translate-y-1 active:shadow-none transition-all">登入</button>
        </div>
      </div>
    </div>
  );
};


// 新增：QR Code 顯示視窗
const QrModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  // 自動抓取目前的網址來產生 QR 碼
  const currentUrl = window.location.href;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A3320]/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-[#FFF9E6] border-[4px] border-[#4A3320] shadow-[8px_8px_0px_#4A3320] rounded-[2rem] p-8 w-full max-w-sm relative flex flex-col items-center" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-[#F2EDE4] text-[#4A3320] border-[3px] border-[#4A3320] rounded-full shadow-[2px_2px_0px_#4A3320] active:translate-y-1 active:shadow-none transition-all">
          <X size={20} strokeWidth={3} />
        </button>
        <div className="text-center mb-6 mt-2">
          <div className="bg-[#85C46C] w-16 h-16 rounded-full border-[3px] border-[#4A3320] shadow-[3px_3px_0px_#4A3320] mx-auto mb-3 flex items-center justify-center">
            <QrCode size={32} className="text-[#4A3320]" strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-black text-[#4A3320]">邀請大家來留言</h3>
          <p className="text-sm font-bold text-[#8B7355] mt-1">掃描行動條碼一起加入</p>
        </div>
        <div className="bg-white p-4 border-[4px] border-[#4A3320] rounded-2xl shadow-[4px_4px_0px_#4A3320] mb-6">
          <img src={qrUrl} alt="QR Code" className="w-48 h-48 object-contain" />
        </div>
        <p className="text-sm font-bold text-[#8B7355] text-center px-2">
          請大家用手機相機掃描<br />就能將貼紙送到牆上喔！
        </p>
      </div>
    </div>
  );
};





// ==========================================
// 5. 主程式 (App) - 整合所有模組
// ==========================================
export default function App() {
  const user = useAuth();
  const blessings = useBlessings(user);
  const floatingItems = useFloatingBubbles(blessings);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const handleDelete = async (id) => {
    if (!user || !isAdminMode) return;
    try { await deleteDoc(doc(db, 'blessings', id)); } 
    catch (error) { console.error("刪除失敗:", error); }
  };

  const handleAdminLogin = (pwd) => {
    if (pwd === 'weses3974893') { setIsAdminMode(true); setShowAdminLogin(false); } 
    else { alert("密碼錯誤"); }
  };

  return (
    <div className="min-h-screen bg-[#FFF8E7] font-sans overflow-hidden relative" style={{
      backgroundImage: 'radial-gradient(#E8DCC4 3px, transparent 3px)',
      backgroundSize: '36px 36px'
    }}>
      
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(120vh) rotate(var(--start-rot)) scale(var(--scale)); opacity: 0; }
          5% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-50vh) rotate(calc(var(--start-rot) * -1.5)) scale(var(--scale)); opacity: 0; }
        }
        .bubble-item { position: absolute; animation: floatUp linear infinite; will-change: transform; }
        .bubble-item:hover { animation-play-state: paused; z-index: 50 !important; cursor: pointer; }
        @keyframes popup { 0% { transform: scale(0.5) translateY(20px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        .animate-popup { animation: popup 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <BackgroundCharacters />

      <Navbar isAdminMode={isAdminMode} setIsAdminMode={setIsAdminMode} setShowAdminLogin={setShowAdminLogin} setShowQrModal={setShowQrModal} />

      <main className="relative w-full h-[calc(100vh-80px)] overflow-hidden pointer-events-none mt-20">
        <div className="absolute inset-0 pointer-events-auto">
          {floatingItems.map((item) => (
            <Bubble key={item.id} item={item} isAdminMode={isAdminMode} onDelete={handleDelete} />
          ))}
          
          {blessings.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
              <div className="bg-white border-[4px] border-[#4A3320] shadow-[6px_6px_0px_#4A3320] p-6 rounded-full mb-6 rotate-[-5deg]">
                <Sparkles size={48} className="text-[#FFD933] fill-[#FFD933]" strokeWidth={2} />
              </div>
              <h3 className="text-3xl font-black text-[#4A3320] mb-3 drop-shadow-[2px_2px_0px_white]">天空空空的</h3>
              <p className="text-xl font-bold text-[#8B7355] bg-white/80 px-4 py-2 rounded-xl border-2 border-[#4A3320]">快來貼上第一張可愛貼紙！</p>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-6 inset-x-0 flex justify-center z-40">
        <button 
          onClick={() => setIsModalOpen(true)} disabled={!user}
          className="group bg-[#FFD933] border-[4px] border-[#4A3320] text-[#4A3320] px-8 py-4 rounded-full shadow-[4px_8px_0px_#4A3320] flex items-center justify-center gap-3 hover:-translate-y-2 hover:shadow-[4px_12px_0px_#4A3320] active:translate-y-2 active:shadow-none transition-all disabled:opacity-50 disabled:active:translate-y-0"
        >
          <Plus size={28} strokeWidth={3} className="bg-white rounded-full p-1 border-[2px] border-[#4A3320]" />
          <span className="font-black text-2xl tracking-wide">貼一張</span>
        </button>
      </div>

      <AddModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} />
      <AdminModal isOpen={showAdminLogin} onClose={() => setShowAdminLogin(false)} onLogin={handleAdminLogin} />
      <QrModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} />
    </div>
  );
}
