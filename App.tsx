
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  School, 
  Calendar, 
  Settings as SettingsIcon, 
  FileText, 
  CheckCircle,
  Clock,
  GraduationCap,
  PenTool,
  LayoutDashboard,
  Sparkles,
  X,
  Target,
  BookOpen,
  Filter,
  List,
  MapPin,
  Wrench,
  ChevronRight,
  Activity,
  Palette,
  Sun,
  Moon,
  Zap
} from 'lucide-react';
import { DailyRecordRow, TeacherInfo, WeeklySlot } from './types';
import { WEEKLY_SCHEDULE, FIELD_NAME, ALL_LESSONS } from './constants';
import { formatDate, getDayName, getLessonForSlot } from './utils';

// --- أنظمة الألوان (Modern Skins) ---
const THEMES = {
  crystal: {
    name: "كريستال نقي",
    isDark: false,
    primary: "#3b82f6",
    accent: "#6366f1",
    bg: "#f0f4f8",
    text: "#1e293b",
    gradient: "radial-gradient(at 0% 0%, hsla(210,100%,95%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(240,100%,98%,1) 0, transparent 50%), radial-gradient(at 50% 50%, hsla(210,100%,90%,0.3) 0, transparent 100%)"
  },
  emerald_light: {
    name: "ربيع الزمرد",
    isDark: false,
    primary: "#10b981",
    accent: "#059669",
    bg: "#f0fdf4",
    text: "#064e3b",
    gradient: "radial-gradient(at 0% 0%, hsla(160,100%,95%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(150,100%,98%,1) 0, transparent 50%)"
  },
  sunset_bright: {
    name: "صباح مشرق",
    isDark: false,
    primary: "#f59e0b",
    accent: "#ef4444",
    bg: "#fffcf0",
    text: "#451a03",
    gradient: "radial-gradient(at 0% 0%, hsla(45,100%,95%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(10,100%,97%,1) 0, transparent 50%)"
  },
  royal_dark: {
    name: "الليل الملكي",
    isDark: true,
    primary: "#8b5cf6",
    accent: "#ec4899",
    bg: "#0f172a",
    text: "#f8fafc",
    gradient: "radial-gradient(at 0% 0%, hsla(244,47%,11%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(263,91%,60%,0.15) 0, transparent 50%)"
  }
};

type ThemeKey = keyof typeof THEMES;

// --- المكونات الفرعية المتحركة ---

const AnimatedIcon = ({ icon: Icon, size = 24, color = "currentColor", animate = true }: { icon: React.ElementType, size?: number, color?: string, animate?: boolean }) => (
  <motion.div
    animate={animate ? {
      y: [0, -4, 0],
      rotate: [0, 5, -5, 0],
    } : {}}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    style={{ color }}
  >
    <Icon size={size} />
  </motion.div>
);

const GlassPanel = ({ children, className = "", delay = 0, isDark = false }: { children?: React.ReactNode, className?: string, delay?: number, isDark?: boolean }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.5, delay, type: "spring", stiffness: 100 }}
    className={`glass-effect rounded-[2.5rem] p-8 ${isDark ? 'dark-glass' : 'light-glass'} ${className}`}
  >
    {children}
  </motion.div>
);

const NavButton = ({ icon: Icon, onClick, active = false, label = "", theme }: { icon: React.ElementType, onClick: () => void, active?: boolean, label?: string, theme: any }) => (
  <motion.button
    whileHover={{ x: 5, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all duration-300 relative overflow-hidden group ${
      active ? 'shadow-lg' : 'opacity-70 hover:opacity-100'
    }`}
    style={{ 
      backgroundColor: active ? `${theme.primary}15` : 'transparent',
      color: active ? theme.primary : theme.text,
      border: active ? `1px solid ${theme.primary}33` : '1px solid transparent'
    }}
  >
    {active && (
      <motion.div 
        layoutId="nav-active" 
        className="absolute inset-0 z-0 opacity-10" 
        style={{ backgroundColor: theme.primary }}
      />
    )}
    <div className="relative z-10 flex items-center gap-4">
      <AnimatedIcon icon={Icon} size={22} animate={active} color={active ? theme.primary : undefined} />
      <span className="text-sm font-black tracking-wide">{label}</span>
    </div>
  </motion.button>
);

const ModernInput = ({ label, icon: Icon, value, onChange, type = "text", theme }: { label: string, icon: React.ElementType, value: string, onChange: (v: string) => void, type?: string, theme: any }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[10px] font-black text-slate-400 mr-2 flex items-center gap-2 uppercase tracking-widest">
      <Icon size={14} style={{ color: theme.primary }} />
      {label}
    </label>
    <div className="relative group">
      <input 
        type={type}
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-6 py-4 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm ${
          theme.isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
        } focus:ring-4`}
        style={{ 
          borderColor: "transparent",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = theme.primary;
          e.currentTarget.style.boxShadow = `0 0 0 4px ${theme.primary}15`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "transparent";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  </div>
);

const TypewriterText = ({ text, className = "", speed = 30, cursorColor = "#3b82f6" }: { text: string, className?: string, speed?: number, cursorColor?: string }) => {
  const [displayText, setDisplayText] = useState("");
  useEffect(() => {
    let currentText = "";
    let currentIndex = 0;
    setDisplayText("");
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        currentText += text[currentIndex];
        setDisplayText(currentText);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return (
    <span className={className}>
      {displayText}
      <motion.span 
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block w-[3px] h-[1em] ml-1 align-middle" 
        style={{ backgroundColor: cursorColor }}
      />
    </span>
  );
};

// --- Added LiveDigitalClock Component ---
const LiveDigitalClock = ({ color }: { color: string }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-black font-mono tracking-tighter" style={{ color }}>
        {time.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
};

// --- Added PulsatingText Component ---
const PulsatingText = ({ text }: { text: string }) => (
  <motion.span
    animate={{ opacity: [0.6, 1, 0.6] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
  >
    {text}
  </motion.span>
);

// --- المكون الرئيسي ---

export default function App() {
  const [activeView, setActiveView] = useState<'record' | 'settings' | 'distribution'>('record');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<DailyRecordRow | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    return (localStorage.getItem('app_theme_v2') as ThemeKey) || 'crystal';
  });
  const theme = THEMES[themeKey];

  const [semesterStart, setSemesterStart] = useState<string>(() => {
    return localStorage.getItem('semester_start') || "2026-01-04";
  });
  
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo>(() => {
    const saved = localStorage.getItem('teacher_info');
    return saved ? JSON.parse(saved) : {
      name: "الأستاذ الفاضل",
      school: "ابتدائية العربي بن مهيدي",
      inspector: "السيد المفتش المحترم",
      manager: "السيد مدير المؤسسة"
    };
  });

  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('semester_start', semesterStart);
    localStorage.setItem('teacher_info', JSON.stringify(teacherInfo));
    localStorage.setItem('app_theme_v2', themeKey);
    
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;
    const mesh = document.querySelector('.mesh-bg') as HTMLElement;
    if (mesh) mesh.style.backgroundImage = theme.gradient;
  }, [semesterStart, teacherInfo, themeKey, theme]);

  const rows = useMemo(() => {
    const dateObj = new Date(targetDate);
    const dayIndex = dateObj.getDay();
    const startDate = new Date(semesterStart);
    
    const slotsToday = WEEKLY_SCHEDULE
      .filter(s => s.dayIndex === dayIndex)
      .sort((a, b) => a.time.localeCompare(b.time));

    return slotsToday.map((slot): DailyRecordRow => {
      const lesson = getLessonForSlot(slot, startDate, dateObj);
      return {
        date: formatDate(dateObj),
        day: getDayName(dateObj),
        time: slot.time,
        gradeSection: `${slot.grade} (${slot.section})`,
        field: FIELD_NAME,
        learnings: lesson.knowledgeResource,
        content: lesson.content,
        teachingSituation: lesson.teachingSituation,
        tools: lesson.tools,
        note: ""
      };
    });
  }, [targetDate, semesterStart]);

  const distributionSlots = useMemo(() => {
    return WEEKLY_SCHEDULE
      .filter(s => gradeFilter === 'all' || s.grade === gradeFilter)
      .sort((a, b) => a.dayIndex - b.dayIndex || a.time.localeCompare(b.time));
  }, [gradeFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-all duration-1000" style={{ backgroundColor: theme.bg }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-8">
          <motion.div 
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }} 
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl" 
            style={{ 
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              boxShadow: `0 20px 60px ${theme.primary}55`
            }}
          >
            <Sparkles size={48} className="text-white" />
          </motion.div>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-black tracking-tighter" style={{ color: theme.primary }}>الدفتر الذكي Pro</h2>
            <div className="flex gap-1 justify-center">
              {[0, 1, 2].map(i => (
                <motion.div key={i} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary }} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden relative theme-transition">
      
      {/* النافذة المنبثقة للتفاصيل */}
      <AnimatePresence>
        {selectedRow && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRow(null)} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 cursor-pointer">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} onClick={(e) => e.stopPropagation()} className={`rounded-[3.5rem] w-full max-w-4xl overflow-hidden shadow-2xl relative cursor-default max-h-[90vh] overflow-y-auto border ${theme.isDark ? 'dark-glass' : 'light-glass'}`}>
              <button onClick={() => setSelectedRow(null)} className={`absolute top-8 left-8 p-4 rounded-full transition-all z-10 ${theme.isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}><X size={24} /></button>
              
              <div className="p-12 md:p-20 space-y-12 text-right">
                <div className="flex flex-col md:flex-row justify-between items-center border-b border-black/5 pb-10 gap-8">
                   <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 5, repeat: Infinity }} className="p-8 rounded-[2.5rem] shadow-2xl" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, boxShadow: `0 25px 50px ${theme.primary}44` }}>
                     <Activity className="text-white" size={56} />
                   </motion.div>
                   <div className="text-center md:text-right">
                     <span className="text-xs font-black block mb-3 uppercase tracking-[0.4em] opacity-60" style={{ color: theme.accent }}>بطاقة الحصة الذكية</span>
                     <h3 className="text-5xl font-black leading-tight tracking-tighter" style={{ color: theme.text }}>السنة {selectedRow.gradeSection}</h3>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 font-black text-[10px] justify-end uppercase tracking-widest opacity-60" style={{ color: theme.primary }}>المورد المعرفي <Target size={18} /></div>
                    <div className={`p-10 rounded-[2.5rem] border shadow-sm ${theme.isDark ? 'bg-white/5 border-white/5' : 'bg-blue-50/50 border-blue-100/50'}`}><p className="text-2xl font-bold leading-relaxed">{selectedRow.learnings}</p></div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 font-black text-[10px] justify-end uppercase tracking-widest opacity-60" style={{ color: theme.accent }}>محتوى التعلم <PenTool size={18} /></div>
                    <div className={`p-10 rounded-[2.5rem] border shadow-sm ${theme.isDark ? 'bg-white/5 border-white/5' : 'bg-indigo-50/50 border-indigo-100/50'}`}><p className="text-2xl font-bold leading-relaxed opacity-80">{selectedRow.content}</p></div>
                  </div>
                  <div className="space-y-4 md:col-span-2">
                    <div className="flex items-center gap-3 font-black text-[10px] justify-end uppercase tracking-widest opacity-60" style={{ color: '#10b981' }}>شرح الموقف التعليمي <MapPin size={18} /></div>
                    <div className={`p-10 rounded-[2.5rem] border shadow-sm leading-relaxed ${theme.isDark ? 'bg-emerald-500/5 border-white/5' : 'bg-emerald-50 border-emerald-100'}`}><p className="text-xl font-bold opacity-90">{selectedRow.teachingSituation || "تقويم المكتسبات"}</p></div>
                  </div>
                  <div className="space-y-4 md:col-span-2">
                    <div className="flex items-center gap-3 font-black text-[10px] justify-end uppercase tracking-widest opacity-60" style={{ color: '#f59e0b' }}>الوسائل المستخدمة <Wrench size={18} /></div>
                    <div className={`p-10 rounded-[2.5rem] border shadow-sm ${theme.isDark ? 'bg-amber-500/5 border-white/5' : 'bg-amber-50 border-amber-100'}`}><p className="text-xl font-black italic" style={{ color: theme.isDark ? '#fcd34d' : '#92400e' }}>{selectedRow.tools || "الأدوات الرياضية المتاحة"}</p></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* القائمة الجانبية (Sidebar) */}
      <nav className={`hidden md:flex flex-col w-96 border-l p-10 z-50 transition-all duration-700 ${theme.isDark ? 'bg-slate-950/40 border-white/10 backdrop-blur-3xl' : 'bg-white/40 border-black/5 backdrop-blur-3xl'}`}>
        <div className="flex items-center gap-6 mb-20 group">
          <motion.div 
            whileHover={{ rotate: 180, scale: 1.1 }}
            className="p-5 rounded-3xl shadow-xl flex items-center justify-center transition-transform" 
            style={{ 
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, 
              boxShadow: `0 15px 35px ${theme.primary}44` 
            }}
          >
            <Zap className="text-white" size={32} />
          </motion.div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter" style={{ color: theme.text }}>الدفتر الذكي</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style={{ color: theme.primary }}>Premium Pro V2</p>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <NavButton icon={FileText} label="جدول اليوم" active={activeView === 'record'} onClick={() => setActiveView('record')} theme={theme} />
          <NavButton icon={List} label="خطة التوزيع" active={activeView === 'distribution'} onClick={() => setActiveView('distribution')} theme={theme} />
          <NavButton icon={SettingsIcon} label="الإعدادات" active={activeView === 'settings'} onClick={() => setActiveView('settings')} theme={theme} />
        </div>

        <div className="mt-auto space-y-8">
          <div className="flex justify-center"><LiveDigitalClock color={theme.primary} /></div>
          <motion.div whileHover={{ scale: 1.02 }} className={`p-8 rounded-[2.5rem] border text-center relative overflow-hidden ${theme.isDark ? 'bg-white/5 border-white/5' : 'bg-white/80 border-black/5 shadow-sm'}`}>
            <p className="text-[9px] font-black opacity-40 uppercase tracking-[0.4em] mb-2">وزارة التربية الوطنية</p>
            <p className="text-xs font-black tracking-widest" style={{ color: theme.primary }}>الجمهورية الجزائرية</p>
          </motion.div>
        </div>
      </nav>

      {/* المحتوى الرئيسي (Main Content) */}
      <main className="flex-1 overflow-y-auto px-8 py-10 md:px-20 md:py-16 space-y-16">
        <header className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-8">
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-20 h-20 rounded-[2rem] flex items-center justify-center p-1 shadow-2xl transition-transform" 
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
            >
              <div className={`w-full h-full rounded-[1.8rem] flex items-center justify-center ${theme.isDark ? 'bg-slate-900' : 'bg-white'}`}>
                <User size={36} style={{ color: theme.primary }} />
              </div>
            </motion.div>
            <div className="space-y-1">
              <h2 className="text-4xl font-black tracking-tighter" style={{ color: theme.text }}>مرحباً بك، {teacherInfo.name.split(' ')[0]}</h2>
              <div className="flex items-center gap-3 opacity-60 font-bold text-sm">
                <School size={18} style={{ color: theme.primary }} />
                <span>{teacherInfo.school}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden lg:block text-right">
                <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">توقيت المعاينة</p>
                <p className="text-lg font-black">{getDayName(new Date(targetDate))} • {formatDate(new Date(targetDate))}</p>
             </div>
             <div className="md:hidden"><LiveDigitalClock color={theme.primary} /></div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeView === 'settings' ? (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <GlassPanel isDark={theme.isDark} className="space-y-10">
                <div className="flex items-center gap-4 border-b border-black/5 pb-8">
                  <AnimatedIcon icon={SettingsIcon} color={theme.primary} />
                  <h3 className="text-2xl font-black">إعدادات الجدول والوقت</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ModernInput label="بداية الفصل الدراسي" type="date" icon={Calendar} value={semesterStart} onChange={setSemesterStart} theme={theme} />
                  <ModernInput label="تاريخ المعاينة الحالية" type="date" icon={Clock} value={targetDate} onChange={setTargetDate} theme={theme} />
                </div>
              </GlassPanel>

              <GlassPanel isDark={theme.isDark} className="space-y-10">
                <div className="flex items-center gap-4 border-b border-black/5 pb-8">
                  <AnimatedIcon icon={Palette} color={theme.primary} />
                  <h3 className="text-2xl font-black">سكن البرنامج (ألوان عصرية)</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
                    <motion.button 
                      key={key} 
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setThemeKey(key)}
                      className={`p-6 rounded-3xl border transition-all flex flex-col items-center gap-4 relative ${themeKey === key ? 'shadow-xl' : 'hover:shadow-md opacity-80'}`}
                      style={{ 
                        borderColor: themeKey === key ? THEMES[key].primary : 'rgba(0,0,0,0.05)',
                        backgroundColor: themeKey === key ? `${THEMES[key].primary}08` : 'transparent'
                      }}
                    >
                      <div className="w-14 h-14 rounded-full shadow-lg" style={{ background: `linear-gradient(135deg, ${THEMES[key].primary}, ${THEMES[key].accent})` }}></div>
                      <span className="text-xs font-black tracking-tighter">{THEMES[key].name}</span>
                      {key === 'crystal' && <Sun size={12} className="absolute top-3 right-3 opacity-30" />}
                      {key === 'royal_dark' && <Moon size={12} className="absolute top-3 right-3 opacity-30" />}
                    </motion.button>
                  ))}
                </div>
              </GlassPanel>

              <GlassPanel isDark={theme.isDark} className="space-y-10 lg:col-span-2">
                <div className="flex items-center gap-4 border-b border-black/5 pb-8">
                  <AnimatedIcon icon={User} color={theme.primary} />
                  <h3 className="text-2xl font-black">معلومات الأستاذ والمؤسسة</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <ModernInput label="اسم الأستاذ" icon={User} value={teacherInfo.name} onChange={(v) => setTeacherInfo({...teacherInfo, name: v})} theme={theme} />
                  <ModernInput label="المؤسسة التعليمية" icon={School} value={teacherInfo.school} onChange={(v) => setTeacherInfo({...teacherInfo, school: v})} theme={theme} />
                  <ModernInput label="السيد المفتش" icon={CheckCircle} value={teacherInfo.inspector} onChange={(v) => setTeacherInfo({...teacherInfo, inspector: v})} theme={theme} />
                  <ModernInput label="السيد المدير" icon={GraduationCap} value={teacherInfo.manager} onChange={(v) => setTeacherInfo({...teacherInfo, manager: v})} theme={theme} />
                </div>
              </GlassPanel>
            </motion.div>
          ) : activeView === 'distribution' ? (
            <motion.div key="distribution" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
              <GlassPanel isDark={theme.isDark}>
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
                  <div className="flex items-center gap-6">
                    <AnimatedIcon icon={Filter} color={theme.primary} />
                    <h3 className="text-3xl font-black tracking-tighter">خطة توزيع الحصص</h3>
                  </div>
                  <div className="flex gap-2 p-2 rounded-[1.5rem] bg-black/5 border border-black/5 backdrop-blur-md">
                    {['all', '1', '2', '3', '4', '5'].map(g => (
                      <button 
                        key={g} 
                        onClick={() => setGradeFilter(g)} 
                        className={`px-8 py-3 rounded-2xl text-xs font-black transition-all shadow-sm ${gradeFilter === g ? 'text-white' : 'opacity-40 hover:opacity-100'}`}
                        style={{ backgroundColor: gradeFilter === g ? theme.primary : 'transparent' }}
                      >
                        {g === 'all' ? 'الكل' : `السنة ${g}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead><tr className="border-b border-black/5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40"><th className="py-8 px-6">اليوم الدراسي</th><th className="py-8 px-6">التوقيت الزمني</th><th className="py-8 px-6">المستوى</th><th className="py-8 px-6">الفوج</th></tr></thead>
                    <tbody className="divide-y divide-black/5">
                      {distributionSlots.map((slot, idx) => (
                        <tr key={idx} className="group hover:bg-black/[0.02] transition-colors">
                          <td className="py-8 px-6 font-black text-lg">{slot.dayName}</td>
                          <td className="py-8 px-6 font-mono text-xl" style={{ color: theme.primary }}>{slot.time.replace('/', ' - ')}</td>
                          <td className="py-8 px-6 font-black opacity-80 text-lg">السنة {slot.grade} ابتدائي</td>
                          <td className="py-8 px-6"><span className="px-6 py-3 bg-black/5 rounded-2xl font-black text-sm">الفوج {slot.section}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassPanel>
            </motion.div>
          ) : (
            <motion.div key="record" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {rows.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {rows.map((row, idx) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ y: -6, scale: 1.01 }} 
                      whileTap={{ scale: 0.99 }} 
                      onClick={() => setSelectedRow(row)} 
                      className={`p-10 rounded-[3rem] flex flex-col lg:flex-row items-center gap-12 border transition-all duration-500 cursor-pointer relative group overflow-hidden ${
                        theme.isDark ? 'dark-glass' : 'light-glass shadow-xl shadow-blue-900/5'
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-2 h-full transition-all group-hover:w-4" style={{ backgroundColor: theme.primary }} />
                      
                      <div className="flex items-center gap-8 min-w-[320px] w-full lg:w-auto">
                        <div className="w-32 h-20 rounded-[1.8rem] flex items-center justify-center font-black text-sm text-center border shadow-inner transition-all group-hover:bg-white/10" style={{ 
                          color: theme.primary,
                          backgroundColor: `${theme.primary}10`,
                          borderColor: `${theme.primary}33`
                        }}>
                          {row.time.replace('/', ' - ')}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">المستوى</span>
                          <span className="text-3xl font-black tracking-tighter" style={{ color: theme.text }}>{row.gradeSection}</span>
                        </div>
                      </div>

                      <div className="flex-1 w-full text-right space-y-3">
                        <div className="flex items-center gap-2 font-black text-[11px] justify-end lg:justify-start uppercase tracking-[0.3em]" style={{ color: theme.primary }}>
                          <AnimatedIcon icon={PenTool} size={16} color={theme.primary} />
                          <PulsatingText text={row.field} />
                        </div>
                        <h4 className="text-2xl font-black leading-tight">
                          <TypewriterText text={row.learnings} speed={15} cursorColor={theme.primary} />
                        </h4>
                        <div className="text-sm font-bold opacity-50 italic line-clamp-1">{row.content}</div>
                      </div>

                      <div className="hidden xl:flex items-center">
                        <motion.div 
                          whileHover={{ scale: 1.1 }}
                          className="w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg" 
                          style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}
                        >
                          <ChevronRight size={24} />
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-40 opacity-40 text-center space-y-10">
                  <motion.div 
                    animate={{ 
                      y: [0, -20, 0],
                      scale: [1, 1.1, 1]
                    }} 
                    transition={{ duration: 4, repeat: Infinity }}
                    className="p-16 rounded-full border border-dashed border-black/20"
                  >
                    <Calendar size={96} style={{ color: theme.text }} />
                  </motion.div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black tracking-tighter">اليوم لا توجد حصص مجدولة</h3>
                    <p className="text-lg font-bold">يمكنك معاينة توزيع الحصص أو الانتقال ليوم دراسي قادم</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05, boxShadow: `0 20px 40px ${theme.primary}44` }} 
                    whileTap={{ scale: 0.95 }} 
                    onClick={() => {
                      const d = new Date(targetDate);
                      d.setDate(d.getDate() + 1);
                      setTargetDate(d.toISOString().split('T')[0]);
                    }} 
                    className="flex items-center gap-4 text-white px-12 py-5 rounded-[2rem] font-black text-lg transition-all"
                    style={{ backgroundColor: theme.primary }}
                  >
                    استكشاف اليوم التالي
                    <ChevronRight size={24} />
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* شريط التنقل السفلي للهواتف */}
      <nav className={`md:hidden fixed bottom-0 left-0 w-full p-6 flex justify-around items-center z-[100] backdrop-blur-2xl border-t ${theme.isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-black/5 shadow-2xl'}`}>
        <button onClick={() => setActiveView('record')} className={`flex flex-col items-center gap-2 transition-all ${activeView === 'record' ? 'scale-110' : 'opacity-40'}`} style={{ color: activeView === 'record' ? theme.primary : theme.text }}><LayoutDashboard size={24} /><span className="text-[10px] font-black uppercase">الجدول</span></button>
        <button onClick={() => setActiveView('distribution')} className={`flex flex-col items-center gap-2 transition-all ${activeView === 'distribution' ? 'scale-110' : 'opacity-40'}`} style={{ color: activeView === 'distribution' ? theme.primary : theme.text }}><List size={24} /><span className="text-[10px] font-black uppercase">الخطة</span></button>
        <button onClick={() => setActiveView('settings')} className={`flex flex-col items-center gap-2 transition-all ${activeView === 'settings' ? 'scale-110' : 'opacity-40'}`} style={{ color: activeView === 'settings' ? theme.primary : theme.text }}><SettingsIcon size={24} /><span className="text-[10px] font-black uppercase">الإعدادات</span></button>
      </nav>

    </div>
  );
}
