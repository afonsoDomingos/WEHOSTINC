# Academy Management System

## Overview
This document describes the academy management system implemented for course, module, and lesson management.

## Course Structure
The academy follows a hierarchical structure:
- **Course**: Top-level entity with pricing, access type, and free lessons count
- **Module**: Child of a course, represents chapters/sections
- **Lesson**: Child of a module, contains actual content

## Key Features Implemented

### 1. Course Management
- CRUD operations for courses
- Pricing support (free, paid, preview access types)
- Configurable free lessons count for freemium model
- Course status management (active/inactive)

### 2. Module Management
- Bulk delete with selection checkboxes
- Filter by course to manage modules per course
- "Select All" functionality for efficient management
- Module deletion automatically removes associated lessons
- Material upload supports both URL and file upload (PDF, video, images)
- Auto-detects material type based on uploaded file
- Uploads are handled via Cloudinary API

### 3. Lesson Management
- Bulk delete with selection checkboxes
- Filter by module to manage lessons per module
- "Select All" functionality
- Lesson content includes video and material support
- Material upload supports both URL and file upload (PDF, video, images)
- Auto-detects material type based on uploaded file
- Uploads are handled via Cloudinary API

### 4. Automatic Enrollment
- When payment is approved via M-Pesa callback, users are automatically enrolled
- System matches payment service name to course title
- Free lessons count is preserved during enrollment

### 5. Mobile Responsiveness

#### Admin Academy Page
- Action bar uses vertical flex layout on mobile to prevent button cutoff
- Search and filters are full width on mobile
- Tables have min-width to prevent horizontal compression
- Buttons have responsive sizing (smaller text and icons on mobile)
- Table padding reduced from px-6 to px-4 for better mobile display
- Tables use min-w-[800px] and min-w-[900px] to allow horizontal scroll

#### Email Dashboard Page
- Ultra-compact mobile design with text sizes (8px-9px on mobile)
- Minimal padding and spacing (p-2, p-1.5 on mobile instead of p-4, p-6)
- Tiny icons on mobile (h-2.5, h-3 instead of h-4, h-5)
- Email cards have responsive sizing with truncation
- Configuration box scales from text-[8px] on mobile to text-sm on desktop
- Container padding reduced to px-1.5 on mobile
- Gap in grid reduced to gap-1.5, gap-2 on mobile
- Button padding reduced to py-1.5, px-2 on mobile
- Overall much more compact while still readable

#### Tickets Dashboard Page
- Ultra-compact mobile design with text sizes (8px-9px on mobile)
- Minimal padding and spacing (p-2, p-1.5 on mobile)
- Tiny icons on mobile (h-2.5, h-3 instead of h-4, h-5)
- Metrics cards are ultra-compact on mobile (p-2 instead of p-2.5)
- Filter buttons are smaller with text-[9px] on mobile
- Ticket cards have responsive sizing with truncation for long content
- Empty state has responsive sizing
- Container padding reduced to px-1.5 on mobile
- Gap in grid reduced to gap-1.5, gap-2 on mobile
- Overall layout prioritizes mobile with progressive enhancement

#### Orders Dashboard Page
- Ultra-compact mobile design with text sizes (7px-8px on mobile)
- Minimal padding and spacing (p-1.5, p-2 on mobile)
- Tiny icons on mobile (h-2, h-2.5 instead of h-3, h-4)
- Order cards use p-1.5 on mobile
- Grid gaps reduced to gap-1, gap-1.5 on mobile
- Empty state uses smaller sizes on mobile
- Status messages use text-[7px] on mobile
- Proof download button uses smaller sizes on mobile
- Container padding reduced to px-1.5 on mobile
- Overall much more compact while still readable

### 6. Performance Optimization

#### Course Page Loading
- Implemented progressive loading strategy for instant rendering
- Course page loads modules from localStorage before redirecting
- Chapter page loads course, modules, lessons from localStorage immediately
- Loading state set to false after local data is loaded for instant display
- Server data fetched in background to update with fresh data
- Progress loaded from localStorage first, then updated from server
- Eliminates blocking wait for server responses before showing content
- Users see course content immediately while server data syncs in background
- Background fetches update state when complete for fresh data

## API Endpoints
- `/api/courses` - Course CRUD
- `/api/modules` - Module CRUD
- `/api/lessons` - Lesson CRUD
- `/api/enrollments` - User enrollment management

## Database Models
- CourseModel: `src/lib/models/CourseModel.ts`
- ModuleModel: `src/lib/models/ModuleModel.ts`
- LessonModel: `src/lib/models/LessonModel.ts`

## Admin Pages
- Main admin: `src/app/admin/page.tsx`
- Academy management: `src/app/admin/academy/page.tsx`

## Dashboard Pages
- Email: `src/app/dashboard/email/page.tsx`
- Tickets: `src/app/dashboard/tickets/page.tsx`
- Orders: `src/app/dashboard/orders/page.tsx`
- Academy Course: `src/app/dashboard/academy/course/[courseId]/page.tsx`
- Academy Chapter: `src/app/dashboard/academy/course/[courseId]/chapter/[chapterId]/page.tsx`

## Build Commands
- `npm run build` - Build the application
- All TypeScript errors have been resolved
- ESLint warnings remain but don't block build
