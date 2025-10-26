# SmartGate Design Guidelines

## Design Approach
**System**: Hybrid approach inspired by Linear's clarity + Material Design's enterprise patterns + Notion's modular flexibility

**Justification**: SmartGate is a mission-critical enterprise operations tool requiring high information density, real-time data visualization, and efficient workflows. The design prioritizes clarity, scanability, and rapid decision-making over aesthetic flourishes.

**Core Principles**:
- Information First: Data visibility and clarity trump decorative elements
- Operational Efficiency: Minimize clicks, maximize context
- Alert Hierarchy: Critical notifications must be immediately visible
- Contextual Density: Dense where needed, spacious where focus matters

---

## Typography System

**Font Families**:
- Primary: Inter (via Google Fonts) - all interface text
- Monospace: JetBrains Mono - metrics, flight numbers, percentages

**Hierarchy**:
- Page Headers: text-3xl font-bold (flight management, dashboard titles)
- Section Headers: text-xl font-semibold (module names, panel sections)
- Card Titles: text-lg font-medium (flight cards, metric cards)
- Body Text: text-base font-normal (descriptions, form labels)
- Data/Metrics: text-sm font-medium (tables, statistics)
- Captions/Meta: text-xs font-normal (timestamps, secondary info)
- Critical Alerts: text-base font-semibold (error messages, warnings)

---

## Layout System

**Spacing Primitives**: Use Tailwind units 2, 4, 6, and 8 consistently
- Micro spacing: p-2, gap-2 (tight groupings, icon padding)
- Standard spacing: p-4, gap-4, m-4 (card internals, form fields)
- Section spacing: p-6, py-6 (panel padding, card spacing)
- Major spacing: p-8, gap-8, my-8 (module separation, dashboard sections)

**Container Strategy**:
- Main dashboard: Full-width with sidebar navigation (sidebar: w-64)
- Content areas: max-w-7xl mx-auto px-6
- Data tables: Full-width within containers
- Forms/Modals: max-w-2xl centered

**Grid Layouts**:
- Dashboard metrics: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Flight cards: grid-cols-1 lg:grid-cols-2 xl:grid-cols-3
- Module overview: grid-cols-1 md:grid-cols-2

---

## Component Library

### Navigation
**Sidebar Navigation** (persistent, left-aligned):
- Fixed width w-64
- Contains: logo/branding, module links, user profile, settings
- Active state: Subtle left border (border-l-4) + slight background treatment
- Icons: Heroicons (24px) paired with labels
- Collapsible on mobile (hamburger menu)

**Top Bar** (contextual):
- Flight search/filter, real-time clock, notification bell, quick actions
- Height: h-16
- Sticky positioning: sticky top-0

### Dashboard Components

**Metric Cards**:
- Compact design: p-4 rounded-lg
- Structure: Icon (top-left) + Label (text-sm) + Value (text-2xl font-bold) + Trend indicator
- Grid layout for 2-4 metrics per row
- Include mini sparkline for trends (using recharts)

**Flight Cards**:
- Prominent flight number (text-xl monospace font-bold)
- Reliability badge (percentage in large text-lg)
- Status indicator: dot + label (Scheduled/Delayed/Cancelled)
- Compact info grid: departure time, destination, airline, cargo summary
- Action buttons: View Details, Edit Load, Reassign
- Warning states: Thin border treatment for <70% reliability

**Real-Time Alerts Panel**:
- Fixed position or collapsible slide-out (right-side)
- Alert cards with severity levels (critical, warning, info)
- Icon (Heroicons alert icons) + timestamp + message + action button
- Auto-dismiss for non-critical, persistent for critical

### Module-Specific Components

**Bottle Detection Interface**:
- Large camera preview area (aspect-16/9)
- Capture button (prominent, centered below preview)
- Results display: Image thumbnail + detected bottle type + fill level bar + recommended action (large, color-coded tag)
- Action confirmation buttons: Accept / Override / Discard

**Trolley Verification**:
- Split view: Reference image (golden layout) | Captured image
- Overlay markers on discrepancies (outlined boxes with labels)
- Error list sidebar: Item name + Location + Action needed
- Approval/Rejection controls (large buttons)

**Flight Management Table**:
- Dense data table with sticky header
- Columns: Flight #, Time, Destination, Airline, Status, Reliability %, Actions
- Sortable/filterable columns
- Row highlighting for low reliability (<70%)
- Inline action dropdowns (kebab menu)

**Replanification View**:
- Timeline visualization showing reassignments
- Before/After comparison cards
- Affected items list with checkboxes
- Confirm Reassignment button (prominent)

### Forms

**Input Fields**:
- Standard height: h-10 for text inputs
- Consistent padding: px-4
- Clear labels above inputs (text-sm font-medium)
- Helper text below (text-xs)
- Validation states: border treatments + inline error messages

**Action Buttons**:
- Primary actions: Large (h-10 px-6), prominent positioning
- Secondary actions: Standard (h-9 px-4)
- Destructive actions: Outlined treatment
- Icon-only buttons: Square (h-9 w-9) for compact toolbars

### Data Visualization

**Charts** (using Recharts):
- Line charts for trends (employee efficiency over time)
- Bar charts for comparisons (food saved per day)
- Pie/donut charts for distributions (bottle actions, flight statuses)
- Compact sizing: h-64 for dashboard widgets, h-96 for dedicated views
- Tooltip on hover with detailed breakdowns

**Progress Indicators**:
- Reliability percentage: Circular progress (large, 120px diameter)
- Task completion: Linear progress bars (h-2)
- Loading states: Skeleton screens for data-heavy components

---

## Responsive Behavior

**Breakpoints**:
- Mobile (base): Single column, stacked navigation (hamburger)
- Tablet (md): 2-column grids, persistent top bar
- Desktop (lg+): Sidebar + multi-column layouts, full data tables

**Mobile Optimizations**:
- Camera features: Full-screen capture interface
- Tables: Horizontal scroll with sticky first column OR card-based view
- Metrics: Stack to single column, maintain large numbers
- Navigation: Bottom tab bar for primary modules

---

## Special Considerations

**Real-Time Updates**:
- Subtle pulse animation for new alerts (animate-pulse, duration-1s, once)
- Badge indicators on navigation for unread notifications
- Toast notifications for background updates (slide-in from top-right)

**Critical Alerts**:
- Inline banners above affected content (not dismissible)
- Modal overlays for blocking errors requiring immediate action
- Visual weight: Thick borders (border-4) + icon + bold text

**Accessibility**:
- High contrast ratios for all text
- Focus indicators on all interactive elements (ring-2 ring-offset-2)
- ARIA labels for icon-only buttons
- Keyboard navigation support throughout

**Performance**:
- Lazy load camera components
- Virtualized tables for large datasets (react-window)
- Optimistic UI updates for form submissions
- Skeleton loaders during data fetches

---

## Images

**Dashboard Hero** (Optional):
No traditional hero section. Dashboard opens directly to operational view.

**Contextual Images**:
- **Reference Trolley Layouts**: Golden standard images for comparison (displayed in split-screen during verification)
- **Bottle Type Reference Gallery**: Small thumbnails in admin panel showing bottle types for training
- **Empty States**: Simple illustrations for "No flights scheduled" or "No alerts" (geometric, minimal)

**Camera Captures**: User-generated images displayed in results panels (bottle photos, trolley photos) - shown as thumbnails with expand-to-full-screen capability