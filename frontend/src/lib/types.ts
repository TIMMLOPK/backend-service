export type UserType = "admin" | "student" | "parent" | "supervised_student";

export interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  user_type: UserType;
  supervisor?: User | null;
  dependants?: User[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface RegisterRequest {
  username: string;
  full_name: string;
  email: string;
  password: string;
  user_type: "student" | "parent";
}

export interface CreateDependantRequest {
  username: string;
  full_name: string;
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  status: number;
  data: T;
}

export type TopicCategory =
  | "Mathematics"
  | "Science"
  | "English"
  | "History"
  | "Geography"
  | "Computer Science"
  | "Art"
  | "Music"
  | "Languages"
  | "Physical Education";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type CourseStatus = "draft" | "creating" | "published";

// Backend-matching types
export type CourseType = "academic" | "hobby" | "job";
export type CourseDifficulty = "beginner" | "intermediate" | "advanced" | "expert";
export type CourseTopic = "math" | "science" | "history" | "art" | "music" | "other";
export type CoursePublicity = "public" | "private";

export type CourseGenerationStatus = "generating" | "ready" | "failed";

export interface Course {
  id: string;
  name: string;
  description: string;
  type: CourseType;
  difficulty: CourseDifficulty;
  topic: CourseTopic;
  colour: string;
  estimated_hours: number;
  tags: string[];
  publicity: CoursePublicity;
  status: CourseGenerationStatus;
  created_at: string;
}

export interface SectionTitle {
  index: number;
  title: string;
  is_completed: boolean;
}

export interface MaterialProgress {
  material_id: string;
  type: CourseMaterialType;
  title: string;
  total_sections: number;
  completed_sections: number;
  section_titles: SectionTitle[];
}

export interface RecentScore {
  material_id: string;
  section_index: number;
  score: number;
  total: number;
  created_at: string;
}

export interface CourseProgress {
  course_id: string;
  materials: MaterialProgress[];
  recent_scores: RecentScore[];
}

export interface DashboardSummary {
  total_sections: number;
  completed_sections: number;
  courses_with_progress: CourseProgress[];
  best_quiz_percentage: number | null;
}

// Course material types
export interface LectureData {
  content: string;
}

export interface FlashcardData {
  question: string;
  answer: string;
}

export interface FlashcardSetData {
  flashcards: FlashcardData[];
}

export interface QuizAnswerData {
  answer: string;
  is_correct: boolean;
}

export interface QuizQuestionData {
  question: string;
  answers: QuizAnswerData[];
}

export interface QuizData {
  questions: QuizQuestionData[];
}

export interface FillInTheBlankData {
  question: string;
  answers: string[];
}

export interface MultipleChoiceAnswerData {
  answer: string;
  is_correct: boolean;
}

export interface MultipleChoiceQuestionData {
  question: string;
  answers: MultipleChoiceAnswerData[];
}

export interface MultipleChoiceData {
  questions: MultipleChoiceQuestionData[];
}

export interface MatchingPairData {
  left: string;
  right: string;
}

export interface MatchingData {
  pairs: MatchingPairData[];
  instruction: string;
}

export interface OrderingData {
  items: string[];
  instruction: string;
}

export interface TrueFalseStatementData {
  statement: string;
  is_true: boolean;
  explanation: string;
}

export interface TrueFalseData {
  statements: TrueFalseStatementData[];
}

export interface CaseStudyQuestionData {
  question: string;
  sample_answer: string;
}

export interface CaseStudyData {
  scenario: string;
  questions: CaseStudyQuestionData[];
}

export interface SortingCategoryData {
  name: string;
  items: string[];
}

export interface SortingData {
  instruction: string;
  categories: SortingCategoryData[];
}

export interface SpotlightItemData {
  type: "fact" | "tip" | "mnemonic" | "analogy";
  content: string;
}

export interface SpotlightData {
  highlights: SpotlightItemData[];
}

export interface MaterialSection {
  index: number;
  title: string;
  material:
    | LectureData
    | FlashcardSetData
    | QuizData
    | FillInTheBlankData
    | MultipleChoiceData
    | MatchingData
    | OrderingData
    | TrueFalseData
    | CaseStudyData
    | SortingData
    | SpotlightData;
  is_completed: boolean;
}

export type CourseMaterialType =
  | "lecture"
  | "flashcards"
  | "quiz"
  | "fill_in_the_blank"
  | "multiple_choice"
  | "matching"
  | "ordering"
  | "true_false"
  | "case_study"
  | "sorting"
  | "spotlight";

export interface CourseMaterial {
  id: string;
  course_id: string;
  type: CourseMaterialType;
  data: MaterialSection[];
  title: string;
  description: string;
  is_completed: boolean;
}

export interface GenerateCourseRequest {
  topic: string;
  difficulty: CourseDifficulty;
  course_type: CourseType;
  additional_details?: string;
}

export interface GenerateCourseResponse {
  course: Course;
}

// Quiz score types
export interface QuizAnswerRecord {
  question_index: number;
  selected_answer_indices: number[];
  is_correct: boolean;
}

export interface SubmitQuizRequest {
  section_index: number;
  answers: QuizAnswerRecord[];
}

export interface QuizScoreData {
  id: string;
  score: number;
  total: number;
}

// Journey types
export interface JourneyStep {
  step_index: number;
  material_type: CourseMaterialType;
  material_id: string;
  section_index: number;
  subtopic_title: string;
  is_completed: boolean;
}

export interface JourneyView {
  steps: JourneyStep[];
  total_steps: number;
  completed_steps: number;
  recommended_step_index: number | null;
}

// Parent / child monitoring types
export interface ChildOverview {
  id: string;
  username: string;
  full_name: string;
  email: string;
  course_count: number;
  total_sections: number;
  completed_sections: number;
  completion_pct: number;
}

export interface ChildCourse extends Course {
  total_sections: number;
  completed_sections: number;
  completion_pct: number;
}

export interface ChildSummary {
  child: {
    id: string;
    username: string;
    full_name: string;
    email: string;
  };
  total_sections: number;
  completed_sections: number;
  courses_with_progress: CourseProgress[];
  best_quiz_percentage: number | null;
}

// Specialisation types
export interface TrackSuggestion {
  title: string;
  description: string;
  subtopics: string[];
}

export interface WeakArea {
  subtopic_title: string;
  average_score_pct: number;
}
