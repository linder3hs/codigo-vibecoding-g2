const EXCLUDED_KEYS = ["page", "ordering"]

/**
 * Cuenta cuántos filtros están activos en un objeto de params.
 * Excluye page y ordering (no son "filtros" visibles para el usuario).
 */
export function countActiveFilters(
  params: Record<string, unknown>,
  excludeKeys: string[] = EXCLUDED_KEYS
): number {
  return Object.entries(params).filter(
    ([key, value]) =>
      !excludeKeys.includes(key) &&
      value !== undefined &&
      value !== null &&
      value !== ""
  ).length
}
