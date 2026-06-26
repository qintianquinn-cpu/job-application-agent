# JobMate AI

> Your intelligent job application assistant — paste a JD, get a tailored CV & cover letter in seconds.

🔗 **[Live Demo](https://job-application-agent-chi.vercel.app)**

## Features

| Step | What it does |
|------|-------------|
| 📝 **Profile** | Paste your CV text → AI auto-fills your profile. Edit any field anytime. |
| 🔍 **JD Analysis** | Paste a job description → AI analyzes match across 4 dimensions: Hard Skills, Soft Skills, Competencies & Traits, Preferred Skills. |
| 📄 **CV Generator** | Generates a tailored CV HTML emphasizing your most relevant experience. Side-by-side AI refinement chat. |
| ✉️ **Cover Letter** | Generates a personalized cover letter. Edit inline or discuss changes with AI. |
| 🖨️ **PDF Export** | One-click export via browser print dialog. Clean A4 layout with proper margins. |
| 🌐 **Multi-language** | Auto-detects JD language — generates output in English or Traditional Chinese. |

## Tech Stack

- **Framework:** Next.js 16 (App Router + Turbopack)
- **AI:** Vercel AI SDK + DeepSeek (`deepseek-chat`)
- **UI:** shadcn/ui + Tailwind CSS v4
- **State:** Zustand (localStorage persist — profile never leaves your device)
- **Deploy:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A [DeepSeek API key](https://platform.deepseek.com)

### Setup

```bash
git clone https://github.com/qintianquinn-cpu/job-application-agent.git
cd job-application-agent
npm install
```

Create `.env.local`:

```env
DEEPSEEK_API_KEY=sk-your-key-here
```

```bash
npm run dev
# Open http://localhost:3000
```

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fqintianquinn-cpu%2Fjob-application-agent&env=DEEPSEEK_API_KEY)

Or via CLI:

```bash
npm i -g vercel
vercel
# Set DEEPSEEK_API_KEY in Vercel dashboard → Settings → Environment Variables
```

## Privacy

- Your profile is stored in **your browser's localStorage** — never uploaded to any server
- JD analysis and CV generation data pass through Vercel Serverless Functions → DeepSeek API for processing only — not stored or logged
- No database. No tracking. No cookies.

## Project Structure

```
├── app/
│   ├── (app)/
│   │   ├── profile/          # Profile management
│   │   ├── jd-analysis/      # JD input + match analysis
│   │   ├── cv-generator/     # CV preview + refine chat
│   │   └── cover-letter/     # Cover letter + refine chat
│   └── api/
│       ├── analyze/          # POST: JD → structured analysis
│       ├── generate-cv/      # POST: profile + analysis → CV HTML
│       ├── generate-cover-letter/
│       ├── parse-resume/     # POST: CV text → structured profile
│       └── refine-content/   # POST: AI refinement chat
├── stores/
│   ├── profile-store.ts      # Zustand persist (localStorage)
│   └── app-store.ts          # Session state
├── lib/
│   ├── ai-client.ts          # Typed fetch wrappers
│   ├── detect-language.ts    # CJK detection for JD language
│   └── pdf-export.ts         # Browser print-based PDF export
└── components/
    ├── shared/
    │   └── RefineChat.tsx    # AI refinement chat widget
    └── ui/                   # shadcn/ui components
```

## License

MIT

---

Built by [qintianquinn-cpu](https://github.com/qintianquinn-cpu)
