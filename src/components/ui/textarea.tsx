/**
 * textarea.tsx
 * 
 * Reusable textarea component with consistent styling.
 * Built to match the design system used across the VenU application.
 * 
 * Features:
 * - Consistent styling with other form inputs
 * - Support for disabled state
 * - Forwards refs for form library integration
 * - Supports all native textarea attributes
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * TextareaProps interface extending native textarea attributes.
 * Allows full customization while maintaining type safety.
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Textarea component with consistent styling.
 * Uses forwardRef to allow parent components to access the underlying textarea element.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles: full width, minimum height, padding, rounded corners
          "flex min-h-[120px] w-full rounded-lg border border-gray-200 bg-white px-4 py-3",
          // Typography: readable text size with proper line height
          "text-sm text-foreground placeholder:text-muted-foreground",
          // Focus states: ring effect for accessibility
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          // Disabled state styling
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
          // Resize behavior: only vertical to prevent layout breaking
          "resize-y",
          // Allow custom classes to override defaults
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

// Display name for React DevTools
Textarea.displayName = "Textarea";

export { Textarea };
