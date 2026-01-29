
export interface Lesson {
  id: string;
  topic: string;
  knowledgeResource: string;
  content: string;
}

export interface WeeklySlot {
  dayName: string; // "الأحد", "الاثنين", etc.
  dayIndex: number; // 0 (Sunday) to 4 (Thursday)
  time: string;
  grade: string; // "1", "2", "3", "4", "5"
  section: string; // "أ", "ب"
}

export interface DailyRecordRow {
  date: string;
  day: string;
  time: string;
  gradeSection: string;
  field: string;
  learnings: string;
  content: string;
  note: string;
}

export interface TeacherInfo {
  name: string;
  school: string;
  inspector: string;
  manager: string;
}
