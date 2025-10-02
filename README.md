# Ottopen

An AI-powered writing platform for fiction authors - your complete journey from first draft to publication submission.

## Features

### ✨ AI Writing Assistant

- **Expand** - Continue your story with AI-generated content matching your voice
- **Rewrite** - Transform text with different styles (vivid, concise, emotional, etc.)
- **Describe** - Generate rich, sensory descriptions for characters, settings, and objects
- **Brainstorm** - Generate creative ideas for plot, characters, conflicts, and themes
- **Critique** - Get detailed feedback on pacing, dialogue, plot, and prose
- **Character Generator** - Create detailed character profiles with psychology and arcs
- **Outline Generator** - Build structured outlines using proven story frameworks

### 📚 Story Planning

- **Story Bible** - Comprehensive world-building and character tracking
- **Chapter & Scene Organization** - Hierarchical manuscript structure
- **Plot Threads** - Track main plots, subplots, and character arcs
- **Timeline** - Manage chronological and narrative event sequences
- **Version Control** - Save and restore scene versions
- **Research Notes** - Organize research linked to scenes and characters

### 👥 Collaboration

- **Beta Readers** - Invite feedback from trusted readers
- **Comments** - Scene-level annotations and suggestions
- **Multi-Collaborator Support** - Writers, editors, and co-authors

### 📤 Publishing Tools

- **Query Letter Generator** - AI-assisted query letter creation
- **Synopsis Generator** - Auto-generate short, medium, and long synopses
- **Submission Tracking** - Manage agent queries and responses
- **ISBN Management** - Track edition ISBNs
- **Export** - DOCX, PDF, and EPUB formatting

### 📊 Analytics

- **Writing Goals** - Daily, weekly, and monthly word targets
- **Session Tracking** - Monitor writing sessions and productivity
- **Word Count Graphs** - Visualize progress over time
- **Streak Tracking** - Build consistent writing habits

## Development

### Prerequisites

- Node.js 18+ & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account - [Create free account](https://supabase.com)
- OpenAI API key - [Get API key](https://platform.openai.com/api-keys) OR
- Anthropic API key - [Get API key](https://console.anthropic.com/)

### Setup

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Step 2: Install dependencies
npm install

# Step 3: Set up environment variables
cp .env.example .env.local

# Edit .env.local and add your API keys:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - OPENAI_API_KEY (or ANTHROPIC_API_KEY)

# Step 4: Set up Supabase database
# Run the migrations in supabase/migrations/ in your Supabase project

# Step 5: Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view your app.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Next.js 14
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment

This Next.js application can be deployed to any platform that supports Node.js applications:

- [Vercel](https://vercel.com) (recommended for Next.js)
- [Netlify](https://netlify.com)
- [Railway](https://railway.app)
- Any VPS with Node.js support

Simply build the project with `npm run build` and deploy the generated files.
