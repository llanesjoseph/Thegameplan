# Card & Layout System Documentation
## Reusable Pattern for Dashboard Cards

This document provides a complete blueprint for replicating the athlete dashboard card system in the coach space or any other dashboard.

---

## 1. Card Data Structure

### Basic Card Object
```typescript
interface Card {
  id: string                    // Unique identifier for the card
  title: string                 // Display title
  description: string           // Subtitle/description text
  icon: LucideIcon              // Icon component from lucide-react
  color: string                 // Hex color for theming (icon bg, borders, etc)
  path: string | null           // External route to navigate to (or null)
  action: () => void | null     // Function to execute on click (or null)
  expandable: boolean           // Whether card can expand inline
  isCoachCard?: boolean         // Special flag for profile photo display
  highlighted?: boolean         // Add visual emphasis (pulse animation)
}
```

### Example Card Array
```typescript
const cards = [
  {
    id: 'ai-assistant',
    title: coachName ? `Ask Your Coach ${coachName.split(' ')[0]}` : 'Ask Your Coach',
    description: coachName
      ? `Chat with ${coachName.split(' ')[0]}'s AI assistant about training and techniques`
      : 'Get instant answers from your coach\'s AI assistant',
    icon: Sparkles,
    color: '#20B2AA', // Teal
    path: null,
    action: null,
    expandable: true,
    isCoachCard: true,
    highlighted: true
  },
  {
    id: 'video-review',
    title: 'Request Video Review',
    description: 'Upload a performance clip for coach feedback',
    icon: Video,
    color: '#20B2AA',
    path: null,
    action: () => setShowVideoReviewModal(true),
    expandable: false
  },
  {
    id: 'upcoming-events',
    title: 'Upcoming Events',
    description: 'View scheduled sessions and upcoming training events',
    icon: Calendar,
    color: '#FF6B35',
    path: null,
    action: null,
    expandable: true
  }
]
```

---

## 2. Required State Management

```typescript
// Track which card is currently expanded (only one at a time)
const [expandedCard, setExpandedCard] = useState<string | null>(null)

// Dynamic data for personalization
const [coachName, setCoachName] = useState<string>('')
const [coachPhotoURL, setCoachPhotoURL] = useState<string>('')
const [coachId, setCoachId] = useState<string | null>(null)
```

---

## 3. Card Click Handler

```typescript
const handleCardClick = (card: typeof cards[0]) => {
  // Priority 1: Execute action if present
  if (card.action) {
    card.action()
    return
  }

  // Priority 2: Navigate to path if present
  if (card.path) {
    router.push(card.path)
    return
  }

  // Priority 3: Toggle expansion if expandable
  if (card.expandable) {
    setExpandedCard(expandedCard === card.id ? null : card.id)
  }
}
```

---

## 4. Card Grid Layout

### Grid Container
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
  {cards.map((card, index) => {
    const Icon = card.icon
    const isExpanded = expandedCard === card.id
    const isCoachCard = card.isCoachCard || false
    const isHighlighted = card.highlighted

    return (
      <div
        key={index}
        className={`
          ${isCoachCard ? 'col-span-2 sm:col-span-1' : ''}
          ${isExpanded ? 'col-span-2 sm:col-span-3 md:col-span-4' : ''}
        `}
      >
        {/* Card content here */}
      </div>
    )
  })}
</div>
```

---

## 5. Card Button Component

### Main Card Structure
```tsx
<button
  onClick={() => handleCardClick(card)}
  className={`
    block group cursor-pointer text-left transition-all w-full
    ${isExpanded ? 'ring-2 ring-teal-500 ring-offset-2' : ''}
    ${isHighlighted ? 'animate-pulse-subtle' : ''}
  `}
>
  <div className={`
    bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg
    p-3 sm:p-4 h-full transition-all hover:shadow-2xl hover:scale-105
    ${isExpanded ? 'bg-white shadow-2xl' : ''}
    ${isCoachCard ? 'sm:p-6' : ''}
    ${isHighlighted ? 'border-2 border-teal-500 bg-gradient-to-br from-teal-50 to-white' : 'border border-white/50'}
  `}>
    {/* Inner content */}
  </div>
</button>
```

### Inner Card Layout
```tsx
<div className={`
  flex
  ${isCoachCard ? 'flex-row items-center gap-4' : 'flex-col'}
  h-full
  ${isCoachCard ? 'min-h-[120px]' : 'min-h-[100px] sm:min-h-[120px]'}
`}>
  {/* Icon or Profile Picture */}
  {/* Title and Description */}
  {/* Chevron Indicator (if expandable) */}
</div>
```

---

## 6. Icon/Photo Display

### Standard Icon Card
```tsx
<div
  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg mb-2 sm:mb-3 flex items-center justify-center shadow-md"
  style={{ backgroundColor: card.color }}
>
  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
</div>
```

### Coach Profile Photo Card
```tsx
<div
  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shadow-xl flex-shrink-0 ring-4 ring-teal-500"
  style={{ backgroundColor: card.color }}
>
  {coachPhotoURL ? (
    <img
      src={coachPhotoURL}
      alt={coachName}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-white text-3xl sm:text-4xl">
      {coachName.charAt(0).toUpperCase()}
    </div>
  )}
</div>
```

---

## 7. Prominent Chevron Indicator

### Implementation
```tsx
{card.expandable && (
  <div className="mt-2 sm:mt-0">
    <div className="p-2 rounded-full bg-white/50 shadow-md">
      <ChevronDown
        className={`w-7 h-7 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        style={{ color: card.color, strokeWidth: 2.5 }}
      />
    </div>
  </div>
)}
```

### Key Features:
- **Size**: `w-7 h-7` (28px) - larger than default
- **Container**: White circular background with shadow
- **Stroke**: `strokeWidth: 2.5` - bolder lines
- **Animation**: Rotates 180° when expanded
- **Color**: Matches card's theme color
- **Visibility**: Always visible on all screen sizes

---

## 8. Expanded Content Section

### Pattern for Expandable Cards
```tsx
{isExpanded && card.id === 'ai-assistant' && (
  <div className="mt-4 bg-gradient-to-br from-teal-50/90 to-white/90 backdrop-blur-sm rounded-xl shadow-2xl border border-teal-200/50 overflow-hidden animate-slideDown">
    {/* Header */}
    <div className="bg-gradient-to-r from-teal-500/10 to-teal-400/10 px-6 py-4 border-b border-teal-200/50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: card.color }}>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-medium" style={{ color: '#000000' }}>
            {coachName ? `Your Coach ${coachName.split(' ')[0]}'s AI Assistant` : "Your Coach's AI Assistant"}
          </h3>
          <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>
            Ask questions about training, techniques, and your coach's philosophy
          </p>
        </div>
      </div>
      <button
        onClick={() => setExpandedCard(null)}
        className="p-2 hover:bg-orange-100 rounded-full transition-all animate-bounce-slow"
        title="Collapse AI Assistant"
      >
        <ChevronUp className="w-6 h-6" style={{ color: '#FF6B35' }} />
      </button>
    </div>

    {/* Content */}
    <div className="p-6 overflow-y-auto" style={{ minHeight: '500px', maxHeight: '600px' }}>
      {/* Your expanded content here */}
    </div>
  </div>
)}
```

---

## 9. Required CSS Animations

### Add to JSX Style Block
```tsx
<style jsx>{`
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
      max-height: 0;
    }
    to {
      opacity: 1;
      transform: translateY(0);
      max-height: 1000px;
    }
  }

  .animate-slideDown {
    animation: slideDown 0.3s ease-out forwards;
  }

  @keyframes pulseSubtle {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(20, 184, 166, 0);
    }
  }

  .animate-pulse-subtle {
    animation: pulseSubtle 2s ease-in-out infinite;
  }

  @keyframes bounceSlow {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-6px);
    }
  }

  .animate-bounce-slow {
    animation: bounceSlow 1.5s ease-in-out infinite;
  }
`}</style>
```

---

## 10. Color Palette Reference

```typescript
const colors = {
  teal: '#20B2AA',        // Primary accent, AI features
  skyBlue: '#91A6EB',     // Lessons, learning content
  orange: '#FF6B35',      // Events, actions, warnings
  oliveGreen: '#8D9440',  // Alternative accent
  beige: '#E8E6D8',       // Background
  black: '#000000'        // Text, contrast elements
}
```

---

## 11. Implementation Checklist for Coach Dashboard

- [ ] Copy card data structure
- [ ] Set up state management (expandedCard, coachData, etc.)
- [ ] Implement handleCardClick logic
- [ ] Create card grid layout
- [ ] Build card button components
- [ ] Add icon/photo display logic
- [ ] Implement prominent chevron indicator
- [ ] Create expanded content sections
- [ ] Add CSS animations
- [ ] Test responsive behavior (mobile, tablet, desktop)
- [ ] Test card expansion/collapse
- [ ] Test action buttons and navigation
- [ ] Verify color consistency

---

## 12. Key Best Practices

1. **Single Expansion**: Only allow one card expanded at a time
2. **Clear Hierarchy**: action > path > expandable
3. **Responsive Design**: Different layouts for mobile/tablet/desktop
4. **Smooth Animations**: Use CSS transitions for professional feel
5. **Accessibility**: Maintain button semantics and keyboard navigation
6. **Visual Feedback**: Hover states, scale transforms, shadow depth
7. **Color Consistency**: Use theme colors throughout expanded sections
8. **Profile Photos**: Always provide fallback (first letter of name)

---

## Usage Example for Coach Dashboard

```typescript
// Coach dashboard cards example
const coachCards = [
  {
    id: 'athlete-roster',
    title: 'Athlete Roster',
    description: 'Manage your athletes and track their progress',
    icon: Users,
    color: '#20B2AA',
    path: null,
    action: null,
    expandable: true,
    isCoachCard: false,
    highlighted: false
  },
  {
    id: 'create-content',
    title: 'Create Lesson',
    description: 'Upload new training videos and lessons',
    icon: Video,
    color: '#91A6EB',
    path: '/dashboard/coach/create-content',
    action: null,
    expandable: false
  },
  // Add more cards as needed...
]
```

---

**End of Documentation**

This pattern is production-tested and fully responsive. Implement it exactly as documented for consistent, professional results across all dashboard views.
