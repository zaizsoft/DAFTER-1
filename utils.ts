
import { WEEKLY_SCHEDULE, ALL_LESSONS } from './constants';
import { DailyRecordRow, WeeklySlot } from './types';

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export const getDayName = (date: Date): string => {
  return date.toLocaleDateString('ar-DZ', { weekday: 'long' });
};

export const getLessonForSlot = (
  slot: WeeklySlot,
  startDate: Date,
  targetDate: Date
) => {
  const gradeLessons = ALL_LESSONS[slot.grade] || [];
  const occurrencesInWeek = WEEKLY_SCHEDULE
    .filter(s => s.grade === slot.grade && s.section === slot.section)
    .sort((a, b) => a.dayIndex - b.dayIndex || a.time.localeCompare(b.time));

  let totalCount = 0;
  let current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setHours(0, 0, 0, 0);
  
  // إذا كان تاريخ العرض قبل تاريخ البداية، نعيد أول درس
  if (end < current) return gradeLessons[0] || { id: "01", topic: "-", knowledgeResource: "-", content: "-" };

  while (current <= end) {
    const dIndex = current.getDay();
    const slotsToday = occurrencesInWeek.filter(s => s.dayIndex === dIndex);
    
    if (current.getTime() === end.getTime()) {
       // في اليوم المستهدف، نحسب فقط الحصص التي تسبق أو تساوي توقيت الحصة الحالية
       for (const st of slotsToday) {
         totalCount++;
         if (st.time === slot.time) break;
       }
    } else {
       totalCount += slotsToday.length;
    }
    current.setDate(current.getDate() + 1);
  }
  
  // ترتيب الحصة يبدأ من 0
  const lessonIndex = Math.max(0, totalCount - 1);
  const lesson = gradeLessons[lessonIndex % gradeLessons.length] || { 
    id: "?", topic: "نهاية البرنامج", knowledgeResource: "-", content: "-" 
  };
  return lesson;
};
