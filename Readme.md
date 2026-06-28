# Deadline Rescue

An AI-powered task execution assistant that helps users transform unstructured assignments, project briefs, and deadlines into actionable execution plans.

## Problem

Students and professionals often receive large assignments, project specifications, hackathon briefs, or deadlines without a clear execution strategy.

Deadline Rescue converts raw task descriptions into:

* Structured task analysis
* Step-by-step execution plans
* Progress tracking
* Risk assessment
* Emergency recovery recommendations

## Features

### Task Creation

Users can:

* Upload or paste task descriptions
* Create multiple independent tasks
* Store tasks permanently in MongoDB

### AI Task Analysis

The system automatically extracts:

* Task title
* Priority level
* Difficulty
* Deadline information
* Estimated effort

### Execution Planning

AI generates:

* Phases
* Actionable steps
* Estimated hours
* Critical paths

### Progress Tracking

Track:

* Completed steps
* Remaining work
* Current phase
* Overall completion percentage

### Emergency Mode

The system evaluates:

* Risk level
* Remaining time
* Remaining effort

And generates:

* Focus recommendations
* Recovery plans
* Emergency priorities

### Task Hub

Centralized task management:

* View all tasks
* Track status
* Monitor risk levels
* Delete tasks

## Architecture

### Frontend

* React
* TypeScript
* Vite
* TailwindCSS
* React Query

### Backend

* FastAPI
* Python

### Database

* MongoDB Atlas

### AI Layer

* Task Analysis Agent
* Execution Plan Agent
* Progress Tracker Agent
* Emergency Mode Agent

## Project Structure

```text
frontend/
├── components/
├── hooks/
├── services/
├── types/

backend/
├── api/
├── services/
├── database/
├── agents/
```

## Workflow

1. User submits task
2. Task is stored in MongoDB
3. AI analyzes task
4. Execution plan is generated
5. Progress tracking initialized
6. Emergency mode calculated
7. User executes and completes steps
8. Dashboard updates in real time

## Future Improvements

* Authentication
* User-specific workspaces
* Notification engine
* Real PDF/DOCX parsing
* Calendar integration
* AI-generated emergency solutions

## Learning Outcomes

This project was built as a practical exploration of:

* FastAPI
* MongoDB
* React
* TypeScript
* Full-stack application architecture
* AI workflow orchestration
* State management
* Production debugging

## Author

Devesh Kadam

Bachelor of Computer Applications (BCA)

AI / ML and Cybersecurity Enthusiast
