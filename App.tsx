
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
  Palette
} from 'lucide-react';
import { DailyRecordRow, TeacherInfo, WeeklySlot } from './types';
import { WEEKLY_SCHEDULE, FIELD_NAME, ALL_LESSONS } from './constants';
import { formatDate, getDayName, getLessonForSlot } from './utils';

// --- أنظمة الألوان (Skins) ---
const THEMES = {
  ocean: {
    name: "محيط عميق",
    primary: "#2563eb",
    accent: "#06b6d4",
    bg: "#0f172a",
    gradient: "radial-gradient(at 0% 0%, hsla(222,47%,11%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(217,91%,60%,0.15) 0, transparent 50%)"
  },
  emerald: {
    name: "غابة الزمرد",
    primary: "#10b981",
    accent: "#84cc16",
    bg: "#061f1a",
    gradient: "radial-gradient(at 0% 0%, hsla(164,86%,10%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(158,82%,46%,0.15) 0, transparent 50%)"
  },
  royal: {
    name: "بنفسجي ملكي",
    primary: "#8b5cf6",
    accent: "#ec4899",
    bg: "#1e1b4b",
    gradient: "radial-gradient(at 0% 0%, hsla(244,47%,11%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(263,91%,60%,0.15) 0, transparent 50%)"
  },
  sunset: {
    name: "غسق دافئ",
    primary: "#f43f5e",
    accent: "#f59e0b",
    bg: "#1a0f0f",
    gradient: "radial-gradient(at 0% 0%, hsla(350,47%,11%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(350,91%,60%,0.15) 0, transparent 50%)"
  }
};

type ThemeKey = keyof typeof THEMES;

// --- المكونات الفرعية ---

const GlassPanel = ({ children, className = "", delay = 0 }: { children?: React.ReactNode, className?: string, delay?: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className={`glass-effect rounded-[2.5rem] p-6 ${className}`}
  >
    {children}
  </motion.div>
);

const IconButton = ({ icon: Icon, onClick, active = false, label = "", color }: { icon: React.ElementType, onClick: () => void, active?: boolean, label?: string, color: string }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all duration-300 ${
      active ? 'bg-white/10 border border-white/20 shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
    }`}
    style={active ? { borderColor: `${color}55`, color: color } : {}}
  >
    <Icon size={20} className={active ? 'animate-pulse' : ''} />
    <span className="text-sm font-bold tracking-wide">{label}</span>
  </motion.button>
);

const ModernField = ({ label, icon: Icon, value, onChange, type = "text", color }: { label: string, icon: React.ElementType, value: string, onChange: (v: string) => void, type?: string, color: string }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[10px] font-black text-slate-500 mr-2 flex items-center gap-2 uppercase tracking-widest">
      <Icon size={12} style={{ color }} />
      {label}
    </label>
    <div className="relative">
      <input 
        type={type}
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/10 outline-none transition-all text-sm text-slate-100"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
        onFocus={(e) => e.currentTarget.style.borderColor = color}
        onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
      />
    </div>
  </div>
);

const TypewriterText = ({ text, className = "", speed = 20, cursorColor = "#fff" }: { text: string, className?: string, speed?: number, cursorColor?: string }) => {
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
      {displayText.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] ml-1 align-middle animate-pulse" style={{ backgroundColor: cursorColor }}></span>
      )}
    </span>
  );
};

const PulsatingText = ({ text, className = "" }: { text: string, className?: string }) => (
  <motion.span
    animate={{ opacity: [0.7, 1, 0.7] }}
    transition={{ duration: 3, repeat: Infinity }}
    className={className}
  >
    {text}
  </motion.span>
);

const LiveDigitalClock = ({ color }: { color: string }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-2xl px-6 py-3 min-w-[150px]" style={{ borderColor: `${color}22` }}>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] mb-1" style={{ color }}>الوقت الحالي</span>
      <span className="text-xl font-bold text-white tabular-nums tracking-tighter">
        {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
      </span>
    </div>
  );
};

// --- المكون الرئيسي ---

export default function App() {
  const [activeView, setActiveView] = useState<'record' | 'settings' | 'distribution'>('record');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<DailyRecordRow | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  
  // السكن (الثيم)
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    return (localStorage.getItem('app_theme') as ThemeKey) || 'ocean';
  });
  const currentTheme = THEMES[themeKey];

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
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('semester_start', semesterStart);
    localStorage.setItem('teacher_info', JSON.stringify(teacherInfo));
    localStorage.setItem('app_theme', themeKey);
    
    // حقن ألوان الثيم في CSS
    document.documentElement.style.setProperty('--primary-color', currentTheme.primary);
    document.body.style.backgroundColor = currentTheme.bg;
    const mesh = document.querySelector('.mesh-bg') as HTMLElement;
    if (mesh) mesh.style.backgroundImage = currentTheme.gradient;
  }, [semesterStart, teacherInfo, themeKey, currentTheme]);

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

  const goToNextDay = () => {
    const d = new Date(targetDate);
    d.setDate(d.getDate() + 1);
    setTargetDate(d.toISOString().split('T')[0]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: currentTheme.bg }}>
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl" style={{ backgroundColor: currentTheme.primary, boxShadow: `0 20px 50px ${currentTheme.primary}44` }}>
            <Sparkles size={40} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">جاري التحميل...</h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden" style={{ color: '#fff' }}>
      
      {/* النافذة المنبثقة للتفاصيل */}
      <AnimatePresence>
        {selectedRow && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRow(null)} className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 cursor-pointer">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }} onClick={(e) => e.stopPropagation()} className="glass-effect rounded-[3rem] w-full max-w-4xl overflow-hidden border border-white/20 shadow-2xl relative cursor-default max-h-[90vh] overflow-y-auto">
              <button onClick={() => setSelectedRow(null)} className="absolute top-8 left-8 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white z-10"><X size={24} /></button>
              <div className="p-10 md:p-16 space-y-12 text-right">
                <div className="flex flex-col md:flex-row justify-between items-center border-b border-white/10 pb-8 gap-6">
                   <div className="p-6 rounded-[2.5rem] shadow-2xl" style={{ background: `linear-gradient(to bottom right, ${currentTheme.primary}, ${currentTheme.accent})`, boxShadow: `0 20px 40px ${currentTheme.primary}44` }}>
                     <Activity className="text-white" size={48} />
                   </div>
                   <div className="text-center md:text-right">
                     <span className="text-xs font-black block mb-2 uppercase tracking-[0.3em]" style={{ color: currentTheme.accent }}>بطاقة الحصة اليومية • السنة {selectedRow.gradeSection}</span>
                     <h3 className="text-4xl font-bold text-white leading-tight">تفاصيل النشاط البدني</h3>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 font-black text-xs justify-end uppercase tracking-widest" style={{ color: currentTheme.primary }}>المورد المعرفي <Target size={18} /></div>
                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 h-full"><p className="text-xl font-bold text-slate-100">{selectedRow.learnings}</p></div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 font-black text-xs justify-end uppercase tracking-widest" style={{ color: currentTheme.accent }}>محتوى التعلم <PenTool size={18} /></div>
                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 h-full"><p className="text-xl text-slate-300 font-semibold">{selectedRow.content}</p></div>
                  </div>
                  <div className="space-y-4 md:col-span-2">
                    <div className="flex items-center gap-3 font-black text-xs justify-end uppercase tracking-widest" style={{ color: '#10b981' }}>شرح الموقف التعليمي <MapPin size={18} /></div>
                    <div className="bg-emerald-500/5 p-8 rounded-[2rem] border border-emerald-500/10 shadow-inner"><p className="text-xl text-slate-200 leading-relaxed font-semibold">{selectedRow.teachingSituation || "غير محدد في المخطط"}</p></div>
                  </div>
                  <div className="space-y-4 md:col-span-2">
                    <div className="flex items-center gap-3 font-black text-xs justify-end uppercase tracking-widest" style={{ color: '#f59e0b' }}>الوسائل المستعملة <Wrench size={18} /></div>
                    <div className="bg-amber-500/10 p-8 rounded-[2rem] border border-amber-500/20"><p className="text-xl text-amber-100 font-bold italic">{selectedRow.tools || "كافة الوسائل المتاحة"}</p></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* القائمة الجانبية */}
      <nav className="hidden md:flex flex-col w-80 bg-slate-950/40 backdrop-blur-3xl border-l border-white/10 p-8 z-50">
        <div className="flex items-center gap-5 mb-16">
          <div className="p-4 rounded-2xl shadow-2xl" style={{ backgroundColor: currentTheme.primary, boxShadow: `0 10px 30px ${currentTheme.primary}44` }}><LayoutDashboard className="text-white" size={32} /></div>
          <div><h1 className="text-xl font-bold text-white tracking-tight">الدفتر الذكي</h1><p className="text-[10px] font-black uppercase tracking-widest" style={{ color: currentTheme.accent }}>Smart Teacher V2</p></div>
        </div>
        <div className="flex-1 space-y-3">
          <IconButton icon={FileText} label="جدول اليوم" active={activeView === 'record'} onClick={() => setActiveView('record')} color={currentTheme.primary} />
          <IconButton icon={List} label="توزيع الحصص" active={activeView === 'distribution'} onClick={() => setActiveView('distribution')} color={currentTheme.primary} />
          <IconButton icon={SettingsIcon} label="الإعدادات" active={activeView === 'settings'} onClick={() => setActiveView('settings')} color={currentTheme.primary} />
        </div>
        <div className="mt-auto space-y-6">
          <LiveDigitalClock color={currentTheme.primary} />
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center"><p className="text-[10px] font-black text-slate-500 uppercase mb-1">الجمهورية الجزائرية</p><p className="text-xs font-bold" style={{ color: currentTheme.accent }}>وزارة التربية الوطنية</p></div>
        </div>
      </nav>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-16 md:py-12 space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center p-0.5 shadow-2xl" style={{ background: `linear-gradient(to top right, ${currentTheme.primary}, ${currentTheme.accent})` }}>
              <div className="w-full h-full rounded-[1.4rem] bg-slate-900 flex items-center justify-center"><User size={28} style={{ color: currentTheme.primary }} /></div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">مرحباً أستاذ، {teacherInfo.name.split(' ')[0]}</h2>
              <p className="text-slate-400 text-sm flex items-center gap-2 font-bold"><School size={16} style={{ color: currentTheme.primary }} />{teacherInfo.school}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden lg:block text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">تاريخ العرض</p>
                <p className="text-sm font-bold text-white">{getDayName(new Date(targetDate))}، {formatDate(new Date(targetDate))}</p>
             </div>
             <LiveDigitalClock color={currentTheme.primary} />
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeView === 'settings' ? (
            <motion.div key="settings-view" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <GlassPanel className="p-10 space-y-8">
                <div className="flex items-center gap-4 border-b border-white/10 pb-6"><SettingsIcon style={{ color: currentTheme.primary }} size={24} /><h3 className="text-xl font-bold">إعدادات الوقت والجدولة</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ModernField label="تاريخ بداية الفصل" type="date" icon={Calendar} value={semesterStart} onChange={setSemesterStart} color={currentTheme.primary} />
                  <ModernField label="تاريخ معاينة الدفتر" type="date" icon={Clock} value={targetDate} onChange={setTargetDate} color={currentTheme.primary} />
                </div>
              </GlassPanel>

              <GlassPanel className="p-10 space-y-8">
                <div className="flex items-center gap-4 border-b border-white/10 pb-6"><Palette style={{ color: currentTheme.primary }} size={24} /><h3 className="text-xl font-bold">تغيير سكن البرنامج (الألوان)</h3></div>
                <div className="grid grid-cols-2 gap-4">
                  {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
                    <button 
                      key={key} 
                      onClick={() => setThemeKey(key)}
                      className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${themeKey === key ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'}`}
                      style={{ borderColor: themeKey === key ? THEMES[key].primary : 'rgba(255,255,255,0.1)' }}
                    >
                      <div className="w-10 h-10 rounded-full shadow-lg" style={{ background: `linear-gradient(to bottom right, ${THEMES[key].primary}, ${THEMES[key].accent})` }}></div>
                      <span className="text-xs font-bold">{THEMES[key].name}</span>
                    </button>
                  ))}
                </div>
              </GlassPanel>

              <GlassPanel className="p-10 space-y-8 lg:col-span-2">
                <div className="flex items-center gap-4 border-b border-white/10 pb-6"><User style={{ color: currentTheme.primary }} size={24} /><h3 className="text-xl font-bold">الملف الشخصي</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <ModernField label="اسم الأستاذ" icon={User} value={teacherInfo.name} onChange={(v) => setTeacherInfo({...teacherInfo, name: v})} color={currentTheme.primary} />
                  <ModernField label="المدرسة" icon={School} value={teacherInfo.school} onChange={(v) => setTeacherInfo({...teacherInfo, school: v})} color={currentTheme.primary} />
                  <ModernField label="المفتش" icon={CheckCircle} value={teacherInfo.inspector} onChange={(v) => setTeacherInfo({...teacherInfo, inspector: v})} color={currentTheme.primary} />
                  <ModernField label="المدير" icon={GraduationCap} value={teacherInfo.manager} onChange={(v) => setTeacherInfo({...teacherInfo, manager: v})} color={currentTheme.primary} />
                </div>
              </GlassPanel>
            </motion.div>
          ) : activeView === 'distribution' ? (
            <motion.div key="distribution-view" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="space-y-8">
              <GlassPanel className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                  <div className="flex items-center gap-4"><Filter style={{ color: currentTheme.primary }} size={24} /><h3 className="text-xl font-bold text-white">جدول توزيع الحصص</h3></div>
                  <div className="flex gap-2 bg-slate-900/50 p-2 rounded-2xl border border-white/5">
                    {['all', '1', '2', '3', '4', '5'].map(g => (
                      <button 
                        key={g} 
                        onClick={() => setGradeFilter(g)} 
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${gradeFilter === g ? 'text-white shadow-xl' : 'text-slate-500'}`}
                        style={{ backgroundColor: gradeFilter === g ? currentTheme.primary : 'transparent' }}
                      >
                        {g === 'all' ? 'الكل' : `السنة ${g}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead><tr className="border-b border-white/10 text-slate-500 text-xs font-black uppercase"><th className="py-6 px-4">اليوم</th><th className="py-6 px-4">التوقيت</th><th className="py-6 px-4">المستوى</th><th className="py-6 px-4">الفوج</th></tr></thead>
                    <tbody>
                      {distributionSlots.map((slot, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                          <td className="py-6 px-4 font-bold text-slate-200">{slot.dayName}</td>
                          <td className="py-6 px-4 font-mono" style={{ color: currentTheme.primary }}>{slot.time.replace('/', ' - ')}</td>
                          <td className="py-6 px-4 font-black text-slate-300">السنة {slot.grade} ابتدائي</td>
                          <td className="py-6 px-4"><span className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 font-bold">({slot.section})</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassPanel>
            </motion.div>
          ) : (
            <motion.div key="record-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {rows.length > 0 ? (
                <div className="grid grid-cols-1 gap-5">
                  {rows.map((row, idx) => (
                    <motion.div key={idx} whileHover={{ y: -4 }} whileTap={{ scale: 0.99 }} onClick={() => setSelectedRow(row)} className="glass-effect p-8 rounded-[2.5rem] flex flex-col lg:flex-row items-center gap-8 border-white/5 group cursor-pointer relative transition-all duration-500 shadow-xl" style={{ hoverBorderColor: currentTheme.primary }}>
                      <div className="flex items-center gap-6 min-w-[280px] w-full lg:w-auto">
                        <div className="w-28 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center font-black text-xs text-center border border-white/10 group-hover:text-white transition-all shadow-lg" style={{ color: currentTheme.primary }}>
                          {row.time.replace('/', ' - ')}
                        </div>
                        <div className="flex flex-col"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">المستوى</span><span className="text-xl font-black text-white group-hover:text-blue-400">السنة {row.gradeSection}</span></div>
                      </div>
                      <div className="flex-1 w-full text-right space-y-2">
                        <div className="flex items-center gap-2 font-black text-[10px] justify-end lg:justify-start uppercase tracking-widest" style={{ color: currentTheme.primary }}><PenTool size={14} /><PulsatingText text={row.field} /></div>
                        <h4 className="text-xl font-bold text-slate-100"><TypewriterText text={row.learnings} speed={10} cursorColor={currentTheme.primary} /></h4>
                        <div className="text-sm text-slate-500 italic line-clamp-1">{row.content}</div>
                      </div>
                      <div className="hidden xl:flex items-center">
                        <div className="px-8 py-4 rounded-2xl bg-white/5 text-xs font-black text-slate-400 uppercase tracking-widest border border-white/10 group-hover:text-white transition-all" style={{ groupHoverBackgroundColor: currentTheme.primary }}>
                          عرض المذكرة
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 opacity-50 text-center space-y-6">
                  <div className="bg-white/5 p-10 rounded-full border border-white/5 animate-bounce"><Calendar size={64} className="text-slate-600" /></div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white">لا توجد حصص مجدولة لهذا اليوم</h3>
                    <p className="text-sm text-slate-400">يبدو أنه يوم عطلة أو لم يتم اختيار تاريخ دراسي بعد.</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }} 
                    onClick={goToNextDay} 
                    className="flex items-center gap-2 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl transition-all"
                    style={{ backgroundColor: currentTheme.primary, boxShadow: `0 20px 40px ${currentTheme.primary}44` }}
                  >
                    انتقل لليوم التالي <ChevronRight size={20} />
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full glass-effect border-t border-white/20 px-10 py-5 flex justify-around items-center z-50">
        <button onClick={() => setActiveView('record')} className={`flex flex-col items-center gap-2 ${activeView === 'record' ? '' : 'text-slate-500'}`} style={{ color: activeView === 'record' ? currentTheme.primary : '' }}><LayoutDashboard size={24} /><span className="text-[10px] font-black uppercase">الجدول</span></button>
        <button onClick={() => setActiveView('distribution')} className={`flex flex-col items-center gap-2 ${activeView === 'distribution' ? '' : 'text-slate-500'}`} style={{ color: activeView === 'distribution' ? currentTheme.primary : '' }}><List size={24} /><span className="text-[10px] font-black uppercase">الخطة</span></button>
        <button onClick={() => setActiveView('settings')} className={`flex flex-col items-center gap-2 ${activeView === 'settings' ? '' : 'text-slate-500'}`} style={{ color: activeView === 'settings' ? currentTheme.primary : '' }}><SettingsIcon size={24} /><span className="text-[10px] font-black uppercase">الإعدادات</span></button>
      </nav>

    </div>
  );
}
