
import { WEEKLY_SCHEDULE, ALL_LESSONS, ALL_LESSONS_BY_TERM } from './constants';
import { WeeklySlot, Lesson, TermKey } from './types';

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export const getDayName = (date: Date): string => {
  return date.toLocaleDateString('ar-DZ', { weekday: 'long' });
};

/**
 * ترتيب الحصص حسب التوقيت الصباحي والمسائي
 */
export const getTimeSortValue = (timeStr: string): number => {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  let hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  // في التوقيت المدرسي بالجزائر، 01:00 إلى 06:00 تمثل الفترة المسائية (13:00 إلى 18:00)
  if (hour >= 1 && hour <= 6) {
    hour += 12;
  }
  return hour * 60 + min;
};

/**
 * تحديد الدرس المناسب للحصة مع مراعاة الفصل/الميدان، الحصص المؤجلة، وحذف حصص الإدماج التعويضية
 */
export const getLessonForSlot = (
  slot: WeeklySlot,
  startDate: Date,
  targetDate: Date,
  meetingsState: Record<string, 'completed' | 'incomplete'>,
  termKey: TermKey = '1'
): { lesson: Lesson, isIncomplete: boolean } => {
  const lessonsForTerm = ALL_LESSONS_BY_TERM[termKey] || ALL_LESSONS_BY_TERM['1'];
  const originalLessons = lessonsForTerm[slot.grade] || ALL_LESSONS[slot.grade] || [];
  
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
      .sort((a, b) => getTimeSortValue(a.time) - getTimeSortValue(b.time));
    
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
