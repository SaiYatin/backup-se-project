# ✅ docs/TEAM_WORKFLOW.md
# Team Workflow Guide

## Sprint Planning (Week 1, Monday)
1. Review sprint goal
2. Break down user stories
3. Assign tasks
4. Estimate story points

## Daily Standup (Every day, 15 mins)
- What did I complete yesterday?
- What will I work on today?
- Any blockers?

## Code Review Process
1. Create feature branch from `develop`
2. Make changes and commit
3. Create PR to `develop`
4. Request review from teammate
5. Address feedback
6. Merge after approval

## Git Workflow
```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Commit changes
git add .
git commit -m "feat: add user authentication"

# Push and create PR
git push origin feature/your-feature-name
```

## Definition of Done
- [ ] Code written and follows standards
- [ ] Unit tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Merged to develop
- [ ] Deployed to staging
- [ ] Verified by Product Owner
```

---

### 16. **License File Empty**

**File**: `LICENSE` - EMPTY

**Fix Required**:
```
MIT License

Copyright (c) 2025 Soul Society - Fundraising Portal Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.