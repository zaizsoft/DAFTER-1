
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
  field: string;
  topic: string; // تم الإضافة هنا: نوع الحصة/الموضوع
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

export type PostponeReason = 'half_day' | 'arbitration' | 'competition' | 'other';

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
  reason: string;
  reasonType: PostponeReason;
}
