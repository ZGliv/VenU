/**
 * scroll-reveal.tsx
 * 
 * Scroll-triggered animation component using Intersection Observer.
 * Reveals content with smooth fade-in and slide-up animations as users scroll.
 * 
 * Features:
 * - Configurable animation direction (up, down, left, right)
 * - Adjustable delay for staggered animations
 * - Customizable threshold for trigger point
 * - One-time or repeating animations
 * 
 * Exports:
 * - ScrollReveal: Wrapper component that animates children on scroll
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Animation direction: which way the element slides in from */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** Delay before animation starts (in ms) */
  delay?: number;
  /** Duration of the animation (in ms) */
  duration?: number;
  /** How much of the element needs to be visible (0-1) */
  threshold?: number;
  /** Whether to animate only once or every time element enters viewport */
  once?: boolean;
  /** Distance to travel during animation (in px) */
  distance?: number;
}

export function ScrollReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 600,
  threshold = 0.1,
  once = true,
  distance = 30,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When element enters viewport
        if (entry.isIntersecting) {
          setIsVisible(true);
          // If once is true, stop observing after first reveal
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          // If once is false, hide when out of viewport
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -50px 0px", // Trigger slightly before element is fully in view
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, once]);

  // Calculate initial transform based on direction
  const getInitialTransform = () => {
    switch (direction) {
      case "up":
        return `translateY(${distance}px)`;
      case "down":
        return `translateY(-${distance}px)`;
      case "left":
        return `translateX(${distance}px)`;
      case "right":
        return `translateX(-${distance}px)`;
      case "none":
        return "none";
      default:
        return `translateY(${distance}px)`;
    }
  };

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "none" : getInitialTransform(),
        transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * ScrollRevealGroup
 * 
 * A container for staggered scroll reveal animations.
 * Automatically applies increasing delays to direct children.
 */
interface ScrollRevealGroupProps {
  children: React.ReactNode;
  className?: string;
  /** Base delay between each child (in ms) */
  stagger?: number;
  /** Starting delay for the first child (in ms) */
  baseDelay?: number;
}

export function ScrollRevealGroup({
  children,
  className,
  stagger = 100,
  baseDelay = 0,
}: ScrollRevealGroupProps) {
  return (
    <div className={cn(className)}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <ScrollReveal key={index} delay={baseDelay + index * stagger}>
              {child}
            </ScrollReveal>
          ))
        : children}
    </div>
  );
}
