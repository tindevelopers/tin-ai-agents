
# 🚀 AI BlogWriter Pro

An intelligent content creation platform powered by AI that helps you research keywords, generate content ideas, and write high-quality blog posts.

## ✨ Features

### 🔍 **Keyword Research**
- AI-powered keyword discovery and analysis
- Search volume estimates and difficulty scoring
- Keyword selection and saving functionality
- Multiple keyword set management

### 🎯 **Keyword Clustering** 
- Semantic clustering of keywords into groups
- AI-based content organization
- Cluster-based content strategy insights
- Individual and bulk cluster saving

### 💡 **Content Ideas Generation**
- Creative content ideas based on saved keywords
- Industry and audience targeting
- Category-based content suggestions
- Direct integration with blog editor

### 📚 **Topic Suggestions**
- Specific topic ideas with unique angles
- Difficulty-level content targeting
- Estimated content length recommendations
- Keyword-driven topic discovery

### ✍️ **AI Content Editor**
- Real-time AI blog post generation
- Multiple tone and style options
- Word count targeting (500-2500 words)
- Live preview and editing capabilities
- Markdown export and content saving

### 📊 **Content Strategy**
- Comprehensive content planning
- SEO optimization recommendations
- Content calendar suggestions
- Performance tracking insights

## 🛠 Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS, Framer Motion
- **UI Components:** Radix UI, Shadcn/UI
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **AI Integration:** AbacusAI API (GPT-4o-mini)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Yarn package manager
- PostgreSQL database
- AbacusAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tindevelopers/tin-ai-agents.git
   cd tin-ai-agents
   ```

2. **Install dependencies**
   ```bash
   cd app
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/blogwriter"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   ABACUSAI_API_KEY="your-abacusai-api-key"
   ```

4. **Set up the database**
   ```bash
   yarn prisma generate
   yarn prisma db push
   yarn prisma db seed
   ```

5. **Start the development server**
   ```bash
   yarn dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
ai_blogwriter_app/
├── app/                        # Next.js app directory
│   ├── app/                    # App router pages
│   │   ├── api/               # API routes
│   │   ├── page.tsx           # Main dashboard
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── keyword-search.tsx
│   │   ├── keyword-clustering.tsx
│   │   ├── content-ideas.tsx
│   │   ├── topic-suggestions.tsx
│   │   ├── content-editor.tsx
│   │   └── content-strategy.tsx
│   ├── lib/                   # Utility libraries
│   │   ├── db.ts             # Database configuration
│   │   ├── auth.ts           # Authentication setup
│   │   └── types.ts          # TypeScript definitions
│   ├── prisma/               # Database schema and migrations
│   └── public/               # Static assets
├── README.md
└── .gitignore
```

## 🔑 Key Features Workflow

1. **Research Keywords** → Search and save keyword sets
2. **Create Clusters** → Organize keywords into semantic groups  
3. **Generate Ideas** → Create content concepts from keywords
4. **Suggest Topics** → Get specific angles and topics
5. **Write Blogs** → Transform ideas into full blog posts
6. **Manage Content** → Save, edit, and organize your posts

## 🌐 API Endpoints

- `POST /api/keywords/search` - Search for keywords
- `POST /api/keywords/save` - Save keyword sets
- `POST /api/keywords/cluster` - Generate keyword clusters
- `POST /api/content/ideas` - Generate content ideas
- `POST /api/topics/suggestions` - Generate topic suggestions
- `POST /api/blog/generate` - Generate blog content
- `POST /api/blog/save` - Save blog posts
- `GET /api/blog/list` - List saved blog posts

## 🔐 Authentication

The app includes user authentication with:
- Sign up and login functionality
- Session management with NextAuth.js
- Protected routes and API endpoints

### Default Test Account
- **Email:** test@example.com
- **Password:** password123

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | NextAuth base URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes |
| `ABACUSAI_API_KEY` | AbacusAI API key for AI features | Yes |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the [documentation](https://github.com/tindevelopers/tin-ai-agents/wiki)
- Contact the development team

---

**Built with ❤️ by TIN Developers**
