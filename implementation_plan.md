# Global UI Redesign Implementation Plan

## Goal
Transform the application into a modern, elegant, and "royal" experience with refined animations, premium typography, and a cohesive design system.

## 1. Design System Upgrade (Foundation)
- **Colors**:
  - Introduce "Royal Deep" background: Deep Indigo/Slate gradients.
  - Introduce "Premium Gold" accent: Gradients for primary actions.
  - Refine Glassmorphism: Clearer blur, subtle borders, inner glows.
- **Typography**:
  - Headers: 'Outfit' (existing) with tighter geometric spacing or 'Space Grotesk' for modern feel.
  - Body: 'Inter' or 'Plus Jakarta Sans' for ultra-readability.
- **Animations**:
  - Global entry animations (Fade In Up).
  - Micro-interactions on buttons (Scale, Glow).

## 2. Component Refactoring
### [Global Layout](file:///e:/AIM%202/aim-academy/app/layout.tsx)
- [ ] Add global background wrapper with fixed gradient + noise texture.
- [ ] Update `Header` with glass effect and animated nav items.
- [ ] Update `Sidebar` (mobile menu).

### [Landing Page](file:///e:/AIM%202/aim-academy/app/page.tsx)
- [ ] Hero Section: Large, bold typography, 3D/Floating elements.
- [ ] Features Grid: Glass cards with hover glow.
- [ ] Testimonials: Infinite scroll marquee.
- [ ] CTA: Pulsing gold button.

### [Dashboard](file:///e:/AIM%202/aim-academy/app/home/page.tsx)
- [ ] Welcome Header: Personalized greeting with day/night theme.
- [ ] Stats Grid: Animated counters, progress rings.
- [ ] Subject Cards: 3D tilt effect, vibrant gradients.

### [Quiz Interface](file:///e:/AIM%202/aim-academy/components/quiz/*)
- [ ] Redesign `ModernOptionButton` to be cleaner, with better feedback states (Success/Error).
- [ ] Update Timer animation.
- [ ] "Royal" Result Screen with confetti and gold medals.

## 3. Implementation Steps
1.  **Update Foundation**: `globals.css` and `tailwind.config.ts`.
2.  **Update Layout**: `app/layout.tsx` and `Header`.
3.  **Redesign Landing**: `app/page.tsx`.
4.  **Redesign Dashboard**: `app/home/page.tsx` and components.
5.  **Redesign Quiz**: `ModernOptionButton`, `Timer`.

## Verification
- Visual inspection of all key pages.
- Responsive testing (Mobile/Desktop).
- Performance check (Lighthouse) to ensure animations don't kill FPS.
