import type { AttributeValue } from '@opentelemetry/api';

/**
 * Recursively flattens nested objects for trace attributes
 *
 * @example
 * ```typescript
 * const obj = {
 *   a: 1,
 *   b: { c: 2, d: 3 },
 * };
 * const flattened = flattenAttributes(obj);
 * // flattened = { 'a': '1', 'b.c': '2', 'b.d': '3' }
 * ```
 */
export function flattenAttributes(
  obj: unknown,
  config?: {
    prefix?: string;
    maxDepth?: number;
    currentDepth?: number;
  }
): Record<string, string> {
  const result: Record<string, string> = {};
  const { prefix = '', maxDepth = 3, currentDepth = 0 } = config ?? {};

  if (currentDepth >= maxDepth) {
    result[prefix] = JSON.stringify(obj);
    return result;
  }

  if (obj === null || obj === undefined) {
    result[prefix] = String(obj);
    return result;
  }

  if (typeof obj !== 'object') {
    result[prefix] = String(obj);
    return result;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      result[prefix] = '[]';
    } else if (obj.length <= 5) {
      // For small arrays, expand each item
      obj.forEach((item, index) => {
        const newPrefix = prefix ? `${prefix}.${index}` : String(index);
        Object.assign(
          result,
          flattenAttributes(item, {
            prefix: newPrefix,
            maxDepth,
            currentDepth: currentDepth + 1,
          })
        );
      });
    } else {
      // For large arrays, just show the count and first few items
      result[`${prefix}.length`] = String(obj.length);
      result[`${prefix}.preview`] = `${JSON.stringify(obj.slice(0, 3))}...`;
    }
    return result;
  }

  // Handle regular objects
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    result[prefix] = '{}';
    return result;
  }

  for (const [key, value] of entries) {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    Object.assign(
      result,
      flattenAttributes(value, {
        prefix: newPrefix,
        maxDepth,
        currentDepth: currentDepth + 1,
      })
    );
  }

  return result;
}

/**
 * Recursively flattens nested objects for trace attributes
 */
export function flattenAttributesV2(
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, AttributeValue> {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (value === null || value === undefined) {
        return acc;
      }
      if (Array.isArray(value)) {
        const allPrimitives = value.every(
          (item) => typeof item !== 'object' || item === null
        );
        if (allPrimitives) {
          // OTel doesn't support mixed-type arrays, so convert all to strings.
          acc[newKey] = value
            .filter((item) => item !== null)
            .map((item) => String(item));
        } else {
          value.forEach((item, i) => {
            if (typeof item === 'object' && item !== null) {
              Object.assign(
                acc,
                flattenAttributesV2(
                  item as Record<string, unknown>,
                  `${newKey}.${i}`
                )
              );
            } else if (item !== null && item !== undefined) {
              acc[`${newKey}.${i}`] = String(item);
            }
          });
        }
      } else if (typeof value === 'object') {
        Object.assign(
          acc,
          flattenAttributesV2(value as Record<string, unknown>, newKey)
        );
      } else if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        acc[newKey] = value;
      }
      return acc;
    },
    {} as Record<string, AttributeValue>
  );
}
