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
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  XCircle,
  MessageSquare,
  History,
  ClipboardList,
  Download,
  Upload,
  Database,
  Tag,
  Info,
  Code,
  Award,
  Sun,
  Moon,
  Check,
  Sparkles,
  Monitor,
  Printer,
  ZoomIn,
  ZoomOut,
  PieChart as PieChartIcon,
  TrendingUp,
  CheckCircle2,
  ChevronUp,
  BarChart3,
  Percent,
  Activity
} from 'lucide-react';
import { DailyRecordRow, TeacherInfo, WeeklySlot, PostponeReason, PostponedSession, TermKey } from './types';
import { WEEKLY_SCHEDULE, FIELD_NAME, ALL_LESSONS, TERMS, DEFAULT_TERM } from './constants';
import { formatDate, getDayName, getLessonForSlot, getTimeSortValue } from './utils';

// --- Custom App Icon Component (Signature Style) ---
const AppIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
    </defs>
    <rect x="20" y="15" width="60" height="75" rx="8" fill="#1e293b" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
    <rect x="32" y="35" width="36" height="3" rx="1.5" fill="white" fillOpacity="0.1" />
    <rect x="32" y="45" width="28" height="3" rx="1.5" fill="white" fillOpacity="0.1" />
    <rect x="32" y="55" width="32" height="3" rx="1.5" fill="white" fillOpacity="0.1" />
    <rect x="35" y="8" width="30" height="12" rx="4" fill="url(#iconGrad)" />
    <circle cx="50" cy="14" r="2" fill="white" />
    <g filter="drop-shadow(0 4px 8px rgba(0,0,0,0.4))">
      <path d="M78 58C78 51.3726 72.6274 46 66 46C59.3726 46 54 51.3726 54 58C54 64.6274 59.3726 70 66 70H83C85.7614 70 88 67.7614 88 65V61C88 59.3431 86.6569 58 85 58H78Z" fill="url(#iconGrad)" />
      <rect x="72" y="51" width="10" height="3" rx="1.5" fill="#ea580c" />
      <circle cx="66" cy="58" r="4" fill="#9a3412" />
    </g>
  </svg>
);

type NotificationType = 'success' | 'error' | 'info' | 'warning';
interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  title: string;
}

interface ThemeDef {
  id: string;
  name: string;
  description: string;
  primary: string;
  bg: string;
  isLight: boolean;
  accent: string;
  badge: string;
}

const THEMES: Record<string, ThemeDef> = {
  white: { 
    id: "white",
    name: "ثيم أبيض (نهاري)", 
    description: "واجهة بيضاء ناصعة ومريحة للقراءة والطباعة النهارية", 
    primary: "#2563eb", 
    bg: "#f8fafc", 
    isLight: true,
    accent: "#f97316",
    badge: "فاتح نهاري"
  },
  black: { 
    id: "black",
    name: "ثيم أسود (داكن نقي)", 
    description: "واجهة سوداء داكنة وعميقة وموفرة للطاقة", 
    primary: "#38bdf8", 
    bg: "#000000", 
    isLight: false,
    accent: "#f97316",
    badge: "داكن نقي"
  },
  ocean: { 
    id: "ocean",
    name: "محيط أزرق (كحلي)", 
    description: "السمة الكلاسيكية الزرقاء الداكنة", 
    primary: "#3b82f6", 
    bg: "#0f172a", 
    isLight: false,
    accent: "#f97316",
    badge: "كلاسيكي"
  },
  emerald: { 
    id: "emerald",
    name: "غابة الزمرد (أخضر)", 
    description: "سمة خضراء زمردية هادئة تعزز التركيز", 
    primary: "#10b981", 
    bg: "#061f1a", 
    isLight: false,
    accent: "#14b8a6",
    badge: "طبيعي"
  },
  royal: { 
    id: "royal",
    name: "بنفسجي ملكي", 
    description: "سمة ملكية فخمة بألوان البنفسج الراقية", 
    primary: "#8b5cf6", 
    bg: "#1e1b4b", 
    isLight: false,
    accent: "#a855f7",
    badge: "ملكي"
  },
  sunset: { 
    id: "sunset",
    name: "غسق دافئ", 
    description: "سمة بلون الغسق الدافئ مع لمسات برتقالية", 
    primary: "#f43f5e", 
    bg: "#1a0f0f", 
    isLight: false,
    accent: "#fb923c",
    badge: "دافئ"
  }
};

type ThemeKey = keyof typeof THEMES;

const REASONS_MAP: Record<PostponeReason, string> = {
  half_day: "نصف يوم تعليمي",
  arbitration: "طلب تحكيم",
  competition: "طلب منافسة رياضية",
  other: "سبب آخر"
};

const GlassPanel = ({ 
  children, 
  className = "", 
  id,
  isLight = false,
  isBlack = false
}: { 
  children?: React.ReactNode, 
  className?: string, 
  id?: string, 
  key?: React.Key,
  isLight?: boolean,
  isBlack?: boolean
}) => {
  const baseClasses = isLight 
    ? 'bg-white border border-slate-200/90 text-slate-800 shadow-md shadow-slate-200/40' 
    : isBlack 
      ? 'bg-[#0c0c0e] border border-zinc-800 text-white shadow-2xl'
      : 'bg-white/5 border border-white/10 text-white shadow-xl backdrop-blur-sm';

  return (
    <div id={id} className={`${baseClasses} rounded-[2rem] p-6 transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};

const IconButton = ({ 
  icon: Icon, 
  onClick, 
  active = false, 
  label = "", 
  color,
  isLight = false,
  isBlack = false
}: { 
  icon: React.ElementType, 
  onClick: () => void, 
  active?: boolean, 
  label?: string, 
  color: string,
  isLight?: boolean,
  isBlack?: boolean
}) => {
  let styleClasses = '';
  if (active) {
    styleClasses = isLight 
      ? 'bg-blue-50/90 border-2 font-black shadow-sm' 
      : isBlack
        ? 'bg-zinc-900 border border-zinc-700 font-black shadow-lg'
        : 'bg-white/10 border border-white/20 font-black';
  } else {
    styleClasses = isLight
      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      : 'text-slate-400 hover:bg-white/5';
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 w-full p-4 rounded-xl transition-all duration-300 ${styleClasses}`}
      style={active ? { borderColor: isLight ? `${color}` : `${color}77`, color: color } : {}}
    >
      <Icon size={20} />
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
};

const ModernField = ({ 
  label, 
  icon: Icon, 
  value, 
  onChange, 
  type = "text", 
  color,
  isLight = false,
  isBlack = false
}: { 
  label: string, 
  icon: React.ElementType, 
  value: string, 
  onChange: (v: string) => void, 
  type?: string, 
  color: string,
  isLight?: boolean,
  isBlack?: boolean
}) => (
  <div className="flex flex-col gap-2 w-full">
    <label className={`text-[11px] font-black mr-2 flex items-center gap-2 uppercase ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
      <Icon size={13} style={{ color }} /> {label}
    </label>
    <input 
      type={type} 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-5 py-4 rounded-xl outline-none text-sm font-bold transition-all ${
        isLight 
          ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 shadow-sm'
          : isBlack
            ? 'bg-zinc-900/90 border border-zinc-700 text-white focus:border-sky-400 focus:bg-zinc-800'
            : 'bg-white/5 border border-white/10 text-white focus:border-blue-500 focus:bg-white/[0.08]'
      }`}
    />
  </div>
);

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

// --- Interactive SVG Donut Pie Chart Component ---
interface DonutPieChartProps {
  completed: number;
  postponed: number;
  size?: number;
  isLight?: boolean;
  isBlack?: boolean;
}

const DonutPieChart = ({
  completed,
  postponed,
  size = 170,
  isLight = false,
  isBlack = false
}: DonutPieChartProps) => {
  const [hoveredSlice, setHoveredSlice] = useState<'completed' | 'postponed' | null>(null);
  const total = completed + postponed;
  const completedRate = total > 0 ? (completed / total) * 100 : 0;
  const postponedRate = total > 0 ? (postponed / total) * 100 : 0;

  const cx = 85;
  const cy = 85;
  const outerR = 68;
  const innerR = 46;

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  const describeDonutSlice = (startAngle: number, endAngle: number, expand: boolean) => {
    const rOut = expand ? outerR + 4 : outerR;
    const rIn = expand ? innerR - 2 : innerR;
    const span = endAngle - startAngle;
    if (span <= 0) return '';
    const adjustedEnd = span >= 359.99 ? startAngle + 359.99 : endAngle;
    const p1 = polarToCartesian(cx, cy, rOut, startAngle);
    const p2 = polarToCartesian(cx, cy, rOut, adjustedEnd);
    const p3 = polarToCartesian(cx, cy, rIn, adjustedEnd);
    const p4 = polarToCartesian(cx, cy, rIn, startAngle);
    const largeArc = adjustedEnd - startAngle > 180 ? 1 : 0;

    return [
      `M ${p1.x} ${p1.y}`,
      `A ${rOut} ${rOut} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${rIn} ${rIn} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
      'Z'
    ].join(' ');
  };

  const gap = total > 1 && completed > 0 && postponed > 0 ? 3 : 0;
  const completedAngle = total > 0 ? (completed / total) * 360 : 0;

  const completedPath = completed > 0
    ? describeDonutSlice(
        gap / 2,
        postponed > 0 ? completedAngle - gap / 2 : 360,
        hoveredSlice === 'completed'
      )
    : '';

  const postponedPath = postponed > 0
    ? describeDonutSlice(
        completed > 0 ? completedAngle + gap / 2 : 0,
        completed > 0 ? 360 - gap / 2 : 360,
        hoveredSlice === 'postponed'
      )
    : '';

  const roundedRate = Math.round(completedRate);

  return (
    <div className="relative flex flex-col items-center select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 170 170"
        className="transition-transform duration-300 drop-shadow-lg overflow-visible"
      >
        <defs>
          <linearGradient id="compGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="postGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id="glowComp" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.5" />
          </filter>
          <filter id="glowPost" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#ef4444" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Empty track */}
        <circle
          cx={cx}
          cy={cy}
          r={(outerR + innerR) / 2}
          fill="none"
          stroke={isLight ? '#e2e8f0' : isBlack ? '#1e1e24' : 'rgba(255, 255, 255, 0.08)'}
          strokeWidth={outerR - innerR}
        />

        {total === 0 && (
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fill={isLight ? '#94a3b8' : '#64748b'}
            className="text-[11px] font-bold"
          >
            لا توجد حصص
          </text>
        )}

        {/* Completed Slice */}
        {completedPath && (
          <path
            d={completedPath}
            fill="url(#compGrad)"
            filter={hoveredSlice === 'completed' ? 'url(#glowComp)' : undefined}
            className="transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredSlice('completed')}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            <title>{`دروس منجزة: ${completed} (${completedRate.toFixed(1)}%)`}</title>
          </path>
        )}

        {/* Postponed Slice */}
        {postponedPath && (
          <path
            d={postponedPath}
            fill="url(#postGrad)"
            filter={hoveredSlice === 'postponed' ? 'url(#glowPost)' : undefined}
            className="transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredSlice('postponed')}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            <title>{`دروس مؤجلة: ${postponed} (${postponedRate.toFixed(1)}%)`}</title>
          </path>
        )}

        {/* Center Label */}
        {total > 0 && (
          <g className="pointer-events-none">
            <text
              x={cx}
              y={cy - 2}
              textAnchor="middle"
              className={`font-black ${isLight ? 'fill-slate-900' : 'fill-white'}`}
              style={{ fontSize: roundedRate === 100 ? '24px' : '26px', fontFamily: "'Cairo', sans-serif" }}
            >
              {hoveredSlice === 'completed' 
                ? `${completed}` 
                : hoveredSlice === 'postponed' 
                  ? `${postponed}` 
                  : `${roundedRate}%`}
            </text>
            <text
              x={cx}
              y={cy + 16}
              textAnchor="middle"
              className="text-[9px] font-black fill-slate-400"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              {hoveredSlice === 'completed' 
                ? 'دروس منجزة' 
                : hoveredSlice === 'postponed' 
                  ? 'دروس مؤجلة' 
                  : 'نسبة الإنجاز'}
            </text>
          </g>
        )}
      </svg>

      {/* Dynamic hover badge */}
      {hoveredSlice && (
        <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black shadow-lg transition-all animate-in fade-in zoom-in-95 ${
          hoveredSlice === 'completed' 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        }`}>
          {hoveredSlice === 'completed'
            ? `المنجزة: ${completed} (${completedRate.toFixed(0)}%)`
            : `المؤجلة: ${postponed} (${postponedRate.toFixed(0)}%)`}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [activeView, setActiveView] = useState<'record' | 'desktop' | 'settings' | 'distribution' | 'notes'>('record');
  const [desktopSubView, setDesktopSubView] = useState<'sheet' | 'dashboard'>('sheet');
  const [sheetZoom, setSheetZoom] = useState<number>(100);
  const [showSignatureNames, setShowSignatureNames] = useState<boolean>(true);
  const [academicYear, setAcademicYear] = useState<string>("2025 / 2026");
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printBlobUrl, setPrintBlobUrl] = useState<string | null>(null);
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<DailyRecordRow | null>(null);
  const [viewPdf, setViewPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [dashboardScope, setDashboardScope] = useState<'week' | 'today'>('week');
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('dashboard_open');
    return saved !== null ? saved === 'true' : true;
  });

  const [postponeModalRow, setPostponeModalRow] = useState<DailyRecordRow | null>(null);
  const [tempReasonType, setTempReasonType] = useState<PostponeReason>('half_day');
  const [tempOtherText, setTempOtherText] = useState('');

  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    const saved = localStorage.getItem('app_theme');
    if (saved && saved in THEMES) return saved as ThemeKey;
    return 'ocean';
  });

  const currentTheme = THEMES[themeKey] || THEMES.ocean;
  const isLight = currentTheme.isLight;
  const isBlack = currentTheme.id === 'black';

  const [selectedTerm, setSelectedTerm] = useState<TermKey>(() => {
    const saved = localStorage.getItem('selected_term');
    if (saved && (saved === '1' || saved === '2' || saved === '3')) return saved as TermKey;
    return DEFAULT_TERM;
  });

  const currentTermConfig = TERMS[selectedTerm] || TERMS['1'];
  const currentFieldName = currentTermConfig.fieldName;

  const [semesterStart, setSemesterStart] = useState<string>(() => localStorage.getItem('semester_start') || "2026-01-04");
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Default teacher name is "الزايز محمد الطاهر", and default school is "ابتدائية العربي بني"
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo>(() => {
    const saved = localStorage.getItem('teacher_info');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.name || parsed.name === "الأستاذ الفاضل") {
          parsed.name = "الزايز محمد الطاهر";
        }
        if (!parsed.school || parsed.school.includes("بن مهيدي") || parsed.school.trim() === "") {
          parsed.school = "ابتدائية العربي بني";
        }
        return parsed;
      } catch {
        // fallback
      }
    }
    return { 
      name: "الزايز محمد الطاهر", 
      school: "ابتدائية العربي بني", 
      inspector: "السيد المفتش", 
      manager: "السيد المدير" 
    };
  });

  const [meetingsState, setMeetingsState] = useState<Record<string, 'completed' | 'incomplete'>>(() => {
    const saved = localStorage.getItem('meetings_state');
    return saved ? JSON.parse(saved) : {};
  });

  // Automatically normalize any previous "تعليمة نصف يوم" to "نصف يوم تعليمي"
  const [postponedSessions, setPostponedSessions] = useState<PostponedSession[]>(() => {
    const saved = localStorage.getItem('postponed_sessions');
    if (!saved) return [];
    try {
      const list = JSON.parse(saved);
      return list.map((item: PostponedSession) => ({
        ...item,
        reason: item.reason === "تعليمة نصف يوم" ? "نصف يوم تعليمي" : item.reason
      }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.classList.add('hidden');
        setTimeout(() => { if (splash) splash.style.display = 'none'; }, 800);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('selected_term', selectedTerm);
    localStorage.setItem('semester_start', semesterStart);
    localStorage.setItem('teacher_info', JSON.stringify(teacherInfo));
    localStorage.setItem('app_theme', themeKey);
    localStorage.setItem('meetings_state', JSON.stringify(meetingsState));
    localStorage.setItem('postponed_sessions', JSON.stringify(postponedSessions));
    localStorage.setItem('dashboard_open', String(isDashboardOpen));

    document.body.style.backgroundColor = currentTheme.bg;
    if (currentTheme.isLight) {
      document.body.classList.add('light-mode');
      document.body.classList.remove('black-mode');
    } else if (currentTheme.id === 'black') {
      document.body.classList.add('black-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.remove('light-mode');
      document.body.classList.remove('black-mode');
    }
  }, [semesterStart, teacherInfo, themeKey, currentTheme, meetingsState, postponedSessions, selectedTerm]);

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
      .sort((a, b) => getTimeSortValue(a.time) - getTimeSortValue(b.time));

    return slotsToday.map((slot): DailyRecordRow & { isIncomplete: boolean } => {
      const { lesson, isIncomplete } = getLessonForSlot(slot, startDate, dateObj, meetingsState, selectedTerm);
      return {
        date: formatDate(dateObj),
        day: getDayName(dateObj),
        time: slot.time,
        gradeSection: `${slot.grade} (${slot.section})`,
        field: currentFieldName,
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
  }, [targetDate, semesterStart, meetingsState, selectedTerm, currentFieldName]);

  // --- Weekly & Today Statistics for Dashboard & Pie Chart ---
  const weekStats = useMemo(() => {
    const current = new Date(targetDate);
    const day = current.getDay(); // 0 is Sunday
    const sunday = new Date(current);
    sunday.setDate(current.getDate() - day);
    sunday.setHours(0, 0, 0, 0);

    const thursday = new Date(sunday);
    thursday.setDate(sunday.getDate() + 4);

    // School days with classes: Sunday (0), Monday (1), Wednesday (3), Thursday (4)
    const schoolDays = [0, 1, 3, 4].map(dayIdx => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + dayIdx);
      const dateFormatted = formatDate(d);
      const dayName = getDayName(d);
      const dateISO = d.toISOString().split('T')[0];

      const daySlots = WEEKLY_SCHEDULE
        .filter(s => s.dayIndex === dayIdx)
        .sort((a, b) => getTimeSortValue(a.time) - getTimeSortValue(b.time));
      const slotsWithStatus = daySlots.map(s => {
        const key = `${dateFormatted}_${s.grade}_${s.section}_${s.time}`;
        const isIncomplete = meetingsState[key] === 'incomplete';
        return {
          slot: s,
          key,
          isIncomplete,
          dateFormatted
        };
      });

      const total = slotsWithStatus.length;
      const postponed = slotsWithStatus.filter(s => s.isIncomplete).length;
      const completed = Math.max(0, total - postponed);
      const isSelected = targetDate === dateISO;

      return {
        dayIdx,
        dayName,
        date: d,
        dateFormatted,
        dateISO,
        slots: slotsWithStatus,
        total,
        completed,
        postponed,
        isSelected
      };
    });

    const totalSlots = schoolDays.reduce((acc, d) => acc + d.total, 0);
    const totalPostponed = schoolDays.reduce((acc, d) => acc + d.postponed, 0);
    const totalCompleted = Math.max(0, totalSlots - totalPostponed);
    const rate = totalSlots > 0 ? Math.round((totalCompleted / totalSlots) * 100) : 100;

    return {
      sunday,
      thursday,
      sundayFormatted: formatDate(sunday),
      thursdayFormatted: formatDate(thursday),
      schoolDays,
      totalSlots,
      totalCompleted,
      totalPostponed,
      rate
    };
  }, [targetDate, meetingsState]);

  const todayStats = useMemo(() => {
    const total = rows.length;
    const postponed = rows.filter(r => r.isIncomplete).length;
    const completed = Math.max(0, total - postponed);
    const rate = total > 0 ? Math.round((completed / total) * 100) : 100;
    return {
      total,
      completed,
      postponed,
      rate
    };
  }, [rows]);

  const handleBackup = () => {
    try {
      const backupData = {
        version: "1.3",
        teacherInfo,
        meetingsState,
        postponedSessions,
        semesterStart,
        selectedTerm,
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
    } catch {
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
        if (data.postponedSessions) {
          // ensure reason normalization on restore
          const list = data.postponedSessions.map((item: PostponedSession) => ({
            ...item,
            reason: item.reason === "تعليمة نصف يوم" ? "نصف يوم تعليمي" : item.reason
          }));
          setPostponedSessions(list);
        }
        if (data.semesterStart) setSemesterStart(data.semesterStart);
        if (data.selectedTerm && (data.selectedTerm === '1' || data.selectedTerm === '2' || data.selectedTerm === '3')) {
          setSelectedTerm(data.selectedTerm);
        }
        if (data.appTheme && data.appTheme in THEMES) setThemeKey(data.appTheme);
        addNotification('success', 'استعادة البيانات', 'تمت مزامنة كافة الملاحظات والتأجيلات من الملف المرفوع.');
      } catch {
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
    addNotification('warning', 'حصة مؤجلة', `تم تسجيل عدم اكتمال حصة ${postponeModalRow.gradeSection} بسبب: ${reasonValue}.`);
    setPostponeModalRow(null);
  };

  const changeDay = (offset: number) => {
    const d = new Date(targetDate);
    d.setDate(d.getDate() + offset);
    setTargetDate(d.toISOString().split('T')[0]);
  };

  const generatePrintableHtml = () => {
    const sheetEl = document.getElementById('printable-daily-sheet');
    let sheetContent = sheetEl ? sheetEl.innerHTML : '';
    
    if (!sheetContent) {
      const rowsHtml = rows.map(r => `
        <tr style="border-bottom: 1px solid #000; min-height: 34px; ${r.isIncomplete ? 'background-color: #fee2e2;' : ''}">
          <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">${r.day}</td>
          <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold; direction: ltr;">${r.time}</td>
          <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">السنة ${r.gradeSection}</td>
          <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">${r.field}</td>
          <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold; text-align: right;">${r.learnings}</td>
          <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold; text-align: right;">${r.content}</td>
          <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold; color: ${r.isIncomplete ? '#b91c1c' : '#000'}; font-size: 11px;">
            ${r.isIncomplete ? `مؤجلة (${postponedSessions.find(p => p.date === r.date && p.gradeSection === r.gradeSection)?.reason || 'نصف يوم تعليمي'})` : ''}
          </td>
        </tr>
      `).join('');

      const emptyRows = Array.from({ length: Math.max(0, 24 - rows.length) }).map(() => `
        <tr style="border-bottom: 1px solid #000; height: 34px;">
          <td style="border: 1px solid #000;">&nbsp;</td>
          <td style="border: 1px solid #000;">&nbsp;</td>
          <td style="border: 1px solid #000;">&nbsp;</td>
          <td style="border: 1px solid #000;">&nbsp;</td>
          <td style="border: 1px solid #000;">&nbsp;</td>
          <td style="border: 1px solid #000;">&nbsp;</td>
          <td style="border: 1px solid #000;">&nbsp;</td>
        </tr>
      `).join('');

      sheetContent = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px;">
          <div style="text-align: right; font-weight: 900; font-size: 15px;">المؤسسة : ${teacherInfo.school}</div>
          <div style="text-align: center;">
            <div style="background: #000; color: #fff; padding: 6px 36px; border-radius: 9999px; font-weight: 900; font-size: 18px; display: inline-block;">الدفتر اليومي</div>
          </div>
          <div style="text-align: left; font-weight: 900; font-size: 15px;" dir="ltr">السنة الدراسية : ${academicYear}</div>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 12px; margin-top: 12px;">
          <thead>
            <tr style="border-bottom: 2px solid #000; background: #f8fafc; font-weight: 900;">
              <th style="border: 1px solid #000; padding: 6px; width: 9%;">اليوم</th>
              <th style="border: 1px solid #000; padding: 6px; width: 11%;">الساعة</th>
              <th style="border: 1px solid #000; padding: 6px; width: 10%;">القسم</th>
              <th style="border: 1px solid #000; padding: 6px; width: 12%;">الميدان</th>
              <th style="border: 1px solid #000; padding: 6px; width: 28%;">التعلمات</th>
              <th style="border: 1px solid #000; padding: 6px; width: 20%;">محتوى التعلم</th>
              <th style="border: 1px solid #000; padding: 6px; width: 10%;">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            ${emptyRows}
          </tbody>
        </table>
        <div style="display: flex; justify-content: space-between; margin-top: 30px; font-weight: 900; font-size: 14px;">
          <div>الأستاذ: ${showSignatureNames ? (teacherInfo.name || 'الزايز محمد الطاهر') : '..................................'}</div>
          <div>المفتش: ${showSignatureNames ? (teacherInfo.inspector || 'السيد المفتش') : '..................................'}</div>
          <div>المدير: ${showSignatureNames ? (teacherInfo.manager || 'السيد المدير') : '..................................'}</div>
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>الدفتر اليومي - ${teacherInfo.name || 'الزايز محمد الطاهر'} - ${targetDate}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 6mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif;
      direction: rtl;
      text-align: right;
      background: #ffffff;
      color: #000000;
      padding: 10px;
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-sheet {
      width: 100%;
      max-width: 850px;
      margin: 0 auto;
      background: #ffffff;
      color: #000000;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 1080px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 2px solid #000000;
      text-align: center;
      font-size: 12px;
      margin-top: 10px;
    }
    th, td {
      border: 1px solid #000000;
      padding: 4px 4px;
      vertical-align: middle;
    }
    th {
      font-weight: 900;
      background-color: #f8fafc;
    }
    .action-bar-top {
      position: fixed;
      top: 15px;
      left: 15px;
      z-index: 1000;
      display: flex;
      gap: 10px;
      background: rgba(15, 23, 42, 0.85);
      padding: 8px 14px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      backdrop-filter: blur(8px);
    }
    .btn-print {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      font-family: 'Cairo', sans-serif;
    }
    @media print {
      .action-bar-top {
        display: none !important;
      }
      body {
        padding: 0 !important;
      }
      .print-sheet {
        min-height: auto !important;
        max-width: 100% !important;
      }
    }
  </style>
  <script>
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        try {
          window.print();
        } catch(e) {}
      }, 500);
    });
  </script>
</head>
<body>
  <div class="action-bar-top">
    <button class="btn-print" onclick="window.print()">🖨️ طباعة الآن (A4)</button>
  </div>
  <div class="print-sheet">
    ${sheetContent}
  </div>
</body>
</html>`;
  };

  const handleDownloadPrintFile = () => {
    try {
      const html = generatePrintableHtml();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `الدفتر_اليومي_${targetDate}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      addNotification('success', 'تم تحميل ورقة الكراس', 'تم تنزيل ملف A4 للطباعة. افتحه في المتصفح وسيتم إطلاق أمر الطباعة مباشرة.');
    } catch {
      addNotification('error', 'فشل التحميل', 'تعذر تجهيز ملف الطباعة.');
    }
  };

  const handlePrintSheet = () => {
    try {
      // Ensure we switch to desktop sheet view so the DOM is ready
      setActiveView('desktop');
      setDesktopSubView('sheet');

      const html = generatePrintableHtml();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      setPrintBlobUrl(url);

      // Open print assistant modal so the user gets immediate visual feedback and a guaranteed 1-click fallback
      setShowPrintModal(true);

      // Attempt direct window.print()
      try {
        window.print();
      } catch (err) {
        console.warn("Direct window.print() failed:", err);
      }

      // Also attempt iframe printing
      try {
        let iframe = document.getElementById('print-virtual-iframe') as HTMLIFrameElement;
        if (iframe) {
          iframe.remove();
        }
        iframe = document.createElement('iframe');
        iframe.id = 'print-virtual-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        iframe.src = url;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            } catch (e) {
              console.warn("Iframe print blocked:", e);
            }
          }, 300);
        };
      } catch (err) {
        console.warn("Could not append print iframe:", err);
      }

      addNotification('info', 'طباعة الكراس', 'تم تجهيز ورقة الكراس وفتح خيارات الطباعة A4 بنجاح.');
    } catch {
      addNotification('error', 'خطأ في الطباعة', 'تعذر تجهيز أمر الطباعة.');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row overflow-hidden transition-colors duration-400 ${
      isLight ? 'bg-slate-100 text-slate-800' : isBlack ? 'bg-black text-white' : 'bg-slate-900 text-white'
    }`}>
      
      {/* --- Notification Overlays --- */}
      <div className="fixed top-8 right-8 z-[999] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="pointer-events-auto">
            <Toast notification={n} onClose={removeNotification} />
          </div>
        ))}
      </div>

      {/* --- Sidebar (Navigation) --- */}
      <nav className={`hidden md:flex flex-col w-72 p-6 z-50 transition-colors duration-300 ${
        isLight 
          ? 'bg-white border-l border-slate-200 shadow-sm' 
          : isBlack 
            ? 'bg-[#09090b] border-l border-zinc-800' 
            : 'bg-slate-950/50 border-l border-white/10'
      }`}>
        <div className="flex items-center gap-4 mb-12 group cursor-pointer">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-xl shadow-orange-600/20 ring-4 ring-orange-500/10 group-hover:scale-110 transition-transform duration-500">
            <AppIcon size={32} />
          </div>
          <div>
            <h1 className={`text-xl font-black tracking-tight group-hover:text-orange-500 transition-colors ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>الدفتر الذكي</h1>
            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Digital PE Office</p>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <IconButton icon={FileText} label="جدول اليوم" active={activeView === 'record'} onClick={() => setActiveView('record')} color={currentTheme.primary} isLight={isLight} isBlack={isBlack} />
          
          {/* الكمبيوتر with sub-options */}
          <div className="space-y-1">
            <IconButton 
              icon={Monitor} 
              label="الكمبيوتر" 
              active={activeView === 'desktop'} 
              onClick={() => {
                setActiveView('desktop');
              }} 
              color={currentTheme.primary} 
              isLight={isLight} 
              isBlack={isBlack} 
            />
            
            {/* Sub-menu options under الكمبيوتر */}
            <div className="mr-5 pr-3 border-r-2 border-slate-200/60 dark:border-white/10 space-y-1 my-1">
              <button
                onClick={() => {
                  setActiveView('desktop');
                  setDesktopSubView('sheet');
                }}
                className={`flex items-center gap-2.5 w-full py-2 px-3 rounded-xl text-xs font-black transition-all ${
                  activeView === 'desktop' && desktopSubView === 'sheet'
                    ? 'bg-blue-500/15 text-blue-500 font-black shadow-sm'
                    : isLight ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <FileText size={15} />
                <span>عرض الكراس اليومي</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('desktop');
                  setDesktopSubView('dashboard');
                }}
                className={`flex items-center justify-between w-full py-2 px-3 rounded-xl text-xs font-black transition-all ${
                  activeView === 'desktop' && desktopSubView === 'dashboard'
                    ? 'bg-blue-500/15 text-blue-500 font-black shadow-sm'
                    : isLight ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BarChart3 size={15} />
                  <span>لوحة متابعة الإنجاز والدروس</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-black">
                  {weekStats.rate}%
                </span>
              </button>
            </div>
          </div>

          <IconButton icon={MessageSquare} label="الملاحظات" active={activeView === 'notes'} onClick={() => setActiveView('notes')} color={currentTheme.primary} isLight={isLight} isBlack={isBlack} />
          <IconButton icon={List} label="توزيع الحصص" active={activeView === 'distribution'} onClick={() => setActiveView('distribution')} color={currentTheme.primary} isLight={isLight} isBlack={isBlack} />
          <IconButton icon={SettingsIcon} label="الإعدادات والثيمات" active={activeView === 'settings'} onClick={() => setActiveView('settings')} color={currentTheme.primary} isLight={isLight} isBlack={isBlack} />
        </div>
        
        {/* --- Signature Footer --- */}
        <div className={`mt-auto pt-6 border-t space-y-4 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
           <div className={`p-4 rounded-2xl border transition-all ${
             isLight 
               ? 'bg-slate-50 border-slate-200 hover:border-orange-400/50' 
               : 'bg-white/5 border-white/5 hover:border-orange-500/30'
           }`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-black">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">أستاذ المادة</p>
                  <p className={`text-[12px] font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {teacherInfo.name || "الزايز محمد الطاهر"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold border-t pt-2 mt-2 border-slate-200/50">
                 <Code size={10} className="text-blue-500" /> <span>تصميم وبرمجة: الزايز محمد الطاهر</span>
              </div>
           </div>
        </div>
      </nav>

      {/* --- Main Dashboard Area --- */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10 space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg group hover:border-orange-500/50 transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-white/10'
            }`}>
              <AppIcon size={40} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {teacherInfo.name || "الزايز محمد الطاهر"}
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-black border border-orange-500/20">
                  أستاذ ت.ب.ر
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${
                  isLight 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : isBlack
                      ? 'bg-zinc-900 border-zinc-700 text-sky-400'
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }`}>
                  {currentTermConfig.name} • {currentTermConfig.shortFieldName}
                </span>
              </div>
              <p className={`text-sm flex items-center gap-1.5 mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <School size={14} className="text-orange-500" /> {teacherInfo.school}
              </p>
            </div>
          </div>
          
          {(activeView === 'record' || activeView === 'desktop') && (
            <div className={`flex items-center gap-2 p-1.5 rounded-2xl border shadow-inner ${
              isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-white/5 border-white/10'
            }`}>
              <button onClick={() => changeDay(-1)} className={`p-3 rounded-xl transition-colors ${
                isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-slate-400'
              }`} title="اليوم السابق">
                <ChevronRight size={24} />
              </button>
              <div className="text-center min-w-[160px] px-2">
                <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-0.5">{getDayName(new Date(targetDate))}</p>
                <p className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatDate(new Date(targetDate))}</p>
              </div>
              <button onClick={() => changeDay(1)} className={`p-3 rounded-xl transition-colors ${
                isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-slate-400'
              }`} title="اليوم التالي">
                <ChevronLeft size={24} />
              </button>
            </div>
          )}
        </header>

        <div className="pb-28">
          {activeView === 'settings' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Profile Card showing current teacher name */}
              <GlassPanel isLight={isLight} isBlack={isBlack} className="p-8 border-t-4 border-t-orange-500 lg:col-span-2 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-orange-500/5 to-transparent">
                 <div className={`w-24 h-24 rounded-3xl ${isLight ? 'bg-orange-50 border-2 border-orange-200' : 'bg-slate-800 border-2 border-orange-500/20'} flex items-center justify-center shadow-2xl relative group overflow-hidden`}>
                    <div className="absolute inset-0 bg-orange-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <AppIcon size={56} />
                 </div>
                 <div className="flex-1 text-center md:text-right">
                    <h3 className={`text-3xl font-black mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {teacherInfo.name || "الزايز محمد الطاهر"}
                    </h3>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                       <span className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs font-black text-blue-500 flex items-center gap-2">
                         <Award size={14} /> أستاذ التربية البدنية والرياضية
                       </span>
                       <span className="px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs font-black text-orange-500 flex items-center gap-2">
                         <Palette size={14} /> مصمم ومطور النظام: الزايز محمد الطاهر
                       </span>
                    </div>
                    <p className={`text-sm mt-6 leading-relaxed font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      تم ضبط وتخصيص هذا الدفتر اليومي الرقمي للأستاذ <strong className={isLight ? 'text-blue-700' : 'text-blue-400'}>{teacherInfo.name || "الزايز محمد الطاهر"}</strong> في {teacherInfo.school}. يتم تحديث الاسم وبيانات الإشراف تلقائياً في كافة مذكرات وبطاقات الدفتر اليومي.
                    </p>
                 </div>
              </GlassPanel>

              {/* NEW & PROMINENT: Theme Selection Card (ثيم أبيض و أسود) */}
              <GlassPanel isLight={isLight} isBlack={isBlack} className="p-8 space-y-6 lg:col-span-2 border-t-4 border-t-blue-500">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className={`text-2xl font-black flex items-center gap-3 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                      <Palette size={26} /> ثيمات ومظهر التطبيق (ثيم أبيض وأسود)
                    </h3>
                    <p className={`text-xs mt-1 font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      اختر المظهر المفضل: ثيم أبيض نهاري ناصع ومريح للقراءة والطباعة، أو ثيم أسود داكن نقي وفخم، أو السمات الملونة.
                    </p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-xl text-xs font-black border flex items-center gap-2 ${
                    isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}>
                    <Sparkles size={14} /> المظهر المفعّل: {currentTheme.name}
                  </span>
                </div>

                {/* Primary Dual Selector: White Theme vs Black Theme */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {/* White Theme Card */}
                  <button
                    onClick={() => {
                      setThemeKey('white');
                      addNotification('info', 'تغيير المظهر', 'تم تفعيل ثيم أبيض (النهاري الناصع) بنجاح');
                    }}
                    className={`p-6 rounded-2xl border-2 text-right transition-all flex items-start gap-5 relative overflow-hidden group ${
                      themeKey === 'white'
                        ? 'border-blue-600 bg-blue-50/80 shadow-xl shadow-blue-500/15 ring-4 ring-blue-500/15'
                        : isLight
                          ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-300 shadow-md flex items-center justify-center shrink-0">
                      <Sun className="text-amber-500 group-hover:rotate-45 transition-transform duration-500" size={32} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>ثيم أبيض (نهاري ناصع)</span>
                        {themeKey === 'white' && (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-black flex items-center gap-1 shadow-sm">
                            <Check size={12} /> مفعّل حالياً
                          </span>
                        )}
                      </div>
                      <p className={`text-xs leading-relaxed font-bold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        خلفية بيضاء نقية مع نصوص سوداء واضحة جداً، مريح للعين في النهار ومناسب للمطالعة والطباعة.
                      </p>
                      <div className="flex items-center gap-2 mt-4">
                        <span className="w-4 h-4 rounded-full bg-white border border-slate-300 shadow-inner"></span>
                        <span className="w-4 h-4 rounded-full bg-blue-600"></span>
                        <span className="w-4 h-4 rounded-full bg-slate-900"></span>
                        <span className="text-[10px] font-bold text-slate-400 mr-2">أبيض ناصع • تباين عالٍ</span>
                      </div>
                    </div>
                  </button>

                  {/* Black Theme Card */}
                  <button
                    onClick={() => {
                      setThemeKey('black');
                      addNotification('info', 'تغيير المظهر', 'تم تفعيل ثيم أسود (الداكن النقي) بنجاح');
                    }}
                    className={`p-6 rounded-2xl border-2 text-right transition-all flex items-start gap-5 relative overflow-hidden group ${
                      themeKey === 'black'
                        ? 'border-sky-500 bg-zinc-900 shadow-2xl shadow-sky-500/15 ring-4 ring-sky-500/15'
                        : isLight
                          ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-black border border-zinc-700 shadow-md flex items-center justify-center shrink-0">
                      <Moon className="text-sky-400 group-hover:-rotate-12 transition-transform duration-500" size={32} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>ثيم أسود (داكن نقي)</span>
                        {themeKey === 'black' && (
                          <span className="px-2.5 py-1 rounded-lg bg-sky-500 text-black text-[10px] font-black flex items-center gap-1 shadow-sm">
                            <Check size={12} /> مفعّل حالياً
                          </span>
                        )}
                      </div>
                      <p className={`text-xs leading-relaxed font-bold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        خلفية سوداء عميقة ناصعة السواد OLED مع عناصر رمادية راقية ولمسات زرقاء ساطعة.
                      </p>
                      <div className="flex items-center gap-2 mt-4">
                        <span className="w-4 h-4 rounded-full bg-black border border-zinc-700 shadow-inner"></span>
                        <span className="w-4 h-4 rounded-full bg-sky-400"></span>
                        <span className="w-4 h-4 rounded-full bg-zinc-800"></span>
                        <span className="text-[10px] font-bold text-slate-400 mr-2">أسود خالص • فخم وعصري</span>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Additional Vibrant Themes */}
                <div className="pt-2">
                  <p className={`text-xs font-black uppercase mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>سمات لونية إضافية:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(['ocean', 'emerald', 'royal', 'sunset'] as ThemeKey[]).map((key) => {
                      const theme = THEMES[key];
                      const isSelected = themeKey === key;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setThemeKey(key);
                            addNotification('info', 'تغيير المظهر', `تم تفعيل ${theme.name}`);
                          }}
                          className={`p-3.5 rounded-xl border transition-all text-right flex items-center gap-3 ${
                            isSelected
                              ? 'border-2 shadow-lg'
                              : isLight
                                ? 'border-slate-200 bg-slate-50 hover:bg-white'
                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                          style={isSelected ? { borderColor: theme.primary, backgroundColor: `${theme.primary}15` } : {}}
                        >
                          <div 
                            className="w-7 h-7 rounded-lg shrink-0 border border-white/20 shadow-sm"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <div className="overflow-hidden">
                            <p className={`text-xs font-black truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{theme.name}</p>
                            <p className="text-[9px] text-slate-500 truncate">{theme.badge}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </GlassPanel>

              {/* Official Professional Info (Teacher Name input) */}
              <GlassPanel isLight={isLight} isBlack={isBlack} className="p-8 space-y-8 lg:col-span-2 border-t-4 border-t-indigo-500">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-black flex items-center gap-3 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                    <User size={24} /> المعلومات المهنية الرسمية (اسم الأستاذ والمؤسسة)
                  </h3>
                  <span className="text-xs text-slate-500 font-bold">يتم اعتمادها فوراً في كافة وثائق الدفتر</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <ModernField 
                    label="اسم الأستاذ" 
                    icon={User} 
                    value={teacherInfo.name} 
                    onChange={(v) => setTeacherInfo({...teacherInfo, name: v})} 
                    color={currentTheme.primary} 
                    isLight={isLight} 
                    isBlack={isBlack} 
                  />
                  <ModernField 
                    label="المدرسة الابتدائية" 
                    icon={School} 
                    value={teacherInfo.school} 
                    onChange={(v) => setTeacherInfo({...teacherInfo, school: v})} 
                    color={currentTheme.primary} 
                    isLight={isLight} 
                    isBlack={isBlack} 
                  />
                  <ModernField 
                    label="السيد المفتش" 
                    icon={CheckCircle} 
                    value={teacherInfo.inspector} 
                    onChange={(v) => setTeacherInfo({...teacherInfo, inspector: v})} 
                    color={currentTheme.primary} 
                    isLight={isLight} 
                    isBlack={isBlack} 
                  />
                  <ModernField 
                    label="السيد المدير" 
                    icon={GraduationCap} 
                    value={teacherInfo.manager} 
                    onChange={(v) => setTeacherInfo({...teacherInfo, manager: v})} 
                    color={currentTheme.primary} 
                    isLight={isLight} 
                    isBlack={isBlack} 
                  />
                </div>
              </GlassPanel>

              {/* Time Configuration & Term Selection */}
              <GlassPanel isLight={isLight} isBlack={isBlack} className="p-8 space-y-8 border-t-4 border-t-blue-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className={`text-xl font-black flex items-center gap-3 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                    <Calendar size={24} /> الإعدادات الزمنية واختيار الفصل
                  </h3>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black border flex items-center gap-2 self-start sm:self-auto ${
                    isLight 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : isBlack 
                        ? 'bg-zinc-900 border-zinc-700 text-sky-400' 
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  }`}>
                    <Target size={14} /> الميدان النشط: {currentTermConfig.shortFieldName}
                  </span>
                </div>

                {/* Term / Field Selector */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      اختيار الفصل الدراسي
                    </label>
                    <span className={`text-[11px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      الميدان المعتمد أوتوماتيكياً: <strong className={isLight ? 'text-blue-700' : 'text-blue-400'}>{currentTermConfig.fieldName}</strong>
                    </span>
                  </div>

                  {/* Dropdown Menu (قائمة منسدلة لاختيار الفصل) */}
                  <div className="relative">
                    <select
                      value={selectedTerm}
                      onChange={(e) => {
                        const termKey = e.target.value as TermKey;
                        setSelectedTerm(termKey);
                        addNotification(
                          'success',
                          `تم تفعيل ${TERMS[termKey].name}`,
                          `الميدان المعتمد أوتوماتيكياً: «${TERMS[termKey].fieldName}»`
                        );
                      }}
                      className={`w-full py-4 pr-12 pl-12 rounded-2xl border text-sm font-black appearance-none cursor-pointer transition-all ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300 focus:bg-white focus:border-blue-500 shadow-sm'
                          : isBlack
                            ? 'bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700 focus:border-sky-500'
                            : 'bg-white/5 border-white/10 text-white hover:border-white/20 focus:border-blue-400'
                      }`}
                    >
                      <option value="1" className={isLight ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>
                        الفصل الأول — ميدان الوضعيات والتنقلات
                      </option>
                      <option value="2" className={isLight ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>
                        الفصل الثاني — ميدان الحركات القاعدية
                      </option>
                      <option value="3" className={isLight ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>
                        الفصل الثالث — ميدان الهيكلة والبناء
                      </option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500">
                      <Calendar size={20} />
                    </div>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={20} />
                    </div>
                  </div>

                  {/* Quick Select Buttons: الفصل الأول / الفصل الثاني / الفصل الثالث فقط */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    {(Object.keys(TERMS) as TermKey[]).map((termKey) => {
                      const term = TERMS[termKey];
                      const isSelected = selectedTerm === termKey;
                      return (
                        <button
                          key={termKey}
                          type="button"
                          onClick={() => {
                            setSelectedTerm(termKey);
                            addNotification(
                              'success',
                              `تم تفعيل ${term.name}`,
                              `الميدان المعتمد أوتوماتيكياً: «${term.fieldName}»`
                            );
                          }}
                          className={`py-3.5 px-3 rounded-2xl text-xs md:text-sm font-black transition-all duration-200 text-center cursor-pointer border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 ring-2 ring-blue-500/20'
                              : isLight
                                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                : isBlack
                                  ? 'bg-zinc-900 border-zinc-800 text-slate-300 hover:bg-zinc-800 hover:text-white'
                                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {term.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/60 dark:border-white/10">
                  <ModernField label="تاريخ بداية الفصل" type="date" icon={Calendar} value={semesterStart} onChange={setSemesterStart} color={currentTheme.primary} isLight={isLight} isBlack={isBlack} />
                  <ModernField label="تاريخ معاينة الدفتر" type="date" icon={Clock} value={targetDate} onChange={setTargetDate} color={currentTheme.primary} isLight={isLight} isBlack={isBlack} />
                </div>
              </GlassPanel>

              {/* Data Backup & Restore */}
              <GlassPanel isLight={isLight} isBlack={isBlack} className="p-8 space-y-8 border-t-4 border-t-orange-500">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-black flex items-center gap-3 ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>
                    <Database size={24} /> إدارة البيانات
                  </h3>
                  <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg"><Info size={18} /></div>
                </div>
                <div className="space-y-6">
                  <p className={`text-xs leading-relaxed font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    قم بتصدير مذكراتك وملاحظاتك المهنية لحفظها خارج التطبيق أو استعادتها عند تغيير المتصفح.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={handleBackup} className="flex items-center justify-center gap-3 py-5 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 group">
                      <Download size={20} className="group-hover:-translate-y-1 transition-transform" />
                      <span className="text-sm font-black">نسخ احتياطي</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className={`flex items-center justify-center gap-3 py-5 rounded-2xl border transition-all group ${
                      isLight 
                        ? 'bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-800' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                    }`}>
                      <Upload size={20} className="text-orange-500 group-hover:translate-y-1 transition-transform" />
                      <span className="text-sm font-black">استرجاع النسخة</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleRestore} className="hidden" accept=".json" />
                  </div>
                </div>
              </GlassPanel>

            </div>
          ) : activeView === 'notes' ? (
            <div className="space-y-8">
              <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 ${
                isLight ? 'border-slate-200' : 'border-white/10'
              }`}>
                <h3 className={`text-3xl font-black flex items-center gap-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <History className="text-blue-500" size={32} /> السجل والملاحظات
                </h3>
                <div className="px-5 py-2.5 bg-red-500/10 text-red-500 rounded-2xl text-xs font-black border border-red-500/20 shadow-lg shadow-red-500/5">
                  إجمالي الحصص المؤجلة: {postponedSessions.length}
                </div>
              </div>
              {postponedSessions.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {postponedSessions.map((ps, idx) => (
                    <GlassPanel key={idx} isLight={isLight} isBlack={isBlack} className="flex flex-col md:flex-row items-center gap-6 border-r-8 border-r-red-500 hover:bg-white/[0.08] transition-all group">
                      <div className="flex-1 text-right">
                        <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 mb-2">
                          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-slate-300'}`}>
                            <Calendar size={12} /> {ps.date}
                          </span>
                          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-slate-300'}`}>
                            <School size={12} /> القسم: {ps.gradeSection}
                          </span>
                        </div>
                        <h4 className={`text-xl font-black group-hover:text-red-500 transition-colors ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          سبب التأجيل: {ps.reason}
                        </h4>
                      </div>
                      <div className="px-6 py-3 bg-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/30">حصة غير مكتملة</div>
                    </GlassPanel>
                  ))}
                </div>
              ) : (
                <div className="py-40 text-center opacity-40">
                  <ClipboardList size={80} className={`mx-auto mb-6 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
                  <p className={`text-2xl font-black ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>لا توجد أي ملاحظات أو تأجيلات حالياً</p>
                  <p className={`text-sm mt-2 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>سجل اليومي سليم بنسبة 100%</p>
                </div>
              )}
            </div>
          ) : activeView === 'distribution' ? (
            <GlassPanel isLight={isLight} isBlack={isBlack} className="p-10 border-t-4 border-t-blue-500">
               <div className="flex items-center gap-4 mb-10">
                  <List className="text-blue-500" size={32} />
                  <h3 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>جدول توزيع الحصص الرسمي</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead>
                     <tr className={`border-b font-black ${isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-slate-400'}`}>
                       <th className="py-6 text-right px-4">اليوم</th>
                       <th className="text-right px-4">التوقيت</th>
                       <th className="text-right px-4">المستوى</th>
                       <th className="text-right px-4">الفوج</th>
                     </tr>
                   </thead>
                   <tbody>
                     {WEEKLY_SCHEDULE.map((slot, i) => (
                       <tr key={i} className={`border-b transition-colors group ${
                         isLight ? 'border-slate-100 hover:bg-slate-50' : 'border-white/5 hover:bg-white/5'
                       }`}>
                         <td className={`py-6 font-black px-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>{slot.dayName}</td>
                         <td className="font-mono text-blue-500 px-4 font-bold">{slot.time}</td>
                         <td className={`px-4 font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>السنة {slot.grade} ابتدائي</td>
                         <td className="px-4 font-black text-slate-500 group-hover:text-blue-500">({slot.section})</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </GlassPanel>
          ) : activeView === 'desktop' ? (
            /* Desktop / Computer View with Sub-options: Sheet or Dashboard */
            <div className="space-y-6">
              {/* Top Sub-Navigation Header under "الكمبيوتر" */}
              <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 no-print ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : isBlack ? 'bg-zinc-900 border-zinc-800' : 'bg-white/5 border-white/10'
              }`}>
                <div className="flex items-center gap-4 text-right w-full md:w-auto">
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
                    <Monitor size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        الكمبيوتر
                      </h3>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-black border border-blue-500/20">
                        {desktopSubView === 'sheet' ? 'عرض الكراس اليومي' : 'لوحة متابعة الإنجاز والدروس'}
                      </span>
                    </div>
                    <p className={`text-xs font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {desktopSubView === 'sheet'
                        ? 'ورقة نموذجية مطابقة للدفتر اليومي الورقي الرسمي (معاينة وطباعة A4 لليوم الحالي)'
                        : 'متابعة بصرية دقيقة لإحصائيات ونسب إنجاز الدروس الأسبوعية واليومية'}
                    </p>
                  </div>
                </div>

                {/* Sub-view switcher tabs */}
                <div className={`p-1.5 rounded-2xl border flex items-center gap-1.5 w-full md:w-auto justify-center md:justify-end ${
                  isLight ? 'bg-slate-100 border-slate-200' : isBlack ? 'bg-black border-zinc-800' : 'bg-white/5 border-white/10'
                }`}>
                  <button
                    onClick={() => setDesktopSubView('sheet')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                      desktopSubView === 'sheet'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FileText size={16} />
                    <span>عرض الكراس اليومي</span>
                  </button>

                  <button
                    onClick={() => setDesktopSubView('dashboard')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                      desktopSubView === 'dashboard'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <BarChart3 size={16} />
                    <span>لوحة متابعة الإنجاز والدروس</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      desktopSubView === 'dashboard' ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-500'
                    }`}>
                      {weekStats.rate}%
                    </span>
                  </button>
                </div>
              </div>

              {/* Sub-view Content: Sheet or Dashboard */}
              {desktopSubView === 'sheet' ? (
                <div className="space-y-6">
                  {/* Action & Control Bar */}
                  <div className={`p-6 rounded-3xl border flex flex-col lg:flex-row items-center justify-between gap-6 no-print ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : isBlack ? 'bg-zinc-900 border-zinc-800' : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-center gap-4 text-right w-full lg:w-auto">
                      <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 shrink-0">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          ورقة الكراس اليومي (معاينة وطباعة A4)
                        </h4>
                        <p className={`text-xs font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          ليوم {getDayName(new Date(targetDate))} — {formatDate(new Date(targetDate))} ({rows.length} حصص مبرمجة)
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                      {/* Date Selector */}
                      <div className={`flex items-center gap-1 p-1 rounded-xl border ${
                        isLight ? 'bg-slate-50 border-slate-200' : isBlack ? 'bg-black border-zinc-800' : 'bg-slate-900 border-white/10'
                      }`}>
                        <button 
                          onClick={() => changeDay(-1)} 
                          className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-white/10 text-slate-300'}`}
                          title="اليوم السابق"
                        >
                          <ChevronRight size={18} />
                        </button>
                        <input 
                          type="date" 
                          value={targetDate} 
                          onChange={(e) => setTargetDate(e.target.value)}
                          className={`bg-transparent text-xs font-black px-2 py-1 outline-none cursor-pointer ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        />
                        <button 
                          onClick={() => changeDay(1)} 
                          className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-white/10 text-slate-300'}`}
                          title="اليوم التالي"
                        >
                          <ChevronLeft size={18} />
                        </button>
                      </div>

                      {/* Zoom Controls */}
                      <div className={`hidden sm:flex items-center gap-1 p-1 rounded-xl border ${
                        isLight ? 'bg-slate-50 border-slate-200' : isBlack ? 'bg-black border-zinc-800' : 'bg-slate-900 border-white/10'
                      }`}>
                        <button 
                          onClick={() => setSheetZoom(prev => Math.max(70, prev - 10))}
                          className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-white/10 text-slate-300'}`}
                          title="تصغير الورقة"
                        >
                          <ZoomOut size={16} />
                        </button>
                        <span className={`text-[11px] font-black px-2 font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          {sheetZoom}%
                        </span>
                        <button 
                          onClick={() => setSheetZoom(prev => Math.min(130, prev + 10))}
                          className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-white/10 text-slate-300'}`}
                          title="تكبير الورقة"
                        >
                          <ZoomIn size={16} />
                        </button>
                      </div>

                      {/* Toggle Signatures */}
                      <button
                        onClick={() => setShowSignatureNames(!showSignatureNames)}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-black border transition-all ${
                          showSignatureNames
                            ? isLight ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                            : isLight ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                        title="تبديل إظهار الأسماء أو أسطر النقط للتوقيع اليدوي"
                      >
                        {showSignatureNames ? 'أسماء التوقيع: ظاهرة' : 'أسماء التوقيع: منقطة'}
                      </button>

                      {/* Download Print File (A4) */}
                      <button
                        onClick={handleDownloadPrintFile}
                        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black border transition-all ${
                          isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                        }`}
                        title="تحميل ملف ورقة الكراس كصفحة A4 للطباعة"
                      >
                        <Download size={15} />
                        <span>تحميل ملف A4</span>
                      </button>

                      {/* Print Button - Calls handlePrintSheet to trigger print and open assistant */}
                      <button
                        onClick={handlePrintSheet}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-600/30 active:scale-95"
                      >
                        <Printer size={16} />
                        <span>طباعة الكراس (A4)</span>
                      </button>
                    </div>
                  </div>

                  {/* Paper Canvas Display (Simulating Computer Desktop screen with physical A4 Paper) */}
                  <div className={`p-4 md:p-10 rounded-[2.5rem] border overflow-x-auto flex justify-center sheet-container-wrapper transition-all ${
                    isLight ? 'bg-slate-200/80 border-slate-300/80 shadow-inner' : isBlack ? 'bg-[#09090b] border-zinc-900' : 'bg-slate-950/60 border-white/5 shadow-inner'
                  }`}>
                    <div 
                      style={{ transform: `scale(${sheetZoom / 100})`, transformOrigin: 'top center' }}
                      className="transition-transform duration-200 w-full flex justify-center sheet-scale-wrapper"
                    >
                      <div 
                        id="printable-daily-sheet"
                        className="bg-white text-black w-full max-w-[850px] min-h-[1180px] p-8 md:p-12 shadow-2xl rounded-sm border border-slate-300 relative text-right flex flex-col justify-between"
                        style={{ fontFamily: "'Cairo', sans-serif" }}
                      >
                        {/* Sheet Header */}
                        <div>
                          <div className="flex items-center justify-between pb-3">
                            <div className="text-right">
                              <span className="text-sm md:text-base font-black text-black">
                                المؤسسة : {teacherInfo.school}
                              </span>
                            </div>
                            <div className="text-center">
                              <div className="bg-black text-white px-9 py-2 rounded-full font-black text-lg md:text-xl tracking-wider shadow-sm inline-block">
                                الدفتر اليومي
                              </div>
                            </div>
                            <div className="text-left" dir="ltr">
                              <span className="text-sm md:text-base font-black text-black">
                                السنة الدراسية : {academicYear}
                              </span>
                            </div>
                          </div>

                          {/* Sheet Table */}
                          <div className="mt-4 overflow-hidden">
                            <table className="w-full border-collapse border-2 border-black text-center text-[12px] md:text-[13px] leading-tight text-black">
                              <thead>
                                <tr className="border-b-2 border-black bg-slate-50 font-black">
                                  <th className="border border-black py-2.5 px-1.5 w-[9%] text-black font-black">اليوم</th>
                                  <th className="border border-black py-2.5 px-1.5 w-[11%] text-black font-black">الساعة</th>
                                  <th className="border border-black py-2.5 px-1.5 w-[10%] text-black font-black">القسم</th>
                                  <th className="border border-black py-2.5 px-1.5 w-[12%] text-black font-black">الميدان</th>
                                  <th className="border border-black py-2.5 px-2 w-[28%] text-black font-black">التعلمات</th>
                                  <th className="border border-black py-2.5 px-2 w-[20%] text-black font-black">محتوى التعلم</th>
                                  <th className="border border-black py-2.5 px-1.5 w-[10%] text-black font-black">ملاحظات</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Rows with actual sessions for today */}
                                {rows.map((row, idx) => (
                                  <tr key={`session-${idx}`} className={`border-b border-black min-h-[34px] ${row.isIncomplete ? 'bg-red-50/70' : ''}`}>
                                    <td className="border border-black py-2 px-1 font-bold">{row.day}</td>
                                    <td className="border border-black py-2 px-1 font-mono font-bold text-[11px] md:text-xs" dir="ltr">{row.time}</td>
                                    <td className="border border-black py-2 px-1 font-bold">السنة {row.gradeSection}</td>
                                    <td className="border border-black py-2 px-1 font-bold">{row.field}</td>
                                    <td className="border border-black py-2 px-2 font-bold text-right leading-snug">{row.learnings}</td>
                                    <td className="border border-black py-2 px-2 font-bold text-right leading-snug">{row.content}</td>
                                    <td className="border border-black py-2 px-1 text-[11px] font-bold">
                                      {row.isIncomplete ? (
                                        <span className="text-red-700 font-black">
                                          مؤجلة ({postponedSessions.find(p => p.date === row.date && p.gradeSection === row.gradeSection)?.reason || 'نصف يوم تعليمي'})
                                        </span>
                                      ) : (
                                        ''
                                      )}
                                    </td>
                                  </tr>
                                ))}

                                {/* Empty filler rows to complete the classic paper sheet layout identical to PDF */}
                                {Array.from({ length: Math.max(0, 24 - rows.length) }).map((_, fIdx) => (
                                  <tr key={`empty-${fIdx}`} className="border-b border-black h-[34px]">
                                    <td className="border border-black py-2 px-1">&nbsp;</td>
                                    <td className="border border-black py-2 px-1">&nbsp;</td>
                                    <td className="border border-black py-2 px-1">&nbsp;</td>
                                    <td className="border border-black py-2 px-1">&nbsp;</td>
                                    <td className="border border-black py-2 px-2">&nbsp;</td>
                                    <td className="border border-black py-2 px-2">&nbsp;</td>
                                    <td className="border border-black py-2 px-1">&nbsp;</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Sheet Footer Signatures */}
                        <div className="pt-8 pb-4 flex justify-between items-center text-sm md:text-base font-black text-black">
                          <div className="text-right">
                            الأستاذ: {showSignatureNames ? (teacherInfo.name || "الزايز محمد الطاهر") : ".................................."}
                          </div>
                          <div className="text-center">
                            المفتش: {showSignatureNames ? (teacherInfo.inspector || "السيد المفتش") : ".................................."}
                          </div>
                          <div className="text-left">
                            المدير: {showSignatureNames ? (teacherInfo.manager || "السيد المدير") : ".................................."}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Sub-View: Complete Dashboard (لوحة متابعة الإنجاز والدروس) */
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className={`rounded-[2.5rem] border transition-all duration-300 overflow-hidden shadow-xl ${
                    isLight 
                      ? 'bg-white/95 border-slate-200/90 shadow-slate-200/60' 
                      : isBlack 
                        ? 'bg-[#0c0c0e] border-zinc-800 shadow-2xl' 
                        : 'bg-white/5 border-white/10 backdrop-blur-md shadow-2xl'
                  }`}>
                    {/* Dashboard Header Bar */}
                    <div className={`p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b ${
                      isLight ? 'border-slate-100 bg-slate-50/60' : isBlack ? 'border-zinc-800/80 bg-zinc-900/30' : 'border-white/5 bg-white/[0.02]'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/10 shrink-0">
                          <BarChart3 size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className={`text-xl md:text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              لوحة متابعة الإنجاز والدروس
                            </h3>
                            <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              {dashboardScope === 'week' ? 'إحصائيات أسبوعية' : 'إحصائيات يومية'}
                            </span>
                          </div>
                          <p className={`text-xs mt-1 font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {dashboardScope === 'week' 
                              ? `الأسبوع الجاري: من ${weekStats.sundayFormatted} إلى ${weekStats.thursdayFormatted} (16 حصة مبرمجة)`
                              : `اليوم المختار: ${getDayName(new Date(targetDate))} ${formatDate(new Date(targetDate))} (${rows.length} حصص)`}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
                        {/* Scope Selector: Week vs Day */}
                        <div className={`p-1 rounded-xl border flex items-center gap-1 ${
                          isLight ? 'bg-white border-slate-200' : isBlack ? 'bg-black border-zinc-800' : 'bg-white/5 border-white/10'
                        }`}>
                          <button
                            onClick={() => setDashboardScope('week')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                              dashboardScope === 'week'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            الأسبوع الحالي
                          </button>
                          <button
                            onClick={() => setDashboardScope('today')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                              dashboardScope === 'today'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            اليوم المحدد
                          </button>
                        </div>

                        {/* Quick Jump to Sheet button */}
                        <button
                          onClick={() => setDesktopSubView('sheet')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/20 transition-all active:scale-95"
                        >
                          <FileText size={15} />
                          <span>معاينة ورقة الكراس لهذا اليوم</span>
                        </button>
                      </div>
                    </div>

                    {/* Dashboard Body */}
                    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        
                        {/* Left Side: Interactive Pie Chart (4 cols) */}
                        <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col items-center text-center justify-center relative ${
                          isLight 
                            ? 'bg-slate-50/80 border-slate-200' 
                            : isBlack 
                              ? 'bg-zinc-900/60 border-zinc-800' 
                              : 'bg-white/[0.03] border-white/5'
                        }`}>
                          <div className="w-full flex items-center justify-between mb-2">
                            <span className={`text-xs font-black flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              <PieChartIcon size={16} className="text-blue-500" />
                              مخطط توزيع الحصص
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              (dashboardScope === 'week' ? weekStats.rate : todayStats.rate) >= 80
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            }`}>
                              {(dashboardScope === 'week' ? weekStats.rate : todayStats.rate) >= 90
                                ? '🌟 إنجاز ممتاز'
                                : (dashboardScope === 'week' ? weekStats.rate : todayStats.rate) >= 75
                                  ? '👍 أداء جيد جداً'
                                  : '⚠️ يحتاج متابعة'}
                            </span>
                          </div>

                          {/* Donut Chart */}
                          <div className="my-2">
                            <DonutPieChart
                              completed={dashboardScope === 'week' ? weekStats.totalCompleted : todayStats.completed}
                              postponed={dashboardScope === 'week' ? weekStats.totalPostponed : todayStats.postponed}
                              size={165}
                              isLight={isLight}
                              isBlack={isBlack}
                            />
                          </div>

                          {/* Chart Legend */}
                          <div className="w-full grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/40 dark:border-white/5">
                            <div className={`p-2 rounded-xl flex flex-col items-center ${isLight ? 'bg-white border border-slate-200/60' : 'bg-white/5'}`}>
                              <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-500">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                <span>منجزة</span>
                              </div>
                              <span className={`text-sm font-black mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {dashboardScope === 'week' ? weekStats.totalCompleted : todayStats.completed}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {dashboardScope === 'week' 
                                  ? `${weekStats.totalSlots > 0 ? ((weekStats.totalCompleted / weekStats.totalSlots) * 100).toFixed(0) : 0}%` 
                                  : `${todayStats.total > 0 ? ((todayStats.completed / todayStats.total) * 100).toFixed(0) : 0}%`}
                              </span>
                            </div>

                            <div className={`p-2 rounded-xl flex flex-col items-center ${isLight ? 'bg-white border border-slate-200/60' : 'bg-white/5'}`}>
                              <div className="flex items-center gap-1.5 text-[11px] font-black text-rose-500">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                <span>مؤجلة</span>
                              </div>
                              <span className={`text-sm font-black mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {dashboardScope === 'week' ? weekStats.totalPostponed : todayStats.postponed}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {dashboardScope === 'week' 
                                  ? `${weekStats.totalSlots > 0 ? ((weekStats.totalPostponed / weekStats.totalSlots) * 100).toFixed(0) : 0}%` 
                                  : `${todayStats.total > 0 ? ((todayStats.postponed / todayStats.total) * 100).toFixed(0) : 0}%`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Side: 4 KPI Cards (8 cols) */}
                        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          
                          {/* KPI 1: معدل الإنجاز */}
                          <div className={`p-6 rounded-3xl border transition-all ${
                            isLight 
                              ? 'bg-gradient-to-br from-blue-50/80 to-white border-blue-200/70 shadow-sm' 
                              : isBlack 
                                ? 'bg-zinc-900/80 border-zinc-800' 
                                : 'bg-white/[0.04] border-white/10'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[11px] font-black text-blue-500 uppercase tracking-wider">معدل الإنجاز</span>
                              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                <TrendingUp size={18} />
                              </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className={`text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {dashboardScope === 'week' ? `${weekStats.rate}%` : `${todayStats.rate}%`}
                              </span>
                              <span className="text-xs font-bold text-slate-400">من المستهدف</span>
                            </div>
                            <div className="w-full bg-slate-200/60 dark:bg-white/10 h-2 rounded-full mt-4 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                                style={{ width: `${dashboardScope === 'week' ? weekStats.rate : todayStats.rate}%` }}
                              />
                            </div>
                            <p className={`text-[10px] mt-2 font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              {dashboardScope === 'week' ? 'نسبة تنفيذ المنهاج الأسبوعي بدون تأخير' : 'نسبة حصص هذا اليوم المنفذة'}
                            </p>
                          </div>

                          {/* KPI 2: الدروس المنجزة */}
                          <div className={`p-6 rounded-3xl border transition-all ${
                            isLight 
                              ? 'bg-gradient-to-br from-emerald-50/80 to-white border-emerald-200/70 shadow-sm' 
                              : isBlack 
                                ? 'bg-zinc-900/80 border-zinc-800' 
                                : 'bg-white/[0.04] border-white/10'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">الدروس المنجزة</span>
                              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                <CheckCircle2 size={18} />
                              </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className={`text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {dashboardScope === 'week' ? weekStats.totalCompleted : todayStats.completed}
                              </span>
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                حصة مثبتة بالدفتر
                              </span>
                            </div>
                            <div className="mt-4 flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                              <Check size={14} />
                              <span>سير بيداغوجي وفق التوزيع</span>
                            </div>
                            <p className={`text-[10px] mt-1 font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              الحصص المنفذة ميدانياً حسب الخطط
                            </p>
                          </div>

                          {/* KPI 3: الدروس المؤجلة */}
                          <div className={`p-6 rounded-3xl border transition-all ${
                            isLight 
                              ? 'bg-gradient-to-br from-rose-50/80 to-white border-rose-200/70 shadow-sm' 
                              : isBlack 
                                ? 'bg-zinc-900/80 border-zinc-800' 
                                : 'bg-white/[0.04] border-white/10'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[11px] font-black text-rose-500 uppercase tracking-wider">الدروس المؤجلة</span>
                              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                                <AlertCircle size={18} />
                              </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className={`text-3xl font-black ${
                                (dashboardScope === 'week' ? weekStats.totalPostponed : todayStats.postponed) > 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : isLight ? 'text-slate-900' : 'text-white'
                              }`}>
                                {dashboardScope === 'week' ? weekStats.totalPostponed : todayStats.postponed}
                              </span>
                              <span className="text-xs font-bold text-slate-400">حصة مؤجلة</span>
                            </div>
                            <div className="mt-4 flex items-center gap-1.5 text-xs font-black text-rose-500">
                              {(dashboardScope === 'week' ? weekStats.totalPostponed : todayStats.postponed) > 0 ? (
                                <span>تم تعويض التوزيع وحذف الإدماج آلياً</span>
                              ) : (
                                <span className="text-emerald-500">لا توجد حصص مؤجلة 👍</span>
                              )}
                            </div>
                            <p className={`text-[10px] mt-1 font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              {(dashboardScope === 'week' ? weekStats.totalPostponed : todayStats.postponed) > 0
                                ? 'نصف يوم تعليمي أو منافسات أو أسباب أخرى'
                                : 'جدول منتظم بنسبة 100%'}
                            </p>
                          </div>

                          {/* KPI 4: إجمالي الحصص */}
                          <div className={`p-6 rounded-3xl border transition-all ${
                            isLight 
                              ? 'bg-gradient-to-br from-slate-50 to-white border-slate-200/80 shadow-sm' 
                              : isBlack 
                                ? 'bg-zinc-900/80 border-zinc-800' 
                                : 'bg-white/[0.04] border-white/10'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">إجمالي الحصص</span>
                              <div className="p-2 rounded-xl bg-slate-500/10 text-slate-500">
                                <Calendar size={18} />
                              </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className={`text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {dashboardScope === 'week' ? weekStats.totalSlots : todayStats.total}
                              </span>
                              <span className="text-xs font-bold text-slate-400">حصة مبرمجة</span>
                            </div>
                            <div className="mt-4 flex items-center gap-1.5 text-xs font-black text-slate-500">
                              <Activity size={14} />
                              <span>
                                {dashboardScope === 'week' ? '4 أيام دراسة (16 حصة)' : 'حسب جدول اليوم الحالي'}
                              </span>
                            </div>
                            <p className={`text-[10px] mt-1 font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              توزيع الحصص المعتمد مع الأفواج
                            </p>
                          </div>

                        </div>
                      </div>

                      {/* Day-by-Day Navigator for this Week */}
                      <div className="pt-4 border-t border-slate-200/50 dark:border-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-black flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                            <Calendar size={14} className="text-blue-500" />
                            متابعة الإنجاز اليومي لأيام الأسبوع (اضغط للانتقال لأي يوم مباشرة):
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            الأسبوع: {weekStats.sundayFormatted} — {weekStats.thursdayFormatted}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {weekStats.schoolDays.map((d, dIdx) => (
                            <button
                              key={dIdx}
                              onClick={() => setTargetDate(d.dateISO)}
                              className={`p-4 rounded-2xl border text-right transition-all group flex flex-col justify-between ${
                                d.isSelected
                                  ? isLight
                                    ? 'border-blue-600 bg-blue-50/90 shadow-md ring-2 ring-blue-500/20'
                                    : 'border-blue-500 bg-blue-500/10 shadow-lg ring-2 ring-blue-500/30'
                                  : isLight
                                    ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                    : isBlack
                                      ? 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06]'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full mb-2">
                                <span className={`text-xs font-black ${
                                  d.isSelected ? 'text-blue-600 dark:text-blue-400' : isLight ? 'text-slate-800' : 'text-white'
                                }`}>
                                  {d.dayName}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-slate-400">
                                  {d.dateFormatted.split('/')[0]}/{d.dateFormatted.split('/')[1]}
                                </span>
                              </div>

                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/40 dark:border-white/5">
                                <span className="text-[11px] font-bold text-slate-500">
                                  {d.total} حصص
                                </span>
                                {d.postponed > 0 ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/15 text-rose-500 border border-rose-500/20">
                                    {d.postponed} مؤجلة
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                                    <Check size={10} /> مكتمل
                                  </span>
                                )}
                              </div>

                              {d.isSelected && (
                                <div className="mt-2 text-center text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                  • معروض حالياً في الجدول •
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Record View (جدول اليوم: Daily Lessons) */
            <div className="space-y-8">
              {/* Daily Lessons List Section */}
              <div className="flex items-center justify-between pt-2">
                <h3 className={`text-xl font-black flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <FileText className="text-blue-500" size={22} />
                  حصص اليوم: {getDayName(new Date(targetDate))} ({rows.length} حصص)
                </h3>
                <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                  انقر على أيقونة الحالة لتأجيل الحصة وتحديد السبب
                </span>
              </div>

              {rows.length > 0 ? rows.map((row, idx) => (
                <div 
                  key={idx} 
                  className={`border-2 rounded-[2.5rem] overflow-hidden transition-all duration-300 ${
                    row.isIncomplete 
                      ? 'border-red-500/40 bg-red-500/10 shadow-lg shadow-red-500/5' 
                      : isLight
                        ? 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg'
                        : isBlack
                          ? 'border-zinc-800 bg-[#0e0e11] hover:border-zinc-700'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex flex-col gap-3">
                      <div className={`w-28 py-4 rounded-2xl border text-center text-[11px] font-black shadow-xl ${
                        isLight 
                          ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : isBlack 
                            ? 'bg-zinc-900 border-zinc-800 text-sky-400' 
                            : 'bg-slate-900 border-white/10 text-blue-400'
                      }`}>
                        {row.time}
                      </div>
                      <div className={`w-28 py-2 rounded-xl text-center text-[9px] font-black uppercase tracking-tighter border ${
                        row.topic.includes("تقويم") 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                          : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                      }`}>
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
                      <h4 className={`text-2xl font-black mb-4 leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {row.learnings}
                      </h4>
                      <div className={`mt-4 p-5 rounded-2xl border-r-4 ${
                        isLight ? 'bg-teal-50 border-teal-600 text-teal-950' : 'bg-teal-500/5 border-teal-500 text-teal-50/90'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen size={16} className={isLight ? 'text-teal-700' : 'text-teal-400'} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isLight ? 'text-teal-700' : 'text-teal-400'}`}>
                            محتوى التعلم المستهدف:
                          </span>
                        </div>
                        <p className="text-md font-bold leading-relaxed">{row.content}</p>
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
                       <button 
                         onClick={() => handlePostponeClick(row)} 
                         className={`p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                           row.isIncomplete 
                             ? 'bg-red-600 border-red-500 text-white shadow-xl shadow-red-600/30' 
                             : isLight
                               ? 'bg-slate-50 border-slate-200 text-slate-500 hover:text-green-600 hover:border-green-500/40'
                               : 'bg-white/5 border-white/10 text-slate-500 hover:text-green-500 hover:border-green-500/30'
                         }`}
                         title={row.isIncomplete ? 'الحصة مؤجلة (اضغط للإلغاء)' : 'اضغط للتأجيل وتحديد السبب'}
                       >
                         {row.isIncomplete ? <XCircle size={32} /> : <CheckCircle size={32} />}
                         <span className="text-[9px] font-black uppercase tracking-widest">{row.isIncomplete ? 'مؤجلة' : 'تمت بنجاح'}</span>
                       </button>
                       <button 
                         onClick={() => setExpandedRowIndex(expandedRowIndex === idx ? null : idx)} 
                         className={`p-3 transition-colors ${isLight ? 'text-slate-400 hover:text-slate-800' : 'text-slate-500 hover:text-white'}`}
                       >
                         <ChevronDown size={32} className={`transition-transform duration-500 ${expandedRowIndex === idx ? 'rotate-180' : ''}`} />
                       </button>
                    </div>
                  </div>
                  {expandedRowIndex === idx && (
                    <div className={`p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500 border-t ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.04] border-white/10'
                    }`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className={`p-6 rounded-2xl border-r-4 ${
                           isLight ? 'bg-emerald-100/60 border-emerald-600 text-emerald-950' : 'bg-emerald-950/20 border-emerald-500 text-emerald-50/80'
                         }`}>
                           <span className={`text-[11px] font-black block mb-2 uppercase tracking-widest ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                             الموقف التعليمي المفصل:
                           </span>
                           <p className="text-sm font-bold leading-relaxed">{row.teachingSituation || "يتم اتباع التدرج السنوي للمكتسبات والتركيز على المحتوى المعرفي."}</p>
                         </div>
                         <div className={`p-6 rounded-2xl border-r-4 ${
                           isLight ? 'bg-amber-100/60 border-amber-600 text-amber-950' : 'bg-amber-950/20 border-amber-500 text-amber-50/80'
                         }`}>
                           <span className={`text-[11px] font-black block mb-2 uppercase tracking-widest ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                             الوسائل المستخدمة:
                           </span>
                           <p className="text-sm font-bold leading-relaxed">{row.tools || "سلم أرضي، شواخص، أقماع، كرات طبية."}</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => { setSelectedRow(row); setViewPdf(false); }} 
                        className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/30 group"
                      >
                        فتح المذكرة الكاملة للمعايير <ExternalLink size={20} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}
                </div>
              )) : (
                <div className="py-40 text-center opacity-30">
                  <Calendar size={100} className="mx-auto mb-6 text-slate-500" />
                  <p className={`text-2xl font-black ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                    لا توجد حصص مبرمجة ليوم {getDayName(new Date(targetDate))}
                  </p>
                  <button onClick={() => changeDay(1)} className="mt-6 text-sm font-black text-blue-500 underline decoration-2 underline-offset-8">
                    انتقل إلى اليوم الدراسي القادم
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* --- Mobile Tab Bar --- */}
      <nav className={`md:hidden fixed bottom-0 left-0 w-full backdrop-blur-xl border-t px-4 py-4 flex justify-around items-center z-[100] shadow-2xl ${
        isLight ? 'bg-white/95 border-slate-200 text-slate-700' : isBlack ? 'bg-black/95 border-zinc-800 text-white' : 'bg-slate-950/95 border-white/10 text-white'
      }`}>
        <button onClick={() => setActiveView('record')} className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'record' ? 'text-blue-500' : 'text-slate-500'}`}>
          <LayoutDashboard size={22} />
          <span className="text-[10px] font-black">الجدول</span>
        </button>
        <button onClick={() => setActiveView('desktop')} className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'desktop' ? 'text-blue-500' : 'text-slate-500'}`}>
          <Monitor size={22} />
          <span className="text-[10px] font-black">الكمبيوتر</span>
        </button>
        <button onClick={() => setActiveView('notes')} className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'notes' ? 'text-blue-500' : 'text-slate-500'}`}>
          <MessageSquare size={22} />
          <span className="text-[10px] font-black">السجل</span>
        </button>
        <button onClick={() => setActiveView('settings')} className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'settings' ? 'text-blue-500' : 'text-slate-500'}`}>
          <SettingsIcon size={22} />
          <span className="text-[10px] font-black">الإعدادات</span>
        </button>
      </nav>

      {/* --- Print Assistant & Options Modal --- */}
      {showPrintModal && (
        <div className="fixed inset-0 z-[250] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 md:p-6 text-right animate-in fade-in duration-300 no-print">
          <div className={`border rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : isBlack ? 'bg-[#0e0e11] border-zinc-800 text-white' : 'bg-slate-900 border-white/10 text-white'
          }`}>
            {/* Header */}
            <div className={`p-6 md:p-8 border-b flex justify-between items-center ${
              isLight ? 'border-slate-200 bg-slate-50' : isBlack ? 'border-zinc-800 bg-zinc-900/60' : 'border-white/10 bg-white/5'
            }`}>
              <button 
                onClick={() => setShowPrintModal(false)} 
                className={`p-2.5 rounded-xl transition-colors ${isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-slate-400'}`}
              >
                <X size={22} />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <Printer size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-black">طباعة ورقة الكراس اليومي (A4)</h3>
                  <p className="text-[11px] text-slate-400 font-bold">جاهز للإرسال إلى الطابعة أو التصدير كملف PDF</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Info summary */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold ${
                isLight ? 'bg-blue-50/70 border-blue-200 text-blue-900' : 'bg-white/5 border-white/10 text-slate-300'
              }`}>
                <div>
                  <span className="text-slate-500 block text-[10px]">تاريخ الورقة المطبوعة:</span>
                  <span className="font-black text-sm">{getDayName(new Date(targetDate))} — {formatDate(new Date(targetDate))}</span>
                </div>
                <div className="text-left" dir="ltr">
                  <span className="text-slate-500 block text-[10px]">المؤسسة:</span>
                  <span className="font-black text-sm">{teacherInfo.school}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    try {
                      window.print();
                    } catch (e) {
                      console.warn(e);
                    }
                  }}
                  className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-600/30 transition-all active:scale-95"
                >
                  <Printer size={20} />
                  <span>إطلاق أمر الطباعة الآن (Window Print)</span>
                </button>

                <button
                  onClick={handleDownloadPrintFile}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-sm border flex items-center justify-center gap-3 transition-all ${
                    isLight 
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800' 
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                  }`}
                >
                  <Download size={20} />
                  <span>تحميل ملف ورقة الكراس (HTML / A4) للطباعة بأي وقت</span>
                </button>
              </div>

              {/* Print Guidelines Advice Box */}
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}>
                <div className="font-black flex items-center gap-2">
                  <Info size={15} />
                  <span>إرشادات الطباعة الورقية المثالية:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] font-bold opacity-90">
                  <li>في نافذة الطباعة، اختر مقاس الورقة: <strong>A4</strong> والاتجاه: <strong>عمودي (Portrait)</strong>.</li>
                  <li>تأكد من تفعيل خيار <strong>رسومات الخلفية (Background graphics)</strong> لإظهار التنسيقات.</li>
                  <li>قم بإلغاء تفعيل خيار <strong>الرؤوس والتذييلات (Headers and footers)</strong> لتبدو الورقة رسمية ونظيفة.</li>
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black transition-colors ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 text-white'
                  }`}
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Modals: Postpone and Full Record Sheet --- */}
      {postponeModalRow && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-6 text-right animate-in fade-in duration-300">
          <div className={`border rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
          }`}>
            <div className={`p-8 border-b flex justify-between items-center ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/5'}`}>
              <button onClick={() => setPostponeModalRow(null)} className={`p-2 rounded-xl ${isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-slate-400'}`}>
                <X size={24} />
              </button>
              <h3 className="text-xl font-black">تأجيل حصة السنة {postponeModalRow.gradeSection}</h3>
            </div>
            <div className="p-10 space-y-8">
              <p className={`text-sm font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                لماذا تعذر إتمام هذه الحصة في وقتها المبرمج؟
              </p>
              <div className="grid grid-cols-1 gap-4">
                {(Object.keys(REASONS_MAP) as PostponeReason[]).map((r) => (
                  <button 
                    key={r} 
                    onClick={() => setTempReasonType(r)} 
                    className={`w-full p-5 rounded-2xl text-md font-black border-2 transition-all text-right flex items-center justify-between ${
                      tempReasonType === r 
                        ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-600/20' 
                        : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-300'
                          : 'bg-white/5 border-white/5 text-white hover:border-white/20'
                    }`}
                  >
                    <span>{REASONS_MAP[r]}</span>
                    {tempReasonType === r && <CheckCircle size={24} />}
                  </button>
                ))}
              </div>
              {tempReasonType === 'other' && (
                <div className="mt-4 animate-in slide-in-from-top-4 duration-300">
                   <ModernField 
                     label="اكتب السبب بوضوح" 
                     icon={PenTool} 
                     value={tempOtherText} 
                     onChange={setTempOtherText} 
                     color={currentTheme.primary} 
                     isLight={isLight} 
                     isBlack={isBlack} 
                   />
                </div>
              )}
              <div className="flex gap-4 mt-10">
                 <button onClick={confirmPostpone} className="flex-1 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-md uppercase shadow-xl shadow-blue-600/30 transition-transform active:scale-95">
                   تأكيد التأجيل
                 </button>
                 <button onClick={() => setPostponeModalRow(null)} className={`flex-1 py-5 rounded-2xl font-black text-md uppercase transition-colors ${
                   isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 text-white'
                 }`}>
                   إلغاء
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRow && (
        <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col animate-in fade-in duration-300">
          <header className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900 shadow-2xl">
             <div className="flex items-center gap-6">
                <button onClick={() => setSelectedRow(null)} className="p-3 hover:bg-white/10 rounded-2xl text-slate-400 transition-colors"><X size={32} /></button>
                <div className="text-right">
                   <h3 className="text-lg font-black text-white">{selectedRow.learnings}</h3>
                   <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">السنة {selectedRow.gradeSection} • الميدان {selectedRow.field}</p>
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
                  <div className="bg-white text-slate-900 p-12 md:p-20 rounded-2xl shadow-[0_50px_100px_rgba(0,0,0,0.3)] border-t-[12px] border-blue-600 space-y-16 relative overflow-hidden">
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
                           <p>الأستاذ: <span className="text-slate-900 font-black">{teacherInfo.name || "الزايز محمد الطاهر"}</span></p>
                           <p>المؤسسة: <span className="text-slate-900 font-black">{teacherInfo.school}</span></p>
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
                              <p className="text-[10px] font-black text-slate-400 mb-8 uppercase">ختم وتأشيرة السيد المدير</p>
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
                       <button onClick={() => setViewPdf(false)} className="px-12 py-5 bg-blue-600 rounded-2xl text-md font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 active:scale-95 text-white">الرجوع للبيانات الرقمية</button>
                    </div>
                  )}
               </div>
             )}
          </main>
        </div>
      )}
      
      {/* Credits Footer for Mobile in Settings */}
      {activeView === 'settings' && (
        <div className={`md:hidden w-full p-8 border-t text-center ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-950/50 border-white/5'
        }`}>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">أستاذ المادة وتطوير النظام</p>
           <p className={`text-lg font-black mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
             {teacherInfo.name || "الزايز محمد الطاهر"}
           </p>
           <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 font-bold">
              <span className="flex items-center gap-1"><Award size={12} className="text-orange-500" /> أستاذ ت.ب.ر</span>
              <span className="flex items-center gap-1"><Code size={12} className="text-blue-500" /> برمجة وتطوير</span>
           </div>
        </div>
      )}
    </div>
  );
}
