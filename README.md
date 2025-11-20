# Flashbang - AI-Powered Language Learning App

Flashbang is a modern, mobile-responsive language learning application designed to help you master German vocabulary through interactive Quizzes and Flashcards. Built with React, TypeScript, and Supabase, it leverages Google's Gemini AI to automate content generation and enhance your learning experience.

![Flashbang Dashboard](https://placehold.co/600x400?text=Flashbang+Dashboard)

## 🚀 Features

### 📚 Vocabulary Management
- **Organize with Categories**: Create, edit, and manage word categories (defaulting to German → English).
- **Smart Word Entry**: Add words manually or use **AI Auto-Fill** to automatically generate translations, genders, and example sentences.
- **Image Support**: Upload images for words to create visual associations.
- **Bulk Operations**: Import and Export your vocabulary via CSV.

### 🧠 Interactive Learning Modes
- **Quiz Mode**:
  - Multiple-choice questions.
  - **Spaced Repetition System (SRS)**: Uses the SM-2 algorithm to schedule reviews for optimal retention.
  - Configurable direction (German → English, English → German, or Mixed).
  - Text-to-Speech (TTS) audio for pronunciation.
- **Flashcard Mode**:
  - Classic flip-card interface.
  - **AI Sentence Generation**: Instantly generate example sentences with translations for any word on the fly.
  - Image and Audio support.

### 📱 Mobile-First Design
- Fully responsive layout optimized for smartphones and tablets.
- Touch-friendly controls and navigation.
- Installable as a web app on mobile devices.

### 🤖 AI Integration
- Powered by **Google Gemini API**.
- Automates tedious data entry.
- Provides context-rich learning examples on demand.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Backend**: Supabase (Authentication, Database, Storage)
- **AI**: Google Gemini API
- **Icons**: Lucide React

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- npm or yarn
- A Supabase project
- A Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/flashbang.git
   cd flashbang
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Database Setup**
   Run the provided SQL scripts in your Supabase SQL Editor to set up the tables (`categories`, `words`) and Row Level Security (RLS) policies.

5. **Run the development server**
   ```bash
   npm run dev
   ```

## 📖 Usage

1. **Sign Up/Login**: Create an account to sync your data across devices.
2. **Add Words**: Go to the Dashboard, select a category (or create one), and click "Add Word". Try the "Auto-Fill" button!
3. **Study**:
   - Click **Start Quiz** to test your knowledge and update your SRS progress.
   - Click **Start Flashcards** for a casual review session.
4. **Mobile**: Open the app on your phone for a native-like experience.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
