
export interface Lesson {
  id: string;
  topic: string;
  knowledgeResource: string;
  content: string;
  teachingSituation?: string;
  tools?: string;
  pdfUrl?: string; // رابط ملف المذكرة الأصلية (PDF)
}

export interface WeeklySlot {
  dayName: string;
  dayIndex: number;
  time: string;
  grade: string;
  section: string;
}

export interface DailyRecordRow {
  date: string;
  day: string;
  time: string;
  gradeSection: string;
  grade?: string;
  section?: string;
  field: string;
  topic: string; // تم الإضافة هنا: نوع الحصة/الموضوع
  terminalCompetency?: string; // الكفاءة الختامية
  learnings: string;
  content: string;
  teachingSituation?: string;
  tools?: string;
  pdfUrl?: string;
  note: string;
}

export interface TeacherInfo {
  name: string;
  school: string;
  inspector: string;
  manager: string;
}

export type PostponeReason = 'half_day' | 'arbitration' | 'competition' | 'holiday' | 'other';

export type TermKey = '1' | '2' | '3';

export interface TermConfig {
  id: TermKey;
  name: string;
  fieldName: string;
  shortFieldName: string;
  description: string;
}

export interface PostponedSession {
  key: string; // date_grade_section_time
  date: string;
  gradeSection: string;
  time?: string;
  lessonTopic?: string; // نوع الحصة (مثل: حصة تعليمية 01، تقويم تشخيصي، إلخ)
  reason: string;
  reasonType: PostponeReason;
  holidayName?: string; // عطلة الخريف | عطلة الشتاء | عطلة الربيع | عطلة الصيف
  holidayStartDate?: string;
  holidayEndDate?: string;
}

export interface SessionNote {
  key: string; // date_grade_section_time
  date: string;
  gradeSection: string;
  time: string;
  note: string;
  createdAt?: string;
}

export interface WeeklyNote {
  weekKey: string; // sundayFormatted_thursdayFormatted
  text: string;
  updatedAt?: string;
}

