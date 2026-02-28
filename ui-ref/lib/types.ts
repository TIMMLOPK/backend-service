export type UserRole = "student" | "parent" | "instructor" | "admin"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  xp: number
  level: number
  streak: number
  joinedAt: string
  linkedChildIds?: string[]
  linkedParentIds?: string[]
}

export type CourseLevel = "beginner" | "intermediate" | "advanced" | "expert"
export type CourseCategory =
  | "computer-science"
  | "mathematics"
  | "science"
  | "language"
  | "history"
  | "arts"
  | "business"
  | "engineering"

export interface Course {
  id: string
  title: string
  description: string
  category: CourseCategory
  level: CourseLevel
  instructorId: string
  instructorName: string
  thumbnailUrl?: string
  totalLessons: number
  estimatedHours: number
  tags: string[]
  createdAt: string
  isPublic: boolean
}

export type LessonType = "reading" | "video" | "quiz" | "coding" | "interactive"

export interface Lesson {
  id: string
  courseId: string
  title: string
  type: LessonType
  order: number
  content: string
  estimatedMinutes: number
  xpReward: number
}

export interface QuizQuestion {
  id: string
  lessonId: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface UserProgress {
  userId: string
  courseId: string
  lessonsCompleted: string[]
  lastLessonId?: string
  startedAt: string
  completedAt?: string
  score: number
}

export interface SubjectMastery {
  subject: string
  mastery: number
  lessonsAttempted: number
  averageScore: number
}

export interface ActivityDay {
  date: string
  minutesStudied: number
  lessonsCompleted: number
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earnedAt?: string
}

// ---------------------------------------------------------------------------
// Interactive component catalog types
// ---------------------------------------------------------------------------

export type ComponentType =
  | "Quiz"
  | "Flashcard"
  | "CodeExercise"
  | "Chart"
  | "VideoEmbed"
  | "Callout"

export type ChartType = "bar" | "line" | "pie" | "scatter"
export type CodeLanguage = "python" | "javascript" | "java" | "c" | "sql"
export type CalloutType = "info" | "warning" | "tip" | "danger"
export type Difficulty = "easy" | "medium" | "hard"

export interface QuizProps {
  question: string
  options: string[]
  correct_index: number
  explanation?: string
  difficulty?: Difficulty
}

export interface FlashcardProps {
  front: string
  back: string
  tags?: string[]
  hint?: string
}

export interface CodeTestCase {
  input: string
  expected_output: string
}

export interface CodeExerciseProps {
  language: CodeLanguage
  starter_code: string
  solution: string
  test_cases: CodeTestCase[]
  instructions: string
}

export interface ChartDataPoint {
  [key: string]: string | number
}

export interface ChartProps {
  chart_type: ChartType
  title: string
  data: ChartDataPoint[]
  data_url?: string
  axes?: { x: string; y: string }
}

export interface VideoEmbedProps {
  url: string
  caption?: string
  start_time?: number
  end_time?: number
}

export interface CalloutProps {
  type: CalloutType
  title: string
  body_markdown: string
}

export type ComponentProps =
  | QuizProps
  | FlashcardProps
  | CodeExerciseProps
  | ChartProps
  | VideoEmbedProps
  | CalloutProps

export interface ComponentInstance {
  id: string
  type: ComponentType
  props: ComponentProps
}

export interface HintMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface Enrollment {
  userId: string
  courseId: string
  enrolledAt: string
  progress: number
}

// ---------------------------------------------------------------------------
// Engagement analytics types
// ---------------------------------------------------------------------------

export interface ComponentInteraction {
  componentId: string
  componentType: string
  timestamp: number
  success: boolean
  attemptCount: number
}

export interface SectionEngagement {
  sectionId: string
  sectionTitle: string
  sectionIndex: number
  timeVisibleMs: number
  revisitCount: number
  componentInteractions: ComponentInteraction[]
}

export interface LessonEngagementSession {
  sessionId: string
  userId: string
  lessonId: string
  courseId: string
  startedAt: number
  endedAt: number
  scrollDepthPct: number
  sections: SectionEngagement[]
  hintsRequested: number
  lessonCompleted: boolean
}

export interface ContentAdjustment {
  sectionId: string
  sectionTitle: string
  struggleScore: number
  suggestions: string[]
  additionalContent?: string
}
