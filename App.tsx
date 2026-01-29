
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  School, 
  Calendar, 
  Printer, 
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
  BookOpen
} from 'lucide-react';
import { DailyRecordRow, TeacherInfo } from './types';
import { WEEKLY_SCHEDULE, FIELD_NAME } from './constants';
import { formatDate, getDayName, getLessonForSlot } from './utils';

// --- Animated UI Components ---

const GlassPanel = ({ children, className = "", delay = 0 }: { children?: React.ReactNode, className?: string, delay?: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`glass-effect rounded-[2rem] p-6 ${className}`}
  >
    {children}
  </motion.div>
);

const IconButton = ({ icon: Icon, onClick, active = false, label = "" }: { icon: React.ElementType, onClick: () => void, active?: boolean, label?: string }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-4 rounded-2xl transition-all duration-300 ${
      active ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
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
      <div className="absolute inset-0 rounded-2xl border border-blue-500/0 group-focus-within:border-blue-500/50 pointer-events-none transition-all duration-300" />
    </div>
  </div>
);

// --- Main Application ---

export default function App() {
  const [activeView, setActiveView] = useState<'record' | 'settings'>('record');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<DailyRecordRow | null>(null);
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
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('semester_start', semesterStart);
  }, [semesterStart]);

  useEffect(() => {
    localStorage.setItem('teacher_info', JSON.stringify(teacherInfo));
  }, [teacherInfo]);

  // تحديث صيغة الوقت لتشمل كلمة "الساعة"
  const formatDisplayTime = (timeRange: string) => {
    const parts = timeRange.split('/');
    if (parts.length === 2) {
      return `من الساعة ${parts[0]} إلى الساعة ${parts[1]}`;
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

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
            <Sparkles size={40} className="text-white" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-2xl font-bold text-white">جاري التحميل...</h2>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden no-print">
      
      {/* --- Lesson Detail Modal (Auto-closes on click) --- */}
      <AnimatePresence>
        {selectedRow && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedRow(null)} // إغلاق تلقائي عند النقر في أي مكان
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6 cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-effect rounded-[3rem] w-full max-w-2xl overflow-hidden border border-white/20 shadow-[0_0_100px_rgba(59,130,246,0.3)]"
            >
              <div className="p-10 space-y-10 text-right">
                <div className="flex justify-between items-center">
                   <div className="bg-blue-600/20 p-4 rounded-3xl border border-blue-500/30">
                     <BookOpen className="text-blue-400" size={32} />
                   </div>
                   <div className="text-left">
                     <span className="text-sm font-bold text-blue-400 block mb-1">المستوى {selectedRow.gradeSection}</span>
                     <h3 className="text-3xl font-bold text-white">تفاصيل الحصة</h3>
                   </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-sm justify-end">
                      التعلمات والموارد المعرفية
                      <Target size={18} />
                    </div>
                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
                      <p className="text-2xl font-bold text-white leading-relaxed">
                        {selectedRow.learnings}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-sm justify-end">
                      محتوى التعلم / النشاط
                      <PenTool size={18} />
                    </div>
                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
                      <p className="text-xl text-slate-300 leading-relaxed font-semibold">
                        {selectedRow.content}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center text-slate-500 text-sm animate-pulse">
                  انقر في أي مكان للإغلاق
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* --- Sidebar (Desktop) --- */}
      <nav className="hidden md:flex flex-col w-72 bg-white/5 backdrop-blur-3xl border-l border-white/10 p-6 z-50">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">الدفتر الذكي</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase">الجيل الثاني</p>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <IconButton 
            icon={FileText} 
            label="الدفتر اليومي" 
            active={activeView === 'record'} 
            onClick={() => setActiveView('record')} 
          />
          <IconButton 
            icon={SettingsIcon} 
            label="إعدادات الحساب" 
            active={activeView === 'settings'} 
            onClick={() => setActiveView('settings')} 
          />
        </div>

        <div className="mt-auto">
          <GlassPanel className="p-4 rounded-3xl border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center gap-3 mb-2">
              <Bell size={16} className="text-blue-400" />
              <span className="text-xs font-bold text-white">تذكير</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              يتم تحديث الموارد تلقائياً بناءً على تاريخ البداية المختار.
            </p>
          </GlassPanel>
        </div>
      </nav>

      {/* --- Main Content Area --- */}
      <main className="flex-1 overflow-y-auto px-4 py-8 md:px-12 md:py-10 space-y-10">
        
        {/* --- Header / Dashboard Info --- */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center p-0.5">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                  <User size={30} className="text-blue-400" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-slate-900 rounded-full" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">مرحباً، {teacherInfo.name.split(' ')[0]}</h2>
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <School size={14} />
                {teacherInfo.school}
              </p>
            </div>
          </motion.div>

          <div className="flex gap-4">
            <GlassPanel className="px-6 py-3 rounded-2xl flex items-center gap-4 border-white/5">
              <Clock className="text-blue-400 animate-float" size={20} />
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase">التاريخ المختار</p>
                <p className="text-sm font-bold text-white">{new Date(targetDate).toLocaleDateString('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
            </GlassPanel>
            
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(59, 130, 246, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-blue-900/40"
            >
              <Printer size={20} />
              <span className="hidden sm:inline">طباعة الدفتر</span>
            </motion.button>
          </div>
        </header>

        {/* --- View Switcher Content --- */}
        <AnimatePresence mode="wait">
          {activeView === 'settings' ? (
            <motion.div 
              key="settings-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <GlassPanel className="p-8 space-y-8">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <SettingsIcon className="text-blue-400" />
                  <h3 className="text-lg font-bold">إعدادات النظام والتاريخ</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ModernField label="بداية الفصل الدراسي" type="date" icon={Calendar} value={semesterStart} onChange={setSemesterStart} />
                  <ModernField label="تاريخ عرض الدفتر" type="date" icon={Clock} value={targetDate} onChange={setTargetDate} />
                </div>
              </GlassPanel>

              <GlassPanel className="p-8 space-y-8">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <User className="text-blue-400" />
                  <h3 className="text-lg font-bold">الملف المهني</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ModernField label="اسم الأستاذ الكامل" icon={User} value={teacherInfo.name} onChange={(v: string) => setTeacherInfo({...teacherInfo, name: v})} />
                  <ModernField label="المؤسسة التعليمية" icon={School} value={teacherInfo.school} onChange={(v: string) => setTeacherInfo({...teacherInfo, school: v})} />
                  <ModernField label="مفتش المقاطعة" icon={CheckCircle} value={teacherInfo.inspector} onChange={(v: string) => setTeacherInfo({...teacherInfo, inspector: v})} />
                  <ModernField label="المدير المباشر" icon={GraduationCap} value={teacherInfo.manager} onChange={(v: string) => setTeacherInfo({...teacherInfo, manager: v})} />
                </div>
              </GlassPanel>
            </motion.div>
          ) : (
            <motion.div 
              key="record-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* --- Interactive List View --- */}
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                {rows.length > 0 ? (
                  <div className="space-y-4">
                    {rows.map((row, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ x: -10, backgroundColor: "rgba(255,255,255,0.05)" }}
                        onClick={() => setSelectedRow(row)}
                        className="glass-effect p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center gap-6 border-white/5 group transition-all cursor-pointer relative overflow-hidden"
                      >
                        <div className="flex items-center gap-4 min-w-[220px]">
                          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400 font-bold text-[10px] text-center p-2 leading-tight border border-blue-500/20">
                            {formatDisplayTime(row.time)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">المستوى</span>
                            <span className="text-xl font-bold text-white">{row.gradeSection}</span>
                          </div>
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                            <PenTool size={14} className="group-hover:rotate-12 transition-transform" />
                            {row.field}
                          </div>
                          <h4 className="text-lg font-bold text-slate-100">{row.learnings}</h4>
                          <p className="text-sm text-slate-400 line-clamp-1 leading-relaxed">{row.content}</p>
                        </div>

                        <div className="hidden lg:flex items-center gap-3">
                           <div className="px-5 py-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/10 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                             عرض التفاصيل
                           </div>
                        </div>
                        
                        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-all duration-500 pointer-events-none" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <GlassPanel className="flex flex-col items-center justify-center py-24 border-dashed border-white/10 opacity-60">
                    <Calendar size={60} className="text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-500">لا توجد حصص مجدولة لهذا التاريخ</h3>
                    <p className="text-slate-600">اختر يوماً دراسياً من الإعدادات</p>
                  </GlassPanel>
                )}
              </div>

              {/* --- 3D FAB for Mobile --- */}
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="md:hidden fixed bottom-24 left-6 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50 z-50"
                onClick={() => setActiveView('settings')}
              >
                <Plus size={30} className="text-white" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- Bottom Navigation (Mobile) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full glass-effect border-t border-white/10 px-8 py-4 flex justify-around items-center z-50">
        <button onClick={() => setActiveView('record')} className={`flex flex-col items-center gap-1 ${activeView === 'record' ? 'text-blue-400' : 'text-slate-500'}`}>
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-bold">الدفتر</span>
        </button>
        <button onClick={() => setActiveView('settings')} className={`flex flex-col items-center gap-1 ${activeView === 'settings' ? 'text-blue-400' : 'text-slate-500'}`}>
          <SettingsIcon size={24} />
          <span className="text-[10px] font-bold">الإعدادات</span>
        </button>
      </nav>

      {/* --- Official Print Area (Classic Paper Look) --- */}
      <div className="hidden print:block print-area w-full max-w-[210mm] mx-auto bg-white text-black p-[15mm]">
        {/* Paper Header */}
        <div className="flex justify-between items-start mb-10 border-b-2 border-slate-900 pb-6">
          <div className="text-right space-y-1">
            <p className="font-bold text-lg">المؤسسة: {teacherInfo.school}</p>
            <p>الأستاذ: {teacherInfo.name}</p>
            <p>السنة الدراسية: 2024 / 2025</p>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold border-4 border-double border-slate-900 px-8 py-2 inline-block">
              الدفتر اليومي
            </h2>
          </div>
          <div className="w-[150px]"></div>
        </div>

        {/* Traditional Table */}
        <table className="w-full border-collapse border-2 border-slate-900 text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th className="border-2 border-slate-900 p-2 w-[12%]">اليوم والتاريخ</th>
              <th className="border-2 border-slate-900 p-2 w-[10%]">التوقيت</th>
              <th className="border-2 border-slate-900 p-2 w-[10%]">القسم</th>
              <th className="border-2 border-slate-900 p-2 w-[15%]">الميدان</th>
              <th className="border-2 border-slate-900 p-2 w-[25%]">التعلمات</th>
              <th className="border-2 border-slate-900 p-2 w-[20%]">محتوى التعلم</th>
              <th className="border-2 border-slate-900 p-2 w-[8%]">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((row, idx) => (
              <tr key={idx} className="h-28 align-top">
                <td className="border-2 border-slate-900 p-2 text-center align-middle font-bold">
                  {idx === 0 ? <>{row.day}<br/><span className="text-xs font-normal">{row.date}</span></> : ""}
                </td>
                <td className="border-2 border-slate-900 p-2 text-center align-middle font-bold italic">{formatDisplayTime(row.time)}</td>
                <td className="border-2 border-slate-900 p-2 text-center align-middle font-bold text-lg">{row.gradeSection}</td>
                <td className="border-2 border-slate-900 p-2 text-center align-middle leading-tight">{row.field}</td>
                <td className="border-2 border-slate-900 p-2 leading-relaxed font-bold">{row.learnings}</td>
                <td className="border-2 border-slate-900 p-2 leading-relaxed">{row.content}</td>
                <td className="border-2 border-slate-900 p-2"></td>
              </tr>
            )) : (
              <tr className="h-32">
                <td colSpan={7} className="border-2 border-slate-900 text-center align-middle">لا توجد حصص مبرمجة</td>
              </tr>
            )}
            {/* Fillers */}
            {Array.from({ length: Math.max(0, 10 - rows.length) }).map((_, i) => (
              <tr key={`filler-${i}`} className="h-20">
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="border-2 border-slate-900"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-12 grid grid-cols-3 text-center font-bold">
          <div className="space-y-12">
            <p>توقيع الأستاذ</p>
            <div className="h-1 bg-black/5 w-1/2 mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p>توقيع المفتش</p>
            <p className="text-xs font-normal opacity-60">{teacherInfo.inspector || "................"}</p>
          </div>
          <div className="space-y-2">
            <p>توقيع المدير</p>
            <p className="text-xs font-normal opacity-60">{teacherInfo.manager || "................"}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
