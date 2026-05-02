import { get, set, del, keys } from 'idb-keyval';
import type { SubtitleEntry } from '../types';

export interface Project {
  id: string;
  name: string;
  subtitles: SubtitleEntry[];
  createdAt: number;
  updatedAt: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: number;
}

export async function saveProject(project: Project): Promise<void> {
  project.updatedAt = Date.now();
  await set(`project:${project.id}`, project);
}

export async function loadProject(id: string): Promise<Project | null> {
  const result = await get<Project>(`project:${id}`);
  return result ?? null;
}

export async function deleteProject(id: string): Promise<void> {
  await del(`project:${id}`);
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const allKeys = await keys<string>();
  const summaries: ProjectSummary[] = [];

  for (const key of allKeys) {
    if (key.startsWith('project:')) {
      const project = await get<Project>(key);
      if (project) {
        summaries.push({
          id: project.id,
          name: project.name,
          updatedAt: project.updatedAt,
        });
      }
    }
  }

  return summaries.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function generateProjectName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes} LEGENDA`;
}
