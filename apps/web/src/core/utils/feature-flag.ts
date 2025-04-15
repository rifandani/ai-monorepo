/**
 * All flags should be declared here
 * Flags should be called in the server environment (RSC, Route Handlers, Server Functions, ...)
 *
 * @link https://flags-sdk.dev/docs/getting-started/next
 */
import { flag } from 'flags/next';
import 'server-only';

/**
 * Home welcome flag
 *
 * @description
 * This flag is used to control whether we show the welcome message on the home page
 */
export const homeWelcomeFlag = flag<boolean>({
  key: 'home-welcome-flag',
  decide() {
    return true;
  },
});
