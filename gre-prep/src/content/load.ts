/* Reads content/ from disk. Server-side only (build, scripts, tests).
 *
 * Files:
 *   content/sources.json            closed list of ETS sources
 *   content/syllabus.json           chapters + lesson stubs, each with officialRef
 *   content/lessons/<id>.json       one lesson body per syllabus lesson
 *   content/questions/<set>.json    array of questions; <set> is a lesson id or a pool id
 *   content/passages/<id>.json      one RC passage per file
 */

import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import {
  LessonSchema,
  PassageSchema,
  QuestionSchema,
  SourceSchema,
  SyllabusSchema,
  type LessonContent,
  type PassageSpec,
  type Source,
} from './schema';

export const CONTENT_DIR = path.join(process.cwd(), 'content');

export interface LoadIssue {
  file: string;
  message: string;
}

export interface RawContent {
  sources: Source[];
  syllabus: z.infer<typeof SyllabusSchema>;
  lessons: Map<string, LessonContent>;
  questionSets: Map<string, z.infer<typeof QuestionSchema>[]>;
  passages: Map<string, PassageSpec>;
  /** Schema failures; semantic checks live in check.ts. */
  issues: LoadIssue[];
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function listJson(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
}

export function loadContent(dir: string = CONTENT_DIR): RawContent {
  const issues: LoadIssue[] = [];
  const fail = (file: string, e: unknown) =>
    issues.push({
      file: path.relative(dir, file),
      message: e instanceof z.ZodError
        ? e.issues.slice(0, 6).map((i) => `${i.path.join('.')}: ${i.message}`).join(' | ')
        : String(e),
    });

  const parse = <T>(file: string, schema: z.ZodType<T>): T | null => {
    try {
      return schema.parse(readJson(file));
    } catch (e) {
      fail(file, e);
      return null;
    }
  };

  const sources = parse(path.join(dir, 'sources.json'), z.array(SourceSchema)) ?? [];
  const syllabus = parse(path.join(dir, 'syllabus.json'), SyllabusSchema) ?? { chapters: [], lessons: [] };

  const lessons = new Map<string, LessonContent>();
  for (const f of listJson(path.join(dir, 'lessons'))) {
    const file = path.join(dir, 'lessons', f);
    const l = parse(file, LessonSchema);
    if (l) lessons.set(l.id, l);
  }

  const questionSets = new Map<string, z.infer<typeof QuestionSchema>[]>();
  for (const f of listJson(path.join(dir, 'questions'))) {
    const file = path.join(dir, 'questions', f);
    const qs = parse(file, z.array(QuestionSchema));
    if (qs) questionSets.set(f.replace(/\.json$/, ''), qs);
  }

  const passages = new Map<string, PassageSpec>();
  for (const f of listJson(path.join(dir, 'passages'))) {
    const file = path.join(dir, 'passages', f);
    const p = parse(file, PassageSchema);
    if (p) passages.set(p.id, p);
  }

  return { sources, syllabus, lessons, questionSets, passages, issues };
}
