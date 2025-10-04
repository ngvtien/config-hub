# Electron React TypeScript App

A modern Electron application built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui components.

## Features

- ⚡ **Vite** - Fast build tool and development server
- ⚛️ **React 18** - Modern React with hooks
- 🔷 **TypeScript** - Type safety and better developer experience
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🧩 **shadcn/ui** - Beautiful and accessible UI components
- 📦 **Electron** - Cross-platform desktop app framework
- 🔧 **ESLint** - Code linting and formatting

## Project Structure

```
├── electron/           # Electron main and preload scripts
│   ├── main.ts        # Main process
│   └── preload.ts     # Preload script
├── src/               # React application source
│   ├── components/    # React components
│   │   └── ui/       # shadcn/ui components
│   ├── lib/          # Utility functions
│   ├── App.tsx       # Main App component
│   ├── main.tsx      # React entry point
│   └── index.css     # Global styles with Tailwind
├── public/           # Static assets
└── dist/            # Built web application
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. In another terminal, start Electron:
```bash
npm run electron
```

## Available Scripts

- `npm run dev` - Start Vite development server
- `npm run electron` - Start Electron in development mode
- `npm run build` - Build for production
- `npm run build:web` - Build web version only
- `npm run build:electron` - Build Electron app
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## Adding shadcn/ui Components

To add new shadcn/ui components:

```bash
npx shadcn-ui@latest add [component-name]
```

For example:
```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
```

## Building for Production

1. Build the application:
```bash
npm run build
```

2. The built application will be in the `release` directory.

## Tech Stack

- **Electron** - Desktop app framework
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icons

## License

MIT