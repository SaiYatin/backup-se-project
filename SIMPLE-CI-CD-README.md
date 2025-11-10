# CI/CD Pipeline - README
## Soul Society Team

---

## 🚀 What Is This?

A **simple automated pipeline** that checks your code quality on every push.

**6 stages:** Build → Test → Coverage → Lint → Security → Deploy

**Result:** Downloadable coverage reports + deployment package

---

## ✅ What You Get

**Full marks (15/15) if:**
- Pipeline runs successfully (shows 6 green ✅)
- Code coverage ≥75%
- At least 10 pipeline runs visible
- Artifacts downloadable

---

## 🏃 How to Use

### Before Pushing Code:
```bash
cd backend
npm test                    # Tests pass?
npm test -- --coverage      # Coverage ≥75%?
git push                    # Pipeline runs automatically!
```

### After Pushing:
1. Go to GitHub → Actions tab
2. Watch pipeline run (~9 minutes)
3. See 6 green checkmarks ✅
4. Download artifacts (coverage report + deployment ZIP)

---

## 📊 Checking Coverage

**Quick check:**
```bash
npm test -- --coverage
```

**Detailed check:**
1. Download `coverage-report` from GitHub Actions
2. Open `index.html`
3. Green lines = covered ✅
4. Red lines = need tests ❌

**Need:** All metrics ≥75%

---

## 🎯 For Final Demo

**Show TA (5 minutes):**

1. **GitHub Actions tab** - Multiple runs visible
2. **Latest run** - All 6 stages green
3. **Coverage report** - ≥75% achieved
4. **Deployment ZIP** - Contains code + reports

**= 15/15 marks!** 🎉

---

## 🚨 Troubleshooting

**Pipeline failed?**
- Click the failed stage
- Read error message
- Fix locally (`npm test`)
- Push again

**Coverage too low?**
- Download coverage HTML
- See what's red (uncovered)
- Write tests for it
- Push again

**Lint errors?**
- Run: `npx eslint src/ --fix`
- Push again

---

## 📁 Files

- `.github/workflows/ci-cd-pipeline.yml` - Pipeline config (don't touch)
- `backend/.eslintrc.json` - Linting rules
- `backend/jest.config.js` - Coverage threshold (75%)

---

## 💡 Simple Rules

1. **Write tests while coding** (not after)
2. **Run `npm test` before pushing** (avoid failures)
3. **Check coverage often** (keep it ≥75%)
4. **Fix pipeline failures fast** (don't let them pile up)

---

## ✅ Success Checklist

**Before final demo:**
- [ ] Pipeline has ≥10 successful runs
- [ ] Latest run shows 6 green stages
- [ ] Coverage report shows ≥75%
- [ ] Team can explain what pipeline does
- [ ] Artifacts are downloadable

**All checked? You're ready!** 🚀

---

**Questions?** Check the error logs in GitHub Actions or ask team.

**Simple pipeline. Full marks. No stress.** ✨
