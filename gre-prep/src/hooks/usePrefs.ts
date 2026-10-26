'use client';

import {
  EXAM_DATE_KEY, REASONS_KEY, THEME_KEY, TRANSLATION_KEY, WEEKLY_HOURS_KEY,
  emptyReasons, parseFlag, parseNumber, parseReasons, parseString, parseTheme,
} from '@/lib/prefs';
import { useLocalValue } from './useLocalValue';

export const useTheme = () => useLocalValue(THEME_KEY, parseTheme, 'system');
export const useShowTranslation = () => useLocalValue(TRANSLATION_KEY, parseFlag, false);
export const useExamDate = () => useLocalValue(EXAM_DATE_KEY, parseString, '');
export const useWeeklyHours = () => useLocalValue(WEEKLY_HOURS_KEY, parseNumber, 0);
export const useReasons = () => useLocalValue(REASONS_KEY, parseReasons, emptyReasons);
