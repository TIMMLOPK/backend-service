import type { Course, Lesson, UserProgress, SubjectMastery, ActivityDay, HintMessage } from "./types"
import {
  COURSES,
  LESSONS,
  USER_PROGRESS,
  SUBJECT_MASTERY,
  ACTIVITY_DATA,
  CURRENT_USER,
} from "./mock-data"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ""

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    })
    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
    return res.json() as Promise<T>
  }
  return Promise.resolve(undefined as unknown as T)
}

export async function getCourses(): Promise<Course[]> {
  if (!API_BASE) return COURSES
  return apiFetch<Course[]>("/api/courses")
}

export async function getCourse(courseId: string): Promise<Course | undefined> {
  if (!API_BASE) return COURSES.find((c) => c.id === courseId)
  return apiFetch<Course>(`/api/courses/${courseId}`)
}

export async function getLessons(courseId: string): Promise<Lesson[]> {
  if (!API_BASE) return LESSONS[courseId] ?? []
  return apiFetch<Lesson[]>(`/api/courses/${courseId}/lessons`)
}

export async function getLesson(courseId: string, lessonId: string): Promise<Lesson | undefined> {
  if (!API_BASE) return LESSONS[courseId]?.find((l) => l.id === lessonId)
  return apiFetch<Lesson>(`/api/courses/${courseId}/lessons/${lessonId}`)
}

export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  if (!API_BASE) return USER_PROGRESS.filter((p) => p.userId === userId)
  return apiFetch<UserProgress[]>(`/api/progress/${userId}`)
}

export async function getSubjectMastery(userId: string): Promise<SubjectMastery[]> {
  if (!API_BASE) {
    void userId
    return SUBJECT_MASTERY
  }
  return apiFetch<SubjectMastery[]>(`/api/progress/${userId}/mastery`)
}

export async function getActivityData(userId: string): Promise<ActivityDay[]> {
  if (!API_BASE) {
    void userId
    return ACTIVITY_DATA
  }
  return apiFetch<ActivityDay[]>(`/api/progress/${userId}/activity`)
}

export async function sendHintMessage(
  message: string,
  context: { courseId: string; lessonId: string; history: HintMessage[] }
): Promise<Response> {
  return fetch("/api/ai/hint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, ...context }),
  })
}

export function getLevelInfo(xp: number): { level: number; title: string; nextLevelXp: number; currentLevelXp: number } {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500]
  const titles = ["Beginner", "Apprentice", "Student", "Scholar", "Learner", "Explorer", "Adept", "Expert", "Master", "Grandmaster"]

  let level = 1
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) {
      level = i + 1
      break
    }
  }

  const currentLevelXp = thresholds[level - 1]
  const nextLevelXp = thresholds[level] ?? thresholds[thresholds.length - 1]

  return {
    level,
    title: titles[level - 1],
    currentLevelXp,
    nextLevelXp,
  }
}

export { CURRENT_USER }
