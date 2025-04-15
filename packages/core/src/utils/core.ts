import type { RequireAtLeastOne, UnknownRecord } from 'type-fest';
import { z } from 'zod';

/**
 * Clamps a value to a specified range.
 *
 * @example
 * clamp({ value: 12, min: 0, max: 10 }) // 10
 * clamp({ value: -5, min: 0, max: 10 }) // 0
 *
 * @param {object} options - options object
 * @param {number} options.value - value to clamp
 * @param {number} options.min - minimum value
 * @param {number} options.max - maximum value
 * @returns {number} clamped value
 */
export function clamp({
  value,
  min,
  max,
}: {
  value: number;
  min: number;
  max: number;
}): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format phone number based on mockup, currently only covered minimum 11 characters and max 15 characters include +62
 * e.g +62-812-7363-6365
 *
 * @param phoneNumber - input should include "+62"
 */
export function indonesianPhoneNumberFormat(phoneNumber: string) {
  // e.g: +62
  const code = phoneNumber.slice(0, 3);
  const numbers = phoneNumber.slice(3);
  // e.g 812, 852
  const ndc = numbers.slice(0, 3);
  // e.g the rest of the numbers
  const uniqNumber = numbers.slice(3);
  let regexp: RegExp;

  if (uniqNumber.length <= 6) {
    // biome-ignore lint/performance/useTopLevelRegex: <explanation>
    regexp = /(\d{3})(\d+)/;
  } else if (uniqNumber.length === 7) {
    // biome-ignore lint/performance/useTopLevelRegex: <explanation>
    regexp = /(\d{3})(\d{4})/;
  } else if (uniqNumber.length === 8) {
    // biome-ignore lint/performance/useTopLevelRegex: <explanation>
    regexp = /(\d{4})(\d{4})/;
  } else {
    // biome-ignore lint/performance/useTopLevelRegex: <explanation>
    regexp = /(\d{4})(\d{5,})/;
  }

  const matches = uniqNumber.replace(regexp, '$1-$2');

  return [code, ndc, matches].join('-');
}

/**
 * convert deep nested object keys to camelCase.
 */
export function toCamelCase<T>(object: unknown): T {
  let transformedObject = object as Record<string, unknown>;
  if (typeof object === 'object' && object !== null) {
    if (Array.isArray(object)) {
      transformedObject = object.map(toCamelCase) as unknown as Record<
        string,
        unknown
      >;
    } else {
      transformedObject = {};
      for (const key of Object.keys(object)) {
        if ((object as Record<string, unknown>)[key] !== undefined) {
          // biome-ignore lint/performance/useTopLevelRegex: <explanation>
          const firstUnderscore = key.replace(/^_/, '');
          const newKey = firstUnderscore.replace(/(_\w)|(-\w)/g, (k) =>
            (k[1] as string).toUpperCase()
          );
          transformedObject[newKey] = toCamelCase(
            (object as Record<string, unknown>)[key]
          );
        }
      }
    }
  }
  return transformedObject as T;
}

/**
 * convert deep nested object keys to snake_case.
 */
export function toSnakeCase<T>(object: unknown): T {
  let transformedObject = object as Record<string, unknown>;
  if (typeof object === 'object' && object !== null) {
    if (Array.isArray(object)) {
      transformedObject = object.map(toSnakeCase) as unknown as Record<
        string,
        unknown
      >;
    } else {
      transformedObject = {};
      for (const key of Object.keys(object)) {
        if ((object as Record<string, unknown>)[key] !== undefined) {
          const newKey = key
            .replace(
              /\.?([A-Z]+)/g,
              (_, y) => `_${y ? (y as string).toLowerCase() : ''}`
            )
            // biome-ignore lint/performance/useTopLevelRegex: <explanation>
            .replace(/^_/, '');
          transformedObject[newKey] = toSnakeCase(
            (object as Record<string, unknown>)[key]
          );
        }
      }
    }
  }
  return transformedObject as T;
}

/**
 * Remove leading zero
 */
export function removeLeadingZeros(value: string) {
  // biome-ignore lint/performance/useTopLevelRegex: <explanation>
  if (/^0+[1-9]+/.test(value)) {
    // biome-ignore lint/performance/useTopLevelRegex: <explanation>
    return value.replace(/^(0)/, '');
  }

  // biome-ignore lint/performance/useTopLevelRegex: <explanation>
  return value.replace(/^0{2,}/, '0');
}

/**
 * Remove leading whitespaces
 */
export function removeLeadingWhitespace(value?: string) {
  if (!value) {
    return '';
  }
  // biome-ignore lint/performance/useTopLevelRegex: <explanation>
  if (/^\s*$/.test(value)) {
    // biome-ignore lint/performance/useTopLevelRegex: <explanation>
    return value.replace(/^\s*/, '');
  }

  return value;
}

/**
 * Convert deep object to FormData.
 * Supports File, array, and options to add object rootName and ignore object keys.
 *
 * @example
 *
 * const formData = objectToFormData({
 *   num: 1,
 *   falseBool: false,
 *   trueBool: true,
 *   empty: '',
 *   und: undefined,
 *   nullable: null,
 *   date: new Date(),
 *   file: new File(["foo"], "foo.txt", {
 *     type: "text/plain",
 *   }),
 *   name: 'str',
 *   another_object: {
 *     name: 'my_name',
 *     value: 'whatever'
 *   },
 *   array: [
 *     {
 *       nested_key1: {
 *         name: 'key1'
 *       }
 *     }
 *   ]
 * });
 *
 * // results
 * (2) ['num', '1']
 * (2) ['falseBool', 'false']
 * (2) ['trueBool', 'true']
 * (2) ['empty', '']
 * (2) ['file', File]
 * (2) ['name', 'str']
 * (2) ['another_object.name', 'my_name']
 * (2) ['another_object.value', 'whatever']
 * (2) ['array[0].nested_key1.name', 'key1']
 */
export function objectToFormData<T extends UnknownRecord>(
  obj: T,
  options?: RequireAtLeastOne<{
    rootName?: string;
    ignoreList: Array<keyof T>;
  }>
) {
  const formData = new FormData();

  function ignore(_key?: string) {
    return (
      Array.isArray(options?.ignoreList) &&
      options?.ignoreList.includes(_key as keyof T)
    );
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  function appendFormData(_obj: T, _rootName_?: string) {
    let _rootName = _rootName_;

    if (!ignore(_rootName)) {
      _rootName = _rootName || '';

      if (_obj instanceof File) {
        formData.append(_rootName, _obj);
      } else if (Array.isArray(_obj)) {
        for (let i = 0; i < _obj.length; i++) {
          appendFormData(_obj[i], `${_rootName}[${i}]`);
        }
      } else if (typeof _obj === 'object' && _obj) {
        for (const key in _obj) {
          if (Object.prototype.hasOwnProperty.call(_obj, key)) {
            if (_rootName === '') {
              // @ts-expect-error i'm not typescript wizard
              appendFormData(_obj[key], key);
            } else {
              // @ts-expect-error i'm not typescript wizard
              appendFormData(_obj[key], `${_rootName}.${key}`);
            }
          }
        }
      } else if (_obj !== null && typeof _obj !== 'undefined') {
        formData.append(_rootName, _obj);
      }
    }
  }

  appendFormData(obj, options?.rootName);

  return formData;
}

/**
 * Convert deep object to FormData.
 * Supports File, array, and options to add object rootName and ignore object keys.
 *
 * @example
 *
 * const formData = objectToFormDataArrayWithComma({
 *   num: 1,
 *   falseBool: false,
 *   trueBool: true,
 *   empty: '',
 *   und: undefined,
 *   nullable: null,
 *   date: new Date(),
 *   file: new File(["foo"], "foo.txt", {
 *     type: "text/plain",
 *   }),
 *   name: 'str',
 *   another_object: {
 *     name: 'my_name',
 *     value: 'whatever'
 *   },
 *   array: [
 *     "value1",
 *     "value2"
 *   ]
 * });
 *
 * // results
 * (2) ['num', '1']
 * (2) ['falseBool', 'false']
 * (2) ['trueBool', 'true']
 * (2) ['empty', '']
 * (2) ['file', File]
 * (2) ['name', 'str']
 * (2) ['another_object.name', 'my_name']
 * (2) ['another_object.value', 'whatever']
 * (2) ['array', 'value1,value2']
 */
export function objectToFormDataArrayWithComma<T extends UnknownRecord>(
  obj: T,
  options?: RequireAtLeastOne<{
    rootName?: string;
    ignoreList: Array<keyof T>;
  }>
) {
  const formData = new FormData();

  function ignore(_key?: string) {
    return (
      Array.isArray(options?.ignoreList) &&
      options?.ignoreList.includes(_key as keyof T)
    );
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  function appendFormData(_obj: T, _rootName_?: string) {
    let _rootName = _rootName_;

    if (!ignore(_rootName)) {
      _rootName = _rootName || '';

      if (_obj instanceof File) {
        formData.append(_rootName, _obj);
      } else if (Array.isArray(_obj)) {
        formData.append(_rootName, _obj.join(','));
      } else if (typeof _obj === 'object' && _obj) {
        for (const key in _obj) {
          if (Object.prototype.hasOwnProperty.call(_obj, key)) {
            if (_rootName === '') {
              // @ts-expect-error i'm not typescript wizard
              appendFormData(_obj[key], key);
            } else {
              // @ts-expect-error i'm not typescript wizard
              appendFormData(_obj[key], `${_rootName}.${key}`);
            }
          }
        }
      } else if (_obj !== null && typeof _obj !== 'undefined') {
        formData.append(_rootName, _obj);
      }
    }
  }

  appendFormData(obj, options?.rootName);

  return formData;
}

/**
 * Safely access deep values in an object via a string path seperated by `.`
 * This util is largely inspired by [dlv](https://github.com/developit/dlv/blob/master/index.js) and passes all its tests
 *
 * @param obj {Record<string, unknown>} - The object to parse
 * @param path {string} - The path to search in the object
 * @param [defaultValue] {unknown} -  A default value if the path doesn't exist in the object
 *
 * @returns {any} The value if found, the default provided value if set and not found, undefined otherwise
 *
 * @example
 *
 * ```js
 * const obj = { a: { b : { c: 'hello' } } };
 *
 * const value = deepReadObject(obj, 'a.b.c');
 * // => 'hello'
 * const notFound = deepReadObject(obj, 'a.b.d');
 * // => undefined
 * const notFound = deepReadObject(obj, 'a.b.d', 'not found');
 * // => 'not found'
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function deepReadObject<T = any>(
  obj: Record<string, unknown>,
  path: string,
  defaultValue?: unknown
): T {
  const value = path
    .trim()
    .split('.')
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    .reduce<any>((a, b) => (a ? a[b] : undefined), obj);

  return value !== undefined ? value : (defaultValue as T);
}

/**
 * get default values from zod schema, similar to `yupSchema.getDefault()`
 *
 * If all of your schema keys have default values, then you can just do `schema.parse({})` to read the defaults
 *
 * @note doesn't work with `refine` or `superRefine` in nested `object`
 */
export function getSchemaDefaults<T extends z.ZodTypeAny>(
  // biome-ignore lint/suspicious/noExplicitAny: intended
  schema: z.AnyZodObject | z.ZodEffects<any>
): z.infer<T> {
  // Check if it's a ZodEffect
  if (schema instanceof z.ZodEffects) {
    // Check if it's a recursive ZodEffect
    if (schema.innerType() instanceof z.ZodEffects) {
      return getSchemaDefaults(schema.innerType());
    }
    // return schema inner shape as a fresh zodObject
    return getSchemaDefaults(z.ZodObject.create(schema.innerType().shape));
  }

  function getDefaultValue(schema: z.ZodTypeAny): unknown {
    if (schema instanceof z.ZodDefault) {
      return schema._def.defaultValue();
    }
    // return an empty array if it is
    if (schema instanceof z.ZodArray) {
      return [];
    }
    // return an empty string if it is
    if (schema instanceof z.ZodString) {
      return '';
    }
    // return an content of object recursivly
    if (schema instanceof z.ZodObject) {
      return getSchemaDefaults(schema);
    }
    // return undefined if it is not a zod type
    if (!('innerType' in schema._def)) {
      return undefined;
    }
    return getDefaultValue(schema._def.innerType);
  }

  return Object.fromEntries(
    Object.entries(schema.shape).map(([key, value]) => {
      return [key, getDefaultValue(value as z.ZodTypeAny)];
    })
  );
}

/**
 * Converts a File object to a base64 encoded string
 * @param file - The File object to convert
 * @returns Promise that resolves with the base64 string representation of the file
 */
export function toBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}
