import * as React from "react"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = "", value = 0, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}
        {...props}
      >
        <div
          className="h-full w-full flex-1 rounded-full bg-[#1E293B] transition-all duration-300"
          style={{ transform: `translateX(-${100 - Math.min(Math.max(value, 0), 100)}%)` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
