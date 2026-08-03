import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { Lesson } from "@/core/content/domain/lesson";
import type { LessonListFilters, LessonCatalogPort } from "@/core/content/ports/catalog-ports";
import { DatasetUnavailableException } from "@/core/shared/exceptions";

interface LessonIndexEntry {
  id: string;
  path: string;
  title: string;
  level: string;
  category: string;
  topic: string;
  subtopics: string[];
  difficulty: number;
  estimatedMinutes: number;
  status: string;
  contentVersion: number;
}

interface LessonIndex {
  schemaVersion: string;
  generatedFromDatasetVersion: string;
  lessons: LessonIndexEntry[];
}

interface LessonFrontmatter {
  id: string;
  title: string;
  level: string;
  category: string;
  topic: string;
  subtopics: string[];
  difficulty: number;
  tags: string[];
  status: string;
  contentVersion: number;
  relatedLessonIds?: string[];
}

/**
 * Adaptador de lecciones que lee `DATASET/catalog/lesson-index.json` y los
 * archivos markdown. Cachea el índice una vez por proceso.
 */
export class FileLessonCatalogAdapter implements LessonCatalogPort {
  private readonly datasetRoot: string;
  private readonly indexPath: string;
  private indexPromise: Promise<LessonIndexEntry[]> | null = null;

  constructor(datasetRoot: string) {
    this.datasetRoot = datasetRoot;
    this.indexPath = path.join(datasetRoot, "catalog", "lesson-index.json");
  }

  private async loadIndex(): Promise<LessonIndexEntry[]> {
    if (this.indexPromise) return this.indexPromise;
    this.indexPromise = this.readIndex();
    return this.indexPromise;
  }

  private async readIndex(): Promise<LessonIndexEntry[]> {
    let raw: LessonIndex;
    try {
      raw = JSON.parse(await readFile(this.indexPath, "utf8")) as LessonIndex;
    } catch {
      throw new DatasetUnavailableException(
        `Unable to read lesson index at ${this.indexPath}`,
        "Content catalog is unavailable.",
        { path: this.indexPath },
      );
    }
    return raw.lessons.filter((lesson) => lesson.status === "published");
  }

  private async readLesson(entry: LessonIndexEntry): Promise<Lesson> {
    const filePath = path.join(this.datasetRoot, entry.path);
    let source: string;
    try {
      source = await readFile(filePath, "utf8");
    } catch {
      throw new DatasetUnavailableException(
        `Unable to read lesson file at ${filePath}`,
        "Content catalog is unavailable.",
        { path: filePath },
      );
    }
    const parsed = matter(source);
    const frontmatter = parsed.data as LessonFrontmatter;
    const content = parsed.content.trim();

    return {
      id: entry.id,
      level: entry.level as Lesson["level"],
      category: entry.category as Lesson["category"],
      taxonomyNodeId: entry.subtopics[0] ?? entry.topic,
      title: entry.title,
      summary: this.extractSummary(content),
      explanation: content,
      examples: [],
      commonMistakes: [],
      relatedActivityIds: frontmatter.relatedLessonIds ?? [],
      tags: frontmatter.tags ?? [],
      difficulty: entry.difficulty as 1 | 2 | 3,
      status: entry.status as Lesson["status"],
      contentVersion: entry.contentVersion,
    };
  }

  private extractSummary(content: string): string {
    const lines = content.split("\n");
    const summaryStart = lines.findIndex((line) => line.trim() === "# Resumen");
    if (summaryStart === -1) return "";
    const paragraphs: string[] = [];
    for (let i = summaryStart + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("#") && line !== "# Resumen") break;
      if (line.length > 0) paragraphs.push(line);
      if (paragraphs.length >= 2) break;
    }
    return paragraphs.join(" ");
  }

  async listLessons(filters?: LessonListFilters): Promise<Lesson[]> {
    const entries = await this.loadIndex();
    const filtered = entries.filter((entry) => {
      if (filters?.level && entry.level !== filters.level) return false;
      if (filters?.category && entry.category !== filters.category) return false;
      return true;
    });
    return Promise.all(filtered.map((entry) => this.readLesson(entry)));
  }

  async getLessonById(lessonId: string): Promise<Lesson | null> {
    const entries = await this.loadIndex();
    const entry = entries.find((lesson) => lesson.id === lessonId);
    if (!entry) return null;
    return this.readLesson(entry);
  }
}
