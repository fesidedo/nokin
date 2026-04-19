import type { ListingSummary } from "./types";

/**
 * Title patterns that almost always indicate a junk listing (broken,
 * parts-only, untested, empty box, etc.). The patterns are word-boundary
 * anchored and case-insensitive so we catch "Broken", "BROKEN", and
 * "broken" alike without eating legitimate substrings.
 *
 * Kept as a pure constant (rather than inlined) so the test file can
 * import and iterate over it if we ever want a snapshot of the ruleset.
 */
export const JUNK_TITLE_PATTERNS: readonly RegExp[] = [
  /\bfor parts\b/i,
  /\bparts only\b/i,
  /\bnot working\b/i,
  /\bnot function\w*/i,
  /\bbroken\b/i,
  /\bdamaged\b/i,
  /\bas[- ]is\b/i,
  /\bread (?:the )?description\b/i,
  /\brepair\b/i,
  /\bspares?\b/i,
  /\buntested\b/i,
  /\bempty box\b/i,
  /\bbox only\b/i,
];

/**
 * eBay's "For parts or not working" condition id. Items in this bucket
 * should never surface in the market panel even when the title looks
 * clean, so we short-circuit on the id before touching the regex list.
 */
const JUNK_CONDITION_ID = "7000";

/**
 * Decide whether a listing should be hidden from the market panel.
 *
 * Two-layered defence because the eBay-side `conditions:{NEW|USED}`
 * filter applied by the search helpers already rejects the
 * `FOR_PARTS_OR_NOT_WORKING` category on most leaf categories, but the
 * condition hierarchy varies by category and the filter is best-effort.
 * Dropping by condition id here is the belt, the title denylist is the
 * braces, and together they make sure a "broken AF-S 70-200mm, free
 * shipping" listing can't slip through.
 */
export function isJunkListing(listing: ListingSummary): boolean {
  if (listing.conditionId === JUNK_CONDITION_ID) return true;
  const title = listing.title ?? "";
  if (!title) return false;
  return JUNK_TITLE_PATTERNS.some((re) => re.test(title));
}
