# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

This is a Next.js 16 application using the App Router with TypeScript and Tailwind CSS v4.

**Project Structure:**
- `src/app/` - App Router pages and layouts (file-based routing)
- `src/app/layout.tsx` - Root layout component
- `src/app/page.tsx` - Homepage component
- `public/` - Static assets

**Path Alias:** Use `@/*` to import from `src/` (e.g., `import { Component } from '@/components/Component'`)

**Styling:** Tailwind CSS v4 with PostCSS. Global styles in `src/app/globals.css`.
