\# ============================================

\# FILE: docs/TEAM\_WORKFLOW.md

\# ============================================

---

\# Team Workflow Guide - Fundraising Portal



\## Team Structure (4 Developers)



\### Developer 1 - Backend Lead (@dev1)

\*\*Responsibilities:\*\*

\- User authentication system (FR-001)

\- Event management APIs (FR-002, FR-003, FR-004)

\- Database schema \& migrations

\- Backend testing setup



\*\*Sprint 1 Tasks:\*\*

\- SSS-2: User registration/login

\- SSS-19: Password hashing

\- SSS-20: Secure sessions (JWT)

\- SSS-4: Create event API

\- SSS-9: Edit/delete event API



\### Developer 2 - Backend Support (@dev2)

\*\*Responsibilities:\*\*

\- Pledge system APIs (FR-005, FR-006)

\- Admin \& reporting features (FR-011, FR-012, FR-014)

\- Email notifications (FR-009)

\- Performance optimization (NFR-001)



\*\*Sprint 1 Tasks:\*\*

\- SSS-10: Submit pledge API

\- SSS-18: Aggregate pledges

\- SSS-5: Admin view API

\- SSS-6: Admin approve/reject

\- SSS-14: Confirmation emails



\### Developer 3 - Frontend Lead (@dev3)

\*\*Responsibilities:\*\*

\- Authentication UI (Login/Register)

\- Event pages (List, Detail, Create/Edit)

\- Dashboard setup

\- State management (Context API)



\*\*Sprint 1 Tasks:\*\*

\- SSS-2: Login/Register UI

\- SSS-4: Create event form

\- SSS-16: View active events

\- SSS-9: Edit/delete event UI

\- Dashboard layout



\### Developer 4 - Frontend Support (@dev4)

\*\*Responsibilities:\*\*

\- Pledge submission UI

\- Charts \& visualizations (FR-007)

\- Admin panel

\- Responsive design (NFR-005)



\*\*Sprint 1 Tasks:\*\*

\- SSS-10: Pledge form

\- SSS-12: Anonymous pledge checkbox

\- SSS-21: Pledge history

\- SSS-24: Progress charts

\- SSS-11: Role-based UI



---



\## Daily Workflow



\### Morning (9:00 AM)

1\. Pull latest changes from `develop`

2\. Check sprint board for assigned tasks

3\. Daily standup (15 mins):

&nbsp;  - What I did yesterday

&nbsp;  - What I'll do today

&nbsp;  - Any blockers



\### During Day

1\. Work on assigned tasks

2\. Commit frequently with clear messages

3\. Push to feature branch

4\. Update task status on GitHub Projects



\### End of Day

1\. Push all commits

2\. Update task progress

3\. Note any blockers in Slack



---



\## Git Workflow



\### 1. Start New Feature

```bash

git checkout develop

git pull origin develop

git checkout -b feature/your-feature-name

```



\### 2. Work on Feature

```bash

\# Make changes

git add .

git commit -m "feat: add user login endpoint"



\# Push regularly

git push origin feature/your-feature-name

```



\### 3. Create Pull Request

\- Go to GitHub

\- Click "New Pull Request"

\- Base: `develop`, Compare: `feature/your-feature-name`

\- Fill out PR template:

&nbsp; ```markdown

&nbsp; ## Description

&nbsp; Brief description of changes

&nbsp; 

&nbsp; ## Related Issue

&nbsp; Closes #123

&nbsp; 

&nbsp; ## Type of Change

&nbsp; - \[ ] Bug fix

&nbsp; - \[x] New feature

&nbsp; - \[ ] Breaking change

&nbsp; 

&nbsp; ## Checklist

&nbsp; - \[x] Code follows style guidelines

&nbsp; - \[x] Tests added/updated

&nbsp; - \[x] Documentation updated

&nbsp; ```

\- Request review from teammate



\### 4. Code Review

\*\*Reviewer checks:\*\*

\- Code quality

\- Tests passing

\- No security issues

\- Follows project standards



\*\*If changes requested:\*\*

```bash

\# Make changes

git add .

git commit -m "fix: address review comments"

git push origin feature/your-feature-name

```



\### 5. Merge

\- Squash and merge after approval

\- Delete feature branch



---



\## Communication



\### Slack Channels

\- `#fundraising-general`: General discussion

\- `#fundraising-backend`: Backend questions

\- `#fundraising-frontend`: Frontend questions

\- `#fundraising-bugs`: Bug reports



\### Meetings

\- \*\*Daily Standup\*\*: 9:00 AM (15 mins)

\- \*\*Sprint Planning\*\*: Monday 10:00 AM (1 hour)

\- \*\*Sprint Review\*\*: Friday 4:00 PM (30 mins)

\- \*\*Sprint Retro\*\*: Friday 4:30 PM (30 mins)



---



\## Code Review Guidelines



\### Before Requesting Review

\- \[ ] All tests pass locally

\- \[ ] Code is self-documented

\- \[ ] No console.log() statements

\- \[ ] Follows naming conventions

\- \[ ] README updated if needed



\### When Reviewing

\- Review within 24 hours

\- Be constructive and respectful

\- Test changes locally if possible

\- Suggest improvements, don't just criticize



---



\## Testing Strategy



\### Backend (Dev1 \& Dev2)

```bash

\# Run all tests

npm test



\# Watch mode

npm test -- --watch



\# Coverage

npm run test:coverage

```



\*\*Test Coverage Goal:\*\* >80%



\### Frontend (Dev3 \& Dev4)

```bash

\# Run tests

npm test



\# E2E tests (later sprints)

npm run test:e2e

```



\*\*Test Coverage Goal:\*\* >70%



---



\## Deployment Process



\### Development → Staging → Production



1\. \*\*Merge to `develop`\*\*

&nbsp;  - Automatic deployment to staging

&nbsp;  - Run smoke tests



2\. \*\*Create Release PR\*\*

&nbsp;  - From `develop` to `main`

&nbsp;  - QA testing on staging

&nbsp;  - Get approval from all team members



3\. \*\*Merge to `main`\*\*

&nbsp;  - Automatic deployment to production

&nbsp;  - Monitor logs and metrics



---



\## Troubleshooting Common Issues



\### Backend won't start

```bash

\# Check PostgreSQL

pg\_isready



\# Check .env file

cat backend/.env



\# Reinstall dependencies

cd backend \&\& rm -rf node\_modules \&\& npm install

```



\### Frontend can't connect

```bash

\# Check backend is running

curl http://localhost:5000/api/health



\# Check .env file

cat frontend/.env



\# Clear cache

rm -rf node\_modules .vite

npm install

```



\### Database issues

```bash

\# Reset database

dropdb fundraising\_db

createdb fundraising\_db

psql -d fundraising\_db -f database/schema.sql

```



---



\## Sprint Ceremonies



\### Sprint Planning (Week 1, Monday)

1\. Review sprint goal

2\. Break down user stories

3\. Assign tasks to developers

4\. Estimate story points



\### Daily Standups (Every day, 15 mins)

\- Time-boxed to 15 minutes

\- Each person answers 3 questions

\- Update sprint board



\### Sprint Review (Week 2, Friday)

\- Demo completed features

\- Get feedback from instructor

\- Update backlog



\### Sprint Retrospective (Week 2, Friday)

\- What went well?

\- What could be improved?

\- Action items for next sprint



---



\## Quality Standards



\### Code Quality

\- Use ESLint and Prettier

\- Follow Airbnb style guide

\- No warnings in console

\- Maximum function length: 50 lines

\- Maximum file length: 300 lines

\- Meaningful variable names

\- Add comments for complex logic



\### Security Checklist

\- \[ ] No hardcoded secrets

\- \[ ] Input validation on all endpoints

\- \[ ] SQL injection prevention

\- \[ ] XSS prevention

\- \[ ] CORS properly configured

\- \[ ] Rate limiting enabled



---



\## Definition of Done



A task is "Done" when:

\- \[ ] Code written and reviewed

\- \[ ] Unit tests passing

\- \[ ] Integration tests passing (if applicable)

\- \[ ] Documentation updated

\- \[ ] PR approved by 1+ team member

\- \[ ] Merged to develop

\- \[ ] Tested on staging



---



\## Emergency Contacts



\- \*\*Technical Lead\*\*: \[Name] - \[Email]

\- \*\*Course Instructor\*\*: \[Name] - \[Email]

\- \*\*University IT Support\*\*: \[Number]



---



Last Updated: October 24, 2025

