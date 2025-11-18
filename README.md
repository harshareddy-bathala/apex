# 🎓 Student Mentor AI

An intelligent AI-powered personal mentor system that monitors and supports students holistically across academics, sports, mental health, and personal development.

## 🌟 Overview

Student Mentor AI is more than just a chatbot—it's a comprehensive personal guide that:

- **Monitors Daily Progress**: Tracks student behavior across studies, sports, mental health, and social activities
- **Provides Personalized Guidance**: Multi-agent AI system adapts communication style based on student's age, maturity level, and personality
- **Supports Career Aspirations**: Guides students toward their dream careers with targeted advice
- **Enables Peer Collaboration**: Connect with classmates and teachers for homework help and discussions
- **Smart Task Management**: Track homework and upcoming tests with intelligent reminders stored in Firestore
- **AI-Powered Alerts**: Automatically notifies teachers when students need extra support
- **Generates Teacher Reports**: Provides educators with detailed insights into student well-being and performance
- **Ensures Holistic Development**: Balances academic excellence with mental health and physical fitness

## 🚀 Key Features

### 1. **Comprehensive Onboarding** 📝
- Multi-step profile creation capturing:
  - Basic info (name, age, grade)
  - Academic subjects, goals, and learning style
  - Career aspirations and dream job (editable anytime)
  - Interests and hobbies (dynamic updates)
  - Sports and physical activities
  - Academic and personal challenges
  - Mental health considerations
- **Note**: Personalization data is used by AI but NOT shown in dashboard

### 2. **Dynamic Goals Management** 🎯
- **Current Goals**: Active focus areas
- **Short-term Goals**: 3-6 month objectives
- **Long-term Goals**: 1+ year aspirations
- **Career Aspirations**: Updated as interests evolve
- **Interests**: Add/remove hobbies anytime
- All goals are editable from user profile menu

### 3. **Homework & To-Do List** 📚
- View all assigned homework from teachers
- Filter by status: All, Pending, Completed
- Sort by due date or priority
- Priority levels: Low, Medium, High, Urgent
- Mark as in-progress, completed, or submitted
- Overdue warnings with visual indicators
- Estimated time tracking
- Subject and teacher information

### 4. **Upcoming Tests & Exams** 📝
- Complete test schedule from teachers
- View tests by: Upcoming, Today, This Week, All
- Test importance: Quiz, Unit Test, Midterm, Final, Board Exam
- Syllabus topics for each test
- Preparation status tracking
- Study materials and resources
- Personal notes for each test
- Days-until countdown

### 5. **Peer & Teacher Chat** 👥
- Real-time messaging with classmates
- Direct communication with teachers
- Online status indicators
- Message read receipts
- Subject-specific teacher contacts
- Conversation history
- Unread message counters

### 6. **AI Teacher Alerts** 🔔
- Automatic detection of struggling students
- Mental health crisis warnings
- Academic difficulty patterns
- Severity levels: Low, Medium, High, Urgent
- AI-generated insights and recommendations
- Suggested interventions
- Beta version for teacher notification

### 7. **Intelligent Dashboard** 📊
- Real-time progress visualization
- Mood trend analysis
- Study hours tracking
- Homework completion rates
- Stress level monitoring
- Recent activity feed
- Achievement highlights
- **Note**: Personal aspirations hidden from dashboard

### 8. **Daily Check-In System** ✅
- Track mood and emotional state
- Log sleep hours and energy levels
- Record study sessions and subjects
- Monitor physical activity
- Capture achievements and challenges
- Build historical data for insights

### 9. **Advanced AI Chat** 💬
- Multi-agent system powered by Google ADK (Agent Development Kit)
- Context-aware conversations using Gemini models
- Age-appropriate communication style
- Personalized responses based on all profile data from Firestore
- Considers current goals, not hardcoded aspirations
- Real-time streaming responses
- Automatic activity logging to backend
- **AI Alert Triggers**: Detects when student needs teacher intervention
- Quick prompt suggestions

### 10. **Teacher Report Generation** 📄
- Comprehensive student progress reports
- Academic performance analysis
- Mental health and well-being assessment
- Physical activity tracking
- Behavioral insights
- Actionable recommendations
- Downloadable and printable reports

## 🏗️ Technical Architecture

### Frontend Stack
- **React 19** with TypeScript
- **Vite** for blazing-fast development
- **Tailwind CSS** + **Framer Motion** for responsive design and animations
- **React Router v7** for navigation
- **Firebase SDK** for authentication and Firestore integration

### Backend Stack
- **FastAPI** (Python) for RESTful API
- **Google ADK 0.3** (Agent Development Kit) for multi-agent AI orchestration
- **Firebase Admin SDK** for server-side authentication
- **Google Cloud Firestore** for persistent, multi-tenant data storage

### Data Management
- **Firestore** collections for users, student profiles, teacher profiles, assignments, submissions, and check-ins
- **Firebase Authentication** securing all endpoints
- Comprehensive TypeScript interfaces
- Real-time state management
- Multi-tenant data isolation by user ID

### AI Integration
- **Google ADK** multi-agent framework
- **Gemini 1.5 Flash** as the primary language model
- Dynamic system instruction generation based on student context
- Context-aware prompting with full student history from Firestore
- Streaming responses for better UX
- Intelligent alert detection and teacher notification system

## 📁 Project Structure

### Current Structure
```
student-mentor-ai/
├── components/             # React components
│   ├── chat/              # Chat-related components
│   ├── dashboard/         # Dashboard components
│   ├── Login.tsx
│   ├── Onboarding.tsx
│   ├── Dashboard.tsx
│   ├── GoalsEditor.tsx
│   ├── HomeworkList.tsx
│   ├── TestsList.tsx
│   ├── PeerChat.tsx
│   ├── Chat.tsx
│   ├── DailyCheckIn.tsx
│   ├── TeacherAlerts.tsx
│   └── TeacherReport.tsx
├── utils/
│   └── aiHelpers.ts       # AI prompting & analytics
├── tests/                  # Test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── setup.ts           # Test configuration
├── types.ts               # TypeScript type definitions
├── authTypes.ts           # Authentication types
├── App.tsx                # Main application
├── CONTRIBUTING.md        # Contribution guidelines
├── SETUP_INSTRUCTIONS.md  # Development setup guide
└── RESTRUCTURING_GUIDE.md # Architecture guide
```

📖 **See [RESTRUCTURING_GUIDE.md](./RESTRUCTURING_GUIDE.md) for planned architecture improvements**

## 🎯 Usage Guide

### For Students

1. **Complete Onboarding**:
   - Fill in all 6 steps of profile creation
   - Be honest about challenges and goals
   - Add interests and aspirations

2. **Daily Check-In**:
   - Complete daily check-in to track progress
   - Log mood, sleep, study hours, and activities
   - Record achievements

3. **Chat with AI Mentor**:
   - Ask questions about studies
   - Seek career guidance
   - Discuss challenges and concerns
   - Get personalized study strategies

4. **Monitor Progress**:
   - View dashboard for insights
   - Track mood trends
   - Review study patterns
   - See activity history

### For Teachers/Parents

1. **Generate Reports**:
   - Click "Report" button in navigation
   - Review comprehensive student analysis
   - Download or print for records
   - Use recommendations for intervention

## 💡 Key Differentiators

### What Makes This System Unique?

1. **Multi-Agent AI Architecture**: Powered by Google ADK with specialized agents for different tasks
2. **Holistic Monitoring**: Unlike simple chatbots, tracks multiple dimensions of student life
3. **Adaptive AI**: Communication style adapts to age and maturity level
4. **Actionable Insights**: Generates specific, data-driven recommendations from Firestore analytics
5. **Multi-Stakeholder**: Serves students, teachers, and parents with role-based access
6. **Cloud-Native**: Built on Firebase and Google Cloud for scalability and reliability
7. **Career-Oriented**: Connects daily activities to long-term aspirations

## 🔮 Upcoming Features

### Phase 1 - Enhanced Communication
- [ ] **Group Study Rooms**: Create virtual study sessions with multiple students
- [ ] **Video/Voice Chat**: Real-time video calls with teachers and peers
- [ ] **Screen Sharing**: Share screens for collaborative problem-solving
- [ ] **File Attachments**: Send and receive study materials, notes, PDFs

### Phase 2 - Advanced Analytics
- [ ] **Predictive Performance**: AI predicts exam performance based on preparation
- [ ] **Learning Style Optimization**: Personalized study recommendations
- [ ] **Time Management AI**: Smart scheduling based on workload and deadlines
- [ ] **Comparison Analytics**: Anonymous peer performance benchmarking

### Phase 3 - Gamification & Rewards
- [ ] **Achievement Badges**: Earn badges for study streaks, goals, improvements
- [ ] **Leaderboards**: Friendly competition with classmates
- [ ] **XP System**: Gain experience points for completing tasks
- [ ] **Virtual Rewards**: Unlock themes, avatars, study tools

### Phase 4 - Parent/Guardian Features
- [ ] **Parent Dashboard**: View child's progress and well-being
- [ ] **Weekly Reports**: Automated summary emails
- [ ] **Concern Alerts**: Notifications for academic/mental health issues
- [ ] **Parent-Teacher Communication**: Direct messaging channel

### Phase 5 - School Integration
- [ ] **LMS Integration**: Connect with Canvas, Google Classroom, Moodle
- [ ] **Grade Sync**: Automatic grade import from school systems
- [ ] **Calendar Integration**: Sync with school calendars
- [ ] **Attendance Tracking**: Monitor and report attendance patterns

### Phase 6 - AI Enhancements
- [ ] **Study Plan Generator**: AI creates personalized study schedules
- [ ] **Doubt Solver**: AI explains concepts with step-by-step solutions
- [ ] **Practice Problem Generator**: Auto-generate practice questions
- [ ] **Essay Reviewer**: AI feedback on writing assignments
- [ ] **Voice AI Mentor**: Voice-based interactions for accessibility

### Phase 7 - Wellness Features
- [ ] **Meditation & Mindfulness**: Guided sessions for stress relief
- [ ] **Break Reminders**: Smart notifications to take study breaks
- [ ] **Sleep Tracker**: Monitor and optimize sleep patterns
- [ ] **Nutrition Tips**: Healthy eating advice for students
- [ ] **Exercise Challenges**: Physical fitness goals and tracking

### Phase 8 - Career Development
- [ ] **Career Aptitude Tests**: AI-powered career assessments
- [ ] **Industry Mentorship**: Connect with professionals in dream fields
- [ ] **College Planning**: Application guidance and deadlines
- [ ] **Skill Development Paths**: Curated learning tracks for career goals
- [ ] **Internship Finder**: Opportunities matching student interests

### Phase 9 - Content Library
- [ ] **Video Tutorials**: Recorded lessons for all subjects
- [ ] **Practice Tests**: Mock exams with detailed explanations
- [ ] **Study Notes**: Community-contributed study materials
- [ ] **Formula Sheets**: Quick reference guides
- [ ] **Past Papers**: Previous exam papers with solutions

### Phase 10 - Advanced Features
- [ ] **Multi-language Support**: Interface in student's native language
- [ ] **Offline Mode**: Access key features without internet
- [ ] **Mobile Apps**: Native iOS and Android applications
- [ ] **Smart Watch Integration**: Quick check-ins and reminders
- [ ] **AR Study Tools**: Augmented reality for interactive learning
- [ ] **Blockchain Certificates**: Verified achievement credentials
- [ ] **AI Tutor Network**: Connect with specialized AI tutors

### Phase 11 - Teacher Tools
- [ ] **Class Management**: Bulk homework and test assignments
- [ ] **Automated Grading**: AI-assisted assignment evaluation
- [ ] **Attendance Dashboard**: Visual attendance tracking
- [ ] **Performance Predictions**: Early warning system for at-risk students
- [ ] **Lesson Planning AI**: Curriculum suggestions and resources

### Phase 12 - Community Features
- [ ] **Study Groups**: Form groups based on subjects/interests
- [ ] **Peer Tutoring Marketplace**: Students help each other
- [ ] **Discussion Forums**: Subject-wise Q&A communities
- [ ] **Resource Sharing**: Exchange notes, summaries, tips
- [ ] **Event Calendar**: School events, deadlines, competitions

## 💭 Feature Suggestions

Have ideas for new features? We'd love to hear them! The system is designed to be extensible and can accommodate:

- **Custom Integrations**: Connect with your school's specific tools
- **Specialized Subjects**: Advanced courses, languages, vocational training
- **Regional Adaptations**: Country-specific curricula and exam boards
- **Accessibility Features**: Screen readers, dyslexia-friendly modes, etc.
- **Cultural Customization**: Respect local education systems and values

## 🔧 Configuration Options

### Customizing AI Behavior

Edit `utils/aiHelpers.ts` to modify:
- Age-based communication styles
- System instruction templates
- Insight generation rules
- Mood analysis thresholds

### Styling

The app uses Tailwind CSS. Customize colors in:
- `index.css` for global styles
- Component-level className attributes

## 📊 Data Models

All data is stored in **Google Cloud Firestore** with the following collections:

### `users`
Canonical record for every authenticated user containing `uid`, `email`, and `role` (student/teacher).

### `studentProfiles`
Extended student metadata including goals, interests, academic subjects, career aspirations, onboarding answers, and personalization data. Document ID matches the student's `uid`.

### `teacherProfiles`
Teacher-specific metadata and preferences, keyed by their `uid`.

### `assignments`
Homework and tests created by teachers, storing owner info, class identifiers, due dates, priority levels, and syllabus topics.

### `studentSubmissions`
Join table linking students to assignments with submission status, timestamps, and completion tracking.

### `checkins`
Daily wellness and academic check-ins created by students, including mood, sleep hours, study time, physical activity, and achievements. Used by AI agents for context-aware conversations.

## 🚀 Deployment

### Build Frontend for Production
```powershell
npm run build
```

The optimized static files will be in the `dist/` directory.

### Preview Production Build
```powershell
npm run preview
```

### Deploy to Google Cloud

**Backend (Cloud Run)**:
1. Build the Docker image for the FastAPI backend
2. Push to Google Container Registry or Artifact Registry
3. Deploy to Cloud Run with environment variables from `.env`
4. Ensure service account has Firestore and Firebase Admin permissions

**Frontend (Firebase Hosting or Cloud Storage + CDN)**:
1. Build the frontend with `npm run build`
2. Deploy `dist/` folder to Firebase Hosting: `firebase deploy --only hosting`
3. Or upload to Cloud Storage bucket configured for static website hosting

📖 **See [Google Cloud Run deployment guide](https://cloud.google.com/run/docs/quickstarts/build-and-deploy) for detailed instructions**

## 🔐 Privacy & Security

- **Firebase Authentication** secures all API endpoints
- **Multi-tenant data isolation** ensures students only access their own data
- **Firestore security rules** enforce role-based access control
- **Environment variables** protect API keys and credentials
- **HTTPS encryption** for all data in transit
- **Service account authentication** for backend-to-Firestore communication
- Teachers can only access reports and data for students in their classes

## 🎓 Use Cases

1. **Academic Support**: Help with homework, study strategies, exam preparation
2. **Career Guidance**: Advice on pursuing dream careers
3. **Mental Health**: Emotional support, stress management
4. **Time Management**: Balancing studies, sports, and personal life
5. **Goal Setting**: Breaking down aspirations into actionable steps
6. **Progress Tracking**: Monitoring growth across multiple dimensions

## 🤝 Contributing

We welcome contributions! This project follows best practices for code quality and maintainability.

### How to Contribute

1. **Read the guidelines**: Check [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines
2. **Setup your environment**: Follow [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)
3. **Understand the structure**: See [RESTRUCTURING_GUIDE.md](./RESTRUCTURING_GUIDE.md) for architecture
4. **Pick an issue**: Look for issues labeled `good first issue` or `help wanted`
5. **Make your changes**: Follow the code style and testing requirements
6. **Submit a PR**: Create a pull request with a clear description

### Development Commands

```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
npm run test           # Run tests
npm run test:ui        # Run tests with UI
npm run test:coverage  # Generate coverage report
npm run lint           # Check for linting errors
npm run lint:fix       # Fix linting errors
npm run format         # Format all files
npm run type-check     # Check TypeScript types
```

### Code Quality

- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **Vitest** for testing
- **TypeScript** for type safety

All contributions must pass linting, formatting, type checking, and tests before merging.

## 🛠️ Getting Started

Ready to contribute or run the project locally? Check out our comprehensive setup guide:

📖 **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Complete development setup instructions for both frontend and backend

📖 **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** - Detailed linting, testing, and CI configuration

---

## 🌟 Why This System Matters

Traditional education focuses on grades, but student success requires a holistic approach encompassing:

- **Mental Well-being**: Emotional health and stress management
- **Physical Health**: Sleep, nutrition, and exercise habits
- **Social Development**: Peer collaboration and communication skills
- **Career Preparation**: Long-term goal setting and skill building
- **Personal Growth**: Self-awareness and continuous improvement

Student Mentor AI provides the comprehensive support system that students need to thrive in all these areas. By combining advanced AI technology with thoughtful design, we create a personalized learning companion that adapts to each student's unique needs while keeping teachers and parents informed.

Our multi-agent AI system, powered by Google's ADK, doesn't just respond to questions—it proactively monitors student well-being, identifies potential issues before they escalate, and provides actionable guidance tailored to each student's age, personality, and aspirations.

---

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Ensure API keys and environment variables are correctly configured
3. Verify all dependencies are installed (both frontend and backend)
4. Check browser compatibility (modern browsers required)
5. Review backend logs for FastAPI or Firestore connection issues

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** and **Google ADK** for powerful AI capabilities
- **Google Cloud Platform** for Firestore, Firebase, and Cloud Run
- **React Team** for excellent framework
- **Vite** for fast development experience
- **Tailwind CSS** and **Framer Motion** for beautiful styling
- **FastAPI** for high-performance backend framework

---

**Built with ❤️ to empower students and support their holistic development**

**Ready to transform student mentoring? Start with the [Local Development Setup](#%EF%B8%8F-local-development-setup)** 🚀

## 🙏 Acknowledgments