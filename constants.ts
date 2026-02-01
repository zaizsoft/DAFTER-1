
import { Lesson, WeeklySlot } from './types';

export const FIELD_NAME = "ميدان الحركات القاعدية";

export const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];

export const WEEKLY_SCHEDULE: WeeklySlot[] = [
  { dayName: "الأحد", dayIndex: 0, time: "09:30/10:30", grade: "3", section: "أ" },
  { dayName: "الأحد", dayIndex: 0, time: "10:30/11:30", grade: "3", section: "ب" },
  { dayName: "الأحد", dayIndex: 0, time: "12:00/13:00", grade: "2", section: "ب" },
  { dayName: "الاثنين", dayIndex: 1, time: "09:30/10:30", grade: "2", section: "أ" },
  { dayName: "الاثنين", dayIndex: 1, time: "10:30/11:30", grade: "1", section: "ب" },
  { dayName: "الاثنين", dayIndex: 1, time: "13:00/14:00", grade: "1", section: "أ" },
  { dayName: "الاثنين", dayIndex: 1, time: "14:00/15:00", grade: "3", section: "أ" },
  { dayName: "الاثنين", dayIndex: 1, time: "16:00/17:00", grade: "4", section: "ب" },
  { dayName: "الأربعاء", dayIndex: 3, time: "09:30/10:30", grade: "1", section: "أ" },
  { dayName: "الأربعاء", dayIndex: 3, time: "10:30/11:30", grade: "2", section: "ب" },
  { dayName: "الأربعاء", dayIndex: 3, time: "14:00/15:00", grade: "4", section: "أ" },
  { dayName: "الأربعاء", dayIndex: 3, time: "16:00/17:00", grade: "3", section: "ب" },
  { dayName: "الخميس", dayIndex: 4, time: "10:30/11:30", grade: "2", section: "أ" },
  { dayName: "الخميس", dayIndex: 4, time: "13:00/14:00", grade: "1", section: "ب" },
  { dayName: "الخميس", dayIndex: 4, time: "14:00/15:00", grade: "5", section: "أ" },
  { dayName: "الخميس", dayIndex: 4, time: "16:00/17:00", grade: "5", section: "ب" },
];

export const LESSONS_Y1: Lesson[] = [
  { id: "01", topic: "تقويم تشخيصي", knowledgeResource: "تقويم مدى اكتساب واستثمار مركبات الكفاءة الختامية.", content: "تقييم المهارات الحركية القاعدية والقدرة على التنقل بوتائر مختلفة.", teachingSituation: "أداء مسلك فني يضم محطات للمشي، الجري، والتنقل الجانبي والخلفي لتقييم المكتسبات القبلية.", tools: "سلم أرضي، صحون، أقماع، حلقات، كرات.", pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { id: "02", topic: "وحدة تعليمية 01-أ", knowledgeResource: "تعلم مختلف الحركات.", content: "المشي الفردي والتحكم في وضعية الجسم.", teachingSituation: "المشي الفردي بوضع أداة فوق الرأس للحفاظ على التوازن والوصول إلى نقطة محددة.", tools: "صحون، حلقات، أقماع، شواخص.", pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { id: "03", topic: "وحدة تعليمية 01-ب", knowledgeResource: "تعلم مختلف الحركات.", content: "المشي الثنائي والتنسيق مع الزميل.", teachingSituation: "المشي مع زميل يداً بيد مع الحفاظ على توازن أداة فوق الرأس للوصول إلى هدف مشترك.", tools: "حلقات، صحون، أقماع، عصا." },
  { id: "04", topic: "وحدة تعليمية 02-أ", knowledgeResource: "تعلم مختلف الحركات.", content: "الجري الفردي مع التركيز على اتجاه النظر.", teachingSituation: "الجري السريع في خط مستقيم لنقل كرات ووضعها في مكان محدد حسب اللون.", tools: "كرات، صحون، أقماع، حلقات." },
  { id: "05", topic: "وحدة تعليمية 02-ب", knowledgeResource: "تعلم مختلف الحركات.", content: "الجري الثنائي والانتباه للزميل.", teachingSituation: "الجري مع الزميل لنقل أداة مشتركة باستخدام وسيلة مساعدة للوصول إلى نقطة النهاية.", tools: "حلقات، كرات، أكواب، أقماع." },
];

export const LESSONS_Y2: Lesson[] = [
  { id: "01", topic: "تقويم تشخيصي", knowledgeResource: "تقويم مدى اكتساب واستثمار مركبات الكفاءة الختامية.", content: "ممارسة حركات طبيعية في وضعيات متنوعة.", teachingSituation: "مسار يجمع بين الوقوف، الجثو، الجلوس، والتنقل بخطوات متناسقة لنقل أدوات طبية تمثيلية.", tools: "أقماع، صحون، بساط، سلم، حلقات.", pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { id: "02", topic: "وحدة تعليمية 01-أ", knowledgeResource: "تعلم حركات قاعدية في وضعيات طبيعية.", content: "وضعية الوقوف والتحكم في التوازن.", teachingSituation: "الاستعداد بوضعية الوقوف لالتقاط أداة تسقط فجأة قبل وصولها للأرض.", tools: "صحون، حلقات، خيط، شواخص." },
];

export const ALL_LESSONS: Record<string, Lesson[]> = {
  "1": LESSONS_Y1,
  "2": LESSONS_Y2,
  "3": LESSONS_Y1, // Fallback
  "4": LESSONS_Y1, // Fallback
  "5": LESSONS_Y1, // Fallback
};
