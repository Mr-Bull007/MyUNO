# 🎴 MyUNO - An Online Multiplayer UNO Game

Born from sibling betrayal and coding magic!

## 📖 The Origin Story

Once upon a time, a 25-year-old developer was excluded from playing UNO with his 10-year-old cousins. Their reason? They owned the card deck, and the rules clearly stated: "No cards? No play!"

Faced with this unjust ostracism, our hero didn't complain—he *created*. With the power of code, MyUNO was born: a digital revolution against childish gatekeeping. Now everyone can play UNO online, anytime, anywhere, without needing anyone's permission or their precious card stack.

**Moral of the story:** Never underestimate a developer who's been told "no." 😄

---

## 🎮 About the Project

MyUNO is a fun, full-stack project that brings the classic UNO card game to the web, allowing players to compete against each other in real-time multiplayer matches. Built with modern technologies and a sense of poetic justice, the project is currently under active development with new features being added regularly.

## 🚀 Tech Stack

- **Frontend**: React with TypeScript (92.6% of the codebase)
- **Styling**: CSS (7.0% of the codebase)
- **Backend**: Blitz.js (full-stack React framework)
- **Database**: PostgreSQL with Prisma ORM
- **Build Tool**: Next.js
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint, Prettier, Husky (pre-commit hooks)
- **Package Manager**: npm/yarn

## 🎯 Features

- User authentication (login, signup, password reset, forgot password)
- Multiplayer game rooms and real-time gameplay
- Classic UNO game mechanics
- PostgreSQL database for persistent storage
- Comprehensive test suite with Vitest
- Full TypeScript implementation for type safety
- Modern UI/UX with responsive design

## 🛠️ Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Mr-Bull007/MyUNO.git
cd MyUNO
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up your environment variables:

Create a `.env.local` file in the root directory with your PostgreSQL credentials:
```bash
DATABASE_URL=postgresql://<YOUR_DB_USERNAME>@localhost:5432/my-uno-game
```

For testing, create a `.env.test.local` file:
```bash
DATABASE_URL=postgresql://<YOUR_DB_USERNAME>@localhost:5432/my-uno-game_test
```

4. Set up the database:
```bash
npx blitz prisma migrate dev
```

### 🚀 Development

Start the development server:
```bash
npm run dev
# or
yarn dev
```

The app will be available at `http://localhost:3000`

## 📁 Project Structure

```
MyUNO/
├── src/
│   ├── auth/                   # Authentication logic
│   │   ├── components/         # Login/Signup forms
│   │   └── mutations/          # Auth mutations (login, signup, etc.)
│   ├── components/             # Components for the main page
│   ├── core/                   # Core components and layouts
│   │   ├── components/         # Reusable UI components
│   │   └── layouts/            # Layout wrappers
│   ├── pages/                  # Main application pages
│   │   ├── api/                # API endpoints and routes
│   │   ├── auth/
|   │   │   └── pages/          # Auth pages
│   │   ├── pages/              # All the other pages
│   └── users/                  # User-related queries and hooks
├── db/
│   ├── migrations/             # Database migrations
│   ├── schema.prisma           # Prisma database schema
│   └── seeds.ts                # Database seeding utilities
├── integrations/               # Third-party integrations
├── mailers/                    # Email service handlers
├── public/                     # Static assets (images, favicons)
├── test/                       # Test utilities and setup
├── .env                        # Environment variables (example)
├── .env.test                   # Test environment variables
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vitest.config.ts            # Vitest test configuration
├── blitz.config.ts             # Blitz.js advanced configuration
├── next.config.js              # Next.js configuration
├── types.ts                    # Global TypeScript type definitions
└── README.md                   # This file
```

## 🧪 Testing

Run tests using Vitest:
```bash
npm test
# or
yarn test
```

The project uses Vitest as the test runner with React Testing Library for component testing.

## 🛡️ Code Quality Tools

The project includes several tools to maintain code quality and consistency:

- **ESLint**: Code linting to catch errors and enforce best practices. Configure via `.eslintrc.js`
- **Prettier**: Automatic code formatting to ensure consistent style. Configure via `.prettierrc`
- **Husky**: Git hooks that run checks before commits. See `.husky/` folder for details
- **EditorConfig**: Maintains consistent coding styles across different editors

## 📚 Blitz.js Commands

The Blitz CLI provides helpful commands for development:

```bash
blitz dev          # Start development server
blitz build        # Create a production build
blitz start        # Start production server
blitz export       # Export as static application
blitz prisma       # Run prisma commands
blitz generate     # Generate new files for your project
blitz console      # Run interactive REPL console
blitz install      # Install Blitz recipes
blitz test         # Run tests
blitz help         # Show help information
```

## 🔧 Configuration Files

- **`blitz.config.ts`**: Advanced Blitz.js framework configuration
- **`vitest.config.ts`**: Vitest testing framework configuration
- **`tsconfig.json`**: TypeScript compiler options and paths
- **`eslintrc.js`**: ESLint rules and coding standards
- **`next.config.js`**: Next.js build and optimization settings
- **`package.json`**: Project dependencies, devDependencies, and scripts
- **`.editorconfig`**: Editor formatting rules for consistency

## 📖 Learn More

- [Blitz.js Documentation](https://blitzjs.com)
- [Next.js Documentation](https://nextjs.org)
- [Prisma Documentation](https://www.prisma.io)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Vitest Documentation](https://vitest.dev/)

## 🤝 Community & Support

The Blitz.js community is welcoming and helpful:
- [Blitz.js Discord](https://blitzjs.com/discord)
- [Blitz GitHub Discussions](https://github.com/blitz-js/blitz/discussions)
- [How to Contribute to Blitz](https://blitzjs.com/docs/contributing)

## 📋 Current Status

MyUNO is under active development! New features are being added as I get time to expand the game's capabilities and improve the user experience.

## 🚦 Contributing

Contributions are welcome! Feel free to:
- Report bugs using GitHub Issues
- Suggest new features
- Submit pull requests with improvements
- Improve documentation
- Test and provide feedback

## 📄 License

This project is open source and available under the MIT License.

## 💬 Feedback

Have a feature request? Found a bug? Feel free to [open an issue](https://github.com/Mr-Bull007/MyUNO/issues) on GitHub!

---

## 👨‍💻 Author

**Mr-Bull007** - The Developer Who Coded Their Way Into Family Game Night

---

**Happy playing! 🎴**

Remember: The best revenge is a well-built web app. Now go invite those cousins to play! 😉
