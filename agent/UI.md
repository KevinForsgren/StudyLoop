# UI Specification

## 1. Design Direction

The UI should feel minimal, polished, modern, and intentional.

The goal is NOT to create a stereotypical "AI website".

Avoid:
- Purple/blue AI gradients everywhere
- Excessive glassmorphism
- Neon glows
- Huge gradient text
- Excessive rounded cards
- Floating blobs/background decorations
- Excessive shadows
- Unnecessary animations
- Generic AI-dashboard aesthetics
- Making every section look like a card

The visual language should feel closer to a carefully designed developer/product website than an AI SaaS template.

Reference websites for overall design quality and consistency:
- https://hacktoberfest.com/
- https://chaicode.com/
- https://www.somehowliving.tech/

These references should be treated as inspiration for:
- Typography
- Spacing
- Layout rhythm
- Visual hierarchy
- Consistency
- Use of whitespace
- Restrained use of color
- Section transitions
- Overall polish

Do NOT copy their design directly.

The project should have its own visual identity.

---

## 2. Core Design Principles

### Minimal

Every visual element should have a reason to exist.

Prefer:
- whitespace
- typography
- subtle borders
- restrained color
- simple shapes
- clear hierarchy

over:
- decorative gradients
- unnecessary illustrations
- excessive shadows
- visual noise

### Consistent

Components should follow a shared design language.

Buttons, inputs, cards, badges, navigation, typography, spacing, borders, and states should feel like they belong to the same system.

Do not create one-off component styles unless there is a strong reason.

### Functional

Visual design should never interfere with usability.

Important actions should be obvious.

Information should be scannable.

The user should understand the current state of the application without having to interpret decorative UI.

### Characterful but restrained

The interface should have personality, but it should not feel over-designed.

Use small visual details to make the product memorable rather than relying on large visual effects.

---

# 3. Color System

The application must support both:

- Light mode
- Dark mode

Dark/light mode should be a complete theme rather than simply inverting colors.

Use semantic design tokens instead of hardcoding colors throughout components.

Example semantic tokens:

- background
- foreground
- muted
- muted-foreground
- card
- card-foreground
- border
- primary
- primary-foreground
- secondary
- secondary-foreground
- accent
- destructive
- success
- warning

The exact colors should be selected during implementation.

### Color philosophy

The primary UI should be relatively neutral.

Color should primarily communicate:

- state
- progress
- importance
- interaction
- categorization

Do not use gradients as the primary visual identity.

Avoid making the entire UI blue/purple simply because the product uses AI.

A small accent color is acceptable and encouraged if it gives the product a distinct identity.

---

# 4. Typography

Typography is an important part of the visual identity.

Use a clean modern sans-serif font.

The typography hierarchy should be clear:

- Large page/section heading
- Supporting heading
- Body text
- Secondary/muted text
- Labels
- Small metadata

Avoid using too many font sizes or font weights.

Headings should feel intentional without becoming oversized.

Body text should prioritize readability.

Numbers and progress values should be visually easy to scan.

---

# 5. Layout

Use a consistent maximum content width throughout the application.

The layout should breathe.

Avoid cramming information into every available pixel.

Recommended principles:

- generous horizontal padding
- consistent vertical spacing
- predictable section spacing
- clear alignment
- strong content hierarchy
- responsive layout

Desktop layouts should not simply shrink on mobile.

Important content should reorganize naturally for smaller screens.

---

# 6. Components

Use a shared component system for project-wide consistency.

Use `shadcn/ui` where appropriate for common primitives and components.

Prefer reusable components for:

- buttons
- inputs
- text areas
- dialogs
- dropdowns
- tabs
- badges
- progress indicators
- tooltips
- cards
- navigation
- switches
- loading states
- alerts

Components should be customized to match the project's visual language instead of looking like untouched default shadcn components.

Do not introduce multiple component libraries that solve the same problem.

---

# 7. Main Page

The main page is the primary design target.

Other pages should inherit the same visual system once the main page is established.

The main page should communicate the product's purpose quickly.

A possible structure:

1. Navigation/header
2. Hero/introduction
3. Main user interaction
4. Progress/task visualization
5. Supporting information
6. Footer

The exact sections may change based on the final product specification.

Do not implement sections simply because they are listed here if they do not serve the actual product.

---

# 8. Navigation

The navigation should be simple.

It should contain only the most important actions.

Possible elements:

- Product/logo/name
- Main navigation
- Theme toggle
- Primary action if necessary
- User/settings area if required by the product

Avoid overly complicated dashboard-style navigation.

Navigation should remain visually quiet so that the main content remains the focus.

---

# 9. Progress / Git-Graph Visualization

A major visual element of the product is a Git-graph-inspired progress visualization.

The visualization represents the user's tasks and progress.

It should feel inspired by a Git contribution/activity graph, but it should NOT simply copy GitHub's contribution graph.

### Core concept

Each task/activity is represented visually.

The visual intensity of a task should depend on its completion percentage.

For example:

- 0% → very subtle / empty
- 25% → low intensity
- 50% → medium intensity
- 75% → strong intensity
- 100% → strongest state

The exact color scale should work in both light and dark mode.

### Important

Brightness/intensity should communicate progress without becoming visually overwhelming.

Do not use highly saturated neon colors.

The visualization should remain readable at a glance.

### Task representation

Each task should be able to communicate:

- Task name
- Completion percentage
- Current state
- Optional deadline/time information
- Optional category
- Optional AI-generated insight

Hovering/focusing a task may reveal additional information.

Do not force all metadata into the visualization itself.

### Interaction

The graph may support:

- hover states
- focus states
- click/select
- tooltip/details
- filtering if required

Interactions should remain subtle.

Avoid excessive animation.

---

# 10. Progress Color Rules

Progress color should be semantic.

The UI should establish a consistent relationship between:

completion percentage
→
visual intensity

The color should not change randomly between components.

For example, a task at 70% completion should visually communicate roughly the same state wherever that task appears.

The implementation should use shared CSS variables/design tokens for the progress scale.

---

# 11. Cards

Cards should be used intentionally.

Not every section should be placed inside a rounded rectangle.

Prefer using:

- spacing
- borders
- dividers
- typography

when a card is unnecessary.

When cards are used:

- keep radius consistent
- keep padding consistent
- use subtle borders
- avoid heavy shadows
- avoid excessive gradients

Cards should organize information rather than decorate the page.

---

# 12. Buttons

Buttons should have a clear hierarchy.

Primary action:
- visually prominent
- simple
- easy to identify

Secondary action:
- quieter
- should not compete with primary action

Destructive action:
- clearly distinguishable
- should not be visually confused with normal actions

Avoid overly large buttons unless the action is genuinely the primary action of the page.

---

# 13. Inputs and Forms

Inputs should be simple and readable.

Focus states must be obvious.

Validation states should be clear without relying exclusively on color.

Use:

- labels
- helpful descriptions
- error messages
- loading states
- disabled states

Avoid excessive decoration around forms.

---

# 14. Animation

Animations should be subtle and purposeful.

Good uses:

- page/section transitions
- hover feedback
- progress changes
- expanding/collapsing content
- loading states

Avoid:

- constant floating animations
- animated gradients
- excessive parallax
- distracting background effects
- animations that delay interaction

The application should still feel polished when animations are disabled or reduced.

Respect `prefers-reduced-motion`.

---

# 15. Loading / Empty / Error States

Every important asynchronous interaction should have a clear state for:

- Loading
- Success
- Empty
- Error

These states should use the same design system as the rest of the application.

Avoid generic "AI is thinking..." animations unless they provide useful feedback.

Loading states should communicate what is actually happening when possible.

---

# 16. AI UI

The application uses AI, but the interface should not constantly remind the user that it is an "AI app".

AI should feel like a product capability rather than the visual identity of the entire application.

Avoid:

- robot icons everywhere
- "✨ AI MAGIC" labels
- purple AI gradients
- chat bubbles unless conversation is actually required
- excessive AI branding

The AI's output should integrate naturally into the product's existing UI.

---

# 17. Responsive Design

The application must work across:

- Desktop
- Tablet
- Mobile

The desktop layout should not simply be scaled down.

For mobile:

- navigation should simplify
- multi-column layouts may become stacked
- graph visualizations should remain usable
- controls should remain touch-friendly
- text should remain readable
- important actions should remain accessible

---

# 18. Accessibility

The UI should follow basic accessibility practices.

Requirements:

- semantic HTML
- keyboard navigation
- visible focus states
- sufficient color contrast
- accessible labels
- tooltips should not be the only source of important information
- don't rely solely on color to communicate state
- support reduced motion

Interactive elements should have clear hover, focus, active, disabled, and loading states where applicable.

---

# 19. Visual Details

Small details should provide polish.

Examples:

- subtle borders
- carefully chosen corner radii
- consistent icon sizes
- consistent spacing
- subtle hover transitions
- thoughtful empty states
- clean dividers
- aligned text and controls

These details should remain subtle.

The goal is:

"Everything feels intentional."

Not:

"Everything is animated."

---

# 20. Design System Rules

Before creating a new visual pattern, check whether an existing component or token can be reused.

Prefer:

Existing component
→
existing variant
→
new variant
→
new component

rather than creating many one-off components.

Use shared tokens for:

- colors
- spacing
- typography
- radii
- borders
- shadows
- transitions

Avoid hardcoded values scattered throughout the UI.

---

# 21. Main Page First

Only the main page needs detailed visual design initially.

Do not spend significant time designing secondary pages before the main page is established.

Once the main page establishes:

- typography
- color system
- spacing
- component styling
- navigation
- buttons
- cards
- progress visualization
- interaction patterns

those rules should become the foundation for all other pages.

Secondary pages should feel like they belong to the same product rather than introducing a new visual style.

---

# 22. Implementation Philosophy

The UI should be built incrementally.

First establish:

1. Global theme
2. Typography
3. Layout/container
4. Navigation
5. Main page structure
6. Core interaction
7. Progress visualization
8. Responsive behavior
9. Loading/error/empty states
10. Final polish

Do not spend time polishing minor components before the main page composition is correct.

The visual result should be evaluated as a whole.

---

# 23. Definition of Visual Success

The UI is successful when:

- The first impression is clean and intentional.
- It does not look like a generic AI SaaS template.
- Light and dark themes both feel deliberately designed.
- Components feel like they belong to the same system.
- The progress visualization is immediately understandable.
- Color is used purposefully.
- The page has strong visual hierarchy.
- There is enough whitespace.
- Nothing feels unnecessarily decorative.
- The interface feels polished without being visually noisy.
- The design remains usable on mobile.