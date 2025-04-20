interface CookieAttributes {
  value: string;
  'max-age'?: number;
  expires?: Date;
  domain?: string;
  path?: string;
  secure?: boolean;
  httponly?: boolean;
  samesite?: 'strict' | 'lax' | 'none';
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [key: string]: any;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
export function parseSetCookieHeader(
  setCookie: string
): Map<string, CookieAttributes> {
  const cookies = new Map<string, CookieAttributes>();
  const cookieArray = setCookie.split(', ');

  for (const cookieString of cookieArray) {
    const parts = cookieString.split(';').map((part) => part.trim());
    const [nameValue, ...attributes] = parts;
    const [name, ...valueParts] = nameValue?.split('=') ?? [];

    const value = valueParts.join('=');

    if (!name || value === undefined) {
      continue;
    }

    const attrObj: CookieAttributes = { value };

    for (const attribute of attributes) {
      const [attrName, ...attrValueParts] = attribute.split('=');
      const attrValue = attrValueParts.join('=');

      const normalizedAttrName = attrName?.trim().toLowerCase();

      switch (normalizedAttrName) {
        case 'max-age':
          attrObj['max-age'] = attrValue
            ? Number.parseInt(attrValue.trim(), 10)
            : undefined;
          break;
        case 'expires':
          attrObj.expires = attrValue ? new Date(attrValue.trim()) : undefined;
          break;
        case 'domain':
          attrObj.domain = attrValue ? attrValue.trim() : undefined;
          break;
        case 'path':
          attrObj.path = attrValue ? attrValue.trim() : undefined;
          break;
        case 'secure':
          attrObj.secure = true;
          break;
        case 'httponly':
          attrObj.httponly = true;
          break;
        case 'samesite':
          attrObj.samesite = attrValue
            ? (attrValue.trim().toLowerCase() as 'strict' | 'lax' | 'none')
            : undefined;
          break;
        default:
          // Handle any other attributes
          attrObj[normalizedAttrName ?? ''] = attrValue
            ? attrValue.trim()
            : true;
          break;
      }
    }

    cookies.set(name, attrObj);
  }

  return cookies;
}
