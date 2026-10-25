/**
 * One-time launch loader gate.
 *
 * The rocket launch belongs to the very first load of the site only: not to
 * client-side navigation between routes and not to later reloads in the same
 * browser session. Two layers decide it:
 *
 * - a module-level flag, which covers client-side navigation (the JS module
 *   survives route changes), and
 * - a sessionStorage flag, which covers reloads and new visits in the same tab
 *   session. sessionStorage (not localStorage) is deliberate: a new session,
 *   e.g. a recruiter opening the link tomorrow, gets the launch again, while
 *   nobody sees it twice in one sitting.
 *
 * Storage can throw (privacy modes, blocked cookies); then the module flag
 * alone applies, which still guarantees "once per page load".
 *
 * Only ever read on the client (the loader renders nothing on the server), so
 * there is no hydration mismatch.
 */
const STORAGE_KEY = "fp:launch-loader-shown";

let decided: boolean | null = null;
let finished = false;

function readShown(): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeShown() {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Blocked storage: the module flag still limits it to this page load.
  }
}

/** True while the launch loader is still owed to this visit. */
export function isLaunchLoaderPending(): boolean {
  if (decided === null) {
    decided = !readShown();
    // Marked right away: a reload mid-launch must not replay it either.
    writeShown();
  }
  return decided && !finished;
}

/** The launch played (or was skipped): never show it again this session. */
export function expireLaunchLoader() {
  if (decided === null) {
    decided = false;
    writeShown();
  }
  finished = true;
}
