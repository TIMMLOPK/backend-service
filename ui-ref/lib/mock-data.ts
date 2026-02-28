import type {
  User,
  Course,
  Lesson,
  QuizQuestion,
  UserProgress,
  SubjectMastery,
  ActivityDay,
  Badge,
  Enrollment,
  ComponentInstance,
} from "./types"

export const CURRENT_USER: User = {
  id: "user-1",
  name: "Alex Chen",
  email: "alex.chen@example.com",
  role: "student",
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  xp: 3420,
  level: 8,
  streak: 14,
  joinedAt: "2025-09-01",
  linkedParentIds: ["user-parent-1"],
}

export const USERS: User[] = [
  CURRENT_USER,
  {
    id: "user-parent-1",
    name: "David Chen",
    email: "david.chen@example.com",
    role: "parent",
    xp: 0,
    level: 1,
    streak: 0,
    joinedAt: "2025-09-01",
    linkedChildIds: ["user-1"],
  },
  {
    id: "instructor-1",
    name: "Dr. Sarah Park",
    email: "sarah.park@hku.hk",
    role: "instructor",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    xp: 12000,
    level: 25,
    streak: 90,
    joinedAt: "2024-01-15",
  },
  {
    id: "instructor-2",
    name: "Prof. James Liu",
    email: "james.liu@example.com",
    role: "instructor",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    xp: 8500,
    level: 18,
    streak: 45,
    joinedAt: "2024-03-20",
  },
]

export const COURSES: Course[] = [
  {
    id: "course-cs101",
    title: "Introduction to Computer Science",
    description:
      "A comprehensive introduction covering algorithms, data structures, and fundamental programming concepts. Perfect for beginners and CS undergrads.",
    category: "computer-science",
    level: "intermediate",
    instructorId: "instructor-1",
    instructorName: "Dr. Sarah Park",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=60",
    totalLessons: 24,
    estimatedHours: 48,
    tags: ["algorithms", "data structures", "python", "HKU"],
    createdAt: "2024-08-01",
    isPublic: true,
  },
  {
    id: "course-calc1",
    title: "Calculus I: Limits & Derivatives",
    description:
      "Master the foundations of calculus — limits, continuity, and differentiation. Includes interactive graphing tools and adaptive practice problems.",
    category: "mathematics",
    level: "intermediate",
    instructorId: "instructor-2",
    instructorName: "Prof. James Liu",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=60",
    totalLessons: 18,
    estimatedHours: 36,
    tags: ["calculus", "mathematics", "derivatives", "limits"],
    createdAt: "2024-09-10",
    isPublic: true,
  },
  {
    id: "course-pyml",
    title: "Machine Learning with Python",
    description:
      "Hands-on ML course using scikit-learn, TensorFlow, and real datasets. Build and deploy models from scratch.",
    category: "computer-science",
    level: "advanced",
    instructorId: "instructor-1",
    instructorName: "Dr. Sarah Park",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&auto=format&fit=crop&q=60",
    totalLessons: 32,
    estimatedHours: 80,
    tags: ["machine learning", "python", "tensorflow", "AI"],
    createdAt: "2024-10-05",
    isPublic: true,
  },
  {
    id: "course-web101",
    title: "Web Development Fundamentals",
    description:
      "Learn HTML, CSS, and JavaScript from the ground up. Build responsive websites and understand how the web works.",
    category: "computer-science",
    level: "beginner",
    instructorId: "instructor-2",
    instructorName: "Prof. James Liu",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&auto=format&fit=crop&q=60",
    totalLessons: 20,
    estimatedHours: 30,
    tags: ["html", "css", "javascript", "web"],
    createdAt: "2024-07-15",
    isPublic: true,
  },
  {
    id: "course-phys1",
    title: "Physics: Mechanics & Motion",
    description:
      "Explore Newton's laws, kinematics, and energy conservation with simulations and real-world problem sets.",
    category: "science",
    level: "beginner",
    instructorId: "instructor-2",
    instructorName: "Prof. James Liu",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&auto=format&fit=crop&q=60",
    totalLessons: 16,
    estimatedHours: 24,
    tags: ["physics", "mechanics", "newton", "energy"],
    createdAt: "2025-01-10",
    isPublic: true,
  },
  {
    id: "course-algo",
    title: "Algorithms & Complexity",
    description:
      "Deep dive into sorting, searching, graphs, dynamic programming, and Big-O analysis. Essential for technical interviews.",
    category: "computer-science",
    level: "advanced",
    instructorId: "instructor-1",
    instructorName: "Dr. Sarah Park",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop&q=60",
    totalLessons: 28,
    estimatedHours: 56,
    tags: ["algorithms", "big-o", "graphs", "dynamic programming"],
    createdAt: "2025-02-01",
    isPublic: true,
  },
]

export const LESSONS: Record<string, Lesson[]> = {
  "course-cs101": [
    {
      id: "lesson-cs-1",
      courseId: "course-cs101",
      title: "What is Computer Science?",
      type: "reading",
      order: 1,
      estimatedMinutes: 15,
      xpReward: 50,
      content: `## What is Computer Science?

Computer science is the study of **computation**, **information**, and **automation**. It involves both theoretical disciplines (such as algorithms, theory of computation, and information theory) and practical disciplines (such as the design and implementation of hardware and software).

### Key Areas

- **Algorithms & Data Structures** — The backbone of efficient software
- **Programming Languages** — How we instruct computers to solve problems  
- **Computer Architecture** — How hardware is designed and organized
- **Operating Systems** — The bridge between hardware and software
- **Artificial Intelligence** — Teaching machines to reason and learn

{{component:comp-callout-001}}

### Why Study Computer Science?

> "Everybody in this country should learn to program a computer, because it teaches you how to think." — Steve Jobs

Computer science teaches **computational thinking** — a way of solving problems by breaking them down into steps a machine can execute. This skill is valuable across every field, from biology to finance.

### Your First Algorithm

An algorithm is just a set of step-by-step instructions. Here's a simple example:

\`\`\`python
def find_maximum(numbers):
    max_val = numbers[0]
    for num in numbers:
        if num > max_val:
            max_val = num
    return max_val

result = find_maximum([3, 7, 2, 9, 1])
print(result)  # Output: 9
\`\`\`

This algorithm scans a list once, keeping track of the largest value seen — **O(n)** time complexity.

{{component:comp-flashcard-001}}

### Check Your Understanding

{{component:comp-quiz-001}}`,
    },
    {
      id: "lesson-cs-2",
      courseId: "course-cs101",
      title: "Variables, Types & Control Flow",
      type: "reading",
      order: 2,
      estimatedMinutes: 20,
      xpReward: 60,
      content: `## Variables, Types & Control Flow

### Variables

A **variable** is a named storage location in memory.

\`\`\`python
name = "Alice"      # string
age = 21            # integer
gpa = 3.85          # float
is_enrolled = True  # boolean
\`\`\`

{{component:comp-callout-002}}

### Control Flow

Programs make decisions using **conditional statements**:

\`\`\`python
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"

print(f"Your grade: {grade}")  # Your grade: B
\`\`\`

### Loops

\`\`\`python
# Count from 1 to 5
for i in range(1, 6):
    print(i)

# Sum all elements
total = 0
numbers = [10, 20, 30, 40]
for n in numbers:
    total += n
print(total)  # 100
\`\`\`

{{component:comp-flash-002}}

### Quick Check

{{component:comp-quiz-002}}`,
    },
    {
      id: "lesson-cs-3",
      courseId: "course-cs101",
      title: "Functions & Recursion",
      type: "coding",
      order: 3,
      estimatedMinutes: 30,
      xpReward: 80,
      content: `## Functions & Recursion

### Defining Functions

Functions are reusable blocks of code:

{{component:comp-video-001}}

\`\`\`python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Bob"))           # Hello, Bob!
print(greet("Alice", "Hi"))   # Hi, Alice!
\`\`\`

### Recursion

A function that calls itself is **recursive**. Classic example — factorial:

\`\`\`python
def factorial(n):
    if n <= 1:          # base case
        return 1
    return n * factorial(n - 1)   # recursive case

print(factorial(5))  # 120
\`\`\`

**Call stack visualization for factorial(4):**

\`\`\`
factorial(4)
  → 4 * factorial(3)
       → 3 * factorial(2)
            → 2 * factorial(1)
                 → 1
\`\`\`

### Fibonacci Sequence

\`\`\`python
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)

# First 8 Fibonacci numbers
for i in range(8):
    print(fib(i), end=" ")
# 0 1 1 2 3 5 8 13
\`\`\`

{{component:comp-chart-001}}

### Practice

{{component:comp-code-001}}`,
    },
    {
      id: "lesson-cs-4",
      courseId: "course-cs101",
      title: "Arrays & Lists",
      type: "reading",
      order: 4,
      estimatedMinutes: 25,
      xpReward: 70,
      content: `## Arrays & Lists

Arrays store multiple values in a single variable, accessed by index.

{{component:comp-callout-003}}

### Python Lists

\`\`\`python
fruits = ["apple", "banana", "cherry"]
print(fruits[0])   # apple
print(fruits[-1])  # cherry (last element)

# Slicing
print(fruits[0:2])  # ['apple', 'banana']
\`\`\`

### Common Operations

\`\`\`python
nums = [3, 1, 4, 1, 5, 9, 2, 6]

nums.append(7)        # add to end
nums.insert(0, 0)     # insert at index 0
nums.remove(1)        # remove first occurrence of 1
nums.sort()           # sort in place
nums.reverse()        # reverse in place

print(len(nums))      # length
print(sum(nums))      # sum
print(max(nums))      # maximum
\`\`\`

{{component:comp-flash-003}}

### Practice: List Filtering

{{component:comp-code-002}}

### Knowledge Check

{{component:comp-quiz-003}}`,
    },
    {
      id: "lesson-cs-5",
      courseId: "course-cs101",
      title: "Introduction to Algorithms",
      type: "reading",
      order: 5,
      estimatedMinutes: 35,
      xpReward: 90,
      content: `## Introduction to Algorithms

An **algorithm** is a finite sequence of well-defined instructions for solving a problem.

### Characteristics of Good Algorithms

1. **Correctness** — Produces the right answer for all valid inputs
2. **Efficiency** — Runs in reasonable time and space
3. **Clarity** — Easy to understand and implement
4. **Finiteness** — Always terminates

### Big-O Notation

Big-O describes how runtime **scales** with input size:

| Notation | Name | Example |
|---|---|---|
| O(1) | Constant | Array index access |
| O(log n) | Logarithmic | Binary search |
| O(n) | Linear | Linear scan |
| O(n log n) | Linearithmic | Merge sort |
| O(n²) | Quadratic | Bubble sort |
| O(2ⁿ) | Exponential | Naive Fibonacci |

{{component:comp-chart-002}}

### Binary Search

\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1  # not found

sorted_arr = [2, 5, 8, 12, 16, 23, 38, 56]
print(binary_search(sorted_arr, 23))  # 5
\`\`\`

{{component:comp-callout-004}}

{{component:comp-flash-004}}

### Check Your Understanding

{{component:comp-quiz-004}}`,
    },
  ],
  "course-calc1": [
    {
      id: "lesson-calc-1",
      courseId: "course-calc1",
      title: "Understanding Limits",
      type: "reading",
      order: 1,
      estimatedMinutes: 20,
      xpReward: 50,
      content: `## Understanding Limits

The **limit** is the fundamental concept underlying all of calculus.

### Informal Definition

The limit of f(x) as x approaches a is L if f(x) gets arbitrarily close to L as x gets arbitrarily close to a.

We write: **lim(x→a) f(x) = L**

{{component:comp-callout-005}}

### Example

Consider f(x) = (x² - 1)/(x - 1):

At x = 1, this is 0/0 — undefined. But let's factor:

\`\`\`
f(x) = (x-1)(x+1) / (x-1) = x + 1   (for x ≠ 1)
\`\`\`

So **lim(x→1) f(x) = 2**, even though f(1) is undefined.

### One-sided Limits

- **Left-hand limit**: lim(x→a⁻) f(x)
- **Right-hand limit**: lim(x→a⁺) f(x)

The two-sided limit exists **only if** both one-sided limits exist and are equal.

{{component:comp-flash-005}}

### Check Your Understanding

{{component:comp-quiz-005}}`,
    },
    {
      id: "lesson-calc-2",
      courseId: "course-calc1",
      title: "Continuity",
      type: "reading",
      order: 2,
      estimatedMinutes: 20,
      xpReward: 55,
      content: `## Continuity

A function f is **continuous at x = a** if:

1. f(a) is defined
2. lim(x→a) f(x) exists
3. lim(x→a) f(x) = f(a)

### Types of Discontinuities

- **Removable**: A hole in the graph (the limit exists but ≠ f(a))
- **Jump**: Left and right limits exist but are unequal
- **Infinite**: The function goes to ±∞

{{component:comp-callout-006}}

### Intermediate Value Theorem

If f is continuous on [a, b] and N is any value between f(a) and f(b), then there exists c in (a, b) such that f(c) = N.

**Practical use**: If f(0) = -1 and f(1) = 3, then f has at least one root in (0, 1).

### Quick Check

{{component:comp-quiz-006}}`,
    },
    {
      id: "lesson-calc-3",
      courseId: "course-calc1",
      title: "Introduction to Derivatives",
      type: "reading",
      order: 3,
      estimatedMinutes: 25,
      xpReward: 70,
      content: `## Introduction to Derivatives

The **derivative** measures the instantaneous rate of change of a function.

### Definition

The derivative of f at x is:

\`\`\`
f'(x) = lim(h→0) [f(x+h) - f(x)] / h
\`\`\`

{{component:comp-video-002}}

### Basic Rules

| Rule | Formula |
|---|---|
| Power Rule | d/dx [xⁿ] = n·xⁿ⁻¹ |
| Constant Rule | d/dx [c] = 0 |
| Sum Rule | d/dx [f+g] = f'+g' |
| Product Rule | d/dx [fg] = f'g + fg' |

### Examples

\`\`\`
f(x) = x³  →  f'(x) = 3x²
g(x) = 5x² + 2x  →  g'(x) = 10x + 2
h(x) = 7  →  h'(x) = 0
\`\`\`

{{component:comp-flash-006}}

### Knowledge Check

{{component:comp-quiz-007}}`,
    },
    {
      id: "lesson-calc-4",
      courseId: "course-calc1",
      title: "Chain Rule & Composite Functions",
      type: "reading",
      order: 4,
      estimatedMinutes: 30,
      xpReward: 80,
      content: `## Chain Rule & Composite Functions

The **chain rule** differentiates composite functions f(g(x)).

### The Rule

\`\`\`
d/dx [f(g(x))] = f'(g(x)) · g'(x)
\`\`\`

Think of it as: **"derivative of outside × derivative of inside"**.

### Examples

\`\`\`
y = (3x + 1)⁵
  outer: u⁵ → 5u⁴
  inner: 3x+1 → 3
  y' = 5(3x+1)⁴ · 3 = 15(3x+1)⁴

y = sin(x²)
  outer: sin(u) → cos(u)
  inner: x² → 2x
  y' = cos(x²) · 2x
\`\`\`

{{component:comp-callout-007}}

### Practice

{{component:comp-code-003}}

### Check Your Understanding

{{component:comp-quiz-008}}`,
    },
    {
      id: "lesson-calc-5",
      courseId: "course-calc1",
      title: "Applications of Derivatives",
      type: "reading",
      order: 5,
      estimatedMinutes: 35,
      xpReward: 90,
      content: `## Applications of Derivatives

Derivatives tell us about the **shape** and **behaviour** of functions.

### Finding Extrema

A **critical point** occurs where f'(x) = 0 or f'(x) is undefined.

- If f''(x) > 0 at a critical point → **local minimum**
- If f''(x) < 0 at a critical point → **local maximum**

\`\`\`
f(x) = x³ - 3x
f'(x) = 3x² - 3 = 0  →  x = ±1
f''(x) = 6x
f''(1) = 6 > 0  →  local min at x=1
f''(-1) = -6 < 0 → local max at x=-1
\`\`\`

### Velocity & Acceleration

If s(t) is **position**, then:
- **Velocity**: v(t) = s'(t)
- **Acceleration**: a(t) = v'(t) = s''(t)

{{component:comp-chart-003}}

{{component:comp-callout-008}}

### Knowledge Check

{{component:comp-quiz-009}}`,
    },
  ],
  "course-web101": [
    {
      id: "lesson-web-1",
      courseId: "course-web101",
      title: "HTML: Structure of the Web",
      type: "reading",
      order: 1,
      estimatedMinutes: 20,
      xpReward: 50,
      content: `## HTML: Structure of the Web

**HTML** (HyperText Markup Language) defines the structure and content of web pages using **elements** wrapped in tags.

### Anatomy of an Element

\`\`\`html
<p class="intro">Hello, world!</p>
<!-- opening tag  content  closing tag -->
\`\`\`

{{component:comp-callout-009}}

### A Minimal Page

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My Page</title>
  </head>
  <body>
    <h1>Welcome</h1>
    <p>This is a paragraph.</p>
  </body>
</html>
\`\`\`

### Semantic Elements

Semantic tags carry **meaning** beyond presentation:

| Tag | Meaning |
|---|---|
| \`<header>\` | Page or section header |
| \`<nav>\` | Navigation links |
| \`<main>\` | Primary content |
| \`<article>\` | Self-contained content |
| \`<footer>\` | Page or section footer |

{{component:comp-flash-007}}

### Practice: Build a Card

{{component:comp-code-004}}`,
    },
    {
      id: "lesson-web-2",
      courseId: "course-web101",
      title: "CSS: Styling the Web",
      type: "reading",
      order: 2,
      estimatedMinutes: 25,
      xpReward: 65,
      content: `## CSS: Styling the Web

**CSS** (Cascading Style Sheets) controls the visual presentation of HTML elements.

### Selectors & Properties

\`\`\`css
/* element selector */
p { color: #374151; font-size: 16px; }

/* class selector */
.card { background: white; border-radius: 8px; padding: 16px; }

/* id selector */
#hero { background: linear-gradient(135deg, #667eea, #764ba2); }
\`\`\`

### The Box Model

Every element is a rectangular box with four layers:

\`\`\`
+----------------------------+
|          margin            |
|  +----------------------+  |
|  |       border         |  |
|  |  +--------------+   |  |
|  |  |   padding    |   |  |
|  |  |  +--------+  |   |  |
|  |  |  | content|  |   |  |
|  |  |  +--------+  |   |  |
|  |  +--------------+   |  |
|  +----------------------+  |
+----------------------------+
\`\`\`

{{component:comp-callout-010}}

### Flexbox Basics

\`\`\`css
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
\`\`\`

{{component:comp-video-003}}

### Knowledge Check

{{component:comp-quiz-010}}`,
    },
    {
      id: "lesson-web-3",
      courseId: "course-web101",
      title: "JavaScript: Making Pages Interactive",
      type: "coding",
      order: 3,
      estimatedMinutes: 35,
      xpReward: 85,
      content: `## JavaScript: Making Pages Interactive

**JavaScript** brings behaviour to web pages — responding to events, updating content, and communicating with servers.

### Variables & Functions

\`\`\`javascript
// Modern variable declarations
const name = "Alice"    // immutable binding
let count = 0           // mutable binding

function greet(person) {
  return \`Hello, \${person}!\`
}

// Arrow function
const double = (n) => n * 2
\`\`\`

### DOM Manipulation

\`\`\`javascript
const btn = document.querySelector("#myButton")
const counter = document.querySelector("#count")

btn.addEventListener("click", () => {
  count++
  counter.textContent = count
})
\`\`\`

{{component:comp-callout-011}}

### Fetch API

\`\`\`javascript
async function loadUser(id) {
  const res = await fetch(\`/api/users/\${id}\`)
  const user = await res.json()
  console.log(user.name)
}
\`\`\`

### Practice: Counter Component

{{component:comp-code-005}}

### Knowledge Check

{{component:comp-quiz-011}}`,
    },
    {
      id: "lesson-web-4",
      courseId: "course-web101",
      title: "Responsive Design",
      type: "reading",
      order: 4,
      estimatedMinutes: 25,
      xpReward: 70,
      content: `## Responsive Design

Responsive websites adapt their layout to any screen size — from phones to 4K monitors.

### Media Queries

\`\`\`css
/* Mobile first (default styles) */
.grid { grid-template-columns: 1fr; }

/* Tablet and up */
@media (min-width: 768px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop */
@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
\`\`\`

### Common Breakpoints

{{component:comp-chart-004}}

### The Viewport Meta Tag

Always include this in your HTML \`<head>\`:

\`\`\`html
<meta name="viewport" content="width=device-width, initial-scale=1" />
\`\`\`

{{component:comp-callout-012}}

### Knowledge Check

{{component:comp-quiz-012}}`,
    },
  ],
  "course-pyml": [
    {
      id: "lesson-ml-1",
      courseId: "course-pyml",
      title: "What is Machine Learning?",
      type: "reading",
      order: 1,
      estimatedMinutes: 20,
      xpReward: 55,
      content: `## What is Machine Learning?

**Machine learning** is a branch of AI where systems learn patterns from data rather than following explicit rules.

### Three Paradigms

- **Supervised Learning** — Learns from labelled examples (input → known output)
- **Unsupervised Learning** — Finds hidden structure in unlabelled data
- **Reinforcement Learning** — An agent learns by receiving rewards and penalties

{{component:comp-callout-013}}

### The ML Workflow

1. **Collect & clean data**
2. **Choose a model** (algorithm)
3. **Train** — fit model to training data
4. **Evaluate** — measure performance on unseen data
5. **Deploy** — serve predictions in production

### Where ML Shines

{{component:comp-chart-005}}

{{component:comp-flash-008}}

### Knowledge Check

{{component:comp-quiz-013}}`,
    },
    {
      id: "lesson-ml-2",
      courseId: "course-pyml",
      title: "Linear Regression",
      type: "reading",
      order: 2,
      estimatedMinutes: 30,
      xpReward: 75,
      content: `## Linear Regression

**Linear regression** models the relationship between a continuous output y and one or more inputs x.

### Simple Linear Regression

\`\`\`
y = mx + b
\`\`\`

Where **m** is the slope (weight) and **b** is the intercept (bias). We find the best m and b by minimising the **Mean Squared Error**:

\`\`\`
MSE = (1/n) Σ (yᵢ - ŷᵢ)²
\`\`\`

{{component:comp-video-004}}

### With scikit-learn

\`\`\`python
from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2.1, 3.9, 6.2, 7.8, 10.1])

model = LinearRegression()
model.fit(X, y)

print(f"Slope: {model.coef_[0]:.2f}")      # ~2.0
print(f"Intercept: {model.intercept_:.2f}") # ~0.1
print(f"Prediction for x=6: {model.predict([[6]])[0]:.2f}")
\`\`\`

### Visualising the Fit

{{component:comp-chart-006}}

### Knowledge Check

{{component:comp-quiz-014}}`,
    },
    {
      id: "lesson-ml-3",
      courseId: "course-pyml",
      title: "Classification & Decision Trees",
      type: "coding",
      order: 3,
      estimatedMinutes: 40,
      xpReward: 100,
      content: `## Classification & Decision Trees

**Classification** assigns inputs to discrete categories. A **Decision Tree** does this by learning a series of yes/no rules.

### How Decision Trees Work

At each **node**, the tree asks a question about a feature (e.g. "Is petal length > 2.5 cm?"). The answer routes the sample left or right until a **leaf node** gives the final class.

{{component:comp-callout-014}}

### With scikit-learn

\`\`\`python
from sklearn.datasets import load_iris
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

clf = DecisionTreeClassifier(max_depth=3)
clf.fit(X_train, y_train)

print(f"Accuracy: {clf.score(X_test, y_test):.2%}")
\`\`\`

### Key Hyperparameters

| Parameter | Effect |
|---|---|
| \`max_depth\` | Limits tree depth — prevents overfitting |
| \`min_samples_split\` | Minimum samples to split a node |
| \`criterion\` | Impurity measure: gini or entropy |

### Practice: Predict Iris Species

{{component:comp-code-006}}

### Knowledge Check

{{component:comp-quiz-015}}`,
    },
  ],
  "course-phys1": [
    {
      id: "lesson-phys-1",
      courseId: "course-phys1",
      title: "Newton's Three Laws of Motion",
      type: "reading",
      order: 1,
      estimatedMinutes: 20,
      xpReward: 50,
      content: `## Newton's Three Laws of Motion

Isaac Newton's three laws form the foundation of **classical mechanics**.

### First Law: Inertia

> An object at rest stays at rest, and an object in motion stays in motion, unless acted upon by a net external force.

**Inertia** is the resistance to change in motion. Mass is the measure of inertia.

### Second Law: F = ma

> The net force on an object equals its mass times acceleration.

\`\`\`
F = m × a
\`\`\`

{{component:comp-flash-009}}

If a 5 kg box accelerates at 3 m/s², the net force is **15 N**.

### Third Law: Action–Reaction

> For every action, there is an equal and opposite reaction.

When you push a wall, the wall pushes back with the same force. Rockets work because exhaust gas pushes backward, propelling the rocket forward.

{{component:comp-callout-015}}

### Knowledge Check

{{component:comp-quiz-016}}`,
    },
    {
      id: "lesson-phys-2",
      courseId: "course-phys1",
      title: "Kinematics: Motion in One Dimension",
      type: "reading",
      order: 2,
      estimatedMinutes: 25,
      xpReward: 65,
      content: `## Kinematics: Motion in One Dimension

**Kinematics** describes how objects move, without asking *why* they move.

### The Four Equations

For constant acceleration **a**:

\`\`\`
v = v₀ + at
x = x₀ + v₀t + ½at²
v² = v₀² + 2a(x - x₀)
x = x₀ + ½(v + v₀)t
\`\`\`

### Free Fall

Near Earth's surface, all objects accelerate downward at **g = 9.8 m/s²** (ignoring air resistance).

\`\`\`
A ball dropped from rest after 3 s:
v = 0 + 9.8 × 3 = 29.4 m/s
x = ½ × 9.8 × 3² = 44.1 m
\`\`\`

{{component:comp-video-005}}

### Velocity vs. Time Chart

{{component:comp-chart-007}}

### Knowledge Check

{{component:comp-quiz-017}}`,
    },
    {
      id: "lesson-phys-3",
      courseId: "course-phys1",
      title: "Work, Energy & Power",
      type: "coding",
      order: 3,
      estimatedMinutes: 30,
      xpReward: 80,
      content: `## Work, Energy & Power

### Work

Work is done when a force moves an object through a displacement:

\`\`\`
W = F · d · cos(θ)
\`\`\`

- **F** — applied force (N)
- **d** — displacement (m)
- **θ** — angle between force and displacement

### Kinetic Energy

The energy of motion:

\`\`\`
KE = ½mv²
\`\`\`

**Work-Energy Theorem**: The net work done on an object equals its change in kinetic energy.

### Potential Energy

\`\`\`
PE (gravitational) = mgh
\`\`\`

{{component:comp-callout-016}}

### Energy Conservation

{{component:comp-chart-008}}

### Practice: Compute KE and PE

{{component:comp-code-007}}

### Knowledge Check

{{component:comp-quiz-018}}`,
    },
  ],
  "course-algo": [
    {
      id: "lesson-algo-1",
      courseId: "course-algo",
      title: "Sorting Algorithms",
      type: "reading",
      order: 1,
      estimatedMinutes: 35,
      xpReward: 90,
      content: `## Sorting Algorithms

Sorting is the most thoroughly studied problem in computer science. Understanding the trade-offs between algorithms is essential for writing efficient code.

### Bubble Sort — O(n²)

Repeatedly swaps adjacent elements that are out of order.

\`\`\`python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
\`\`\`

### Merge Sort — O(n log n)

Divides the array in half, sorts each half, then merges.

\`\`\`python
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)
\`\`\`

### Algorithm Comparison

{{component:comp-chart-009}}

{{component:comp-flash-010}}

### Knowledge Check

{{component:comp-quiz-019}}`,
    },
    {
      id: "lesson-algo-2",
      courseId: "course-algo",
      title: "Graph Search: BFS & DFS",
      type: "reading",
      order: 2,
      estimatedMinutes: 40,
      xpReward: 100,
      content: `## Graph Search: BFS & DFS

Graphs model networks — social connections, road maps, dependency trees. Two fundamental traversal strategies are **BFS** and **DFS**.

### Breadth-First Search (BFS)

Explores neighbours level-by-level using a **queue**. Finds the *shortest path* in unweighted graphs.

\`\`\`python
from collections import deque

def bfs(graph, start):
    visited = set()
    queue = deque([start])
    visited.add(start)
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbour in graph[node]:
            if neighbour not in visited:
                visited.add(neighbour)
                queue.append(neighbour)
    return order
\`\`\`

### Depth-First Search (DFS)

Explores as deep as possible before backtracking, using a **stack** (or recursion).

\`\`\`python
def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    visited.add(start)
    for neighbour in graph[start]:
        if neighbour not in visited:
            dfs(graph, neighbour, visited)
    return visited
\`\`\`

{{component:comp-callout-017}}

{{component:comp-video-006}}

### Knowledge Check

{{component:comp-quiz-020}}`,
    },
    {
      id: "lesson-algo-3",
      courseId: "course-algo",
      title: "Dynamic Programming",
      type: "coding",
      order: 3,
      estimatedMinutes: 50,
      xpReward: 120,
      content: `## Dynamic Programming

**Dynamic programming (DP)** solves complex problems by breaking them into overlapping subproblems and caching results to avoid recomputation.

### Two Approaches

- **Top-down (memoisation)** — Recursive with a cache
- **Bottom-up (tabulation)** — Iterative, building from the smallest subproblems

### Classic Example: Fibonacci

\`\`\`python
# Naive recursion — O(2ⁿ)
def fib_naive(n):
    if n <= 1: return n
    return fib_naive(n-1) + fib_naive(n-2)

# Memoisation — O(n)
from functools import lru_cache

@lru_cache(maxsize=None)
def fib_memo(n):
    if n <= 1: return n
    return fib_memo(n-1) + fib_memo(n-2)

# Bottom-up — O(n) time, O(1) space
def fib_dp(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
\`\`\`

{{component:comp-callout-018}}

### Classic Problem: 0/1 Knapsack

Given items with weights and values, maximise the value fitting in a weight capacity W.

\`\`\`python
def knapsack(weights, values, W):
    n = len(weights)
    dp = [[0] * (W + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for w in range(W + 1):
            dp[i][w] = dp[i-1][w]
            if weights[i-1] <= w:
                dp[i][w] = max(dp[i][w], dp[i-1][w - weights[i-1]] + values[i-1])
    return dp[n][W]
\`\`\`

### Practice: Coin Change

{{component:comp-code-008}}

### Knowledge Check

{{component:comp-quiz-021}}`,
    },
  ],
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q-1",
    lessonId: "lesson-cs-1",
    question: "What is the time complexity of the find_maximum algorithm shown in the lesson?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correctIndex: 2,
    explanation:
      "The algorithm scans through every element exactly once, so it scales linearly with the input size — O(n).",
  },
  {
    id: "q-2",
    lessonId: "lesson-cs-3",
    question: "What is the base case in the factorial function?",
    options: ["n == 0", "n <= 1", "n == 2", "n > 0"],
    correctIndex: 1,
    explanation:
      "The base case is n <= 1, which returns 1. This stops the recursion from going into negative numbers.",
  },
  {
    id: "q-3",
    lessonId: "lesson-cs-5",
    question: "What is the time complexity of binary search?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctIndex: 1,
    explanation:
      "Binary search halves the search space with each step, resulting in O(log n) time complexity.",
  },
]

export const USER_PROGRESS: UserProgress[] = [
  {
    userId: "user-1",
    courseId: "course-cs101",
    lessonsCompleted: ["lesson-cs-1", "lesson-cs-2", "lesson-cs-3"],
    lastLessonId: "lesson-cs-4",
    startedAt: "2025-10-01",
    score: 87,
  },
  {
    userId: "user-1",
    courseId: "course-calc1",
    lessonsCompleted: ["lesson-calc-1", "lesson-calc-2"],
    lastLessonId: "lesson-calc-3",
    startedAt: "2025-11-15",
    score: 74,
  },
  {
    userId: "user-1",
    courseId: "course-web101",
    lessonsCompleted: ["lesson-web-1"],
    lastLessonId: "lesson-web-2",
    startedAt: "2026-01-20",
    score: 91,
  },
  {
    userId: "user-1",
    courseId: "course-pyml",
    lessonsCompleted: [],
    lastLessonId: "lesson-ml-1",
    startedAt: "2026-02-10",
    score: 0,
  },
  {
    userId: "user-1",
    courseId: "course-algo",
    lessonsCompleted: ["lesson-algo-1"],
    lastLessonId: "lesson-algo-2",
    startedAt: "2026-01-05",
    score: 80,
  },
]

export const ENROLLMENTS: Enrollment[] = [
  { userId: "user-1", courseId: "course-cs101", enrolledAt: "2025-10-01", progress: 60 },
  { userId: "user-1", courseId: "course-calc1", enrolledAt: "2025-11-15", progress: 40 },
  { userId: "user-1", courseId: "course-web101", enrolledAt: "2026-01-20", progress: 25 },
  { userId: "user-1", courseId: "course-pyml", enrolledAt: "2026-02-10", progress: 5 },
  { userId: "user-1", courseId: "course-algo", enrolledAt: "2026-01-05", progress: 33 },
]

export const SUBJECT_MASTERY: SubjectMastery[] = [
  { subject: "Algorithms", mastery: 78, lessonsAttempted: 12, averageScore: 84 },
  { subject: "Mathematics", mastery: 65, lessonsAttempted: 8, averageScore: 72 },
  { subject: "Web Dev", mastery: 40, lessonsAttempted: 4, averageScore: 68 },
  { subject: "Machine Learning", mastery: 25, lessonsAttempted: 3, averageScore: 60 },
  { subject: "Physics", mastery: 55, lessonsAttempted: 6, averageScore: 74 },
  { subject: "Data Structures", mastery: 82, lessonsAttempted: 15, averageScore: 88 },
]

function generateActivityData(): ActivityDay[] {
  const days: ActivityDay[] = []
  const now = new Date("2026-02-28")
  for (let i = 90; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]
    const isActive = Math.random() > 0.35
    days.push({
      date: dateStr,
      minutesStudied: isActive ? Math.floor(Math.random() * 90) + 10 : 0,
      lessonsCompleted: isActive ? Math.floor(Math.random() * 4) : 0,
    })
  }
  return days
}

export const ACTIVITY_DATA: ActivityDay[] = generateActivityData()

export const BADGES: Badge[] = [
  {
    id: "badge-first-lesson",
    name: "First Step",
    description: "Complete your first lesson",
    icon: "🎯",
    earnedAt: "2025-10-01",
  },
  {
    id: "badge-streak-7",
    name: "Week Warrior",
    description: "Maintain a 7-day study streak",
    icon: "🔥",
    earnedAt: "2025-10-08",
  },
  {
    id: "badge-streak-14",
    name: "Fortnight Focus",
    description: "Maintain a 14-day study streak",
    icon: "⚡",
    earnedAt: "2026-02-14",
  },
  {
    id: "badge-perfect-score",
    name: "Perfect Score",
    description: "Score 100% on a quiz",
    icon: "💯",
    earnedAt: "2025-11-03",
  },
  {
    id: "badge-course-complete",
    name: "Course Champion",
    description: "Complete an entire course",
    icon: "🏆",
  },
  {
    id: "badge-night-owl",
    name: "Night Owl",
    description: "Study after midnight",
    icon: "🦉",
  },
]

export const COMPONENTS: Record<string, ComponentInstance> = {
  // ── CS101: Lesson 1 ─────────────────────────────────────────────────────
  "comp-callout-001": {
    id: "comp-callout-001",
    type: "Callout",
    props: {
      type: "tip",
      title: "Computational Thinking is Universal",
      body_markdown:
        "Even if you never write a line of code, learning to **decompose problems**, **recognise patterns**, and **think algorithmically** will make you sharper in any discipline — from medicine to music.",
    },
  },
  "comp-flashcard-001": {
    id: "comp-flashcard-001",
    type: "Flashcard",
    props: {
      front: "What does **O(n)** mean in Big-O notation?",
      back: "The algorithm's running time grows **linearly** with the input size `n`. Doubling the input roughly doubles the time.",
      hint: "Think about what happens when n = 10 vs n = 1,000,000.",
      tags: ["Big-O", "complexity", "algorithms"],
    },
  },
  "comp-quiz-001": {
    id: "comp-quiz-001",
    type: "Quiz",
    props: {
      question:
        "The `find_maximum` algorithm above scans every element once. What is its time complexity?",
      options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
      correct_index: 2,
      explanation:
        "Because we visit each element exactly once, the work grows linearly with the list length — O(n).",
      difficulty: "easy",
    },
  },

  // ── CS101: Lesson 2 ─────────────────────────────────────────────────────
  "comp-callout-002": {
    id: "comp-callout-002",
    type: "Callout",
    props: {
      type: "warning",
      title: "Python is Dynamically Typed",
      body_markdown:
        "Unlike Java or C++, Python infers types at **runtime**. This means `x = 5` and then `x = \"hello\"` is valid — but it can introduce hard-to-find bugs. Use type hints (`x: int = 5`) and tools like **mypy** to catch issues early.",
    },
  },
  "comp-flash-002": {
    id: "comp-flash-002",
    type: "Flashcard",
    props: {
      front: "What is the difference between `for` and `while` loops?",
      back: "Use `for` when you know the **number of iterations** in advance (iterate over a collection). Use `while` when you loop until a **condition** becomes false.",
      tags: ["control flow", "loops", "python"],
    },
  },
  "comp-quiz-002": {
    id: "comp-quiz-002",
    type: "Quiz",
    props: {
      question: "What does `range(2, 8, 2)` produce?",
      options: ["[2, 4, 6, 8]", "[2, 4, 6]", "[2, 3, 4, 5, 6, 7]", "[0, 2, 4, 6]"],
      correct_index: 1,
      explanation:
        "`range(start, stop, step)` generates values from 2 up to (but not including) 8 in steps of 2: 2, 4, 6.",
      difficulty: "easy",
    },
  },

  // ── CS101: Lesson 3 ─────────────────────────────────────────────────────
  "comp-video-001": {
    id: "comp-video-001",
    type: "VideoEmbed",
    props: {
      url: "https://www.youtube.com/watch?v=8mAITcNt710",
      caption: "Functions & Recursion explained in 7 minutes",
      start_time: 0,
    },
  },
  "comp-chart-001": {
    id: "comp-chart-001",
    type: "Chart",
    props: {
      chart_type: "bar",
      title: "Fibonacci Growth (first 8 terms)",
      data: [
        { n: "fib(1)", value: 1 },
        { n: "fib(2)", value: 1 },
        { n: "fib(3)", value: 2 },
        { n: "fib(4)", value: 3 },
        { n: "fib(5)", value: 5 },
        { n: "fib(6)", value: 8 },
        { n: "fib(7)", value: 13 },
        { n: "fib(8)", value: 21 },
      ],
      axes: { x: "n", y: "value" },
    },
  },
  "comp-code-001": {
    id: "comp-code-001",
    type: "CodeExercise",
    props: {
      language: "python",
      instructions:
        "Write a recursive function `sum_digits(n)` that returns the sum of all digits of a non-negative integer.\n\n**Examples:** `sum_digits(123)` → `6`, `sum_digits(0)` → `0`.",
      starter_code: "def sum_digits(n):\n    # your code here\n    pass\n",
      solution:
        "def sum_digits(n):\n    if n < 10:\n        return n\n    return n % 10 + sum_digits(n // 10)\n",
      test_cases: [
        { input: "sum_digits(0)", expected_output: "0" },
        { input: "sum_digits(5)", expected_output: "5" },
        { input: "sum_digits(123)", expected_output: "6" },
        { input: "sum_digits(9999)", expected_output: "36" },
      ],
    },
  },

  // ── CS101: Lesson 4 ─────────────────────────────────────────────────────
  "comp-callout-003": {
    id: "comp-callout-003",
    type: "Callout",
    props: {
      type: "info",
      title: "Python Lists are Zero-Indexed",
      body_markdown:
        "The first element is at index `0`, not `1`. So `fruits[0]` is `\"apple\"` and `fruits[-1]` is the **last** element (Python counts from the end with negative indices).",
    },
  },
  "comp-flash-003": {
    id: "comp-flash-003",
    type: "Flashcard",
    props: {
      front: "What does `list.append(x)` do vs `list.insert(i, x)`?",
      back: "`append(x)` adds `x` to the **end** of the list in O(1). `insert(i, x)` inserts `x` at index `i`, shifting all following elements — O(n).",
      hint: "Think about which is faster for large lists.",
      tags: ["lists", "arrays", "time complexity"],
    },
  },
  "comp-code-002": {
    id: "comp-code-002",
    type: "CodeExercise",
    props: {
      language: "python",
      instructions:
        "Write `filter_evens(nums)` that returns a **new list** containing only the even numbers from `nums`.\n\n**Example:** `filter_evens([1, 2, 3, 4, 5, 6])` → `[2, 4, 6]`.",
      starter_code: "def filter_evens(nums):\n    # your code here\n    pass\n",
      solution: "def filter_evens(nums):\n    return [n for n in nums if n % 2 == 0]\n",
      test_cases: [
        { input: "filter_evens([1, 2, 3, 4, 5, 6])", expected_output: "[2, 4, 6]" },
        { input: "filter_evens([1, 3, 5])", expected_output: "[]" },
        { input: "filter_evens([2, 4, 6])", expected_output: "[2, 4, 6]" },
        { input: "filter_evens([])", expected_output: "[]" },
      ],
    },
  },
  "comp-quiz-003": {
    id: "comp-quiz-003",
    type: "Quiz",
    props: {
      question: "What is the output of `[1, 2, 3, 4, 5][1:4]`?",
      options: ["[1, 2, 3]", "[2, 3, 4]", "[2, 3, 4, 5]", "[1, 2, 3, 4]"],
      correct_index: 1,
      explanation:
        "Slicing `[start:stop]` returns elements from index `start` up to (but not including) `stop`. So `[1:4]` gives indices 1, 2, 3 → values 2, 3, 4.",
      difficulty: "easy",
    },
  },

  // ── CS101: Lesson 5 ─────────────────────────────────────────────────────
  "comp-chart-002": {
    id: "comp-chart-002",
    type: "Chart",
    props: {
      chart_type: "bar",
      title: "Algorithm Operations at n = 100",
      data: [
        { complexity: "O(1)", ops: 1 },
        { complexity: "O(log n)", ops: 7 },
        { complexity: "O(n)", ops: 100 },
        { complexity: "O(n log n)", ops: 664 },
        { complexity: "O(n²)", ops: 10000 },
      ],
      axes: { x: "complexity", y: "ops" },
    },
  },
  "comp-callout-004": {
    id: "comp-callout-004",
    type: "Callout",
    props: {
      type: "danger",
      title: "Binary Search Requires a Sorted Array",
      body_markdown:
        "Binary search will produce **incorrect results** on an unsorted array. Always verify that the input is sorted, or sort it first — but remember that sorting itself takes O(n log n), which may dominate your total cost.",
    },
  },
  "comp-flash-004": {
    id: "comp-flash-004",
    type: "Flashcard",
    props: {
      front: "Why is binary search O(log n) instead of O(n)?",
      back: "Each comparison **halves** the remaining search space. Starting from n elements: after 1 step → n/2, after 2 → n/4, … after k steps → n/2ᵏ = 1, so k = log₂(n).",
      hint: "How many times can you halve n before reaching 1?",
      tags: ["binary search", "Big-O", "algorithms"],
    },
  },
  "comp-quiz-004": {
    id: "comp-quiz-004",
    type: "Quiz",
    props: {
      question: "How many comparisons does binary search need in the worst case for a sorted array of 1,024 elements?",
      options: ["10", "100", "512", "1024"],
      correct_index: 0,
      explanation:
        "log₂(1024) = 10. Binary search halves the search space each step, so it needs at most 10 comparisons for 2¹⁰ = 1024 elements.",
      difficulty: "medium",
    },
  },

  // ── Calc1: Lesson 1 ─────────────────────────────────────────────────────
  "comp-callout-005": {
    id: "comp-callout-005",
    type: "Callout",
    props: {
      type: "info",
      title: "The Formal (ε–δ) Definition",
      body_markdown:
        "Formally, lim(x→a) f(x) = L means: for every **ε > 0** there exists **δ > 0** such that if 0 < |x−a| < δ then |f(x)−L| < ε. In practice, you'll use limit laws and algebra — but this definition is what puts calculus on rigorous footing.",
    },
  },
  "comp-flash-005": {
    id: "comp-flash-005",
    type: "Flashcard",
    props: {
      front: "When does lim(x→a) f(x) **not** exist?",
      back: "The limit fails to exist when:\n1. The left- and right-hand limits are **unequal** (jump discontinuity)\n2. The function **oscillates** without settling (e.g. sin(1/x) as x→0)\n3. The function grows without bound (vertical asymptote)",
      tags: ["limits", "calculus", "discontinuity"],
    },
  },
  "comp-quiz-005": {
    id: "comp-quiz-005",
    type: "Quiz",
    props: {
      question: "What is lim(x→2) (x² − 4) / (x − 2)?",
      options: ["0", "2", "4", "undefined"],
      correct_index: 2,
      explanation:
        "Factor: (x²−4)/(x−2) = (x+2)(x−2)/(x−2) = x+2 (for x≠2). As x→2, x+2 → 4.",
      difficulty: "medium",
    },
  },

  // ── Calc1: Lesson 2 ─────────────────────────────────────────────────────
  "comp-callout-006": {
    id: "comp-callout-006",
    type: "Callout",
    props: {
      type: "tip",
      title: "Polynomials are Always Continuous",
      body_markdown:
        "Every polynomial function is continuous **everywhere**. Rational functions (polynomial/polynomial) are continuous everywhere except where the denominator is zero. This means for most textbook functions you can evaluate the limit simply by **substitution**.",
    },
  },
  "comp-quiz-006": {
    id: "comp-quiz-006",
    type: "Quiz",
    props: {
      question: "What type of discontinuity does f(x) = (x²−1)/(x−1) have at x = 1?",
      options: ["Jump discontinuity", "Infinite discontinuity", "Removable discontinuity", "No discontinuity"],
      correct_index: 2,
      explanation:
        "The limit exists (equals 2), but f(1) is undefined. This is a **removable** discontinuity — it can be 'patched' by defining f(1) = 2.",
      difficulty: "medium",
    },
  },

  // ── Calc1: Lesson 3 ─────────────────────────────────────────────────────
  "comp-video-002": {
    id: "comp-video-002",
    type: "VideoEmbed",
    props: {
      url: "https://www.youtube.com/watch?v=WUvTyaaNkzM",
      caption: "Essence of Calculus — Derivatives visualised (3Blue1Brown)",
    },
  },
  "comp-flash-006": {
    id: "comp-flash-006",
    type: "Flashcard",
    props: {
      front: "State the **Power Rule** for derivatives.",
      back: "If f(x) = xⁿ, then **f'(x) = n · xⁿ⁻¹**.\n\nExamples:\n- d/dx [x⁵] = 5x⁴\n- d/dx [x] = 1\n- d/dx [x⁻²] = −2x⁻³",
      hint: "Bring the exponent down as a multiplier, then reduce the exponent by 1.",
      tags: ["derivatives", "power rule", "calculus"],
    },
  },
  "comp-quiz-007": {
    id: "comp-quiz-007",
    type: "Quiz",
    props: {
      question: "What is d/dx [4x³ − 2x + 7]?",
      options: ["12x² − 2", "4x² − 2", "12x² − 2x", "12x³ − 2"],
      correct_index: 0,
      explanation:
        "Apply the power rule term by term: d/dx[4x³] = 12x², d/dx[−2x] = −2, d/dx[7] = 0. Sum: 12x² − 2.",
      difficulty: "easy",
    },
  },

  // ── Calc1: Lesson 4 ─────────────────────────────────────────────────────
  "comp-callout-007": {
    id: "comp-callout-007",
    type: "Callout",
    props: {
      type: "tip",
      title: "Identify Inside and Outside",
      body_markdown:
        "The chain rule is easiest when you can clearly label the **outer** function and the **inner** function. Write `u = inner`, compute `du/dx`, then multiply `d(outer)/du × du/dx`.",
    },
  },
  "comp-code-003": {
    id: "comp-code-003",
    type: "CodeExercise",
    props: {
      language: "python",
      instructions:
        "Implement `chain_rule(outer_exp, inner_coeff, inner_exp)` which returns the derivative of `(inner_coeff · xⁱⁿⁿᵉʳ⁻ᵉˣᵖ)^outer_exp` evaluated symbolically as a tuple `(new_coeff, new_exp)`.\n\n**Example:** f(x) = (3x²)⁴\n- outer_exp=4, inner_coeff=3, inner_exp=2\n- result: (4 × 3⁴ × 2, 4×2−1) = (648, 7)",
      starter_code:
        "def chain_rule(outer_exp, inner_coeff, inner_exp):\n    # Hint: new_coeff = outer_exp * inner_coeff**outer_exp * inner_exp\n    # new_exp = outer_exp * inner_exp - 1\n    pass\n",
      solution:
        "def chain_rule(outer_exp, inner_coeff, inner_exp):\n    new_coeff = outer_exp * (inner_coeff ** outer_exp) * inner_exp\n    new_exp = outer_exp * inner_exp - 1\n    return (new_coeff, new_exp)\n",
      test_cases: [
        { input: "chain_rule(4, 3, 2)", expected_output: "(648, 7)" },
        { input: "chain_rule(2, 1, 3)", expected_output: "(6, 5)" },
        { input: "chain_rule(3, 2, 1)", expected_output: "(24, 2)" },
      ],
    },
  },
  "comp-quiz-008": {
    id: "comp-quiz-008",
    type: "Quiz",
    props: {
      question: "What is d/dx [(5x + 2)³]?",
      options: ["3(5x + 2)²", "15(5x + 2)²", "3(5x + 2)² · 5x", "(5x + 2)² · 5"],
      correct_index: 1,
      explanation:
        "Outer: d/du[u³] = 3u². Inner: d/dx[5x+2] = 5. Chain rule: 3(5x+2)² × 5 = **15(5x+2)²**.",
      difficulty: "medium",
    },
  },

  // ── Calc1: Lesson 5 ─────────────────────────────────────────────────────
  "comp-chart-003": {
    id: "comp-chart-003",
    type: "Chart",
    props: {
      chart_type: "line",
      title: "Position, Velocity & Acceleration over Time",
      data: [
        { t: 0, position: 0, velocity: 0, acceleration: 9.8 },
        { t: 1, position: 4.9, velocity: 9.8, acceleration: 9.8 },
        { t: 2, position: 19.6, velocity: 19.6, acceleration: 9.8 },
        { t: 3, position: 44.1, velocity: 29.4, acceleration: 9.8 },
        { t: 4, position: 78.4, velocity: 39.2, acceleration: 9.8 },
        { t: 5, position: 122.5, velocity: 49, acceleration: 9.8 },
      ],
      axes: { x: "t", y: "position" },
    },
  },
  "comp-callout-008": {
    id: "comp-callout-008",
    type: "Callout",
    props: {
      type: "info",
      title: "Second Derivative Test Caveat",
      body_markdown:
        "If **f''(c) = 0**, the test is **inconclusive** — the point could be a local min, max, or an inflection point. In that case, fall back to the **first derivative test**: check the sign of f'(x) on either side of c.",
    },
  },
  "comp-quiz-009": {
    id: "comp-quiz-009",
    type: "Quiz",
    props: {
      question: "An object has position s(t) = t³ − 6t² + 9t. At what time is it momentarily at rest?",
      options: ["t = 1 and t = 3", "t = 2 only", "t = 0 and t = 6", "t = 3 only"],
      correct_index: 0,
      explanation:
        "Velocity v(t) = s'(t) = 3t² − 12t + 9. Set v = 0: 3(t−1)(t−3) = 0, so t = 1 and t = 3.",
      difficulty: "hard",
    },
  },

  // ── Web101: Lesson 1 ────────────────────────────────────────────────────
  "comp-callout-009": {
    id: "comp-callout-009",
    type: "Callout",
    props: {
      type: "tip",
      title: "Use Semantic HTML Over Generic Divs",
      body_markdown:
        "Prefer `<article>`, `<section>`, `<nav>`, and `<header>` over a sea of `<div>` elements. Semantic HTML improves **accessibility** (screen readers understand page structure), **SEO** (search engines rank structured pages higher), and **maintainability**.",
    },
  },
  "comp-flash-007": {
    id: "comp-flash-007",
    type: "Flashcard",
    props: {
      front: "What is the difference between `<div>` and `<span>`?",
      back: "`<div>` is a **block-level** element — it starts on a new line and stretches the full width. `<span>` is **inline** — it flows within text without breaking the line. Use `<div>` for sections, `<span>` for styling individual words or phrases.",
      tags: ["HTML", "block", "inline", "elements"],
    },
  },
  "comp-code-004": {
    id: "comp-code-004",
    type: "CodeExercise",
    props: {
      language: "javascript",
      instructions:
        "Write a function `makeCard(title, body)` that returns an HTML string for a simple card:\n\n```\n<div class=\"card\">\n  <h2>{title}</h2>\n  <p>{body}</p>\n</div>\n```",
      starter_code: "function makeCard(title, body) {\n  // your code here\n}\n",
      solution:
        'function makeCard(title, body) {\n  return `<div class="card"><h2>${title}</h2><p>${body}</p></div>`;\n}\n',
      test_cases: [
        {
          input: 'makeCard("Hello", "World")',
          expected_output: '<div class="card"><h2>Hello</h2><p>World</p></div>',
        },
        {
          input: 'makeCard("Title", "Description")',
          expected_output: '<div class="card"><h2>Title</h2><p>Description</p></div>',
        },
      ],
    },
  },

  // ── Web101: Lesson 2 ────────────────────────────────────────────────────
  "comp-callout-010": {
    id: "comp-callout-010",
    type: "Callout",
    props: {
      type: "warning",
      title: "Box-Sizing: border-box",
      body_markdown:
        "By default (`content-box`), `width` and `height` don't include padding or border — which makes layout maths hard. Add `* { box-sizing: border-box; }` to your reset so that **padding and border are included in the element's total size**. Almost every professional project does this.",
    },
  },
  "comp-video-003": {
    id: "comp-video-003",
    type: "VideoEmbed",
    props: {
      url: "https://www.youtube.com/watch?v=fYq5PXgSsbE",
      caption: "CSS Flexbox in 15 minutes — Traversy Media",
    },
  },
  "comp-quiz-010": {
    id: "comp-quiz-010",
    type: "Quiz",
    props: {
      question: "Which CSS property centres a flex container's children along the **cross axis**?",
      options: ["justify-content", "align-items", "flex-direction", "align-self"],
      correct_index: 1,
      explanation:
        "`align-items` aligns children along the **cross axis** (perpendicular to the main axis). `justify-content` handles the main axis.",
      difficulty: "easy",
    },
  },

  // ── Web101: Lesson 3 ────────────────────────────────────────────────────
  "comp-callout-011": {
    id: "comp-callout-011",
    type: "Callout",
    props: {
      type: "info",
      title: "Always Use addEventListener, Not onclick",
      body_markdown:
        "Inline `onclick` attributes and `element.onclick = fn` can only hold **one handler** at a time — assigning a second overwrites the first. `addEventListener` supports **multiple handlers** on the same event and gives you fine-grained control over event capture and bubbling.",
    },
  },
  "comp-code-005": {
    id: "comp-code-005",
    type: "CodeExercise",
    props: {
      language: "javascript",
      instructions:
        "Write a function `counter()` that returns an object with two methods: `increment()` and `getCount()`. Each call to `increment()` should increase the internal count by 1.\n\n**Example:**\n```js\nconst c = counter();\nc.increment(); c.increment();\nc.getCount(); // 2\n```",
      starter_code:
        "function counter() {\n  // your code here\n}\n",
      solution:
        "function counter() {\n  let count = 0;\n  return {\n    increment() { count++; },\n    getCount() { return count; }\n  };\n}\n",
      test_cases: [
        { input: "const c = counter(); c.getCount()", expected_output: "0" },
        { input: "const c = counter(); c.increment(); c.getCount()", expected_output: "1" },
        {
          input: "const c = counter(); c.increment(); c.increment(); c.increment(); c.getCount()",
          expected_output: "3",
        },
      ],
    },
  },
  "comp-quiz-011": {
    id: "comp-quiz-011",
    type: "Quiz",
    props: {
      question: "What does `document.querySelector('.btn')` return?",
      options: [
        "All elements with class 'btn'",
        "The first element with class 'btn'",
        "The last element with class 'btn'",
        "An array of elements with class 'btn'",
      ],
      correct_index: 1,
      explanation:
        "`querySelector` returns the **first** matching element, or `null` if none is found. Use `querySelectorAll` to get all matches as a NodeList.",
      difficulty: "easy",
    },
  },

  // ── Web101: Lesson 4 ────────────────────────────────────────────────────
  "comp-chart-004": {
    id: "comp-chart-004",
    type: "Chart",
    props: {
      chart_type: "bar",
      title: "Common Responsive Breakpoints",
      data: [
        { device: "Mobile S", px: 320 },
        { device: "Mobile L", px: 425 },
        { device: "Tablet", px: 768 },
        { device: "Laptop", px: 1024 },
        { device: "Desktop", px: 1440 },
      ],
      axes: { x: "device", y: "px" },
    },
  },
  "comp-callout-012": {
    id: "comp-callout-012",
    type: "Callout",
    props: {
      type: "danger",
      title: "Don't Forget the Viewport Meta Tag",
      body_markdown:
        "Without `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">`, mobile browsers render the page at a **desktop width** and then scale it down — making all your media queries useless. This is one of the most common responsive design mistakes.",
    },
  },
  "comp-quiz-012": {
    id: "comp-quiz-012",
    type: "Quiz",
    props: {
      question: "Which approach to responsive design writes mobile styles first, then adds complexity at larger breakpoints?",
      options: ["Desktop-first", "Mobile-first", "Fluid-first", "Adaptive-first"],
      correct_index: 1,
      explanation:
        "**Mobile-first** starts with the simplest layout and progressively enhances it with `min-width` media queries. It generally produces leaner CSS and better performance on slower devices.",
      difficulty: "easy",
    },
  },

  // ── PyML: Lesson 1 ──────────────────────────────────────────────────────
  "comp-callout-013": {
    id: "comp-callout-013",
    type: "Callout",
    props: {
      type: "tip",
      title: "ML ≠ AI ≠ Deep Learning",
      body_markdown:
        "**AI** is the broadest field (any technique making machines behave intelligently). **ML** is a subset where systems learn from data. **Deep Learning** is a subset of ML that uses neural networks with many layers. Most production ML today does *not* use deep learning.",
    },
  },
  "comp-chart-005": {
    id: "comp-chart-005",
    type: "Chart",
    props: {
      chart_type: "bar",
      title: "ML Application Domains",
      data: [
        { domain: "NLP", adoption: 82 },
        { domain: "Computer Vision", adoption: 76 },
        { domain: "Recommendation", adoption: 71 },
        { domain: "Forecasting", adoption: 65 },
        { domain: "Fraud Detection", adoption: 60 },
        { domain: "Healthcare", adoption: 48 },
      ],
      axes: { x: "domain", y: "adoption" },
    },
  },
  "comp-flash-008": {
    id: "comp-flash-008",
    type: "Flashcard",
    props: {
      front: "What is the difference between **training** and **test** sets?",
      back: "The **training set** is used to fit the model (adjust parameters). The **test set** is held out and used only to evaluate final performance — it simulates unseen data. Mixing them leads to **data leakage** and over-optimistic metrics.",
      hint: "Think of training as studying, and the test set as the actual exam.",
      tags: ["machine learning", "evaluation", "overfitting"],
    },
  },
  "comp-quiz-013": {
    id: "comp-quiz-013",
    type: "Quiz",
    props: {
      question: "A spam filter learns from 10,000 labelled emails (spam / not spam). Which ML paradigm is this?",
      options: ["Unsupervised learning", "Reinforcement learning", "Supervised learning", "Self-supervised learning"],
      correct_index: 2,
      explanation:
        "Because each email has a known label (spam or not spam), the model learns from labelled examples — that is **supervised learning**.",
      difficulty: "easy",
    },
  },

  // ── PyML: Lesson 2 ──────────────────────────────────────────────────────
  "comp-video-004": {
    id: "comp-video-004",
    type: "VideoEmbed",
    props: {
      url: "https://www.youtube.com/watch?v=CtsRRUddV2s",
      caption: "Linear Regression — StatQuest with Josh Starmer",
    },
  },
  "comp-chart-006": {
    id: "comp-chart-006",
    type: "Chart",
    props: {
      chart_type: "scatter",
      title: "House Size vs. Price (sample data)",
      data: [
        { size: 80, price: 250 },
        { size: 95, price: 290 },
        { size: 110, price: 330 },
        { size: 125, price: 370 },
        { size: 140, price: 420 },
        { size: 160, price: 480 },
        { size: 175, price: 510 },
        { size: 190, price: 560 },
        { size: 210, price: 620 },
      ],
      axes: { x: "size", y: "price" },
    },
  },
  "comp-quiz-014": {
    id: "comp-quiz-014",
    type: "Quiz",
    props: {
      question: "Mean Squared Error (MSE) penalises large errors more than small ones. Why?",
      options: [
        "Because it takes the mean of absolute differences",
        "Because squaring makes all values positive",
        "Because squaring amplifies large differences more than small ones",
        "Because it is easier to compute than MAE",
      ],
      correct_index: 2,
      explanation:
        "**Squaring** is a convex function that grows faster than linearly. An error of 10 contributes 100 to MSE, while an error of 1 contributes only 1 — so large outliers have a **disproportionately large** impact.",
      difficulty: "medium",
    },
  },

  // ── PyML: Lesson 3 ──────────────────────────────────────────────────────
  "comp-callout-014": {
    id: "comp-callout-014",
    type: "Callout",
    props: {
      type: "warning",
      title: "Overfitting: When Trees Grow Too Deep",
      body_markdown:
        "An unconstrained decision tree will **memorise** the training data (100% training accuracy) but fail on new examples. Limit `max_depth`, increase `min_samples_split`, or use **pruning** / **Random Forests** to control overfitting.",
    },
  },
  "comp-code-006": {
    id: "comp-code-006",
    type: "CodeExercise",
    props: {
      language: "python",
      instructions:
        "Given a list of `(petal_length, label)` tuples, write `simple_classify(samples)` that returns a list of predicted labels using the rule: if `petal_length > 2.5` → `'virginica'`, else → `'setosa'`.",
      starter_code:
        "def simple_classify(samples):\n    # your code here\n    pass\n",
      solution:
        "def simple_classify(samples):\n    return ['virginica' if pl > 2.5 else 'setosa' for pl, _ in samples]\n",
      test_cases: [
        { input: "simple_classify([(1.4, None), (4.7, None)])", expected_output: "['setosa', 'virginica']" },
        { input: "simple_classify([(2.5, None)])", expected_output: "['setosa']" },
        { input: "simple_classify([(3.0, None), (1.0, None), (5.0, None)])", expected_output: "['virginica', 'setosa', 'virginica']" },
      ],
    },
  },
  "comp-quiz-015": {
    id: "comp-quiz-015",
    type: "Quiz",
    props: {
      question: "A decision tree achieves 98% accuracy on training data and 62% on test data. What is the problem?",
      options: ["Underfitting", "Overfitting", "Data leakage", "Class imbalance"],
      correct_index: 1,
      explanation:
        "High training accuracy with low test accuracy is the classic signature of **overfitting** — the model has memorised the training set rather than learning generalisable patterns.",
      difficulty: "easy",
    },
  },

  // ── Phys1: Lesson 1 ─────────────────────────────────────────────────────
  "comp-flash-009": {
    id: "comp-flash-009",
    type: "Flashcard",
    props: {
      front: "State Newton's **Second Law** and its units.",
      back: "**F = ma** — Net force equals mass times acceleration.\n\n- Force in **Newtons (N)**\n- Mass in **kilograms (kg)**\n- Acceleration in **m/s²**\n\n1 N = 1 kg·m/s²",
      hint: "What happens to acceleration when you double the force but keep mass constant?",
      tags: ["Newton's laws", "force", "physics"],
    },
  },
  "comp-callout-015": {
    id: "comp-callout-015",
    type: "Callout",
    props: {
      type: "info",
      title: "Action–Reaction Forces Act on Different Objects",
      body_markdown:
        "Newton's third law pairs always act on **different** bodies. When a horse pulls a cart, the cart pulls back on the horse with equal force — but the cart still moves because the **net force on the cart** (horse pull minus friction) is non-zero.",
    },
  },
  "comp-quiz-016": {
    id: "comp-quiz-016",
    type: "Quiz",
    props: {
      question: "A 10 kg crate accelerates at 2 m/s². What is the net force acting on it?",
      options: ["5 N", "12 N", "20 N", "200 N"],
      correct_index: 2,
      explanation:
        "F = ma = 10 kg × 2 m/s² = **20 N**.",
      difficulty: "easy",
    },
  },

  // ── Phys1: Lesson 2 ─────────────────────────────────────────────────────
  "comp-video-005": {
    id: "comp-video-005",
    type: "VideoEmbed",
    props: {
      url: "https://www.youtube.com/watch?v=GEg1W3gxqxY",
      caption: "Kinematics: position, velocity, and acceleration (Khan Academy)",
    },
  },
  "comp-chart-007": {
    id: "comp-chart-007",
    type: "Chart",
    props: {
      chart_type: "line",
      title: "Free Fall: Velocity vs. Time (g = 9.8 m/s²)",
      data: [
        { t: 0, v: 0 },
        { t: 1, v: 9.8 },
        { t: 2, v: 19.6 },
        { t: 3, v: 29.4 },
        { t: 4, v: 39.2 },
        { t: 5, v: 49.0 },
      ],
      axes: { x: "t", y: "v" },
    },
  },
  "comp-quiz-017": {
    id: "comp-quiz-017",
    type: "Quiz",
    props: {
      question: "A ball is dropped from rest. How far has it fallen after 4 seconds? (g = 9.8 m/s²)",
      options: ["19.6 m", "39.2 m", "78.4 m", "156.8 m"],
      correct_index: 2,
      explanation:
        "x = ½gt² = ½ × 9.8 × 4² = ½ × 9.8 × 16 = **78.4 m**.",
      difficulty: "medium",
    },
  },

  // ── Phys1: Lesson 3 ─────────────────────────────────────────────────────
  "comp-callout-016": {
    id: "comp-callout-016",
    type: "Callout",
    props: {
      type: "tip",
      title: "Conservation of Mechanical Energy",
      body_markdown:
        "When only conservative forces (gravity, springs) act, **total mechanical energy is conserved**: KE + PE = constant. A ball at height h has PE = mgh; as it falls, PE converts to KE — but the sum never changes.",
    },
  },
  "comp-chart-008": {
    id: "comp-chart-008",
    type: "Chart",
    props: {
      chart_type: "line",
      title: "KE and PE During Free Fall (m = 1 kg, initial h = 50 m)",
      data: [
        { t: 0, KE: 0, PE: 490 },
        { t: 1, KE: 48, PE: 442 },
        { t: 2, KE: 192, PE: 298 },
        { t: 3, KE: 432, PE: 58 },
        { t: 3.19, KE: 490, PE: 0 },
      ],
      axes: { x: "t", y: "KE" },
    },
  },
  "comp-code-007": {
    id: "comp-code-007",
    type: "CodeExercise",
    props: {
      language: "python",
      instructions:
        "Write `mechanical_energy(m, v, h, g=9.8)` that returns the **total mechanical energy** (KE + PE) of an object.\n\n- KE = ½mv²\n- PE = mgh\n\n**Example:** `mechanical_energy(2, 3, 10)` → `9 + 196 = 205.0`",
      starter_code:
        "def mechanical_energy(m, v, h, g=9.8):\n    # your code here\n    pass\n",
      solution:
        "def mechanical_energy(m, v, h, g=9.8):\n    ke = 0.5 * m * v ** 2\n    pe = m * g * h\n    return ke + pe\n",
      test_cases: [
        { input: "mechanical_energy(2, 3, 10)", expected_output: "205.0" },
        { input: "mechanical_energy(1, 0, 5)", expected_output: "49.0" },
        { input: "mechanical_energy(5, 4, 0)", expected_output: "40.0" },
      ],
    },
  },
  "comp-quiz-018": {
    id: "comp-quiz-018",
    type: "Quiz",
    props: {
      question: "A 2 kg object moving at 6 m/s has what kinetic energy?",
      options: ["6 J", "12 J", "36 J", "72 J"],
      correct_index: 2,
      explanation:
        "KE = ½mv² = ½ × 2 × 6² = ½ × 2 × 36 = **36 J**.",
      difficulty: "easy",
    },
  },

  // ── Algo: Lesson 1 ──────────────────────────────────────────────────────
  "comp-chart-009": {
    id: "comp-chart-009",
    type: "Chart",
    props: {
      chart_type: "bar",
      title: "Sorting Algorithm Comparisons at n = 1,000",
      data: [
        { algorithm: "Bubble Sort", comparisons: 1000000 },
        { algorithm: "Selection", comparisons: 500000 },
        { algorithm: "Insertion", comparisons: 250000 },
        { algorithm: "Merge Sort", comparisons: 9966 },
        { algorithm: "Quick Sort", comparisons: 10000 },
        { algorithm: "Heap Sort", comparisons: 9966 },
      ],
      axes: { x: "algorithm", y: "comparisons" },
    },
  },
  "comp-flash-010": {
    id: "comp-flash-010",
    type: "Flashcard",
    props: {
      front: "When would you choose **Insertion Sort** over **Merge Sort**?",
      back: "Insertion sort is preferred for:\n1. **Small arrays** (n < ~20) — lower constant factor beats the asymptotic advantage\n2. **Nearly-sorted data** — runs in O(n) best case\n3. **Online sorting** — can sort a stream as elements arrive\n\nMerge sort dominates for large, random data.",
      hint: "Think about the constant factors hidden inside Big-O notation.",
      tags: ["sorting", "insertion sort", "merge sort", "algorithms"],
    },
  },
  "comp-quiz-019": {
    id: "comp-quiz-019",
    type: "Quiz",
    props: {
      question: "Which sorting algorithm is guaranteed O(n log n) in the **worst case**?",
      options: ["Quick Sort", "Merge Sort", "Insertion Sort", "Bubble Sort"],
      correct_index: 1,
      explanation:
        "**Merge Sort** is always O(n log n). Quick Sort degrades to O(n²) on already-sorted input with a naive pivot. Insertion and Bubble sort are O(n²) worst case.",
      difficulty: "medium",
    },
  },

  // ── Algo: Lesson 2 ──────────────────────────────────────────────────────
  "comp-callout-017": {
    id: "comp-callout-017",
    type: "Callout",
    props: {
      type: "info",
      title: "BFS vs DFS: When to Use Each",
      body_markdown:
        "Use **BFS** when you need the **shortest path** in an unweighted graph (e.g. social network degrees of separation). Use **DFS** for problems that require exploring all paths (e.g. detecting cycles, topological sort, maze solving).",
    },
  },
  "comp-video-006": {
    id: "comp-video-006",
    type: "VideoEmbed",
    props: {
      url: "https://www.youtube.com/watch?v=pcKY4hjDrxk",
      caption: "BFS vs DFS Graph Traversal — visualised and explained",
    },
  },
  "comp-quiz-020": {
    id: "comp-quiz-020",
    type: "Quiz",
    props: {
      question: "BFS uses a **queue** and DFS uses a **stack**. Why?",
      options: [
        "BFS needs LIFO order; DFS needs FIFO order",
        "BFS needs FIFO to explore level-by-level; DFS needs LIFO to backtrack",
        "Both use queues, but BFS is iterative",
        "The data structure doesn't matter — it's the same algorithm",
      ],
      correct_index: 1,
      explanation:
        "BFS processes nodes level-by-level: first-in, first-out (queue). DFS dives deep and backtracks: last-in, first-out (stack, or the call stack in recursive implementations).",
      difficulty: "medium",
    },
  },

  // ── Algo: Lesson 3 ──────────────────────────────────────────────────────
  "comp-callout-018": {
    id: "comp-callout-018",
    type: "Callout",
    props: {
      type: "tip",
      title: "Two Conditions for DP to Apply",
      body_markdown:
        "A problem benefits from dynamic programming when it has:\n1. **Overlapping subproblems** — the same sub-calculation is needed multiple times\n2. **Optimal substructure** — the optimal solution is built from optimal solutions to subproblems\n\nIf both hold, DP can transform exponential brute-force into polynomial time.",
    },
  },
  "comp-code-008": {
    id: "comp-code-008",
    type: "CodeExercise",
    props: {
      language: "python",
      instructions:
        "**Coin Change (minimum coins)**\n\nGiven `coins` (a list of denominations) and an `amount`, return the **minimum number of coins** needed to make `amount`. Return `-1` if it's impossible.\n\n**Examples:**\n- `coin_change([1, 5, 10, 25], 36)` → `3` (25 + 10 + 1)\n- `coin_change([2], 3)` → `-1`",
      starter_code:
        "def coin_change(coins, amount):\n    # Use bottom-up DP\n    pass\n",
      solution:
        "def coin_change(coins, amount):\n    dp = [float('inf')] * (amount + 1)\n    dp[0] = 0\n    for i in range(1, amount + 1):\n        for c in coins:\n            if c <= i:\n                dp[i] = min(dp[i], dp[i - c] + 1)\n    return dp[amount] if dp[amount] != float('inf') else -1\n",
      test_cases: [
        { input: "coin_change([1, 5, 10, 25], 36)", expected_output: "3" },
        { input: "coin_change([1, 2, 5], 11)", expected_output: "3" },
        { input: "coin_change([2], 3)", expected_output: "-1" },
        { input: "coin_change([1], 0)", expected_output: "0" },
      ],
    },
  },
  "comp-quiz-021": {
    id: "comp-quiz-021",
    type: "Quiz",
    props: {
      question: "The naive recursive Fibonacci has time complexity O(2ⁿ). What does memoisation reduce it to?",
      options: ["O(log n)", "O(n)", "O(n log n)", "O(n²)"],
      correct_index: 1,
      explanation:
        "Memoisation ensures each subproblem fib(k) is computed **exactly once**. There are n distinct subproblems (0 to n), so total time is **O(n)**.",
      difficulty: "medium",
    },
  },
}

export const XP_LEVELS: { level: number; xpRequired: number; title: string }[] = [
  { level: 1, xpRequired: 0, title: "Beginner" },
  { level: 2, xpRequired: 100, title: "Apprentice" },
  { level: 3, xpRequired: 300, title: "Student" },
  { level: 4, xpRequired: 600, title: "Scholar" },
  { level: 5, xpRequired: 1000, title: "Learner" },
  { level: 6, xpRequired: 1500, title: "Explorer" },
  { level: 7, xpRequired: 2100, title: "Adept" },
  { level: 8, xpRequired: 2800, title: "Expert" },
  { level: 9, xpRequired: 3600, title: "Master" },
  { level: 10, xpRequired: 4500, title: "Grandmaster" },
]
