import { useMediaQuery } from "./useMediaQuery";

export type Breakpoint = "mobile" | "tablet" | "desktop";

/**
 * Returns the current responsive breakpoint:
 * - "mobile"  (< 480px)
 * - "tablet"  (480–768px)
 * - "desktop" (> 768px)
 */
export function useBreakpoint(): Breakpoint {
  const isMobile = useMediaQuery("(max-width: 479px)");
  const isTablet = useMediaQuery("(min-width: 480px) and (max-width: 768px)");

  if (isMobile) return "mobile";
  if (isTablet) return "tablet";
  return "desktop";
}
