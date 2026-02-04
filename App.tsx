
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  X,
  Target,
  BookOpen,
  List,
  Wrench,
  Palette,
  ChevronDown,
  ExternalLink,
  FileSearch,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  XCircle,
  MessageSquare,
  History,
  ClipboardList,
  Download,
  Upload,
  RefreshCw,
  Database,
  Tag,
  Bell,
  Info
} from 'lucide-react';
import { DailyRecordRow, TeacherInfo, WeeklySlot, PostponeReason, PostponedSession } from './types';
import { WEEKLY_SCHEDULE, FIELD_NAME, ALL_LESSONS } from './constants';
import { formatDate, getDayName, getLessonForSlot } from './utils';

// --- Custom App Icon Component (Based on User Image) ---
const AppIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Clipboard Base */}
    <rect x="20" y="15" width="60" height="75" rx="8" fill="#1e293b" stroke="white" strokeWidth="2" strokeOpacity="0.1" />
    <rect x="30" y="30" width="40" height="4" rx="2" fill="white" fillOpacity="0.1" />
    <rect x="30" y="40" width="25" height="4" rx="2" fill="white" fillOpacity="0.1" />
    <rect x="30" y="50" width="35" height="4" rx="2" fill="white" fillOpacity="0.1" />
    
    {/* Clipboard Clip */}
    <rect x="35" y="8" width="30" height="12" rx="3" fill="#f97316" />
    <circle cx="50" cy="14" r="2" fill="white" />
    
    {/* Whistle Overlapping */}
    <g filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))">
      <path d="M75 55C75 48.3726 69.6274 43 63 43C56.3726 43 51 48.3726 51 55C51 61.6274 56.3726 67 63 67H80C82.7614 67 85 64.7614 85 62V58C85 56.3431 83.6569 55 82 55H75Z" fill="#fb923c" />
      <rect x="70" y="48" width="8" height="3" rx="1" fill="#f97316" />
      <circle cx="63" cy="55" r="4" fill="#ea580c" />
    </g>
  </svg>
);

// --- Notification Logic ---
type NotificationType = 'success' | 'error' | 'info' | 'warning';
interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  title: string;
}

const THEMES = {
  ocean: { name: "محيط عميق", primary: "#2563eb", bg: "#0f172a", gradient: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" },
  emerald: { name: "غابة الزمرد", primary: "#10b981", bg: "#061f1a", gradient: "linear-gradient(180deg, #061f1a 0%, #064e3b 100%)" },
  royal: { name: "بنفسجي ملكي", primary: "#8b5cf6", bg: "#1e1b4b", gradient: "linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)" },
  sunset: { name: "غسق دافئ", primary: "#f43f5e", bg: "#1a0f0f", gradient: "linear-gradient(180deg, #1a0f0f 0%, #450a0a 100%)" }
};

const REASONS_MAP: Record<PostponeReason, string> = {
  half_day: "تعليمة نصف يوم",
  arbitration: "طلب تحكيم",
  competition: "طلب منافسة رياضية",
  other: "سبب آخر"
};

type ThemeKey = keyof typeof THEMES;

const GlassPanel = ({ children, className = "" }: { children?: React.ReactNode, className?: string, key?: React.Key }) => (
  <div className={`bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl backdrop-blur-sm ${className}`}>{children}</div>
);

const IconButton = ({ icon: Icon, onClick, active = false, label = "", color }: { icon: React.ElementType, onClick: () => void, active?: boolean, label?: string, color: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 w-full p-4 rounded-xl transition-all duration-300 ${active ? 'bg-white/10 border border-white/20' : 'text-slate-400 hover:bg-white/5'}`}
    style={active ? { borderColor: `${color}55`, color: color } : {}}
  >
    <Icon size={20} />
    <span className="text-sm font-bold">{label}</span>
  </button>
);

const ModernField = ({ label, icon: Icon, value, onChange, type = "text", color }: { label: string, icon: React.ElementType, value: string, onChange: (v: string) => void, type?: string, color: string }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[10px] font-black text-slate-500 mr-2 flex items-center gap-2 uppercase">
      <Icon size={12} style={{ color }} /> {label}
    </label>
    <input 
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none text-sm text-white focus:border-blue-500 focus:bg-white/[0.08] transition-all"
    />
  </div>
);

// --- Toast Component ---
const Toast = ({ notification, onClose }: { notification: AppNotification, onClose: (id: string) => void }) => {
  const styles = {
    success: 'border-teal-500 bg-teal-500/10 text-teal-400',
    error: 'border-red-500 bg-red-500/10 text-red-400',
    info: 'border-blue-500 bg-blue-500/10 text-blue-400',
    warning: 'border-amber-500 bg-amber-500/10 text-amber-400'
  }[notification.type];

  const Icon = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertCircle
  }[notification.type];

  return (
    <div className={`flex items-start gap-4 p-4 min-w-[320px] border-r-4 rounded-xl shadow-2xl backdrop-blur-lg animate-in slide-in-from-right-full duration-500 ${styles}`}>
      <div className="p-2 rounded-lg bg-white/5">
        <Icon size={20} />
      </div>
      <div className="flex-1 text-right">
        <h4 className="text-sm font-bold text-white mb-0.5">{notification.title}</h4>
        <p className="text-[11px] text-slate-300 leading-tight">{notification.message}</p>
      </div>
      <button onClick={() => onClose(notification.id)} className="p-1 text-white/40 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
};

export default function App() {
  const [activeView, setActiveView] = useState<'record' | 'settings' | 'distribution' | 'notes'>('record');
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<DailyRecordRow | null>(null);
  const [viewPdf, setViewPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [postponeModalRow, setPostponeModalRow] = useState<DailyRecordRow | null>(null);
  const [tempReasonType, setTempReasonType] = useState<PostponeReason>('half_day');
  const [tempOtherText, setTempOtherText] = useState('');

  const [themeKey, setThemeKey] = useState<ThemeKey>(() => (localStorage.getItem('app_theme') as ThemeKey) || 'ocean');
  const currentTheme = THEMES[themeKey];

  const [semesterStart, setSemesterStart] = useState<string>(() => localStorage.getItem('semester_start') || "2026-01-04");
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo>(() => {
    const saved = localStorage.getItem('teacher_info');
    return saved ? JSON.parse(saved) : { name: "الأستاذ الفاضل", school: "ابتدائية العربي بن مهيدي", inspector: "السيد المفتش", manager: "السيد المدير" };
  });

  const [meetingsState, setMeetingsState] = useState<Record<string, 'completed' | 'incomplete'>>(() => {
    const saved = localStorage.getItem('meetings_state');
    return saved ? JSON.parse(saved) : {};
  });

  const [postponedSessions, setPostponedSessions] = useState<PostponedSession[]>(() => {
    const saved = localStorage.getItem('postponed_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('semester_start', semesterStart);
    localStorage.setItem('teacher_info', JSON.stringify(teacherInfo));
    localStorage.setItem('app_theme', themeKey);
    localStorage.setItem('meetings_state', JSON.stringify(meetingsState));
    localStorage.setItem('postponed_sessions', JSON.stringify(postponedSessions));
    document.body.style.backgroundColor = currentTheme.bg;
  }, [semesterStart, teacherInfo, themeKey, currentTheme, meetingsState, postponedSessions]);

  // Hide Splash Screen Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      const splash = document.getElementById('splash-screen');
      if (splash) splash.classList.add('hidden');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const addNotification = (type: NotificationType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [{ id, type, title, message }, ...prev]);
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const rows = useMemo(() => {
    const dateObj = new Date(targetDate);
    const dayIndex = dateObj.getDay();
    const startDate = new Date(semesterStart);
    
    const slotsToday = WEEKLY_SCHEDULE
      .filter(s => s.dayIndex === dayIndex)
      .sort((a, b) => a.time.localeCompare(b.time));

    return slotsToday.map((slot): DailyRecordRow & { isIncomplete: boolean } => {
      const { lesson, isIncomplete } = getLessonForSlot(slot, startDate, dateObj, meetingsState);
      return {
        date: formatDate(dateObj),
        day: getDayName(dateObj),
        time: slot.time,
        gradeSection: `${slot.grade} (${slot.section})`,
        field: FIELD_NAME,
        topic: lesson.topic,
        learnings: lesson.knowledgeResource,
        content: lesson.content,
        teachingSituation: lesson.teachingSituation,
        tools: lesson.tools,
        pdfUrl: lesson.pdfUrl,
        note: "",
        isIncomplete
      };
    });
  }, [targetDate, semesterStart, meetingsState]);

  const handleBackup = () => {
    try {
      const backupData = {
        version: "1.1",
        teacherInfo,
        meetingsState,
        postponedSessions,
        semesterStart,
        appTheme: themeKey,
        backupDate: new Date().toLocaleString('ar-DZ')
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SmarteRecord_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      addNotification('success', 'نجاح النسخ الاحتياطي', 'تم حفظ بياناتك وملاحظاتك بأمان في ملف خارجي.');
    } catch (err) {
      addNotification('error', 'فشل العملية', 'حدث خطأ تقني أثناء محاولة النسخ.');
    }
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.teacherInfo) setTeacherInfo(data.teacherInfo);
        if (data.meetingsState) setMeetingsState(data.meetingsState);
        if (data.postponedSessions) setPostponedSessions(data.postponedSessions);
        if (data.semesterStart) setSemesterStart(data.semesterStart);
        if (data.appTheme) setThemeKey(data.appTheme);
        
        addNotification('success', 'استعادة البيانات', 'تمت مزامنة كافة الملاحظات والتأجيلات من الملف المرفوع.');
      } catch (err) {
        addNotification('error', 'ملف غير صالح', 'الرجاء التأكد من اختيار ملف النسخة الاحتياطية الصحيح.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePostponeClick = (row: DailyRecordRow) => {
    const key = `${row.date}_${row.gradeSection.replace(' (', '_').replace(')', '')}_${row.time}`;
    if (meetingsState[key] === 'incomplete') {
      setMeetingsState(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setPostponedSessions(prev => prev.filter(s => s.key !== key));
      addNotification('info', 'تم التحديث', `تمت إعادة حصة السنة ${row.gradeSection} كحصة مكتملة.`);
    } else {
      setPostponeModalRow(row);
      setTempReasonType('half_day');
      setTempOtherText('');
    }
  };

  const confirmPostpone = () => {
    if (!postponeModalRow) return;
    const key = `${postponeModalRow.date}_${postponeModalRow.gradeSection.replace(' (', '_').replace(')', '')}_${postponeModalRow.time}`;
    const reasonValue = tempReasonType === 'other' ? tempOtherText : REASONS_MAP[tempReasonType];

    setMeetingsState(prev => ({ ...prev, [key]: 'incomplete' }));
    setPostponedSessions(prev => [
      ...prev,
      {
        key,
        date: postponeModalRow.date,
        gradeSection: postponeModalRow.gradeSection,
        reason: reasonValue || "غير محدد",
        reasonType: tempReasonType
      }
    ]);
    
    addNotification('warning', 'حصة مؤجلة', `تم تسجيل عدم اكتمال حصة ${postponeModalRow.gradeSection}.`);
    setPostponeModalRow(null);
  };

  const changeDay = (offset: number) => {
    const d = new Date(targetDate);
    d.setDate(d.getDate() + offset);
    setTargetDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-slate-900" style={{ color: '#fff' }}>
      
      {/* --- Notification Overlays --- */}
      <div className="fixed top-8 right-8 z-[999] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="pointer-events-auto">
            <Toast notification={n} onClose={removeNotification} />
          </div>
        ))}
      </div>

      {/* --- Sidebar (Navigation) --- */}
      <nav className="hidden md:flex flex-col w-72 bg-slate-950/50 border-l border-white/10 p-6 z-50">
        <div className="flex items-center gap-4 mb-12 group cursor-pointer">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-xl shadow-orange-600/20 ring-4 ring-orange-500/10 group-hover:scale-110 transition-transform duration-500">
            <AppIcon size={32} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight group-hover:text-orange-400 transition-colors">الدفتر الذكي</h1>
            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Smart Sport Office</p>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <IconButton icon={FileText} label="جدول اليوم" active={activeView === 'record'} onClick={() => setActiveView('record')} color={currentTheme.primary} />
          <IconButton icon={MessageSquare} label="الملاحظات" active={activeView === 'notes'} onClick={() => setActiveView('notes')} color={currentTheme.primary} />
          <IconButton icon={List} label="توزيع الحصص" active={activeView === 'distribution'} onClick={() => setActiveView('distribution')} color={currentTheme.primary} />
          <IconButton icon={SettingsIcon} label="الإعدادات" active={activeView === 'settings'} onClick={() => setActiveView('settings')} color={currentTheme.primary} />
        </div>
        <div className="mt-auto pt-6 border-t border-white/10">
           <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-tighter">الحالة التشغيلية</p>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                 <span className="text-xs font-bold text-orange-500">نشط الآن</span>
              </div>
           </div>
        </div>
      </nav>

      {/* --- Main Dashboard Area --- */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10 space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-800 border border-white/10 shadow-lg group hover:border-orange-500/50 transition-colors">
              <AppIcon size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">{teacherInfo.name}</h2>
              <p className="text-slate-400 text-sm flex items-center gap-1"><School size={14} className="text-orange-500" /> {teacherInfo.school}</p>
            </div>
          </div>
          
          {activeView === 'record' && (
            <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-inner">
              <button onClick={() => changeDay(-1)} className="p-3 hover:bg-white/10 rounded-xl transition-colors text-slate-400"><ChevronRight size={24} /></button>
              <div className="text-center min-w-[160px] px-2">
                <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-0.5">{getDayName(new Date(targetDate))}</p>
                <p className="text-sm font-black">{formatDate(new Date(targetDate))}</p>
              </div>
              <button onClick={() => changeDay(1)} className="p-3 hover:bg-white/10 rounded-xl transition-colors text-slate-400"><ChevronLeft size={24} /></button>
            </div>
          )}
        </header>

        <div className="pb-28">
          {activeView === 'settings' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <GlassPanel className="p-8 space-y-8 border-t-4 border-t-orange-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black flex items-center gap-3 text-orange-400"><Database size={24} /> إدارة البيانات</h3>
                  <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg"><Info size={18} /></div>
                </div>
                <div className="space-y-6">
                  <p className="text-xs text-slate-400 leading-relaxed font-bold">قم بتصدير مذكراتك وملاحظاتك المهنية لحفظها خارج التطبيق أو استعادتها عند تغيير المتصفح.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={handleBackup} className="flex items-center justify-center gap-3 py-5 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 group">
                      <Download size={20} className="group-hover:-translate-y-1 transition-transform" />
                      <span className="text-sm font-black">نسخ احتياطي</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-3 py-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                      <Upload size={20} className="text-orange-400 group-hover:translate-y-1 transition-transform" />
                      <span className="text-sm font-black">استرجاع النسخة</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleRestore} className="hidden" accept=".json" />
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel className="p-8 space-y-8 border-t-4 border-t-blue-500">
                <h3 className="text-xl font-black flex items-center gap-3 text-blue-400"><SettingsIcon size={24} /> الإعدادات الزمنية</h3>
                <div className="grid grid-cols-1 gap-6">
                  <ModernField label="تاريخ بداية الفصل" type="date" icon={Calendar} value={semesterStart} onChange={setSemesterStart} color={currentTheme.primary} />
                  <ModernField label="تاريخ معاينة الدفتر" type="date" icon={Clock} value={targetDate} onChange={setTargetDate} color={currentTheme.primary} />
                </div>
              </GlassPanel>

              <GlassPanel className="p-8 space-y-8 lg:col-span-2 border-t-4 border-t-indigo-500">
                <h3 className="text-xl font-black flex items-center gap-3 text-indigo-400"><User size={24} /> المعلومات المهنية الرسمية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <ModernField label="اسم الأستاذ" icon={User} value={teacherInfo.name} onChange={(v) => setTeacherInfo({...teacherInfo, name: v})} color={currentTheme.primary} />
                  <ModernField label="المدرسة" icon={School} value={teacherInfo.school} onChange={(v) => setTeacherInfo({...teacherInfo, school: v})} color={currentTheme.primary} />
                  <ModernField label="المفتش" icon={CheckCircle} value={teacherInfo.inspector} onChange={(v) => setTeacherInfo({...teacherInfo, inspector: v})} color={currentTheme.primary} />
                  <ModernField label="المدير" icon={GraduationCap} value={teacherInfo.manager} onChange={(v) => setTeacherInfo({...teacherInfo, manager: v})} color={currentTheme.primary} />
                </div>
              </GlassPanel>
            </div>
          ) : activeView === 'notes' ? (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                <h3 className="text-3xl font-black text-white flex items-center gap-4"><History className="text-blue-500" size={32} /> السجل والملاحظات</h3>
                <div className="px-5 py-2.5 bg-red-500/10 text-red-400 rounded-2xl text-xs font-black border border-red-500/20 shadow-lg shadow-red-500/5">
                  إجمالي الحصص المؤجلة: {postponedSessions.length}
                </div>
              </div>
              {postponedSessions.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {postponedSessions.map((ps, idx) => (
                    <GlassPanel key={idx} className="flex flex-col md:flex-row items-center gap-6 border-r-8 border-r-red-500 hover:bg-white/[0.08] transition-all group">
                      <div className="flex-1 text-right">
                        <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 mb-2">
                          <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md"><Calendar size={12} /> {ps.date}</span>
                          <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md"><School size={12} /> القسم: {ps.gradeSection}</span>
                        </div>
                        <h4 className="text-xl font-black text-white group-hover:text-red-400 transition-colors">سبب التأجيل: {ps.reason}</h4>
                      </div>
                      <div className="px-6 py-3 bg-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/30">حصة غير مكتملة</div>
                    </GlassPanel>
                  ))}
                </div>
              ) : (
                <div className="py-40 text-center opacity-30">
                  <ClipboardList size={80} className="mx-auto mb-6 text-slate-600" />
                  <p className="text-2xl font-black text-slate-500">لا توجد أي ملاحظات أو تأجيلات حالياً</p>
                  <p className="text-sm mt-2 text-slate-600">سجل اليومي سليم بنسبة 100%</p>
                </div>
              )}
            </div>
          ) : activeView === 'distribution' ? (
            <GlassPanel className="p-10 border-t-4 border-t-blue-500">
               <div className="flex items-center gap-4 mb-10">
                  <List className="text-blue-500" size={32} />
                  <h3 className="text-2xl font-black">جدول توزيع الحصص الرسمي</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead><tr className="border-b border-white/10 text-slate-500 font-black"><th className="py-6 text-right px-4">اليوم</th><th className="text-right px-4">التوقيت</th><th className="text-right px-4">المستوى</th><th className="text-right px-4">الفوج</th></tr></thead>
                   <tbody>
                     {WEEKLY_SCHEDULE.map((slot, i) => (
                       <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                         <td className="py-6 font-black text-white px-4">{slot.dayName}</td>
                         <td className="font-mono text-blue-400 px-4">{slot.time}</td>
                         <td className="px-4 font-bold">السنة {slot.grade} ابتدائي</td>
                         <td className="px-4 font-black text-slate-400 group-hover:text-blue-400">({slot.section})</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </GlassPanel>
          ) : (
            <div className="space-y-6">
              {rows.length > 0 ? rows.map((row, idx) => (
                <div key={idx} className={`bg-white/5 border-2 rounded-[2.5rem] overflow-hidden transition-all duration-300 ${row.isIncomplete ? 'border-red-500/40 bg-red-500/10 shadow-lg shadow-red-500/5' : 'border-white/10 hover:border-white/20'}`}>
                  <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex flex-col gap-3">
                      <div className="w-28 py-4 rounded-2xl bg-slate-900 border border-white/10 text-center text-[11px] font-black text-blue-400 shadow-xl">
                        {row.time}
                      </div>
                      <div className={`w-28 py-2 rounded-xl text-center text-[9px] font-black uppercase tracking-tighter border ${row.topic.includes("تقويم") ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                        {row.topic.includes("تقويم") ? "تقويم تشخيصي" : "وحدة تعليمية"}
                      </div>
                    </div>
                    
                    <div className="flex-1 text-right">
                      <div className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 mb-2">
                        <PenTool size={12} /> {row.field} | <School size={12} /> السنة {row.gradeSection}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <Tag size={16} className="text-amber-500" />
                        <span className="text-sm font-black text-amber-500/90 uppercase tracking-wide">نوع الحصة: {row.topic}</span>
                      </div>

                      <h4 className="text-2xl font-black text-white mb-4 leading-tight">{row.learnings}</h4>
                      
                      <div className="mt-4 p-5 bg-teal-500/5 border-r-4 border-teal-500 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen size={16} className="text-teal-400" />
                          <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">محتوى التعلم المستهدف:</span>
                        </div>
                        <p className="text-md font-bold text-teal-50/90 leading-relaxed">{row.content}</p>
                      </div>

                      {row.isIncomplete && (
                        <div className="mt-5 flex flex-wrap gap-3">
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white rounded-xl shadow-xl shadow-red-600/20 text-xs font-black animate-pulse">
                            <AlertCircle size={14} /> الحصة لم تكتمل
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-5">
                       <button onClick={() => handlePostponeClick(row)} className={`p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${row.isIncomplete ? 'bg-red-600 border-red-500 text-white shadow-xl shadow-red-600/30' : 'bg-white/5 border-white/10 text-slate-500 hover:text-green-500 hover:border-green-500/30'}`}>
                         {row.isIncomplete ? <XCircle size={32} /> : <CheckCircle size={32} />}
                         <span className="text-[9px] font-black uppercase tracking-widest">{row.isIncomplete ? 'مؤجلة' : 'تمت بنجاح'}</span>
                       </button>
                       <button onClick={() => setExpandedRowIndex(expandedRowIndex === idx ? null : idx)} className="p-3 text-slate-500 hover:text-white transition-colors">
                         <ChevronDown size={32} className={`transition-transform duration-500 ${expandedRowIndex === idx ? 'rotate-180' : ''}`} />
                       </button>
                    </div>
                  </div>

                  {expandedRowIndex === idx && (
                    <div className="bg-white/[0.04] border-t border-white/10 p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="p-6 bg-emerald-950/20 border-r-4 border-emerald-500 rounded-2xl">
                           <span className="text-[11px] text-emerald-400 font-black block mb-2 uppercase tracking-widest">الموقف التعليمي المفصل:</span>
                           <p className="text-sm font-bold leading-relaxed text-emerald-50/80">{row.teachingSituation || "يتم اتباع التدرج السنوي للمكتسبات والتركيز على المحتوى المعرفي."}</p>
                         </div>
                         <div className="p-6 bg-amber-950/20 border-r-4 border-amber-500 rounded-2xl">
                           <span className="text-[11px] text-amber-400 font-black block mb-2 uppercase tracking-widest">الوسائل المستخدمة:</span>
                           <p className="text-sm font-bold text-amber-50/80 leading-relaxed">{row.tools || "سلم أرضي، شواخص، أقماع، كرات طبية."}</p>
                         </div>
                      </div>
                      <button onClick={() => { setSelectedRow(row); setViewPdf(false); }} className="w-full py-5 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/30 group">
                        فتح المذكرة الكاملة للمعايير <ExternalLink size={20} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}
                </div>
              )) : (
                <div className="py-40 text-center opacity-20">
                  <Calendar size={100} className="mx-auto mb-6 text-slate-600" />
                  <p className="text-2xl font-black text-slate-500">لا توجد حصص مبرمجة ليوم {getDayName(new Date(targetDate))}</p>
                  <button onClick={() => changeDay(1)} className="mt-6 text-sm font-black text-blue-400 underline decoration-2 underline-offset-8">انتقل إلى اليوم الدراسي القادم</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* --- Mobile Tab Bar --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950/95 backdrop-blur-xl border-t border-white/10 px-8 py-5 flex justify-around items-center z-[100] shadow-2xl">
        <button onClick={() => setActiveView('record')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeView === 'record' ? 'text-blue-500' : 'text-slate-500'}`}><LayoutDashboard size={24} /><span className="text-[10px] font-black">الجدول</span></button>
        <button onClick={() => setActiveView('notes')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeView === 'notes' ? 'text-blue-500' : 'text-slate-500'}`}><MessageSquare size={24} /><span className="text-[10px] font-black">السجل</span></button>
        <button onClick={() => setActiveView('settings')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeView === 'settings' ? 'text-blue-500' : 'text-slate-500'}`}><SettingsIcon size={24} /><span className="text-[10px] font-black">الإعدادات</span></button>
      </nav>

      {/* --- Modal: Postpone (Reschedule) --- */}
      {postponeModalRow && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 text-right animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
              <button onClick={() => setPostponeModalRow(null)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400"><X size={24} /></button>
              <h3 className="text-xl font-black">تأجيل حصة {postponeModalRow.gradeSection}</h3>
            </div>
            <div className="p-10 space-y-8">
              <p className="text-sm text-slate-400 font-bold">لماذا تعذر إتمام هذه الحصة في وقتها المبرمج؟</p>
              <div className="grid grid-cols-1 gap-4">
                {(Object.keys(REASONS_MAP) as PostponeReason[]).map((r) => (
                  <button key={r} onClick={() => setTempReasonType(r)} className={`w-full p-5 rounded-2xl text-md font-black border-2 transition-all text-right flex items-center justify-between ${tempReasonType === r ? 'bg-blue-600 border-blue-400 shadow-xl shadow-blue-600/20' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                    <span>{REASONS_MAP[r]}</span>
                    {tempReasonType === r && <CheckCircle size={24} />}
                  </button>
                ))}
              </div>
              {tempReasonType === 'other' && (
                <div className="mt-4 animate-in slide-in-from-top-4 duration-300">
                   <ModernField label="اكتب السبب بوضوح" icon={PenTool} value={tempOtherText} onChange={setTempOtherText} color={currentTheme.primary} />
                </div>
              )}
              <div className="flex gap-4 mt-10">
                 <button onClick={confirmPostpone} className="flex-1 py-5 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-md uppercase shadow-xl shadow-blue-600/30 transition-transform active:scale-95">تأكيد التأجيل</button>
                 <button onClick={() => setPostponeModalRow(null)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-md uppercase transition-colors">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal: Full Record Card --- */}
      {selectedRow && (
        <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col animate-in fade-in duration-300">
          <header className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900 shadow-2xl">
             <div className="flex items-center gap-6">
                <button onClick={() => setSelectedRow(null)} className="p-3 hover:bg-white/10 rounded-2xl text-slate-400 transition-colors"><X size={32} /></button>
                <div className="text-right">
                   <h3 className="text-lg font-black text-white">{selectedRow.learnings}</h3>
                   <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest">السنة {selectedRow.gradeSection} • الميدان {selectedRow.field}</p>
                </div>
             </div>
             <div className="flex gap-3">
                <button onClick={() => setViewPdf(false)} className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${!viewPdf ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-white/5 text-slate-400 hover:text-white'}`}>البيانات الرقمية</button>
                <button onClick={() => setViewPdf(true)} className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${viewPdf ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-white/5 text-slate-400 hover:text-white'}`}>نسخة المذكرة الأصلية</button>
             </div>
          </header>
          
          <main className="flex-1 bg-slate-950 overflow-y-auto pattern-grid">
             {!viewPdf ? (
               <div className="max-w-6xl mx-auto p-6 md:p-16 text-right">
                  <div className="bg-white text-slate-900 p-12 md:p-20 rounded-lg shadow-[0_50px_100px_rgba(0,0,0,0.3)] border-t-[12px] border-blue-600 space-y-16 relative overflow-hidden">
                     {/* Watermark/Background Decoration */}
                     <div className="absolute top-10 left-10 opacity-[0.03] pointer-events-none rotate-12"><AppIcon size={400} /></div>
                     
                     <div className="flex justify-between items-start border-b-2 border-slate-100 pb-12 relative">
                        <div className="text-xs font-black space-y-1 text-slate-500 uppercase">
                           <p>الميدان: <span className="text-slate-900">{selectedRow.field}</span></p>
                           <p>المستوى: <span className="text-slate-900">السنة {selectedRow.gradeSection}</span></p>
                        </div>
                        <div className="text-center">
                           <h2 className="text-4xl font-black mb-2 text-slate-900 tracking-tight">بطاقة إعداد الحصة</h2>
                           <p className="text-sm font-bold text-blue-600">التربية البدنية والرياضية - الطور الابتدائي</p>
                        </div>
                        <div className="text-xs font-black space-y-1 text-slate-500 text-left uppercase">
                           <p>الأستاذ: <span className="text-slate-900">{teacherInfo.name}</span></p>
                           <p>المؤسسة: <span className="text-slate-900">{teacherInfo.school}</span></p>
                        </div>
                     </div>
                     
                     <div className="bg-blue-50/80 p-6 rounded-3xl border-2 border-blue-100 flex items-center justify-between shadow-sm relative">
                        <div className="flex items-center gap-4">
                          <Tag size={28} className="text-blue-600" />
                          <span className="text-xl font-black text-blue-900 uppercase">نوع الحصة / الموضوع المبرمج:</span>
                        </div>
                        <span className="text-2xl font-black text-blue-700 underline underline-offset-8 decoration-4 decoration-blue-200">{selectedRow.topic}</span>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                           <h4 className="text-sm font-black text-blue-700 uppercase flex items-center gap-2"><Target size={18}/> المورد المعرفي المبرمج:</h4>
                           <p className="text-2xl leading-snug bg-slate-50 p-8 border-r-8 border-blue-600 rounded-lg font-bold shadow-sm">{selectedRow.learnings}</p>
                        </div>
                        <div className="space-y-4">
                           <h4 className="text-sm font-black text-teal-700 uppercase flex items-center gap-2"><BookOpen size={18}/> محتوى التعلم المنجز:</h4>
                           <p className="text-2xl leading-snug bg-slate-50 p-8 border-r-8 border-teal-600 rounded-lg font-bold shadow-sm">{selectedRow.content}</p>
                        </div>
                     </div>
                     
                     <div className="space-y-6">
                        <h4 className="text-sm font-black text-emerald-700 uppercase flex items-center gap-2"><PenTool size={18}/> محتوى الإنجاز (المواقف التعليمية):</h4>
                        <div className="bg-emerald-50/50 p-10 border-r-8 border-emerald-600 rounded-lg shadow-sm">
                           <p className="text-xl leading-loose whitespace-pre-wrap font-bold text-slate-800">{selectedRow.teachingSituation || "يتم تنفيذ مسارات تعليمية تركز على المهارات الأساسية وتناسب الفئة العمرية."}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t-2 border-slate-100 pt-12">
                        <div className="space-y-4">
                           <h4 className="text-sm font-black text-amber-700 uppercase flex items-center gap-2"><Wrench size={18}/> الوسائل البيداغوجية:</h4>
                           <p className="text-lg font-black italic text-slate-700 bg-amber-50 p-4 rounded-xl border border-amber-100">{selectedRow.tools || "سلم أرضي، شواخص، أقماع، كرات، حلقات."}</p>
                        </div>
                        <div className="flex items-end justify-between px-4 pb-4 border-b-2 border-slate-200">
                           <div className="text-center">
                              <p className="text-[10px] font-black text-slate-400 mb-8 uppercase">ختم السيد المدير</p>
                              <div className="w-24 h-24 border-2 border-dashed border-slate-200 rounded-full mx-auto"></div>
                           </div>
                           <div className="text-center">
                              <p className="text-[10px] font-black text-slate-400 mb-8 uppercase">تأشيرة السيد المفتش</p>
                              <div className="w-24 h-24 border-2 border-dashed border-slate-200 rounded-full mx-auto"></div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center p-10">
                  {selectedRow.pdfUrl && selectedRow.pdfUrl !== "#" ? (
                    <iframe src={`${selectedRow.pdfUrl}#toolbar=0`} className="w-full h-full border-none max-w-6xl rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-white" title="PDF Lesson View" />
                  ) : (
                    <div className="text-center space-y-10 max-w-xl animate-in zoom-in-90 duration-500">
                       <div className="w-32 h-32 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto ring-8 ring-blue-600/5">
                          <AlertCircle size={64} className="text-blue-500" />
                       </div>
                       <div>
                          <p className="text-3xl font-black text-white mb-4">ملف PDF غير مرتبط</p>
                          <p className="text-slate-400 text-lg leading-relaxed">لم يتم رفع المذكرة الورقية الأصلية لهذا الدرس بعد. يمكنك الاعتماد حالياً على البيانات الرقمية الكاملة الموضحة في التبويب السابق.</p>
                       </div>
                       <button onClick={() => setViewPdf(false)} className="px-12 py-5 bg-blue-600 rounded-2xl text-md font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 active:scale-95">الرجوع للبيانات الرقمية</button>
                    </div>
                  )}
               </div>
             )}
          </main>
        </div>
      )}
    </div>
  );
}
