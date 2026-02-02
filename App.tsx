
import React, { useState, useEffect, useMemo } from 'react';
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
  ClipboardList
} from 'lucide-react';
import { DailyRecordRow, TeacherInfo, WeeklySlot, PostponeReason, PostponedSession } from './types';
import { WEEKLY_SCHEDULE, FIELD_NAME, ALL_LESSONS } from './constants';
import { formatDate, getDayName, getLessonForSlot } from './utils';

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

// Fix: Expanded GlassPanel props type to include 'key' so TypeScript doesn't complain when it's passed in a .map() function.
const GlassPanel = ({ children, className = "" }: { children?: React.ReactNode, className?: string, key?: React.Key }) => (
  <div className={`bg-white/5 border border-white/10 rounded-[2rem] p-6 ${className}`}>{children}</div>
);

const IconButton = ({ icon: Icon, onClick, active = false, label = "", color }: { icon: React.ElementType, onClick: () => void, active?: boolean, label?: string, color: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 w-full p-4 rounded-xl transition-colors ${active ? 'bg-white/10 border border-white/20' : 'text-slate-400 hover:bg-white/5'}`}
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
      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none text-sm text-white focus:border-blue-500"
    />
  </div>
);

export default function App() {
  const [activeView, setActiveView] = useState<'record' | 'settings' | 'distribution' | 'notes'>('record');
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<DailyRecordRow | null>(null);
  const [viewPdf, setViewPdf] = useState(false);
  
  // سبب التأجيل الحالي الذي يتم اختياره
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

  const handlePostponeClick = (row: DailyRecordRow) => {
    const key = `${row.date}_${row.gradeSection.replace(' (', '_').replace(')', '')}_${row.time}`;
    if (meetingsState[key] === 'incomplete') {
      // إذا كانت بالفعل مؤجلة، نقوم بإلغاء التأجيل
      setMeetingsState(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setPostponedSessions(prev => prev.filter(s => s.key !== key));
    } else {
      // إظهار نافذة اختيار السبب
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
    setPostponeModalRow(null);
  };

  const changeDay = (offset: number) => {
    const d = new Date(targetDate);
    d.setDate(d.getDate() + offset);
    setTargetDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-slate-900" style={{ color: '#fff' }}>
      
      {/* Sidebar */}
      <nav className="hidden md:flex flex-col w-72 bg-slate-950/50 border-l border-white/10 p-6 z-50">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 rounded-xl bg-blue-600"><LayoutDashboard className="text-white" size={24} /></div>
          <div><h1 className="text-lg font-bold text-white">الدفتر الذكي</h1><p className="text-[9px] opacity-50 uppercase">نظام إدارة التربية البدنية</p></div>
        </div>
        <div className="flex-1 space-y-2">
          <IconButton icon={FileText} label="جدول اليوم" active={activeView === 'record'} onClick={() => setActiveView('record')} color={currentTheme.primary} />
          <IconButton icon={MessageSquare} label="الملاحظات" active={activeView === 'notes'} onClick={() => setActiveView('notes')} color={currentTheme.primary} />
          <IconButton icon={List} label="توزيع الحصص" active={activeView === 'distribution'} onClick={() => setActiveView('distribution')} color={currentTheme.primary} />
          <IconButton icon={SettingsIcon} label="الإعدادات" active={activeView === 'settings'} onClick={() => setActiveView('settings')} color={currentTheme.primary} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10 space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-slate-800 border border-white/10">
              <User size={24} style={{ color: currentTheme.primary }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{teacherInfo.name}</h2>
              <p className="text-slate-400 text-xs">{teacherInfo.school}</p>
            </div>
          </div>
          
          {/* Day Navigation (only in record view) */}
          {activeView === 'record' && (
            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
              <button onClick={() => changeDay(-1)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400" title="اليوم السابق"><ChevronRight size={24} /></button>
              <div className="text-center min-w-[150px]">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{getDayName(new Date(targetDate))}</p>
                <p className="text-sm font-bold">{formatDate(new Date(targetDate))}</p>
              </div>
              <button onClick={() => changeDay(1)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400" title="اليوم التالي"><ChevronLeft size={24} /></button>
            </div>
          )}
        </header>

        <div>
          {activeView === 'settings' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassPanel className="p-8 space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2"><SettingsIcon size={20} /> الإعدادات العامة</h3>
                <div className="space-y-4">
                  <ModernField label="تاريخ بداية الفصل" type="date" icon={Calendar} value={semesterStart} onChange={setSemesterStart} color={currentTheme.primary} />
                  <ModernField label="تاريخ معاينة الدفتر" type="date" icon={Clock} value={targetDate} onChange={setTargetDate} color={currentTheme.primary} />
                </div>
              </GlassPanel>
              <GlassPanel className="p-8 space-y-6 lg:col-span-2">
                <h3 className="text-lg font-bold flex items-center gap-2"><User size={20} /> المعلومات المهنية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <ModernField label="اسم الأستاذ" icon={User} value={teacherInfo.name} onChange={(v) => setTeacherInfo({...teacherInfo, name: v})} color={currentTheme.primary} />
                  <ModernField label="المدرسة" icon={School} value={teacherInfo.school} onChange={(v) => setTeacherInfo({...teacherInfo, school: v})} color={currentTheme.primary} />
                  <ModernField label="المفتش" icon={CheckCircle} value={teacherInfo.inspector} onChange={(v) => setTeacherInfo({...teacherInfo, inspector: v})} color={currentTheme.primary} />
                  <ModernField label="المدير" icon={GraduationCap} value={teacherInfo.manager} onChange={(v) => setTeacherInfo({...teacherInfo, manager: v})} color={currentTheme.primary} />
                </div>
              </GlassPanel>
            </div>
          ) : activeView === 'notes' ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-black text-white flex items-center gap-3"><History className="text-blue-500" /> سجل الملاحظات والحصص المؤجلة</h3>
                <div className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-xs font-bold border border-blue-600/20">
                  إجمالي المؤجلات: {postponedSessions.length}
                </div>
              </div>

              {postponedSessions.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {postponedSessions.map((ps, idx) => (
                    <GlassPanel key={idx} className="flex flex-col md:flex-row items-center gap-6 border-r-4 border-r-red-500">
                      <div className="flex-1 text-right">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 mb-1">
                          <Calendar size={12} /> {ps.date} | <School size={12} /> القسم: {ps.gradeSection}
                        </div>
                        <h4 className="text-lg font-bold">سبب التأجيل: <span className="text-red-400">{ps.reason}</span></h4>
                      </div>
                      <div className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-bold uppercase border border-red-500/20">
                        حصة غير مكتملة
                      </div>
                    </GlassPanel>
                  ))}
                </div>
              ) : (
                <div className="py-32 text-center opacity-20">
                  <ClipboardList size={64} className="mx-auto mb-4" />
                  <p className="text-xl font-bold">لا توجد ملاحظات أو حصص مؤجلة حالياً</p>
                </div>
              )}
            </div>
          ) : activeView === 'distribution' ? (
            <GlassPanel className="p-8">
               <h3 className="text-lg font-bold mb-6">جدول توزيع الحصص الأسبوعي</h3>
               <div className="overflow-x-auto text-right">
                 <table className="w-full text-sm">
                   <thead><tr className="border-b border-white/10 text-slate-500 font-bold"><th className="py-4">اليوم</th><th>التوقيت</th><th>المستوى</th><th>الفوج</th></tr></thead>
                   <tbody>
                     {WEEKLY_SCHEDULE.map((slot, i) => (
                       <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                         <td className="py-4">{slot.dayName}</td>
                         <td className="font-mono text-blue-400">{slot.time}</td>
                         <td>السنة {slot.grade} ابتدائي</td>
                         <td>({slot.section})</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </GlassPanel>
          ) : (
            <div className="space-y-4">
              {rows.length > 0 ? rows.map((row, idx) => (
                <div key={idx} className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all ${row.isIncomplete ? 'border-red-500/50 bg-red-500/10' : ''}`}>
                  <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 py-3 rounded-xl bg-slate-900 border border-white/10 text-center text-[10px] font-bold text-blue-400">
                      {row.time}
                    </div>
                    
                    <div className="flex-1 text-right">
                      <div className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                        <PenTool size={10} /> {row.field} | السنة {row.gradeSection}
                      </div>
                      <h4 className="text-lg font-bold text-white">{row.learnings}</h4>
                      
                      {/* محتوى التعلم بارز تحت العنوان */}
                      <div className="mt-3 p-3 bg-teal-500/10 border-r-2 border-teal-500 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen size={14} className="text-teal-400" />
                          <span className="text-[10px] font-bold text-teal-400 uppercase">محتوى التعلم:</span>
                        </div>
                        <p className="text-sm font-semibold text-teal-50/90 leading-relaxed">{row.content}</p>
                      </div>

                      {/* ملصق الحصة غير المكتملة وسببها */}
                      {row.isIncomplete && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-lg shadow-lg text-xs font-bold animate-pulse">
                            <AlertCircle size={14} /> لم تكتمل الحصة
                          </div>
                          {postponedSessions.find(s => s.key === `${row.date}_${row.gradeSection.replace(' (', '_').replace(')', '')}_${row.time}`)?.reason && (
                             <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-slate-300 rounded-lg text-xs font-bold border border-white/10">
                               <MessageSquare size={12} /> {postponedSessions.find(s => s.key === `${row.date}_${row.gradeSection.replace(' (', '_').replace(')', '')}_${row.time}`)?.reason}
                             </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                       <button 
                        onClick={() => handlePostponeClick(row)}
                        className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-1 ${row.isIncomplete ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-white/5 border-white/10 text-slate-500 hover:text-green-500'}`}
                        title={row.isIncomplete ? "سحب حالة عدم الإتمام" : "تأجيل الحصة وتحديد السبب"}
                       >
                         {row.isIncomplete ? <XCircle size={24} /> : <CheckCircle size={24} />}
                         <span className="text-[8px] font-bold uppercase">{row.isIncomplete ? 'مؤجلة' : 'تمت'}</span>
                       </button>

                       <button 
                        onClick={() => setExpandedRowIndex(expandedRowIndex === idx ? null : idx)}
                        className="p-2 text-slate-500 hover:text-white"
                       >
                         <ChevronDown size={24} className={`transition-transform ${expandedRowIndex === idx ? 'rotate-180' : ''}`} />
                       </button>
                    </div>
                  </div>

                  {expandedRowIndex === idx && (
                    <div className="bg-white/[0.03] border-t border-white/10 p-6 space-y-6">
                      <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                        <span className="text-[10px] text-emerald-400 font-bold block mb-1">شرح الموقف التعليمي</span>
                        <p className="text-sm leading-relaxed">{row.teachingSituation || "يتم اتباع التدرج السنوي للمكتسبات."}</p>
                      </div>
                      <button 
                        onClick={() => { setSelectedRow(row); setViewPdf(false); }}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors"
                      >
                        فتح البطاقة الكاملة <ExternalLink size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )) : (
                <div className="py-24 text-center opacity-30">
                  <Calendar size={48} className="mx-auto mb-4" />
                  <p className="text-lg font-bold">لا توجد حصص مبرمجة اليوم</p>
                  <button onClick={() => changeDay(1)} className="mt-4 text-xs font-bold underline">الانتقال لليوم التالي</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950 border-t border-white/10 px-8 py-4 flex justify-around items-center z-50">
        <button onClick={() => setActiveView('record')} className={`flex flex-col items-center gap-1 ${activeView === 'record' ? 'text-blue-500' : 'text-slate-500'}`}><LayoutDashboard size={20} /><span className="text-[9px] font-bold">الجدول</span></button>
        <button onClick={() => setActiveView('notes')} className={`flex flex-col items-center gap-1 ${activeView === 'notes' ? 'text-blue-500' : 'text-slate-500'}`}><MessageSquare size={20} /><span className="text-[9px] font-bold">ملاحظات</span></button>
        <button onClick={() => changeDay(-1)} className="text-slate-500"><ChevronRight size={24} /></button>
        <button onClick={() => changeDay(1)} className="text-slate-500"><ChevronLeft size={24} /></button>
        <button onClick={() => setActiveView('settings')} className={`flex flex-col items-center gap-1 ${activeView === 'settings' ? 'text-blue-500' : 'text-slate-500'}`}><SettingsIcon size={20} /><span className="text-[9px] font-bold">إعدادات</span></button>
      </nav>

      {/* Postpone Reason Modal */}
      {postponeModalRow && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 text-right">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <button onClick={() => setPostponeModalRow(null)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400"><X size={24} /></button>
              <h3 className="text-lg font-bold">تأجيل حصة {postponeModalRow.gradeSection}</h3>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-sm text-slate-400">يرجى تحديد سبب عدم إتمام الحصة لهذا اليوم:</p>
              <div className="grid grid-cols-1 gap-3">
                {(Object.keys(REASONS_MAP) as PostponeReason[]).map((r) => (
                  <button 
                    key={r}
                    onClick={() => setTempReasonType(r)}
                    className={`w-full p-4 rounded-xl text-sm font-bold border transition-all text-right flex items-center justify-between ${tempReasonType === r ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                  >
                    <span>{REASONS_MAP[r]}</span>
                    {tempReasonType === r && <CheckCircle size={18} />}
                  </button>
                ))}
              </div>

              {tempReasonType === 'other' && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                   <ModernField label="اكتب السبب هنا" icon={PenTool} value={tempOtherText} onChange={setTempOtherText} color={currentTheme.primary} />
                </div>
              )}

              <div className="flex gap-4 mt-8">
                 <button onClick={confirmPostpone} className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-sm uppercase">تأكيد التأجيل</button>
                 <button onClick={() => setPostponeModalRow(null)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm uppercase">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Record Modal */}
      {selectedRow && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col">
          <header className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900">
             <div className="flex items-center gap-4">
                <button onClick={() => setSelectedRow(null)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400"><X size={24} /></button>
                <div className="text-right">
                   <h3 className="text-sm font-bold">المذكرة: {selectedRow.learnings}</h3>
                   <p className="text-[10px] text-slate-500">السنة {selectedRow.gradeSection} | {selectedRow.time}</p>
                </div>
             </div>
             <div className="flex gap-2">
                <button onClick={() => setViewPdf(false)} className={`px-4 py-2 rounded-lg text-[10px] font-bold ${!viewPdf ? 'bg-blue-600' : 'bg-slate-700'}`}>البيانات</button>
                <button onClick={() => setViewPdf(true)} className={`px-4 py-2 rounded-lg text-[10px] font-bold ${viewPdf ? 'bg-blue-600' : 'bg-slate-700'}`}>نسخة PDF</button>
             </div>
          </header>
          
          <main className="flex-1 bg-slate-900 overflow-y-auto">
             {viewPdf ? (
               <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  {(selectedRow.pdfUrl && selectedRow.pdfUrl !== "#") ? (
                    <iframe src={`${selectedRow.pdfUrl}#toolbar=0`} className="w-full h-full border-none max-w-5xl rounded-lg shadow-2xl bg-white" title="PDF" />
                  ) : (
                    <div className="text-center space-y-6 max-w-md">
                       <AlertCircle size={60} className="text-blue-500 mx-auto" />
                       <p className="text-lg font-bold">لم يتم ربط ملف PDF لهذه الحصة بعد</p>
                       <button onClick={() => setViewPdf(false)} className="px-6 py-3 bg-blue-600 rounded-xl text-xs font-bold w-full">عرض التفاصيل النصية</button>
                    </div>
                  )}
               </div>
             ) : (
               <div className="max-w-5xl mx-auto p-6 md:p-12 text-right">
                  <div className="bg-white text-slate-900 p-8 rounded-sm shadow-2xl border-t-8 border-blue-600 space-y-10">
                     <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                        <div className="text-xs font-bold">
                           <p>الميدان: {selectedRow.field}</p>
                           <p>المستوى: السنة {selectedRow.gradeSection}</p>
                        </div>
                        <h2 className="text-2xl font-black">مذكرة حصة التربية البدنية</h2>
                        <div className="text-xs font-bold text-left">
                           <p>الأستاذ: {teacherInfo.name}</p>
                           <p>المؤسسة: {teacherInfo.school}</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                           <h4 className="text-sm font-black text-blue-700">المورد المعرفي المبرمج:</h4>
                           <p className="text-lg leading-relaxed bg-slate-50 p-4 border-r-4 border-blue-600">{selectedRow.learnings}</p>
                        </div>
                        <div className="space-y-3">
                           <h4 className="text-sm font-black text-teal-700">محتوى التعلم:</h4>
                           <p className="text-lg leading-relaxed bg-slate-50 p-4 border-r-4 border-teal-600">{selectedRow.content}</p>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h4 className="text-sm font-black text-emerald-700">محتوى الإنجاز (المواقف التعليمية):</h4>
                        <div className="bg-emerald-50 p-6 border-r-4 border-emerald-600">
                           <p className="text-lg leading-loose whitespace-pre-wrap">{selectedRow.teachingSituation}</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-10 border-t border-slate-100 pt-8">
                        <div className="space-y-3">
                           <h4 className="text-sm font-black text-amber-700">الوسائل البيداغوجية:</h4>
                           <p className="text-md font-bold italic">{selectedRow.tools || "سلم، أقماع، صحون، كرات."}</p>
                        </div>
                     </div>
                  </div>
               </div>
             )}
          </main>
        </div>
      )}

    </div>
  );
}
