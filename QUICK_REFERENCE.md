# Quick Reference - Development Commands

## 🚀 Getting Started

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd student-mentor-backend
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows
source .venv/bin/activate    # Linux/Mac
pip install -r requirements.txt
cd ..

# Start backend server (Terminal 1)
cd student-mentor-backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Start frontend dev server (Terminal 2)
npm run dev

# Open browser at http://localhost:5173
```

## 🔧 Development

```bash
# Development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🧪 Testing

### Frontend Tests

```bash
# Run all frontend tests
npm run test

# Run tests in watch mode (auto-rerun on changes)
npm run test -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Backend Tests

```bash
# Activate backend environment first
cd student-mentor-backend
.venv\Scripts\Activate.ps1  # Windows

# Run backend tests
pytest

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov=. --cov-report=html
```

## ✨ Code Quality

```bash
# Check for linting errors
npm run lint

# Fix auto-fixable linting issues
npm run lint:fix

# Check code formatting
npm run format:check

# Format all files
npm run format

# TypeScript type checking
npm run type-check
```

## 🔄 Git Workflow

```bash
# Stage changes
git add .

# Commit (triggers pre-commit hooks)
git commit -m "feat: your feature description"

# Push to remote
git push origin your-branch-name
```

### Commit Message Format

```
<type>(<scope>): <subject>

Examples:
feat(chat): add voice input support
fix(login): resolve authentication timeout
docs(readme): update setup instructions
test(homework): add unit tests
refactor(dashboard): extract chart components
style(ui): format button component
chore(deps): update dependencies
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 📦 Dependencies

```bash
# Install new dependency
npm install package-name

# Install dev dependency
npm install --save-dev package-name

# Update all dependencies
npm update

# Check for outdated packages
npm outdated
```

## 🐞 Troubleshooting

### Frontend Issues

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Reset Husky hooks
rm -rf .husky
npx husky install

# Check for type errors
npm run type-check

# View detailed test output
npm run test -- --reporter=verbose
```

### Backend Issues

```bash
# Recreate virtual environment
cd student-mentor-backend
rm -rf .venv
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Check Firestore connection
python -c "from google.cloud import firestore; print('Firestore OK')"

# Verify ADK installation
python -c "import google.adk; print(google.adk.__version__)"

# Test backend endpoints
curl http://localhost:8000/health
```

## 🔍 Useful VS Code Commands

```
Ctrl+Shift+P          Open command palette
Ctrl+P                Quick file open
Ctrl+Shift+F          Search across files
Ctrl+`                Toggle terminal
F2                    Rename symbol
Shift+Alt+F           Format document
Ctrl+.                Quick fix
```

## 📚 Documentation

- **Setup Guide**: `SETUP_INSTRUCTIONS.md`
- **Contributing**: `CONTRIBUTING.md`
- **Architecture**: `RESTRUCTURING_GUIDE.md`
- **Improvements**: `PROJECT_IMPROVEMENTS.md`

## 🆘 Common Issues

### Issue: Frontend port already in use
```bash
# Kill process on port 5173 (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```

### Issue: Backend port already in use
```bash
# Kill process on port 8000 (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process
```

### Issue: Firestore authentication error
```bash
# Verify service account path in .env
echo $env:GOOGLE_APPLICATION_CREDENTIALS

# Check file exists
Test-Path "path/to/service-account.json"
```

### Issue: Husky hooks not running
```bash
# Reinitialize Husky
npx husky install
```

### Issue: Tests failing after update
```bash
# Clear test cache
npm run test -- --clearCache
```

### Issue: Build fails
```bash
# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint
```

## 🎯 Before Pushing

Always run these before pushing:

### Frontend
```bash
npm run lint:fix      # Fix linting issues
npm run format        # Format code
npm run type-check    # Check types
npm run test          # Run tests
npm run build         # Verify build works
```

### Backend
```bash
cd student-mentor-backend
.venv\Scripts\Activate.ps1
pytest                # Run backend tests
python -m black .     # Format Python code (if installed)
python -m flake8 .    # Lint Python code (if installed)
```

Or run all frontend checks at once:
```bash
npm run lint:fix && npm run format && npm run type-check && npm run test && npm run build
```

## 🚀 Production Deployment

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview

# Output is in dist/ directory
```

## 📊 Project Stats

```bash
# Count lines of code (requires cloc)
cloc . --exclude-dir=node_modules,dist

# Check bundle size
npm run build
du -sh dist/

# Analyze dependencies
npm list --depth=0
```

---

**Tip**: Add this file to your bookmarks for quick access to commands!
