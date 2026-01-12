# CovenantOps

A polished web application that transforms loan agreements into an **Obligations Control Tower**. Track obligations, upload evidence, export calendars, and generate compliance reports with an intuitive, accessible interface.

## 🚀 Live Demo

**[Try the live demo →](https://tsyrulb.github.io/lma_edge/)**

The demo runs entirely in your browser with realistic sample data - no backend required!

## ✨ Features

### Core Functionality
- **Smart Obligation Extraction**: Parse loan agreements and automatically extract obligations
- **Status Tracking**: Visual dashboard with color-coded status badges (On Track, Due Soon, Overdue, Completed)
- **Evidence Management**: Upload and organize compliance evidence with audit trails
- **Calendar Export**: Generate ICS files for obligation due dates
- **Compliance Reporting**: Generate printable compliance packets

### UI/UX Enhancements
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Accessibility**: Full keyboard navigation, screen reader support, WCAG AA compliance
- **Smart Date Formatting**: Human-readable dates with relative formatting ("in 3 days", "2 weeks ago")
- **Loading States**: Smooth loading indicators and skeleton screens
- **Toast Notifications**: Real-time feedback for user actions
- **Form Validation**: Inline validation with helpful error messages

### Demo Mode
- **Realistic Sample Data**: Pre-populated with 2 sample loans and 20+ obligations
- **Persistent Storage**: Changes saved to browser localStorage
- **Auto-Detection**: Automatically enables on GitHub Pages deployment
- **Full Functionality**: All features work without a backend connection

## 🎯 Quick Start

### Option 1: Try the Live Demo
Visit **[the live demo](https://tsyrulb.github.io/lma_edge/)** - no installation required!

### Option 2: Local Development

#### Backend (FastAPI + SQLite)
```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

API available at: `http://localhost:8000/api` (Docs: `http://localhost:8000/docs`)

#### Frontend (Angular)
```bash
cd frontend
npm install
npm start
```

Frontend available at: `http://localhost:4200`

#### Demo Mode Toggle
- **Enable Demo Mode**: Click "Try Demo Mode" button or visit `http://localhost:4200?demo=true`
- **Disable Demo Mode**: Click "Exit Demo Mode" in settings or clear localStorage

## 🎬 Demo Walkthrough

### With Live Demo (2 minutes)
1. Visit the [live demo](https://tsyrulb.github.io/lma_edge/)
2. Explore the **Dashboard** with pre-loaded sample data
3. Click on an obligation to view details and upload evidence
4. Try the **Import** page to create new loans
5. Export calendar or generate compliance reports

### With Local Setup (3 minutes)
1. Open `http://localhost:4200` → **Import**
2. Create loan "DemoCo Facility Agreement", paste agreement text → **Extract obligations**
3. Go to **Dashboard** (auto-selects most recent loan)
4. Open an obligation → upload evidence → mark **Complete**
5. From Dashboard: **Export ICS** + open **Compliance Packet**

## 🧪 Testing

### Run All Tests
```bash
cd frontend
npm test
```

### Test Coverage
```bash
cd frontend
npm run test:coverage
```

### Build Verification
```bash
cd frontend
npm run build                    # Standard build
npm run build:github-pages      # GitHub Pages build
```

## 🚀 Deployment

### GitHub Pages (Recommended)
1. Fork this repository
2. Enable GitHub Pages in repository settings
3. GitHub Actions will automatically build and deploy
4. Demo mode will be automatically enabled

### Manual Deployment
```bash
cd frontend
npm run build:github-pages
# Deploy contents of dist/lma_edge/browser/ to your hosting provider
```

## 🏗️ Architecture

### Frontend (Angular 17)
- **Components**: Reusable UI components (StatusBadge, LoadingSpinner, ToastContainer)
- **Services**: API service with demo mode fallback, Toast notifications, Mock data service
- **Pages**: Dashboard, Import, Obligation Detail, Evidence, Settings
- **Utils**: Date formatting, form validation

### Backend (FastAPI + SQLite)
- **API**: RESTful endpoints for loans, obligations, evidence
- **Database**: SQLite with SQLAlchemy ORM
- **Storage**: Local file storage for evidence uploads
- **Services**: Document extraction, calendar export, compliance reporting

### Demo Mode
- **Mock Data Service**: Complete API simulation with localStorage persistence
- **Sample Data**: Realistic loans and obligations with proper date ranges
- **Auto-Detection**: Enables automatically on static hosting platforms

## 📁 Project Structure

```
lma_edge/
├── frontend/                 # Angular application
│   ├── src/app/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Utility functions
│   ├── dist/               # Build output
│   └── package.json
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── routers/        # API route handlers
│   │   ├── services/       # Business logic
│   │   └── models.py       # Database models
│   ├── storage/            # File uploads
│   └── requirements.txt
├── .github/workflows/      # GitHub Actions
└── README.md
```

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL`: SQLite database path (default: `backend/lma_edge.db`)
- `STORAGE_DIR`: Evidence file storage directory (default: `backend/storage/`)

### Demo Mode
Demo mode automatically enables on:
- GitHub Pages (`*.github.io` domains)
- HTTPS static hosting (when no backend is detected)
- Manual activation via UI or URL parameter

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test` in frontend directory)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for the LMA EDGE Hackathon
- Designed for loan covenant tracking and compliance management
- Optimized for accessibility and user experience