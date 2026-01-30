
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
  Bell,
  Sparkles,
  Plus,
  X,
  Target,
  BookOpen,
  Filter,
  List
} from 'lucide-react';
import { DailyRecordRow, TeacherInfo, WeeklySlot } from './types';
import { WEEKLY_SCHEDULE, FIELD_NAME, ALL_LESSONS } from './constants';
import { formatDate, getDayName, getLessonForSlot } from './utils';

// --- Animated UI Components ---

const GlassPanel = ({ children, className = "", delay = 0 }: { children?: React.ReactNode, className?: string, delay?: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className={`glass-effect rounded-[2rem] p-6 ${className}`}
  >
    {children}
  </motion.div>
);

const IconButton = ({ icon: Icon, onClick, active = false, label = "" }: { icon: React.ElementType, onClick: () => void, active?: boolean, label?: string }) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-4 rounded-2xl transition-all duration-200 ${
      active ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
    }`}
  >
    <Icon size={20} className={active ? 'animate-pulse' : ''} />
    <span className="text-sm font-bold">{label}</span>
  </motion.button>
);

const ModernField = ({ label, icon: Icon, value, onChange, type = "text" }: { label: string, icon: React.ElementType, value: string, onChange: (v: string) => void, type?: string }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-2">
      <Icon size={14} className="text-blue-500" />
      {label}
    </label>
    <div className="relative group">
      <input 
        type={type}
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500/50 focus:bg-white/10 outline-none transition-all text-sm text-slate-100 placeholder-slate-500"
      />
    </div>
  </div>
);

// Component for Typewriter Text Effect
const TypewriterText = ({ text, className = "", speed = 15 }: { text: string, className?: string, speed?: number }) => {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let currentText = "";
    let currentIndex = 0;
    setDisplayText("");

    const startTimeout = setTimeout(() => {
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
    }, 50);

    return () => clearTimeout(startTimeout);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayText}
      {displayText.length < text.length && (
        <motion.span 
          animate={{ opacity: [1, 0] }} 
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-1 h-4 bg-blue-400 ml-1 align-middle"
        />
      )}
    </span>
  );
};

// Component for Pulsating/Glowing Text Effect for the "Field" label
const PulsatingText = ({ text, className = "" }: { text: string, className?: string }) => {
  return (
    <motion.span
      key={text}
      initial={{ opacity: 0.8, filter: 'drop-shadow(0 0 0px rgba(37, 99, 235, 0))' }}
      animate={{ 
        opacity: [0.8, 1, 0.8],
        filter: [
          'drop-shadow(0 0 0px rgba(37, 99, 235, 0))',
          'drop-shadow(0 0 4px rgba(37, 99, 235, 0.6))',
          'drop-shadow(0 0 0px rgba(37, 99, 235, 0))'
        ]
      }}
      transition={{ 
        duration: 2, 
        repeat: 3, 
        ease: "easeInOut" 
      }}
      className={className}
    >
      {text}
    </motion.span>
  );
};

// --- Real-time Clock Component (Strict 24-hour format) ---
const LiveDigitalClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center bg-blue-600/10 border border-blue-500/20 rounded-2xl px-5 py-2 min-w-[140px]">
      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">الوقت الآن</span>
      <span className="text-xl font-bold text-white tabular-nums tracking-wider">
        {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
      </span>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  const [activeView, setActiveView] = useState<'record' | 'settings' | 'distribution'>('record');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<DailyRecordRow | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  
  const [semesterStart, setSemesterStart] = useState<string>(() => {
    const saved = localStorage.getItem('semester_start');
    return saved || new Date().toISOString().split('T')[0];
  });
  
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo>(() => {
    const saved = localStorage.getItem('teacher_info');
    return saved ? JSON.parse(saved) : {
      name: "الزايز محمد الطاهر",
      school: "ابتدائية العربي بن مهيدي",
      inspector: "الأستاذ المفتش",
      manager: "مدير المؤسسة"
    };
  });

  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('semester_start', semesterStart);
  }, [semesterStart]);

  useEffect(() => {
    localStorage.setItem('teacher_info', JSON.stringify(teacherInfo));
  }, [teacherInfo]);

  // Format time as "HH:mm - HH:mm" (24h)
  const formatDisplayTime = (timeRange: string) => {
    const parts = timeRange.split('/');
    if (parts.length === 2) {
      return `${parts[0]} - ${parts[1]}`;
    }
    return timeRange;
  };

  const rows = useMemo(() => {
    const dateObj = new Date(targetDate);
    const dayName = getDayName(dateObj);
    const dayIndex = dateObj.getDay();
    const startDate = new Date(semesterStart);
    
    const slotsToday = WEEKLY_SCHEDULE
      .filter(s => s.dayIndex === dayIndex)
      .sort((a, b) => a.time.localeCompare(b.time));

    return slotsToday.map((slot): DailyRecordRow => {
      const lesson = getLessonForSlot(slot, startDate, dateObj);
      return {
        date: formatDate(dateObj),
        day: dayName,
        time: slot.time,
        gradeSection: `${slot.grade} (${slot.section})`,
        field: FIELD_NAME,
        learnings: lesson.knowledgeResource,
        content: lesson.content,
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
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
            <Sparkles size={32} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">تحميل...</h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      
      {/* --- Lesson Detail Modal --- */}
      <AnimatePresence>
        {selectedRow && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedRow(null)}
            className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="glass-effect rounded-[2.5rem] w-full max-w-2xl overflow-hidden border border-white/10"
            >
              <div className="p-8 space-y-8 text-right">
                <div className="flex justify-between items-center border-b border-white/5 pb-6">
                   <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/20">
                     <BookOpen className="text-blue-400" size={24} />
                   </div>
                   <div className="text-left">
                     <span className="text-xs font-bold text-blue-400 block mb-0.5">المستوى {selectedRow.gradeSection}</span>
                     <h3 className="text-2xl font-bold text-white">معلومات الحصة</h3>
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs justify-end">
                      التعلمات والموارد
                      <Target size={16} />
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                      <p className="text-xl font-bold text-white leading-relaxed">
                        {selectedRow.learnings}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs justify-end">
                      محتوى التعلم
                      <PenTool size={16} />
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                      <p className="text-lg text-slate-300 leading-relaxed font-semibold">
                        {selectedRow.content}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center text-slate-500 text-[10px] pt-2">
                  انقر للإغلاق السريع
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* --- Sidebar (Desktop) --- */}
      <nav className="hidden md:flex flex-col w-72 bg-white/5 backdrop-blur-3xl border-l border-white/10 p-6 z-50">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-blue-600 rounded-2xl">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">الدفتر الذكي</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase">الجيل الثاني</p>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <IconButton 
            icon={FileText} 
            label="الدفتر اليومي" 
            active={activeView === 'record'} 
            onClick={() => setActiveView('record')} 
          />
          <IconButton 
            icon={List} 
            label="التوزيع الأسبوعي" 
            active={activeView === 'distribution'} 
            onClick={() => setActiveView('distribution')} 
          />
          <IconButton 
            icon={SettingsIcon} 
            label="إعدادات الحساب" 
            active={activeView === 'settings'} 
            onClick={() => setActiveView('settings')} 
          />
        </div>

        <div className="mt-auto">
          <LiveDigitalClock />
        </div>
      </nav>

      {/* --- Main Content Area --- */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-12 md:py-10 space-y-8">
        
        {/* --- Header --- */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center p-0.5">
              <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
                <User size={24} className="text-blue-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">مرحباً، {teacherInfo.name.split(' ')[0]}</h2>
              <p className="text-slate-400 text-xs flex items-center gap-1.5">
                <School size={12} />
                {teacherInfo.school}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LiveDigitalClock />
          </div>
        </header>

        {/* --- View Content --- */}
        <AnimatePresence mode="wait">
          {activeView === 'settings' ? (
            <motion.div 
              key="settings-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <GlassPanel className="p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <SettingsIcon className="text-blue-400" size={20} />
                  <h3 className="text-lg font-bold">التواريخ والنظام</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ModernField label="بداية الفصل الدراسي" type="date" icon={Calendar} value={semesterStart} onChange={setSemesterStart} />
                  <ModernField label="تاريخ عرض الدفتر" type="date" icon={Clock} value={targetDate} onChange={setTargetDate} />
                </div>
              </GlassPanel>

              <GlassPanel className="p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <User className="text-blue-400" size={20} />
                  <h3 className="text-lg font-bold">الملف الشخصي</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ModernField label="الاسم الكامل" icon={User} value={teacherInfo.name} onChange={(v: string) => setTeacherInfo({...teacherInfo, name: v})} />
                  <ModernField label="اسم المدرسة" icon={School} value={teacherInfo.school} onChange={(v: string) => setTeacherInfo({...teacherInfo, school: v})} />
                  <ModernField label="اسم المفتش" icon={CheckCircle} value={teacherInfo.inspector} onChange={(v: string) => setTeacherInfo({...teacherInfo, inspector: v})} />
                  <ModernField label="اسم المدير" icon={GraduationCap} value={teacherInfo.manager} onChange={(v: string) => setTeacherInfo({...teacherInfo, manager: v})} />
                </div>
              </GlassPanel>
            </motion.div>
          ) : activeView === 'distribution' ? (
            <motion.div 
              key="distribution-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <GlassPanel className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Filter className="text-blue-400" size={20} />
                    <h3 className="text-lg font-bold text-white">توزيع الحصص الأسبوعي</h3>
                  </div>
                  <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                    {['all', '1', '2', '3', '4', '5'].map(g => (
                      <button 
                        key={g}
                        onClick={() => setGradeFilter(g)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${gradeFilter === g ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        {g === 'all' ? 'الكل' : `س${g}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-500 text-xs">
                        <th className="py-4 px-2 font-bold">اليوم</th>
                        <th className="py-4 px-2 font-bold">التوقيت</th>
                        <th className="py-4 px-2 font-bold">المستوى</th>
                        <th className="py-4 px-2 font-bold">الفوج</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distributionSlots.map((slot, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                          <td className="py-4 px-2 font-bold text-slate-200">{slot.dayName}</td>
                          <td className="py-4 px-2 font-mono text-blue-400 tracking-tight">{formatDisplayTime(slot.time)}</td>
                          <td className="py-4 px-2">السنة {slot.grade}</td>
                          <td className="py-4 px-2 font-bold">({slot.section})</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassPanel>
            </motion.div>
          ) : (
            <motion.div 
              key="record-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {rows.length > 0 ? (
                <div className="space-y-3">
                  {rows.map((row, idx) => (
                    <motion.div
                      key={idx}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedRow(row)}
                      className="glass-effect p-5 rounded-[2rem] flex flex-col md:flex-row items-center gap-5 border-white/5 group cursor-pointer relative"
                    >
                      <div className="flex items-center gap-4 min-w-[240px] w-full md:w-auto">
                        <div className="w-24 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400 font-bold text-[11px] text-center p-2 leading-tight border border-blue-500/10">
                          {formatDisplayTime(row.time)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">المستوى</span>
                          <span className="text-lg font-bold text-white">{row.gradeSection}</span>
                        </div>
                      </div>

                      <div className="flex-1 w-full text-right md:text-right space-y-1">
                        <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[10px] justify-end md:justify-start">
                          <PenTool size={12} />
                          <PulsatingText text={row.field} />
                        </div>
                        <h4 className="text-md font-bold text-slate-100 line-clamp-1">
                          <TypewriterText text={row.learnings} />
                        </h4>
                        <div className="text-xs text-slate-400 line-clamp-1">
                          <TypewriterText text={row.content} speed={10} />
                        </div>
                      </div>

                      <div className="hidden lg:flex items-center">
                         <div className="px-4 py-2 rounded-xl bg-blue-500/5 text-[10px] font-bold text-blue-400 uppercase tracking-tighter">
                           اضغط للتفاصيل
                         </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                  <Calendar size={48} className="text-slate-600 mb-3" />
                  <p className="text-sm font-bold">لا توجد حصص لهذا اليوم</p>
                </div>
              )}

              <motion.button 
                whileTap={{ scale: 0.9 }}
                className="md:hidden fixed bottom-24 left-6 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center z-50 shadow-lg"
                onClick={() => setActiveView('settings')}
              >
                <SettingsIcon size={24} className="text-white" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- Mobile Bottom Nav --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full glass-effect border-t border-white/10 px-8 py-3 flex justify-around items-center z-50">
        <button onClick={() => setActiveView('record')} className={`flex flex-col items-center gap-1 ${activeView === 'record' ? 'text-blue-400' : 'text-slate-500'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold">الجدول</span>
        </button>
        <button onClick={() => setActiveView('distribution')} className={`flex flex-col items-center gap-1 ${activeView === 'distribution' ? 'text-blue-400' : 'text-slate-500'}`}>
          <List size={20} />
          <span className="text-[10px] font-bold">الخطة</span>
        </button>
        <button onClick={() => setActiveView('settings')} className={`flex flex-col items-center gap-1 ${activeView === 'settings' ? 'text-blue-400' : 'text-slate-500'}`}>
          <SettingsIcon size={20} />
          <span className="text-[10px] font-bold">الإعدادات</span>
        </button>
      </nav>

    </div>
  );
}
