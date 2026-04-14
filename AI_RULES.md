# AI Rules for this Application

## Tech Stack
- **React 19 & TypeScript**: Core framework for building the user interface with strong typing.
- **Vite 6**: Fast build tool and development server.
- **Tailwind CSS 4**: Utility-first CSS framework for styling components.
- **React Router**: Standard library for routing and navigation.
- **shadcn/ui & Radix UI**: Accessible, unstyled components used as the foundation for the UI.
- **Lucide React**: Icon library for consistent and scalable vector icons.
- **Motion (framer-motion)**: Library for creating smooth animations and transitions.
- **Supabase**: Backend-as-a-Service for Authentication, Database (PostgreSQL), and Edge Functions.
- **Express**: Used for the development server environment.

## Library Usage Rules
- **UI Components**: Always prioritize using **shadcn/ui** components. If a component doesn't exist in the library, build it using **Radix UI** primitives and **Tailwind CSS**.
- **Styling**: Use **Tailwind CSS** utility classes for all styling. Avoid writing custom CSS files unless absolutely necessary.
- **Icons**: Use **Lucide React** for all icons to maintain visual consistency.
- **Routing**: Define all application routes in `src/App.tsx`. Use `src/pages/` for top-level page components.
- **State Management**: Use React's built-in hooks (`useState`, `useContext`, `useReducer`) for local and shared state. For complex server state, consider the existing patterns in the codebase.
- **Backend & Auth**: Use the **Supabase** client for all database operations and authentication. Do not implement custom auth logic.
- **Server-side Logic**: Use **Supabase Edge Functions** for any logic that requires server-side execution, sensitive API keys, or complex data processing.
- **Animations**: Use **Motion** (framer-motion) for any interactive animations or page transitions.
- **File Structure**: 
  - `src/components/`: Reusable UI elements.
  - `src/pages/`: Page-level components.
  - `src/integrations/`: Third-party service configurations (e.g., Supabase).
  - `src/hooks/`: Custom React hooks.
