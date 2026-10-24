/**
 * Pure filtering helpers for the Tools directory.
 * Kept free of DOM access so the exact same logic is unit-tested and used by
 * the page script. Nothing here stores or transmits what the visitor types.
 */

export type IntentFilter = string; // 'all' or a ToolIntentId

export interface FilterableTool {
  id: string;
  intents: readonly string[];
  searchText: string;
}

export function normalizeQuery(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Every whitespace-separated term must appear somewhere in the haystack. */
export function matchesQuery(searchText: string, rawQuery: string): boolean {
  const normalizedQuery = normalizeQuery(rawQuery);
  if (!normalizedQuery) return true;
  const haystack = normalizeQuery(searchText);
  return normalizedQuery.split(' ').every((term) => haystack.includes(term));
}

export function matchesIntent(intents: readonly string[], intent: IntentFilter): boolean {
  return intent === 'all' || intents.includes(intent);
}

export function filterTools<T extends FilterableTool>(
  tools: readonly T[],
  intent: IntentFilter,
  rawQuery: string,
): T[] {
  return tools.filter(
    (tool) => matchesIntent(tool.intents, intent) && matchesQuery(tool.searchText, rawQuery),
  );
}
