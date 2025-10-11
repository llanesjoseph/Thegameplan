import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
 HTMLDivElement,
 React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
 <div
  ref={ref}
  className={cn(
   "rounded-lg bg-white shadow-sm p-6",
   className
  )}
  {...props}
 />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
 HTMLDivElement,
 React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
 <div
  ref={ref}
  className={cn("flex items-center gap-3 mb-4", className)}
  {...props}
 />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
 HTMLParagraphElement,
 React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
 <h3
  ref={ref}
  className={cn(
   "text-lg text-gray-900",
   className
  )}
  {...props}
 />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
 HTMLParagraphElement,
 React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
 <p
  ref={ref}
  className={cn("text-sm text-muted-foreground", className)}
  {...props}
 />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
 HTMLDivElement,
 React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
 <div ref={ref} className={cn("space-y-3", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
 HTMLDivElement,
 React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
 <div
  ref={ref}
  className={cn("flex items-center pt-4", className)}
  {...props}
 />
))
CardFooter.displayName = "CardFooter"

// Stats Card - for displaying metrics
interface CardStatsProps extends React.HTMLAttributes<HTMLDivElement> {
 icon: React.ReactNode
 label: string
 value: string | number
 iconBgColor?: string
 iconColor?: string
}

const CardStats = React.forwardRef<HTMLDivElement, CardStatsProps>(
 ({ icon, label, value, iconBgColor = 'bg-blue-100', iconColor = 'text-blue-600', className, ...props }, ref) => (
  <Card ref={ref} className={cn("p-6", className)} {...props}>
   <div className="flex items-center">
    <div className={cn('p-2 rounded-lg', iconBgColor)}>
     <div className={iconColor}>{icon}</div>
    </div>
    <div className="ml-4">
     <p className="text-sm text-gray-600">{label}</p>
     <p className="text-2xl text-gray-900">{value}</p>
    </div>
   </div>
  </Card>
 )
)
CardStats.displayName = "CardStats"

// Notification Badge - for counts on cards
interface NotificationBadgeProps {
 count: number
 color?: 'blue' | 'green' | 'orange' | 'purple' | 'red'
}

function NotificationBadge({ count, color = 'blue' }: NotificationBadgeProps) {
 if (count === 0) return null

 const colorClasses = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  orange: 'bg-orange-600',
  purple: 'bg-purple-600',
  red: 'bg-red-600'
 }

 return (
  <span className={cn(
   'inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 text-xs text-white rounded-full',
   colorClasses[color]
  )}>
   {count}
  </span>
 )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardStats, NotificationBadge }
