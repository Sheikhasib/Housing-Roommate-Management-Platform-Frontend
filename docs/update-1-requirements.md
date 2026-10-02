# Squid Game-7 Project Update-1 Requirements

Upgrade the existing project into a feature-rich, production-ready and professional application. This applies to any project type. This file is a reference copy of the course requirements: never edit it.

## 1. Global UI and design rules
- Use a maximum of 3 primary colors (plus an optional neutral color).
- Support light and dark mode with proper contrast.
- Keep layout, spacing and alignment consistent throughout the project.
- All cards and components have the same size, border radius and visual style.
- Forms include validation, error messages, success states and loaders.
- Fully responsive for mobile, tablet and desktop.
- No placeholder or dummy content.

## 2. Home / landing page
### Navbar
- Full-width background.
- At least 4 routes when logged out (for example Home, Items, About, Login).
- At least 6 routes when logged in (for example Home, Items, Dashboard, Blog, Profile dropdown, Logout).
- At least 1 advanced menu (dropdown or profile menu).
- Sticky or fixed position. Fully responsive.
### Hero section
- Height limited to 60 to 70 percent of the screen.
- Interactive elements (slider, animation, CTA).
- Clear visual flow to the next section.
### Sections
- At least 8 meaningful sections (for example Features, Services, Categories, Highlights, Statistics, Testimonials, Blogs, Newsletter, FAQ, Call to Action). These are examples; design sections that fit the project.
### Footer
- Fully functional footer with working links only, contact information and social links.

## 3. Core listing / card section
- Each card has: image, title, short description, meta info (price, date, rating, location and so on) and a "View Details" button.
- Cards have the same height and width, the same border radius and layout.
- Desktop view: at least 3 cards per row.
- Skeleton loader while data is loading.

## 4. Details page
- Publicly accessible.
- Multiple images or media (if applicable).
- Separate sections: description / overview; key information / specifications; reviews / ratings (if applicable); related items (if applicable).

## 5. Listing / explore page
- Search bar.
- Filtering with at least 2 fields (for example category, price, rating, date, location).
- Sorting options.
- Pagination or infinite scroll.
- Fully functional filtering.

## 6. Authentication system
- Login and registration pages.
- Demo login button (auto-fill credentials).
- Social login (Google or Facebook).
- Clean and professional UI.

## 7. Dashboard (role based)
- Multiple roles, like User / Admin / Manager.
- Sidebar navigation: User at least 4 menu items or pages; Admin at least 6.
- A profile icon with a dropdown menu in the dashboard navbar (Profile, Logout and related actions).
- The dashboard includes: overview cards; charts (bar, line, pie or other) that reflect real, dynamic data; data tables; a profile page with editable user information.
- All tables in the dashboard have filtering and pagination.

## 8. Additional pages
- At least 2 to 3 additional pages, such as About, Contact, Blog, Help / Support, Privacy / Terms.

## 9. UX and responsiveness
- No lorem ipsum or placeholder content.
- Fully responsive across all devices.
- Proper spacing and alignment.
- All buttons and links are clickable.
- Dark mode keeps proper contrast.

## 10. Forms handling
All forms include: client-side validation (required fields, format validation); server-side validation; proper error and success messages; a loading state (spinner or disabled button); proper label usage; accessible inputs (label connected with input).
Forms required: Login, Registration, Contact, Create item, Edit item, Profile update.

## 11. Backend requirements
- Required stack: Express; MongoDB, PostgreSQL or MySQL; an ODM (Mongoose) or ORM (Prisma).
- Architecture: basic modular structure; API route separation; centralized error handling; proper status codes.
- Database: proper schema planning; relationships where needed.
- Security: password hashing (bcrypt); JWT authentication; input validation; CORS configuration; role-based access control.

## 12. Code quality rules
- Clean and organized folder structure.
- Reusable components; custom hooks (if React based).
- Proper environment variable usage.
- No console logs in production.
- Meaningful commit messages.

## 13. Final submission requirements
- Live website URL.
- GitHub repository links (frontend and backend).
- Demo credentials: user email and password, admin email and password.
