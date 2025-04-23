import type { Http } from '@workspace/core/services/http';
import type { Options } from 'ky';
import { z } from 'zod';

// #region ENTITY
export const authSessionSchema = z.object({
  id: z.string(),
  expiresAt: z.string().date(),
  token: z.string(),
  createdAt: z.string().date(),
  updatedAt: z.string().date(),
  ipAddress: z.string(),
  userAgent: z.string(),
  userId: z.string(),
});
export type AuthSessionSchema = z.infer<typeof authSessionSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.string().date(),
  updatedAt: z.string().date(),
});
export type AuthUserSchema = z.infer<typeof authUserSchema>;
// #endregion ENTITY

// #region API SCHEMAS
export const authGetSessionResponseSchema = z
  .object({
    session: authSessionSchema,
    user: authUserSchema,
  })
  .nullable();
export type AuthGetSessionResponseSchema = z.infer<
  typeof authGetSessionResponseSchema
>;

export const authSignUpEmailRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(3),
  callbackURL: z.string().optional(),
});
export type AuthSignUpEmailRequestSchema = z.infer<
  typeof authSignUpEmailRequestSchema
>;

export const authSignUpEmailResponseSchema = z.object({
  token: z.string().nullable(),
});
export type AuthSignUpEmailResponseSchema = z.infer<
  typeof authSignUpEmailResponseSchema
>;

export const authSignInEmailRequestSchema = authSignUpEmailRequestSchema
  .omit({
    name: true,
  })
  .extend({
    rememberMe: z.boolean(),
  });
export type AuthSignInEmailRequestSchema = z.infer<
  typeof authSignInEmailRequestSchema
>;

export const authSignInEmailResponseSchema = z.object({
  redirect: z.boolean(),
  token: z.string(),
  url: z.string().nullable(),
});
export type AuthSignInEmailResponseSchema = z.infer<
  typeof authSignInEmailResponseSchema
>;

export const authSignOutResponseSchema = z.object({
  success: z.boolean(),
});
export type AuthSignOutResponseSchema = z.infer<
  typeof authSignOutResponseSchema
>;
// #endregion API SCHEMAS

export const authKeys = {
  all: () => ['auth'] as const,
  signUpEmail: (params: AuthSignUpEmailRequestSchema | undefined) =>
    [...authKeys.all(), 'signUpEmail', ...(params ? [params] : [])] as const,
  signInEmail: (params: AuthSignInEmailRequestSchema | undefined) =>
    [...authKeys.all(), 'signInEmail', ...(params ? [params] : [])] as const,
  signOut: () => [...authKeys.all(), 'signOut'] as const,
};

export function authRepositories(http: InstanceType<typeof Http>) {
  return {
    /**
     * @access public
     * @url GET ${env.apiBaseUrl}/api/auth/get-session
     * @throws HTTPError | TimeoutError | ZodError
     */
    getSession: async (options?: Options) => {
      const resp = await http.instance.get('api/auth/get-session', {
        ...options,
      });
      const json = await resp.json();
      const parsed = authGetSessionResponseSchema.parse(json);

      return { headers: resp.headers, json: parsed };
    },

    /**
     * @access public
     * @url POST ${env.apiBaseUrl}/api/auth/sign-in/email
     * @throws HTTPError | TimeoutError | ZodError
     */
    signInEmail: async (
      options?: Options & { json: AuthSignInEmailRequestSchema }
    ) => {
      const resp = await http.instance.post('api/auth/sign-in/email', {
        ...options,
      });
      const json = await resp.json();
      const parsed = authSignInEmailResponseSchema.parse(json);

      return { headers: resp.headers, json: parsed };
    },

    /**
     * @access public
     * @url POST ${env.apiBaseUrl}/api/auth/sign-up/email
     * @throws HTTPError | TimeoutError | ZodError
     */
    signUpEmail: async (
      options?: Options & { json: AuthSignUpEmailRequestSchema }
    ) => {
      const resp = await http.instance.post('api/auth/sign-up/email', {
        ...options,
      });
      const json = await resp.json();
      const parsed = authSignUpEmailResponseSchema.parse(json);

      return { headers: resp.headers, json: parsed };
    },

    /**
     * @access public
     * @url POST ${env.apiBaseUrl}/api/auth/sign-out
     * @throws HTTPError | TimeoutError | ZodError
     */
    signOut: async (options?: Options) => {
      const resp = await http.instance.post('api/auth/sign-out', {
        ...options,
      });
      const json = await resp.json();
      const parsed = authSignOutResponseSchema.parse(json);

      return { headers: resp.headers, json: parsed };
    },
  } as const;
}
