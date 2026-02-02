
import { WEEKLY_SCHEDULE, ALL_LESSONS } from './constants';
import { WeeklySlot, Lesson } from './types';

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export const getDayName = (date: Date): string => {
  return date.toLocaleDateString('ar-DZ', { weekday: 'long' });
};

/**
 * تحديد الدرس المناسب للحصة مع مراعاة الحصص المؤجلة وحذف حصص الإدماج التعويضية
 */
export const getLessonForSlot = (
  slot: WeeklySlot,
  startDate: Date,
  targetDate: Date,
  meetingsState: Record<string, 'completed' | 'incomplete'>
): { lesson: Lesson, isIncomplete: boolean } => {
  const originalLessons = ALL_LESSONS[slot.grade] || [];
  
  // 1. تحديد كافة المواعيد المبرمجة لهذا القسم من البداية حتى اليوم المطلوب
  const classMeetings: { date: string, slot: WeeklySlot }[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setHours(0, 0, 0, 0);

  const tempDate = new Date(current);
  while (tempDate <= end) {
    const dayIdx = tempDate.getDay();
    const dailySlots = WEEKLY_SCHEDULE
      .filter(s => s.grade === slot.grade && s.section === slot.section && s.dayIndex === dayIdx)
      .sort((a, b) => a.time.localeCompare(b.time));
    
    dailySlots.forEach(s => {
      classMeetings.push({ date: formatDate(tempDate), slot: s });
    });
    tempDate.setDate(tempDate.getDate() + 1);
  }

  // تحديد ترتيب الحصة الحالية (فهرس اللقاء)
  const currentMeetingDateStr = formatDate(end);
  const currentMeetingIdx = classMeetings.findIndex(m => m.date === currentMeetingDateStr && m.slot.time === slot.time);
  
  if (currentMeetingIdx === -1) {
    return { lesson: originalLessons[0], isIncomplete: false };
  }

  // 2. حساب عدد التأجيلات "التي حدثت قبل" هذا اللقاء
  let incompletesBefore = 0;
  for (let i = 0; i < currentMeetingIdx; i++) {
    const m = classMeetings[i];
    const key = `${m.date}_${m.slot.grade}_${m.slot.section}_${m.slot.time}`;
    if (meetingsState[key] === 'incomplete') {
      incompletesBefore++;
    }
  }

  // 3. تعديل قائمة الدروس المتاحة (حذف الإدماجية عند وجود تأخير)
  const modifiedLessons = [...originalLessons];
  
  // البحث عن فهارس الدروس الإدماجية في المصفوفة الأصلية
  const optionalIndices = originalLessons
    .map((l, idx) => (l.topic.includes('إدماجية') ? idx : -1))
    .filter(idx => idx !== -1);

  // إذا حدث تأجيل واحد أو أكثر، نحذف أول حصة إدماجية مبرمجة
  if (incompletesBefore >= 1 && optionalIndices.length > 0) {
    modifiedLessons.splice(optionalIndices[0], 1);
  }
  // إذا حدث تأجيلان أو أكثر، نحذف الحصة الإدماجية الثانية
  if (incompletesBefore >= 2 && optionalIndices.length > 1) {
    // الفهرس الثاني ينقص بـ 1 لأننا حذفنا عنصراً قبله
    const secondAdj = optionalIndices[1] - 1;
    if (modifiedLessons[secondAdj]) modifiedLessons.splice(secondAdj, 1);
  }

  // 4. تحديد الدرس الحالي
  // الدرس الحالي = (رقم اللقاء - عدد التأجيلات السابقة)
  const targetLessonIdx = Math.max(0, currentMeetingIdx - incompletesBefore);
  const finalLesson = modifiedLessons[targetLessonIdx % modifiedLessons.length] || originalLessons[0];

  // التحقق مما إذا كانت الحصة الحالية "نفسها" قد وسمت بأنها غير مكتملة
  const currentKey = `${currentMeetingDateStr}_${slot.grade}_${slot.section}_${slot.time}`;
  const isIncompleteNow = meetingsState[currentKey] === 'incomplete';

  return { 
    lesson: finalLesson, 
    isIncomplete: isIncompleteNow 
  };
};
