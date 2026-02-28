import type { CourseDifficulty, CourseMaterialType, CourseTopic, TopicCategory, UserType } from "./types";

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  CHILDREN: "/children",
  COURSES: "/courses",
  COURSE_CREATE: "/courses/create",
} as const;

export const USER_TYPE_LABELS: Record<UserType, string> = {
  admin: "Administrator",
  student: "Student",
  parent: "Parent",
  supervised_student: "Student (Supervised)",
};

export const TOPIC_COLORS: Record<TopicCategory, { bg: string; text: string }> =
  {
    Mathematics: { bg: "bg-primary/20", text: "text-primary-foreground" },
    Science: { bg: "bg-emerald-100", text: "text-emerald-700" },
    English: { bg: "bg-sky-100", text: "text-sky-700" },
    History: { bg: "bg-amber-100", text: "text-amber-700" },
    Geography: { bg: "bg-teal-100", text: "text-teal-700" },
    "Computer Science": { bg: "bg-primary/20", text: "text-primary-foreground" },
    Art: { bg: "bg-pink-100", text: "text-pink-700" },
    Music: { bg: "bg-rose-100", text: "text-rose-700" },
    Languages: { bg: "bg-cyan-100", text: "text-cyan-700" },
    "Physical Education": { bg: "bg-orange-100", text: "text-orange-700" },
  };

export const DIFFICULTY_COLORS: Record<
  string,
  { bg: string; text: string }
> = {
  Beginner: { bg: "bg-green-100", text: "text-green-700" },
  Intermediate: { bg: "bg-yellow-100", text: "text-yellow-700" },
  Advanced: { bg: "bg-red-100", text: "text-red-700" },
  beginner: { bg: "bg-green-100", text: "text-green-700" },
  intermediate: { bg: "bg-yellow-100", text: "text-yellow-700" },
  advanced: { bg: "bg-red-100", text: "text-red-700" },
  expert: { bg: "bg-purple-100", text: "text-purple-700" },
};

export const TOPIC_GRADIENTS: Record<CourseTopic, [string, string]> = {
  math: ["#8b5cf6", "#6366f1"],
  science: ["#10b981", "#06b6d4"],
  history: ["#f59e0b", "#ef4444"],
  art: ["#ec4899", "#f43f5e"],
  music: ["#e11d48", "#be185d"],
  other: ["#6366f1", "#8b5cf6"],
};

export const TOPIC_LABELS: Record<CourseTopic, string> = {
  math: "Mathematics",
  science: "Science",
  history: "History",
  art: "Art",
  music: "Music",
  other: "Other",
};

export const DIFFICULTY_LABELS: Record<CourseDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export const MATERIAL_TYPE_LABELS: Record<CourseMaterialType, string> = {
  lecture: "Lecture",
  flashcards: "Flashcards",
  quiz: "Quiz",
  fill_in_the_blank: "Exercises",
  multiple_choice: "Multi-Select",
  matching: "Matching",
  ordering: "Ordering",
  true_false: "True or False",
  case_study: "Case Study",
  sorting: "Sorting",
  spotlight: "Spotlight",
};
