
export interface Lesson {
  id: string;
  topic: string;
  knowledgeResource: string;
  content: string;
  teachingSituation?: string;
  tools?: string;
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
  learnings: string;
  content: string;
  teachingSituation?: string;
  tools?: string;
  note: string;
}

export interface TeacherInfo {
  name: string;
  school: string;
  inspector: string;
  manager: string;
}
