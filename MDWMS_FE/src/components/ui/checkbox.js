import React from 'react';
import { cn } from '../../utils/cn';

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
        <div className="flex items-center space-x-2">
            <input
                type="checkbox"
                className={cn(
                    "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
                    className
                )}
                ref={ref}
                checked={checked}
                onChange={(e) => onCheckedChange?.(e.target.checked)}
                {...props}
            />
        </div>
    );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
