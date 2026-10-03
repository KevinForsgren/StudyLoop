# Backend Specification

## 1. Backend Goals

The main goal of the backend is to manage each user's schedules, plans, tasks, completion data, AI interactions, performance calculations, and reports while keeping all user data isolated.

The backend is also responsible for enforcing application rules, validating AI-generated data, storing persistent data, and providing the API used by the frontend.

---

## 2. Architecture

The application will use a React + Tailwind frontend that communicates with a Python FastAPI backend.

The backend will handle:

* API requests from the frontend.
* User authentication.
* SQLite database operations.
* Ollama/LLM communication.
* Planning and workload logic.
* Task completion and performance calculation.
* AI-generated reports.

The frontend should never directly communicate with SQLite or Ollama.

```text
React + Tailwind
       |
       | HTTP/API
       v
     FastAPI
       |
  +----+----------+-------------+
  |               |             |
SQLite          Ollama      Planning Logic
```

---

## 3. Database

The database will use SQLite and contain the following main tables:

### Users

Stores account information for each user.

* `id` - unique user ID
* `username` - unique
* `email` - unique
* `password_hash`

Login credentials and sensitive authentication information must not be exposed to the AI.

### Plans

Represents a user's planned schedule.

* `id` - unique plan ID
* `user_id` - foreign key to Users
* `date`
* `title` or goal information
* `created_at`

A plan belongs to exactly one user.

### Tasks / Sub-todos

Stores the actual work assigned inside a plan.

* `id` - unique task ID
* `plan_id` - foreign key to Plans
* `user_id` - foreign key to Users
* `task_name`
* `date`
* `estimated_duration`
* `completed`
* `completed_at`

Sub-tasks should remain associated with their parent plan.

### Reports

Stores generated performance reports.

* `id`
* `user_id`
* `date`
* `period_start`
* `period_end`
* `performance_percentage`
* `performance_status`
* `content/summary`

The performance percentage should be calculated by the backend. The AI can provide the written interpretation and summary.

### Chats

Stores relevant conversation history.

* `id`
* `user_id`
* `question/message`
* `response`
* `date`
* `time`

All records must belong to a specific user.

---

## 4. Core Data Models

The Users table is the main entry point. All plans, tasks, reports, and chats are associated with a user through `user_id`.

```text
User
 |
 +-- Plans
 |    |
 |    +-- Tasks / Sub-todos
 |
 +-- Reports
 |
 +-- Chats
```

The application should retrieve the current user's plans and tasks when displaying the current week.

Reports are generated from the user's completed and incomplete tasks over the selected period. The default report period is the previous seven days, normally Monday to Sunday when generating a weekly report.

Chat history and previous reports can be provided to the AI when they are relevant to planning or report generation.

Database operations should be isolated behind backend functions/services rather than being scattered throughout API routes. For example, user registration, login, task creation, task completion, and report retrieval should each have their own database/service logic.

This keeps the rest of the application independent from the database implementation and makes future database changes easier.

---

## 5. API

The initial API will contain:

```text
POST   /auth/register
POST   /auth/login
POST   /auth/change-password

GET    /tasks
POST   /tasks
PATCH  /tasks/{id}
DELETE /tasks/{id}

POST   /plans
GET    /plans/{id}

POST   /tasks/{id}/complete

GET    /performance
POST   /performance/report

POST   /chat
```

Additional endpoints can be added if they are required by the application.

Every endpoint that accesses user-specific data must identify the authenticated user and ensure that the requested resource belongs to that user.

---

## 6. AI Integration

### What information is sent to the model?

The information sent depends on the operation.

For planning, the AI can receive:

* The user's current goal or request.
* Relevant previous chat context.
* Relevant previous performance reports.
* Current or upcoming plans when necessary.
* Relevant task history.

For performance report generation, the AI can receive:

* The current week's plan and task data.
* Calculated performance statistics.
* A limited number of previous reports for context.

Only data belonging to the authenticated user should be provided.

### What information is not sent?

The AI must not receive:

* Data belonging to other users.
* Passwords or password hashes.
* Authentication tokens.
* Unnecessary account information.
* Other sensitive data that is not required for the requested operation.

### How does the model generate plans?

The user provides their current goal or work requirements to the AI.

The AI uses the user's relevant history and previous performance to divide the goal into smaller tasks and create a schedule.

If the user has maintained strong performance, the AI can create a more demanding and structured plan.

If the user's performance has been weaker or inconsistent, the AI should create a more achievable plan with smaller or more manageable tasks.

If no previous performance data exists, the AI should use the more conservative planning approach.

The workload must always remain within the backend's defined limits:

* Minimum planned work: **1 hour 30 minutes per day**
* Maximum planned work: **10 hours per day**

These limits are enforced by the backend and should not depend solely on the AI following them.

### How does the backend validate AI-generated tasks?

The backend must validate the AI response before storing anything in the database.

It should verify:

* The response follows the expected JSON structure.
* Required fields are present.
* Dates are valid.
* Task names are present.
* Task durations are valid.
* Total daily workload is within the allowed limits.
* Tasks belong to the authenticated user.
* No invalid or unexpected database fields are accepted from the model.

The AI should never be allowed to directly modify the database.

### How does AI output get converted into database records?

The AI should return structured JSON representing the proposed plan.

The backend validates this JSON and then converts the validated data into Plan and Task records.

The process should be:

```text
User request
     ↓
AI generates structured JSON
     ↓
Backend validates JSON
     ↓
Backend checks workload limits
     ↓
User confirms plan
     ↓
Backend stores Plan + Tasks
```

For reports, the backend calculates the objective performance statistics first. The AI then generates the written summary and performance interpretation, which is stored together with the calculated statistics.

Chat messages and responses can also be stored in the Chats table.

### How is performance data provided to the model?

For a weekly report, the backend sends the current week's relevant plan/task data together with calculated performance statistics.

A limited number of previous reports, up to five, can also be provided to give the AI historical context.

The backend should provide structured data rather than raw database queries or unrestricted database access.

### What happens if the model gives invalid output?

The backend should reject invalid output and return an appropriate error response to the frontend.

The frontend can then allow the user to retry the request or continue manually.

Invalid AI output must never be inserted directly into the database.

---

## 7. Planning & Workload Logic

The AI can use previous reports and task history when creating a new plan.

Past performance should influence the difficulty and workload of future plans, but the backend remains responsible for enforcing the minimum and maximum workload limits.

Performance calculation itself should not be left entirely to the AI.

The backend should calculate objective values such as:

* Total assigned tasks.
* Completed tasks.
* Incomplete tasks.
* Completion percentage.
* Total planned work.
* Total completed work where applicable.

The AI can then use these values to judge patterns in the user's performance and generate a written interpretation.

For example:

```text
5 assigned tasks
4 completed
      ↓
Backend calculates
      ↓
80% completion
      ↓
AI interprets performance
```

This prevents the AI from producing inconsistent performance percentages.

---

## 8. Performance Tracking

Performance percentage is calculated from completed assigned tasks:

```text
completed tasks
---------------- × 100
total assigned tasks
```

For example:

```text
5 assigned tasks
4 completed tasks

4 / 5 × 100 = 80%
```

The daily consistency graph uses the following levels:

* **0%** - no activity
* **1%–25%**
* **26%–50%**
* **51%–75%**
* **76%–100%**

A day with no planned tasks should be treated as **no activity** rather than as a failed day. An assigned task that remains incomplete contributes to the day's completion percentage.

The GitHub-style graph uses daily performance.

The weekly performance report uses the total completed and assigned tasks for the selected period and can display them using a donut chart.

---

## 9. Authentication

The backend must provide:

* User registration.
* Login.
* Password hashing.
* Authenticated requests.
* Password change while logged in.
* User-specific data access.

Users can only access, modify, complete, or delete their own plans and tasks.

Every user-specific database query must be scoped to the authenticated user's ID.

---

## 10. Error Handling & Reliability

### The AI is unavailable

The backend should return an appropriate error response indicating that the AI service is temporarily unavailable.

The frontend can then allow the user to retry later or continue using manual planning.

### The AI returns malformed output

The backend should reject the response.

A limited automatic retry with the same request can be attempted. If the retry also fails, an error should be returned to the frontend so the user can retry manually.

AI-generated data must not be stored until it passes validation.

### A task or plan does not exist

The backend should return an appropriate not-found error.

It should not create fake completion records or modify performance data when the requested task does not exist.

If a day has no planned tasks, it should simply be treated as a day with no activity.

### A user tries to access another user's task

The backend must verify ownership using the authenticated user's ID.

A user must not be able to view, modify, complete, or delete another user's data, even if they know the resource ID.

---

## 11. Security & Privacy

* Passwords must never be stored as plaintext.
* User data must be isolated between accounts.
* AI requests should only contain the data necessary for the requested operation.
* SQLite must remain accessible only through the backend.
* Authentication secrets and configuration must not be hardcoded.
* Environment-specific secrets and configuration should be stored in `.env`.
* AI-generated content must be validated before being stored or acted upon.
* Database queries involving user data must always be scoped to the authenticated user.

---

## 12. MVP Backend Requirements

* FastAPI backend.
* SQLite persistence.
* User authentication.
* User/task/plan management.
* Task completion tracking.
* Performance calculation.
* AI chat endpoint.
* AI plan generation.
* AI performance report generation.
* AI output validation.
* Performance data for the frontend graph.
* Weekly donut-chart data/report generation.
* Error handling.
* User data isolation.

The backend should provide the data required by the frontend rather than making the frontend responsible for business logic such as performance calculation or workload validation.

---

## 13. Explicitly Out of Scope

* Microservices.
* Redis.
* PostgreSQL.
* Message queues.
* Complex caching systems.
* Kubernetes/container orchestration.
* Multiple AI providers or models.
* Complex event-driven architecture.
* Complex background-job infrastructure.
* Large-scale distributed systems.

The backend should remain a simple monolithic FastAPI application suitable for the project's MVP and challenge timeframe.

---

## 14. Definition of Done

The backend is complete when an authenticated user can:

* Create an account and log in.
* Create, view, edit, and delete their own plans and tasks.
* Mark their assigned tasks as completed.
* Have task and performance data persist correctly in SQLite.
* Chat with the AI.
* Generate an AI-assisted plan based on their goal and relevant performance history.
* Have AI-generated plans validated before being stored.
* Generate a performance report using their stored task history.
* Retrieve the data required for the consistency graph and weekly performance chart.
* Have their future AI planning influenced by their previous performance.
* Be prevented from accessing or modifying another user's data.
* Continue using manual planning when the AI is unavailable.
