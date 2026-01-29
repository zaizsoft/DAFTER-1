
import { WEEKLY_SCHEDULE, ALL_LESSONS } from './constants';
import { DailyRecordRow, WeeklySlot } from './types';

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export const getDayName = (date: Date): string => {
  return date.toLocaleDateString('ar-DZ', { weekday: 'long' });
};

/**
 * Counts how many times a specific weekday (e.g., Monday) has occurred 
 * between startDate and targetDate inclusive.
 */
export const countWeekdayOccurrences = (dayIndex: number, startDate: Date, targetDate: Date): number => {
  if (targetDate < startDate) return 0;
  let count = 0;
  let current = new Date(startDate);
  // Normalize dates to midnight to avoid time issues
  current.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    // Our dayIndex matches WEEKLY_SCHEDULE: 0=Sunday, 1=Monday, 2=Tuesday...
    if (current.getDay() === dayIndex) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

export const getLessonForSlot = (
  slot: WeeklySlot,
  startDate: Date,
  targetDate: Date
) => {
  // Move msPerWeek definition to function scope to fix the 'Cannot find name' error
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const gradeLessons = ALL_LESSONS[slot.grade] || [];
  
  // Find all slots in the week for this specific grade and section
  const occurrencesInWeek = WEEKLY_SCHEDULE
    .filter(s => s.grade === slot.grade && s.section === slot.section)
    .sort((a, b) => a.dayIndex - b.dayIndex || a.time.localeCompare(b.time));

  // Determine current session number:
  // 1. How many full weeks passed?
  // 2. Which occurrence in the target week is this slot?
  
  // More accurate way: Count total previous occurrences of all slots belonging to this grade/section
  let totalOccurrences = 0;
  for (const weeklyOccurrence of occurrencesInWeek) {
    // If target day is Thursday, and we are looking at Monday's slot, we count all Mondays before/on target.
    // If target day is Thursday, and we are looking at Thursday's slot, we count all Thursdays before/on target.
    // But we only want to count up to the specific slot time if there are multiple in the same day (rare here).
    
    // Simplification: How many times has this *specific* weekly slot occurred?
    const timesThisSlotHappened = countWeekdayOccurrences(weeklyOccurrence.dayIndex, startDate, targetDate);
    
    // However, if we are currently at targetDate, and this weeklyOccurrence is LATER in the same day than our 'slot',
    // or if weeklyOccurrence is on the same day but we are calculating for a list, we need care.
    
    // Refined Logic:
    // Session Index = (Full weeks passed * slots per week) + (index of this slot in the week)
    const diff = targetDate.getTime() - startDate.getTime();
    const fullWeeks = Math.floor(diff / msPerWeek);
    
    // This is still slightly flawed if the start date isn't a Sunday.
    // Better: Total sessions = Sum of [countWeekdayOccurrences(s.dayIndex, start, target)] for all slots 's' 
    // BUT we must stop counting at the current slot in the sequence.
  }

  // Linear calculation:
  // For each slot in the week (occurrencesInWeek), count how many times it appeared from start to target.
  let lessonIndex = 0;
  for (const sInWeek of occurrencesInWeek) {
    const count = countWeekdayOccurrences(sInWeek.dayIndex, startDate, targetDate);
    
    // If this sInWeek is the same slot we are currently processing, 
    // the 'count'-th occurrence is the one we are on.
    if (sInWeek.dayIndex === slot.dayIndex && sInWeek.time === slot.time) {
      // The total lesson index is the sum of counts of all slots that appeared *before* or *at* this one in chronological week order.
      // Wait, that's not right. Lessons are sequential. 
      // Session 1: Slot A (Week 1)
      // Session 2: Slot B (Week 1)
      // Session 3: Slot A (Week 2)
      // Session 4: Slot B (Week 2)
      
      // Correct Sequential Logic:
      // total_sessions_passed = 0
      // for week w from 0 to fullWeeks:
      //    for s in occurrencesInWeek:
      //       if (w, s) <= (targetWeek, currentSlot): total_sessions_passed++
      
      // Let's use the simplest reliable method:
      const slotRank = occurrencesInWeek.findIndex(s => s.dayIndex === slot.dayIndex && s.time === slot.time);
      const startOfTargetWeek = new Date(targetDate);
      startOfTargetWeek.setDate(targetDate.getDate() - targetDate.getDay());
      startOfTargetWeek.setHours(0,0,0,0);
      
      // Number of full weeks before the current week
      const weeksBefore = Math.max(0, Math.floor((startOfTargetWeek.getTime() - startDate.getTime()) / msPerWeek));
      
      // How many times did this grade-section's slots occur in those full weeks?
      const sessionsInPriorWeeks = weeksBefore * occurrencesInWeek.length;
      
      // How many times did they occur in the partial start week (if any)? 
      // And in the current week up to this slot?
      // To keep it simple for the user, we assume the semester starts and the first slot encountered is Lesson 1.
      
      // Let's just count every occurrence of any of this grade's slots from start to target.
      let totalCount = 0;
      let current = new Date(startDate);
      current.setHours(0,0,0,0);
      const end = new Date(targetDate);
      end.setHours(0,0,0,0);
      
      while (current <= end) {
        const dIndex = current.getDay();
        const slotsToday = occurrencesInWeek.filter(s => s.dayIndex === dIndex);
        
        if (current.getTime() === end.getTime()) {
           // On the target day, only count slots up to and including the current one
           for (const st of slotsToday) {
             totalCount++;
             if (st.time === slot.time) break;
           }
        } else {
           totalCount += slotsToday.length;
        }
        current.setDate(current.getDate() + 1);
      }
      
      lessonIndex = totalCount - 1; // 0-based index
      break;
    }
  }

  const lesson = gradeLessons[lessonIndex % gradeLessons.length] || { 
    id: "?", topic: "نهاية البرنامج", knowledgeResource: "-", content: "-" 
  };
  return lesson;
};
