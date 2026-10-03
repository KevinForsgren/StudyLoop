# Project Specification

## 1. Problem

I am building a web app to help a friend maintain consistency with his work and goals.

The main purpose of the app is to provide assistance through a locally hosted LLM that can help plan his work schedule. Based on his past performance and consistency, the system can adjust his workload over time while keeping his goals achievable.

## 2. Who is it for?

The initial user is my college friend, who has difficulty consistently planning, starting, and completing his work.

The app is designed around his specific needs, particularly:

* Planning his work.
* Following the planned schedule.
* Maintaining consistency.
* Understanding his progress over time.

## 3. Core Idea

The app will be a web application where the user can either:

* Create tasks and schedules manually for a day or an entire week.
* Explain his goals, work, and related difficulties to the built-in chatbot, which can then create a suitable schedule for him.

After a plan is created and confirmed, the user can access it through the built-in task planner.

The user will log in daily and mark completed tasks. Task completion can only be recorded by the authenticated user for their own account.

At the end of a week, or whenever the user wants, they can generate a performance report. The AI will use the user's stored performance history to summarize their progress and identify whether their consistency and performance are improving or declining.

### Adaptive Workload

The AI will use previous performance and consistency when planning future tasks.

However, poor performance should not cause the workload to continuously decrease. The system will maintain both a **minimum and maximum daily workload**, ensuring that the user continues progressing toward their overall goal while keeping the workload achievable.

### Consistency Graph

Task completion history will be represented in a GitHub-style activity graph.

Each day will have a different brightness/intensity based on the percentage of assigned work completed:

* 0%
* 25%
* 50%
* 75%
* 100%

### Performance Report

The performance report will contain:

* A visual chart of the user's recent performance.
* An AI-generated summary of their performance.
* A simple motivational response based on whether their performance has improved or declined.

The report should remain focused on the user's actual progress rather than becoming a general-purpose AI conversation.

## 4. User Flow

1. The user creates an account using a username, password, and email.
2. The user can either:

   * Chat with the AI to create a plan, or
   * Create/edit a plan manually.
3. After confirming an AI-generated plan, the tasks are automatically added to the built-in planner.
4. The user logs in daily and marks their assigned tasks as completed.
5. The application stores task completion and performance data.
6. The user can open the performance page at any time to view their recent performance and generate a report based on their past seven days.
7. The application stores relevant data in SQLite so the AI can use the user's history when generating future plans and performance reports.
8. The application includes a simple Pomodoro timer with:

   * Pomodoro session
   * Short break
   * Long break

The timer allows the user to focus without leaving the application.

## 5. AI Component

### What does the AI do?

* The user can have a normal conversation with the AI about their goals, work, and difficulties.
* The AI uses this conversation to help create a suitable plan.
* After the user confirms the plan, the AI automatically adds the resulting tasks and schedule to the planner.
* The AI can generate a summary of the user's performance over the past seven days or a full week.
* The AI can use previous performance data when planning future workloads.

### Why does the project need AI?

The AI acts as a personal planning assistant and a sense of accountability for the user. Its purpose is to help the user create realistic plans, maintain consistency, and understand their progress.

### Which open-weight/open-source model?

* ...

### What information does the AI receive?

The AI can receive:

* Relevant chat content with the user.
* The user's tasks and schedules.
* The user's task completion history.
* Relevant performance statistics.

### What does the AI return?

* A planned schedule and task list.
* A performance report and summary.

## 6. MVP

### Must Have

* Chat session.
* Todo/schedule planner.
* GitHub-style consistency graph for the year.
* Performance summary section with:

  * Performance graph.
  * Approximately 100-word AI-generated report.
* Pomodoro timer.
* User authentication/login.

### Nice to Have

These should only be implemented if the core MVP is already stable:

* More polished performance animations.
* Additional visual polish for the consistency graph.
* More refined transitions and feedback throughout the interface.
* Additional customization for the Pomodoro timer.

### Explicitly Not in MVP

The following are outside the initial scope:

* Mobile applications.
* Social or multiplayer features.
* Sharing progress with other users.
* Cloud-based AI as a requirement.
* Multiple AI models or complex model-routing systems.
* Large-scale external service integrations.
* Complex productivity features unrelated to the core planning and consistency system.
* Overly complex authentication or account-management systems.
* Features that require significant infrastructure beyond the core application.

## 7. Tech Stack

* **Backend:** Python + FastAPI
* **Frontend:** HTML/CSS/JavaScript + React + Tailwind
* **AI:** [model]
* **Database:** SQLite
* **Deployment:** [later]

## 8. Constraints

* The project must be buildable within the challenge timeframe.
* Dependencies should remain reasonable.
* Avoid unnecessary complexity and over-engineering.
* User data and privacy should be handled responsibly.
* The application should remain reliable even when the AI is unavailable or produces an unexpected response.
* The core functionality should work independently of optional features.

## 9. Hacktoberfest Requirements

* New project.
* Open-source AI is a core part of the application.
* The project is built around a real problem faced by a friend.
* The project must have a working demo.
* The project should clearly explain why open innovation and open-source AI are relevant to the project.

## 10. Definition of Done

The MVP is considered complete when:

* A user can create and access an account.
* A user can manually create and edit tasks and schedules.
* A user can communicate with the AI to create a plan.
* A confirmed AI-generated plan can be added to the planner.
* A user can mark their assigned tasks as completed.
* Task completion data is persisted in SQLite.
* The application generates the GitHub-style consistency graph.
* The application can generate a performance graph and AI summary from stored performance data.
* The AI can use previous performance data when generating future plans.
* The Pomodoro timer works correctly.
* The main application flow works without requiring unnecessary manual intervention.
