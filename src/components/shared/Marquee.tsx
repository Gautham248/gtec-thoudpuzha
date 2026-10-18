import type { CSSProperties, ReactNode } from "react";

interface MarqueeProps<T> {
  items: readonly T[];
  /** Stable key for an item. */
  itemKey: (item: T) => string;
  /**
   * Draws one tile. `repeat` is true for every copy after an item's first
   * appearance: render it decorative (empty alt, not focusable), since the
   * tile wrapper is already hidden from assistive tech.
   */
  renderItem: (item: T, repeat: boolean) => ReactNode;
  /** Classes for each tile wrapper (width, spacing). */
  itemClassName: string;
  /** Repeat the items until one set has at least this many tiles. */
  minSetSize?: number;
  /** Seconds each tile takes to scroll past; sets the loop's speed. */
  secondsPerItem?: number;
  "data-testid"?: string;
}

/**
 * A full-width row that scrolls left forever. The track holds the set twice
 * and slides by half its width (.gallery-marquee in globals.css), so the loop
 * is seamless; tiles carry their own right margin, not a flex gap, so both
 * halves are exactly equal. Pauses on hover; with reduced motion it stops,
 * drops the copy, and becomes a row you can swipe.
 */
export function Marquee<T>({
  items,
  itemKey,
  renderItem,
  itemClassName,
  minSetSize = 8,
  secondsPerItem = 5,
  "data-testid": testId,
}: MarqueeProps<T>) {
  if (items.length === 0) return null;

  const set = Array.from(
    { length: Math.ceil(minSetSize / items.length) },
    () => items,
  ).flat();

  const tile = (item: T, index: number, loopCopy: boolean) => {
    const repeat = loopCopy || index >= items.length;
    return (
      <div
        key={`${loopCopy ? "b" : "a"}-${index}-${itemKey(item)}`}
        {...(loopCopy ? { "data-marquee-copy": "" } : {})}
        {...(repeat ? { "aria-hidden": true } : {})}
        className={`shrink-0 ${itemClassName}`}
      >
        {renderItem(item, repeat)}
      </div>
    );
  };

  return (
    <div
      data-testid={testId}
      className="gallery-marquee-viewport w-full overflow-hidden"
    >
      <div
        className="gallery-marquee flex w-max"
        style={
          {
            "--marquee-duration": `${set.length * secondsPerItem}s`,
          } as CSSProperties
        }
      >
        {set.map((item, i) => tile(item, i, false))}
        {set.map((item, i) => tile(item, i, true))}
      </div>
    </div>
  );
}
