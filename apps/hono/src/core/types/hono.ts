import type { auth } from '@/auth/libs';
import type { RequestIdVariables } from 'hono/request-id';
import type { TimingVariables } from 'hono/timing';

type AuthVariables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export type Variables = RequestIdVariables & TimingVariables & AuthVariables;
