import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      /** Set in the session callback; progress rows are keyed on it. */
      id: string;
    } & DefaultSession['user'];
  }
}
