
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
  ChevronDown,
  ExternalLink,
  FileSearch
} from 'lucide-react';
import { DailyRecordRow, TeacherInfo, WeeklySlot } from './types';
import { WEEKLY_SCHEDULE, FIELD_NAME, ALL_LESSONS } from './constants';
import { formatDate, getDayName, getLessonForSlot } from './utils';

const THEMES = {
  ocean: {
    name: "محيط عميق",
    primary: "#2563eb",
    accent: "#06b6d4",
    bg: "#0f172a",
    gradient: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)"
  },
  emerald: {
    name: "غابة الزمرد",
    primary: "#10b981",
    accent: "#84cc16",
    bg: "#061f1a",
    gradient: "linear-gradient(180deg, #061f1a 0%, #064e3b 100%)"
  },
  royal: {
    name: "بنفسجي ملكي",
    primary: "#8b5cf6",
    accent: "#ec4899",
    bg: "#1e1b4b",
    gradient: "linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)"
  },
  sunset: {
    name: "غسق دافئ",
    primary: "#f43f5e",
    accent: "#f59e0b",
    bg: "#1a0f0f",
    gradient: "linear-gradient(180deg, #1a0f0f 0%, #450a0a 100%)"
  }
};

type ThemeKey = keyof typeof THEMES;

const GlassPanel = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <div className={`bg-white/5 border border-white/10 rounded-[2rem] p-6 ${className}`}>
    {children}
  </div>
);

const IconButton = ({ icon: Icon, onClick, active = false, label = "", color }: { icon: React.ElementType, onClick: () => void, active?: boolean, label?: string, color: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 w-full p-4 rounded-xl ${
      active ? 'bg-white/10 border border-white/20' : 'text-slate-400 hover:bg-white/5'
    }`}
    style={active ? { borderColor: `${color}55`, color: color } : {}}
  >
    <Icon size={20} />
    <span className="text-sm font-bold">{label}</span>
  </button>
);

const ModernField = ({ label, icon: Icon, value, onChange, type = "text", color }: { label: string, icon: React.ElementType, value: string, onChange: (v: string) => void, type?: string, color: string }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[10px] font-black text-slate-500 mr-2 flex items-center gap-2 uppercase">
      <Icon size={12} style={{ color }} />
      {label}
    </label>
    <input 
      type={type}
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none text-sm text-white focus:border-blue-500"
    />
  </div>
);

export default function App() {
  const [activeView, setActiveView] = useState<'record' | 'settings' | 'distribution'>('record');
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [showSemesterFAB, setShowSemesterFAB] = useState(false);
  const [selectedRow, setSelectedRow] = useState<DailyRecordRow | null>(null);
  const [viewPdf, setViewPdf] = useState(false);
  
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
    localStorage.setItem('semester_start', semesterStart);
    localStorage.setItem('teacher_info', JSON.stringify(teacherInfo));
    localStorage.setItem('app_theme', themeKey);
    
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
        pdfUrl: lesson.pdfUrl,
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-slate-900" style={{ color: '#fff' }}>
      
      {/* Semester Start FAB */}
      <button
        onClick={() => setShowSemesterFAB(!showSemesterFAB)}
        className="fixed bottom-24 right-8 z-[60] w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl md:bottom-12 md:right-12"
        style={{ backgroundColor: currentTheme.primary }}
      >
        <Calendar size={24} />
      </button>

      {showSemesterFAB && (
        <div className="fixed bottom-40 right-8 z-[60] bg-slate-800 p-6 rounded-2xl w-72 border border-white/10 shadow-2xl md:bottom-28 md:right-12">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-white flex items-center gap-2">
              <Target size={14} style={{ color: currentTheme.primary }} /> تاريخ الانطلاق
            </h4>
            <input 
              type="date" 
              value={semesterStart} 
              onChange={(e) => setSemesterStart(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg p-2 text-white outline-none"
            />
            <button 
              onClick={() => setShowSemesterFAB(false)}
              className="w-full py-2 rounded-lg font-bold text-xs uppercase bg-blue-600"
            >
              حفظ
            </button>
          </div>
        </div>
      )}
      
      {/* Sidebar */}
      <nav className="hidden md:flex flex-col w-72 bg-slate-950/50 border-l border-white/10 p-6 z-50">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 rounded-xl bg-blue-600"><LayoutDashboard className="text-white" size={24} /></div>
          <div><h1 className="text-lg font-bold text-white">الدفتر الذكي</h1><p className="text-[9px] opacity-50 uppercase">Smart School Admin</p></div>
        </div>
        <div className="flex-1 space-y-2">
          <IconButton icon={FileText} label="جدول اليوم" active={activeView === 'record'} onClick={() => setActiveView('record')} color={currentTheme.primary} />
          <IconButton icon={List} label="توزيع الحصص" active={activeView === 'distribution'} onClick={() => setActiveView('distribution')} color={currentTheme.primary} />
          <IconButton icon={SettingsIcon} label="الإعدادات" active={activeView === 'settings'} onClick={() => setActiveView('settings')} color={currentTheme.primary} />
        </div>
        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="p-4 bg-white/5 rounded-xl text-center"><p className="text-[10px] text-slate-500 mb-1">الجمهورية الجزائرية</p><p className="text-xs font-bold">وزارة التربية الوطنية</p></div>
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
              <h2 className="text-xl font-bold text-white">الأستاذ: {teacherInfo.name}</h2>
              <p className="text-slate-400 text-xs">{teacherInfo.school}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold bg-white/5 px-4 py-2 rounded-lg">
            <Clock size={14} className="text-blue-500" />
            <span>{getDayName(new Date(targetDate))}، {formatDate(new Date(targetDate))}</span>
          </div>
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

              <GlassPanel className="p-8 space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2"><Palette size={20} /> المظهر</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
                    <button 
                      key={key} 
                      onClick={() => setThemeKey(key)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${themeKey === key ? 'bg-white/10 border-white/40' : 'bg-white/5 border-white/5'}`}
                    >
                      <div className="w-8 h-8 rounded-full" style={{ background: THEMES[key].primary }}></div>
                      <span className="text-[10px] font-bold">{THEMES[key].name}</span>
                    </button>
                  ))}
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
          ) : activeView === 'distribution' ? (
            <GlassPanel className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <h3 className="text-lg font-bold">جدول توزيع الحصص</h3>
                <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-white/5">
                  {['all', '1', '2', '3', '4', '5'].map(g => (
                    <button 
                      key={g} 
                      onClick={() => setGradeFilter(g)} 
                      className={`px-4 py-1.5 rounded-md text-[10px] font-bold ${gradeFilter === g ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                    >
                      {g === 'all' ? 'الكل' : `السنة ${g}`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead><tr className="border-b border-white/10 text-slate-500"><th className="py-4 px-2">اليوم</th><th className="py-4 px-2">التوقيت</th><th className="py-4 px-2">المستوى</th><th className="py-4 px-2">الفوج</th></tr></thead>
                  <tbody>
                    {distributionSlots.map((slot, idx) => (
                      <tr key={idx} className="border-b border-white/5">
                        <td className="py-4 px-2 font-bold">{slot.dayName}</td>
                        <td className="py-4 px-2 font-mono text-blue-400">{slot.time}</td>
                        <td className="py-4 px-2">السنة {slot.grade} ابتدائي</td>
                        <td className="py-4 px-2"><span className="px-3 py-1 bg-white/5 rounded-lg border border-white/5">({slot.section})</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassPanel>
          ) : (
            <div className="space-y-4">
              {rows.length > 0 ? rows.map((row, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div 
                    onClick={() => setExpandedRowIndex(expandedRowIndex === idx ? null : idx)}
                    className="p-6 flex flex-col md:flex-row items-center gap-6 cursor-pointer hover:bg-white/[0.02]"
                  >
                    <div className="w-24 py-3 rounded-xl bg-slate-900 border border-white/10 text-center text-[10px] font-bold text-blue-400">
                      {row.time}
                    </div>
                    <div className="flex-1 text-right">
                      <div className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                        <PenTool size={10} /> {row.field} | السنة {row.gradeSection}
                      </div>
                      <h4 className="text-lg font-bold text-white">{row.learnings}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1">{row.content}</p>
                    </div>
                    <ChevronDown size={20} className={`text-slate-500 transition-transform ${expandedRowIndex === idx ? 'rotate-180' : ''}`} />
                  </div>
                  {expandedRowIndex === idx && (
                    <div className="bg-white/[0.03] border-t border-white/10 p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                          <span className="text-[10px] text-blue-400 font-bold block mb-1">المورد المعرفي</span>
                          <p className="text-sm font-bold">{row.learnings}</p>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                          <span className="text-[10px] text-teal-400 font-bold block mb-1">محتوى التعلم</span>
                          <p className="text-sm">{row.content}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedRow(row)}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2"
                      >
                        فتح البطاقة الكاملة (المذكرة الأصلية) <ExternalLink size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )) : (
                <div className="py-24 text-center opacity-30">
                  <Calendar size={48} className="mx-auto mb-4" />
                  <p className="text-lg font-bold">لا توجد حصص مجدولة</p>
                  <button onClick={goToNextDay} className="mt-4 text-xs font-bold underline">عرض اليوم التالي</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950 border-t border-white/10 px-8 py-4 flex justify-around items-center z-50">
        <button onClick={() => setActiveView('record')} className={`flex flex-col items-center gap-1 ${activeView === 'record' ? 'text-blue-500' : 'text-slate-500'}`}><LayoutDashboard size={20} /><span className="text-[9px] font-bold">الجدول</span></button>
        <button onClick={() => setActiveView('distribution')} className={`flex flex-col items-center gap-1 ${activeView === 'distribution' ? 'text-blue-500' : 'text-slate-500'}`}><List size={20} /><span className="text-[9px] font-bold">الخطة</span></button>
        <button onClick={() => setActiveView('settings')} className={`flex flex-col items-center gap-1 ${activeView === 'settings' ? 'text-blue-500' : 'text-slate-500'}`}><SettingsIcon size={20} /><span className="text-[9px] font-bold">الإعدادات</span></button>
      </nav>

      {/* Full Record Modal - PDF Viewer */}
      {selectedRow && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col">
          <header className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900">
             <div className="flex items-center gap-4">
                <button onClick={() => setSelectedRow(null)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400"><X size={24} /></button>
                <div>
                   <h3 className="text-sm font-bold">المذكرة الأصلية: {selectedRow.learnings}</h3>
                   <p className="text-[10px] text-slate-500">السنة {selectedRow.gradeSection} | {selectedRow.time}</p>
                </div>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => setViewPdf(!viewPdf)} 
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2 ${!viewPdf ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  <FileText size={14} /> تفاصيل البطاقة
                </button>
                <button 
                   onClick={() => setViewPdf(!viewPdf)} 
                   className={`px-4 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2 ${viewPdf ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  <FileSearch size={14} /> عرض المذكرة الأصلية
                </button>
             </div>
          </header>
          
          <main className="flex-1 bg-slate-900 overflow-y-auto">
             {viewPdf ? (
               <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  {selectedRow.pdfUrl ? (
                    <iframe 
                      src={`${selectedRow.pdfUrl}#toolbar=0`} 
                      className="w-full h-full border-none max-w-5xl rounded-lg shadow-2xl"
                      title="PDF Viewer"
                    />
                  ) : (
                    <div className="text-center space-y-4 opacity-50">
                       <FileSearch size={64} className="mx-auto" />
                       <p className="text-lg font-bold">عذراً، لم يتم ربط ملف PDF لهذه المذكرة بعد.</p>
                       <p className="text-sm">سيتم عرض المذكرة الأصلية بمجرد توفر الملف.</p>
                       <button onClick={() => setViewPdf(false)} className="px-6 py-2 bg-white/10 rounded-lg text-xs font-bold">العودة لعرض البيانات</button>
                    </div>
                  )}
               </div>
             ) : (
               <div className="max-w-4xl mx-auto p-10 space-y-12 text-right">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <span className="text-xs font-bold text-blue-400">المورد المعرفي المبرمج</span>
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-xl font-bold">{selectedRow.learnings}</div>
                     </div>
                     <div className="space-y-2">
                        <span className="text-xs font-bold text-teal-400">محتوى التعلم</span>
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-xl font-bold">{selectedRow.content}</div>
                     </div>
                     <div className="md:col-span-2 space-y-2">
                        <span className="text-xs font-bold text-emerald-400">توجيهات الموقف التعليمي</span>
                        <div className="p-8 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-lg leading-relaxed">{selectedRow.teachingSituation || "يتم اتباع التدرج السنوي للمكتسبات."}</div>
                     </div>
                     <div className="md:col-span-2 space-y-2">
                        <span className="text-xs font-bold text-amber-400">الوسائل البيداغوجية المستعملة</span>
                        <div className="p-6 bg-amber-950/20 border border-amber-500/20 rounded-2xl text-lg font-bold italic">{selectedRow.tools || "أقماع، كرات، حلقات."}</div>
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
