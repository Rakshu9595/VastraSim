# PROJECT: FITMIRROR AI — COMPLETE RESPONSIVE FRONTEND DEVELOPMENT

## ROLE

Act as a Senior Frontend Developer, UI/UX Designer, Creative Web Designer, and Frontend Software Architect.

Your task is to design and develop a complete, modern, professional, highly responsive, visually appealing, and interactive frontend for my AI-powered virtual clothing try-on platform called **FitMirror AI**.

This is a real software development project, not a simple demonstration website.

The frontend should look and feel like a premium, production-quality AI fashion technology application.

Build the entire frontend inside my existing VS Code project.

**IMPORTANT: First inspect my existing project directory and files before writing any code.**

Do not create another project folder.

Do not modify the backend or AI service.

Do not introduce unnecessary frameworks.

---

# 1. PROJECT INFORMATION

**Project Name:** FitMirror AI

**Tagline:** Try Anything. From Anywhere. On Yourself.

**Project Category:**

* Artificial Intelligence
* Computer Vision
* Generative AI
* Fashion Technology
* E-commerce
* Virtual Try-On

## Project Description

FitMirror AI is an AI-powered virtual clothing try-on platform that allows users to virtually try on clothing products from supported e-commerce websites.

Users can:

1. Visit an online shopping website.
2. Select a clothing product.
3. Copy the product URL.
4. Open FitMirror AI.
5. Paste the product URL.
6. Extract the product image and available details.
7. Upload their own photograph.
8. Select the garment category if required.
9. Click the Try On button.
10. Generate a realistic AI-powered virtual try-on image.
11. Compare their original photograph with the generated result.
12. Save or delete their try-on results.
13. Return to the original shopping website.

The platform uses the pretrained FASHN VTON v1.5 model through a separate Python FastAPI service.

The frontend must be designed to support this complete workflow.

---

# 2. TECHNOLOGY REQUIREMENTS

Use ONLY the following frontend technologies:

* HTML5
* CSS3
* Vanilla JavaScript (ES6+)
* Bootstrap 5
* Bootstrap Icons
* Google Fonts
* CSS animations and transitions
* Fetch API for backend integration

Do NOT use:

* React
* Angular
* Vue
* Next.js
* TypeScript
* Tailwind CSS
* jQuery
* Any unnecessary frontend framework

Use clean, reusable, modular, well-organized code.

The frontend must work as a standalone static website during development.

Use Bootstrap for responsive layout components and custom CSS for the premium visual design.

---

# 3. EXISTING PROJECT STRUCTURE

My project already contains the following frontend files.

Use this exact structure:

```text
frontend/
│
├── index.html
├── try-on.html
├── history.html
├── privacy.html
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── css/
│   ├── style.css
│   ├── try-on.css
│   └── history.css
│
└── js/
    ├── main.js
    ├── try-on.js
    ├── product.js
    ├── upload.js
    ├── api.js
    └── history.js
```

Do not rename existing files.

Do not create duplicate frontend folders.

Do not change the backend or AI service structure.

You may add a small number of necessary frontend assets or reusable files if required, but preserve the existing architecture.

---

# 4. OVERALL DESIGN VISION

Create a premium AI fashion platform that combines:

**Modern fashion e-commerce design + AI technology + elegant SaaS dashboard experience.**

The website should feel:

* Premium
* Elegant
* Futuristic
* Minimal
* Fashion-oriented
* Modern
* Interactive
* Trustworthy
* Professional
* Clean
* Easy to navigate
* Visually impressive

Avoid generic Bootstrap website styling.

Avoid excessive gradients, unnecessary decorations, and overcrowded layouts.

Use generous whitespace, elegant typography, polished components, and carefully designed visual hierarchy.

## Color Palette

Use a premium fashion-inspired theme.

Primary colors:

* Background: `#FAF9F6`
* Primary text: `#171717`
* Secondary text: `#666666`
* Primary accent: `#8B5CF6`
* Secondary accent: `#C4B5FD`
* White surfaces: `#FFFFFF`
* Soft section backgrounds: `#F4F1FA`
* Borders: `#E8E5ED`

Use purple accents strategically to communicate AI technology.

Maintain excellent contrast and readability.

## Typography

Use a sophisticated font combination.

Suggested:

* Headings: Playfair Display
* Body: Inter
* Buttons and UI labels: Inter

Large editorial headings should create a premium fashion identity.

Body text should remain modern, clean, and easy to read.

## Visual Style

Use:

* Rounded cards
* Soft shadows
* Subtle glassmorphism where appropriate
* Premium product photography
* Modern AI-inspired visual elements
* Smooth hover effects
* Elegant section transitions
* Animated buttons
* Responsive image layouts
* Clean iconography
* Attractive empty states
* Beautiful loading indicators

The interface should look like a real AI fashion startup product.

---

# 5. GLOBAL NAVIGATION BAR

Create a responsive navigation bar shared across all pages.

## Desktop Navigation

Left:

FitMirror AI logo.

Center/right:

* Home
* Virtual Try-On
* My History
* Privacy

Primary CTA:

**Try It Now**

## Navigation Requirements

* Sticky navigation bar.
* Transparent or softly translucent appearance at the top of the homepage.
* Subtle shadow or background change after scrolling.
* Smooth hover underline animations.
* Active page indication.
* Responsive mobile hamburger menu.
* Smooth mobile menu opening and closing.
* Accessible keyboard navigation.
* Proper focus states.
* Navigation links must work correctly.

The logo should look premium and recognizable.

Create a simple custom FitMirror AI logo using typography and an appropriate fashion/AI-inspired icon.

---

# 6. HOMEPAGE — index.html

Design a complete, premium landing page.

The homepage must include the following sections.

## SECTION 1: HERO SECTION

Create an impressive full-width hero section.

### Main Heading

**Your Style. Your Mirror. Powered by AI.**

### Supporting Text

Try on fashion from your favorite online stores without leaving home. Simply paste a clothing product link, upload your photo, and discover how the outfit looks on you.

### Buttons

Primary:

**Start Virtual Try-On**

Secondary:

**See How It Works**

### Hero Visual

Create a visually impressive fashion-tech composition featuring:

* A fashion model or suitable sample person photograph.
* A clothing product card.
* An AI transformation concept.
* A virtual try-on result preview.
* Floating fashion UI elements.
* Subtle glowing purple accents.

Use high-quality, appropriately licensed placeholder images.

Do not use broken image URLs.

The hero should visually explain the concept of AI clothing try-on.

### Hero Animations

* Heading fade-in.
* Supporting text slide-up.
* Buttons reveal smoothly.
* Hero image subtle floating animation.
* Decorative elements animate gently.
* Smooth scroll to the next section.

Avoid distracting continuous animations.

---

## SECTION 2: HOW IT WORKS

Heading:

**Your Virtual Fitting Room in 3 Simple Steps**

Create three beautifully designed cards.

### Step 1 — Find Your Style

Browse your favorite supported fashion shopping websites and copy the product URL.

### Step 2 — Upload Your Photo

Upload a clear photograph of yourself to preview the selected clothing.

### Step 3 — See the Magic

Let AI generate a personalized virtual try-on preview.

Each card should contain:

* Number indicator.
* Attractive icon.
* Heading.
* Short explanation.
* Hover animation.
* Subtle shadow.
* Smooth entrance animation.

Connect the three steps visually on desktop.

Stack them vertically on mobile.

---

## SECTION 3: INTERACTIVE BEFORE-AND-AFTER DEMONSTRATION

Heading:

**See the Transformation**

Create an interactive before-and-after image comparison component.

Features:

* Original image on one side.
* Sample AI-generated result on the other.
* Draggable comparison slider.
* Smooth slider movement.
* Before and After labels.
* Touch support.
* Mouse support.
* Keyboard accessibility.
* Responsive image dimensions.

Use matching, clearly labeled sample images.

If a genuine paired example is unavailable, display an explicitly labeled design preview instead of presenting unrelated images as a real AI result.

Add a CTA:

**Try Your Own Look**

---

## SECTION 4: WHY CHOOSE FITMIRROR AI?

Create a modern feature grid.

Feature cards:

### Shop Across Stores

Try clothing products from supported online fashion retailers through a single interface.

### AI-Powered Visualization

Preview selected garments using an advanced pretrained virtual try-on model.

### Personalized Experience

See an AI-generated clothing preview using your own photograph.

### Easy Product Import

Paste a supported product URL to retrieve available product details.

### Compare Your Looks

Compare your original photograph and generated preview.

### Privacy-Focused

Provide users with controls to manage and delete their uploaded images and results.

Each feature card must have:

* Modern icon.
* Short description.
* Hover animation.
* Consistent spacing.
* Responsive layout.

Do not claim universal retailer compatibility or guaranteed physical fit.

---

## SECTION 5: FASHION SHOWCASE

Heading:

**Explore Your Next Look**

Create an elegant fashion-inspired gallery.

Display sample categories:

* Tops
* Bottoms
* Dresses
* Jackets
* Casual Wear
* Formal Wear

Use attractive fashion imagery.

Create hover overlays with category names.

Clicking a category should navigate to the Try-On page.

The category can be preselected where supported.

Use responsive CSS Grid or Bootstrap Grid.

---

## SECTION 6: AI TECHNOLOGY SECTION

Heading:

**Where Fashion Meets Artificial Intelligence**

Explain how FitMirror AI uses computer vision and generative AI to create clothing previews.

Create a visually appealing technology section featuring:

* AI-inspired visual graphics.
* A simplified transformation diagram.
* Person image input.
* Garment image input.
* AI processing.
* Generated result.

Include a short explanation of the FASHN VTON v1.5 model.

Do not expose backend implementation details unnecessarily to ordinary users.

---

## SECTION 7: FAQ

Create an accordion containing frequently asked questions.

Questions:

1. What is FitMirror AI?
2. How does virtual try-on work?
3. Can I use clothing links from any website?
4. What type of photograph should I upload?
5. Can I try dresses, tops, and bottoms?
6. Are my photographs stored?
7. Can I delete my generated results?
8. Does the generated image guarantee the correct clothing size?

Answers must be accurate and consistent with the project's intended functionality.

Clearly explain that retailer compatibility may vary.

Clarify that AI previews are visual approximations rather than exact physical fitting measurements.

---

## SECTION 8: FINAL CALL TO ACTION

Create a visually impressive CTA section.

Heading:

**Your Next Favorite Outfit Is One Click Away.**

Supporting text:

Discover a new way to explore fashion with AI-powered virtual try-on.

Button:

**Start Trying Outfits**

Use an elegant gradient background and subtle animated decorative elements.

---

## SECTION 9: FOOTER

Create a professional multi-column footer.

Include:

* FitMirror AI logo.
* Short project description.
* Quick navigation links.
* Virtual Try-On link.
* History link.
* Privacy link.
* AI-generated preview disclaimer.
* Copyright notice with dynamic year.

Do not invent company contact information or social media accounts.

---

# 7. VIRTUAL TRY-ON PAGE — try-on.html

This is the MOST IMPORTANT page of the entire application.

Create a premium, intuitive, step-by-step virtual fitting room.

The design must be simple enough for first-time users.

## PAGE HEADER

Heading:

**Your Personal AI Fitting Room**

Description:

Upload your photo, choose your favorite clothing, and see your virtual look.

Add a beautiful progress indicator.

Steps:

1. Choose Clothing
2. Upload Your Photo
3. Generate Your Look

Use a responsive stepper interface.

---

## STEP 1: CHOOSE CLOTHING

Create a product URL input section.

Components:

* URL input field.
* Paste button.
* Fetch Product button.
* Loading indicator.
* URL validation.
* Error messages.
* Product preview card.

Placeholder:

**Paste a clothing product URL here...**

When the user clicks Fetch Product:

1. Validate the URL.
2. Call the product extraction API when available.
3. Display a loading state.
4. Show extracted product information.
5. Display the garment image.
6. Display product name and available metadata.
7. Allow the user to confirm the product.

Do not hardcode a successful extraction result.

### Manual Upload Fallback

Provide an alternative option:

**Or Upload a Clothing Image**

Allow users to upload a garment image manually.

Support:

* JPG
* JPEG
* PNG
* WebP

Features:

* Drag-and-drop upload.
* Click-to-browse upload.
* Image preview.
* Replace image.
* Remove image.
* File validation.
* File size validation.
* Helpful error messages.

Use configurable file size limits that can match backend requirements.

---

## STEP 2: UPLOAD PERSONAL PHOTOGRAPH

Create an attractive photo upload component.

Features:

* Drag-and-drop.
* Browse files.
* Instant image preview.
* Image removal.
* Replace photograph.
* File validation.
* Helpful image guidelines.
* Upload progress when supported.
* Privacy consent checkbox.

Display helpful guidelines:

* Use a clear photograph.
* Face the camera where possible.
* Ensure the relevant body area is visible.
* Use good lighting.
* Avoid heavily obstructed clothing.

Add a privacy notice explaining that the photograph is processed to generate a virtual try-on preview.

Require explicit consent before sending the photograph for processing.

---

## STEP 3: GARMENT CATEGORY

Allow users to select:

* Tops
* Bottoms
* One-pieces

Create visually appealing selectable cards.

Use icons and short descriptions.

The selected category should have a clear active state.

If the product category is extracted automatically, preselect it and allow correction.

---

## STEP 4: GENERATE VIRTUAL TRY-ON

Create a prominent button:

**Generate My Virtual Look**

The button must remain disabled until:

* A valid garment image is available.
* A valid person image is available.
* A garment category is selected.
* Required consent is provided.

When clicked:

1. Validate the required inputs.
2. Upload the required images through the configured backend workflow.
3. Create a try-on session.
4. Display the processing interface.
5. Poll for session status when the backend supports asynchronous processing.
6. Display the result when generation completes.
7. Display an appropriate error if generation fails.

Never simulate a real AI-generated result when the backend is unavailable.

---

# 8. AI GENERATION LOADING SCREEN

Create a premium AI processing experience.

Display:

**Creating Your Virtual Look...**

Supporting message:

Our AI is preparing your personalized fashion preview.

Design requirements:

* Animated AI-inspired loading illustration.
* Subtle pulsing elements.
* Elegant progress visualization.
* Rotating informational messages.
* Smooth transitions.
* Accessible loading status announcements.

Suggested messages:

* Preparing your images...
* Processing your clothing selection...
* Generating your virtual look...
* Finalizing your preview...

Do not display fabricated percentage progress.

Use indeterminate progress unless the backend supplies actual progress data.

Provide clear timeout and retry states.

---

# 9. GENERATED RESULT INTERFACE

Once the backend returns a successful result, display a premium result section.

Heading:

**Your Virtual Look Is Ready!**

Include:

* Large generated result image.
* Original image preview.
* Before-and-after comparison slider.
* Selected clothing preview.
* Product information.
* Try Another Outfit button.
* Download Image button.
* Save Result button where supported.
* Delete Result button.
* Back to Store button when a valid product URL exists.

Use smooth transitions when displaying the result.

Implement real image download behavior when a downloadable result is available.

Never display a fabricated result as successful inference.

Include a disclaimer:

**This AI-generated preview is a visual approximation and does not guarantee actual garment fit or sizing.**

---

# 10. HISTORY PAGE — history.html

Create a modern history dashboard.

Heading:

**Your Virtual Wardrobe**

Description:

Explore and manage your previous virtual try-on sessions.

## Layout

Use a clean responsive grid.

Each history card should display:

* Generated result thumbnail when available.
* Garment preview.
* Product name.
* Garment category.
* Session date.
* Processing status.
* View button.
* Delete button.

## Features

* Responsive card grid.
* Status badges.
* Loading skeletons.
* Empty state.
* Error state.
* Delete confirmation modal.
* Success notifications.
* View result modal.
* Pagination or Load More where supported.

## Empty State

Display:

**Your Virtual Wardrobe Is Waiting**

Description:

You haven't saved any virtual looks yet. Start your first AI-powered fashion experience.

Button:

**Create Your First Look**

History must be retrieved from the backend when available.

Do not fabricate saved sessions.

Respect guest-session authorization and privacy.

---

# 11. PRIVACY PAGE — privacy.html

Create a professional, readable privacy information page.

Include sections for:

1. Introduction
2. How FitMirror AI Works
3. Information Users Provide
4. Photograph Processing
5. Product URL Processing
6. Image Storage
7. Try-On Session History
8. Data Retention and Deletion
9. Security Practices
10. Third-Party Services
11. AI-Generated Image Limitations
12. User Consent

Use a clean document-style layout.

Include:

* Table of contents.
* Clear section headings.
* Comfortable reading width.
* Responsive typography.
* Accessible navigation.

IMPORTANT:

Do not invent legal guarantees, retention periods, compliance certifications, or security measures that have not been implemented.

Where backend privacy details are not finalized, clearly mark them as requiring confirmation before deployment.

---

# 12. ANIMATIONS AND TRANSITIONS

The entire website should have polished and professional animations.

Implement:

### Page Transitions

* Smooth page entry.
* Elegant fade-in.
* Subtle slide-up.
* Consistent navigation behavior.

### Scroll Animations

Use Intersection Observer for:

* Section reveals.
* Feature card animations.
* Image reveals.
* Staggered card animations.

### Hover Animations

* Buttons slightly elevate.
* Cards gain subtle shadows.
* Images scale gently.
* Icons animate subtly.
* Navigation links show animated indicators.

### Interactive Transitions

* Smooth accordion opening.
* Upload area highlighting.
* Modal animations.
* Toast notification transitions.
* Progress step transitions.
* Image comparison slider movement.
* Loading-to-result transitions.

### Performance Requirements

* Prefer CSS transforms and opacity.
* Avoid unnecessary JavaScript animation libraries.
* Prevent layout shifts.
* Avoid excessive animation.
* Support `prefers-reduced-motion`.
* Maintain smooth performance on mobile devices.

---

# 13. FULL RESPONSIVENESS

The website must work perfectly on:

* Large desktop screens.
* Standard laptops.
* Tablets.
* Small tablets.
* Large smartphones.
* Small smartphones.

Test at approximately:

* 320px
* 375px
* 425px
* 768px
* 1024px
* 1280px
* 1440px
* 1920px

## Mobile Requirements

* No horizontal scrolling.
* Properly sized buttons.
* Touch-friendly controls.
* Responsive navigation.
* Readable text.
* Properly scaled images.
* Stacked layouts.
* Accessible upload controls.
* Responsive comparison slider.
* Optimized spacing.
* Functional modals.

The mobile experience should be just as polished as the desktop experience.

---

# 14. JAVASCRIPT FUNCTIONALITY

All JavaScript must be organized according to the existing project structure.

## main.js

Implement:

* Navigation interactions.
* Mobile menu.
* Scroll animations.
* FAQ accordion enhancements.
* Smooth scrolling.
* Global UI interactions.
* Reusable notification helpers where appropriate.

## try-on.js

Implement:

* Try-on workflow coordination.
* Step navigation.
* Input validation.
* Garment category selection.
* Generate button state.
* Processing UI.
* Session status polling.
* Result rendering.
* Retry behavior.
* Before-and-after comparison.

## product.js

Implement:

* Product URL validation.
* Product extraction request.
* Product preview rendering.
* Extraction error handling.
* Manual garment upload fallback.
* Product category preselection.

## upload.js

Implement:

* Drag-and-drop upload.
* File selection.
* Image validation.
* Image preview.
* Image replacement.
* Image removal.
* Upload state management.
* Cleanup of temporary object URLs.

## api.js

Create a centralized API service.

Use the Fetch API.

Keep the API base URL configurable.

Support the backend endpoints defined in the project architecture:

```text
POST   /api/products/extract
POST   /api/uploads/person
POST   /api/tryon
GET    /api/tryon/:id
GET    /api/history
DELETE /api/history/:id
GET    /health
```

Implement reusable request handling for:

* Network errors.
* Non-success HTTP responses.
* Timeouts.
* Validation errors.
* Structured backend errors.
* Authorization failures where applicable.

Do not assume response JSON fields that have not been defined.

Document any proposed API response contracts for later backend implementation.

Never expose API secrets or private credentials in frontend code.

## history.js

Implement:

* Fetch history.
* Render history cards.
* Empty states.
* Loading states.
* View result.
* Delete confirmation.
* Delete session.
* Refresh history.
* Error handling.

---

# 15. CSS FILE RESPONSIBILITIES

## style.css

Include:

* Global CSS variables.
* Typography.
* Colors.
* Buttons.
* Navigation.
* Footer.
* Global components.
* Homepage layout.
* Responsive breakpoints.
* Common animations.
* Accessibility styles.

## try-on.css

Include:

* Try-on page layout.
* Upload components.
* Product preview.
* Stepper.
* Garment category cards.
* Processing screen.
* Result display.
* Comparison slider.
* Responsive adjustments.

## history.css

Include:

* History dashboard.
* Session cards.
* Status badges.
* Empty states.
* History modals.
* Responsive layouts.

Avoid duplicated CSS wherever possible.

Use consistent naming conventions.

---

# 16. USER EXPERIENCE REQUIREMENTS

The website must be intuitive and easy to use.

Implement:

* Clear instructions.
* Helpful placeholders.
* Descriptive labels.
* Proper validation.
* Visible loading states.
* Friendly error messages.
* Success notifications.
* Confirmation before deletion.
* Disabled buttons when appropriate.
* Retry options.
* Image previews.
* Easy navigation.
* Clear progress indicators.
* Consistent visual hierarchy.

A first-time user should understand how to perform a virtual try-on without additional instructions.

---

# 17. ACCESSIBILITY REQUIREMENTS

Follow WCAG 2.2 AA principles where practical.

Include:

* Semantic HTML5.
* Proper heading hierarchy.
* Accessible forms.
* Associated input labels.
* Keyboard navigation.
* Visible focus indicators.
* Descriptive alternative text.
* ARIA labels where necessary.
* Accessible modals.
* Accessible accordion components.
* Sufficient color contrast.
* Reduced-motion support.
* Screen-reader-friendly status messages.

Do not rely on color alone to communicate information.

---

# 18. PERFORMANCE OPTIMIZATION

Optimize the frontend for fast loading.

Requirements:

* Lazy-load below-the-fold images.
* Use appropriately sized images.
* Minimize unnecessary JavaScript.
* Avoid blocking rendering.
* Reuse components and CSS classes.
* Avoid excessive DOM manipulation.
* Prevent memory leaks.
* Revoke unused object URLs.
* Avoid unnecessary API calls.
* Debounce suitable user interactions.
* Ensure responsive images do not cause layout shifts.

Use modern browser APIs where appropriate.

---

# 19. IMAGE AND ASSET REQUIREMENTS

Use visually appealing fashion-related imagery.

Suggested visual categories:

* Fashion editorial photography.
* Clothing product photographs.
* Dresses.
* Shirts.
* Jackets.
* Casual fashion.
* AI-inspired interface illustrations.

Prefer local assets stored inside:

```text
frontend/assets/images/
```

Use Bootstrap Icons or local SVG icons.

Do not use broken external image links.

Avoid copyrighted brand logos unless properly authorized.

Ensure all important UI elements remain usable if decorative images fail to load.

---

# 20. BACKEND INTEGRATION READINESS

The frontend must be prepared for future integration with my existing Node.js and Express backend.

The backend will communicate with:

* MongoDB Atlas.
* Private image storage.
* Python FastAPI.
* FASHN VTON v1.5.

Keep frontend and backend responsibilities separate.

Do not call the private Python AI service directly from the browser.

Do not expose database credentials or AI service secrets.

All backend communication must go through the configured Express API.

Since the backend may not yet be implemented, the frontend should still render and allow users to explore the interface.

Use realistic UI states for:

* Backend unavailable.
* Product extraction failed.
* Image upload failed.
* Try-on processing.
* Try-on completed.
* Try-on failed.
* No history available.

A clearly labeled optional UI preview mode is acceptable for design testing.

However:

**Never pretend that a real AI inference request succeeded when no backend or model is connected.**

---

# 21. SECURITY REQUIREMENTS

Implement appropriate frontend safeguards.

* Validate selected image types.
* Validate image sizes.
* Validate product URL format.
* Use safe DOM rendering.
* Avoid injecting untrusted HTML.
* Never store sensitive credentials in JavaScript.
* Do not expose private image URLs unnecessarily.
* Require user consent for photograph processing.
* Do not store personal photographs in localStorage.
* Handle unauthorized API responses.
* Use safe external-link behavior.
* Avoid logging sensitive user data.

Remember that frontend validation does not replace backend validation.

---

# 22. DESIGN CONSISTENCY

All pages must use the same design system.

Maintain consistent:

* Header.
* Footer.
* Typography.
* Colors.
* Buttons.
* Border radius.
* Shadows.
* Spacing.
* Icons.
* Form components.
* Animation timing.
* Responsive behavior.

The website should feel like one cohesive application.

---

# 23. DEVELOPMENT PROCESS

Follow these instructions carefully.

### Step 1: Inspect Existing Files

Analyze the existing frontend directory.

Identify all available HTML, CSS, and JavaScript files.

Preserve the current project structure.

### Step 2: Create the Design System

Define:

* CSS variables.
* Colors.
* Typography.
* Spacing.
* Buttons.
* Cards.
* Form components.
* Navigation.
* Footer.
* Animation utilities.

### Step 3: Develop the Homepage

Fully implement:

```text
frontend/index.html
frontend/css/style.css
frontend/js/main.js
```

### Step 4: Develop the Try-On Page

Fully implement:

```text
frontend/try-on.html
frontend/css/try-on.css
frontend/js/try-on.js
frontend/js/product.js
frontend/js/upload.js
```

### Step 5: Develop the History Page

Fully implement:

```text
frontend/history.html
frontend/css/history.css
frontend/js/history.js
```

### Step 6: Develop the Privacy Page

Fully implement:

```text
frontend/privacy.html
```

### Step 7: Prepare API Integration

Implement:

```text
frontend/js/api.js
```

### Step 8: Add Animations

Implement all appropriate animations and transitions.

### Step 9: Make Everything Responsive

Test all pages across desktop, tablet, and mobile layouts.

### Step 10: Test Functionality

Verify all interactions.

Fix all discovered frontend errors.

---

# 24. QUALITY ASSURANCE

Before finishing, inspect and test the entire frontend.

Verify:

* All four HTML pages load.
* Navigation works.
* Mobile menu works.
* All internal links work.
* Buttons perform meaningful actions.
* Product URL validation works.
* Manual garment upload works.
* Personal photograph preview works.
* Category selection works.
* Try-on button validation works.
* API failures are handled correctly.
* Loading indicators work.
* History empty state works.
* Delete confirmation works.
* FAQ accordion works.
* Comparison slider works.
* Animations work.
* Images load.
* No horizontal overflow occurs.
* No obvious JavaScript errors occur.
* CSS remains consistent across pages.
* Keyboard navigation is functional.
* Reduced-motion preferences are respected.

Where browser testing tools are available, run the application and test actual interactions.

Fix identified issues rather than simply reporting them.

---

# 25. IMPORTANT DEVELOPMENT RULES

1. Build a COMPLETE frontend, not just a landing page.

2. Use my existing frontend folder.

3. Do not create a new project.

4. Do not modify backend files.

5. Do not modify AI service files.

6. Use HTML, CSS, JavaScript, and Bootstrap only.

7. Make every page fully responsive.

8. Create a premium fashion-tech visual identity.

9. Use professional animations and transitions.

10. Make the virtual try-on page the primary application experience.

11. Keep code clean, modular, and maintainable.

12. Do not leave unnecessary TODO placeholders.

13. Do not use fake successful API responses.

14. Do not invent actual AI-generated results.

15. Ensure all available frontend functionality works.

16. Use appropriate loading, error, and empty states.

17. Keep API integration centralized.

18. Preserve compatibility with the documented system architecture.

19. Prioritize accessibility and user experience.

20. Do not stop after generating only one page.

---

# 26. EXPECTED FINAL OUTPUT

After implementation, the project should contain:

### Homepage

A premium AI fashion landing page with elegant animations, interactive demonstrations, and clear calls to action.

### Virtual Try-On Page

A complete interactive workflow for selecting clothing, uploading a photograph, choosing a garment category, and preparing an AI generation request.

### History Page

A polished virtual wardrobe interface prepared for retrieving and managing saved try-on sessions.

### Privacy Page

A clear and professionally designed privacy information page.

### JavaScript Functionality

Functional frontend interactions, validation, uploads, previews, transitions, and API integration readiness.

### Responsive Design

A polished experience on desktop, tablet, and mobile devices.

### Final Verification

Review all implemented files, fix frontend errors, and summarize:

* Files created or modified.
* Features implemented.
* Responsive behavior.
* Tests performed.
* Backend endpoints still requiring integration.
* Any remaining limitations.

---

# FINAL INSTRUCTION

Develop FitMirror AI as a premium, modern, production-quality AI fashion web application.

The result should feel like a real fashion technology startup platform rather than a basic college project.

Focus on beautiful design, excellent usability, complete frontend functionality, polished animations, responsive layouts, accessibility, and clean code.

**Start by inspecting my existing project structure, then implement the entire frontend directly inside the existing `frontend` directory. Continue until all four pages and their associated CSS and JavaScript files are complete.**
