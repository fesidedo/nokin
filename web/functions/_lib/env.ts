import type { FunctionEnv } from "./types";

export const DEFAULT_EBAY_BASE_URL = "https://api.ebay.com";

export interface ValidatedEnv {
  appId: string;
  certId: string;
  baseUrl: string;
}

export type EnvValidation =
  | { ok: true; env: ValidatedEnv }
  | { ok: false; missing: string[] };

/**
 * Check that the required secrets are present and return a normalized view.
 * Kept pure so it can be tested without a real Pages environment.
 */
export function validateEnv(env: Partial<FunctionEnv>): EnvValidation {
  const missing: string[] = [];
  if (!env.EBAY_APP_ID) missing.push("EBAY_APP_ID");
  if (!env.EBAY_CERT_ID) missing.push("EBAY_CERT_ID");

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  return {
    ok: true,
    env: {
      appId: env.EBAY_APP_ID as string,
      certId: env.EBAY_CERT_ID as string,
      baseUrl: (env.EBAY_BASE_URL ?? DEFAULT_EBAY_BASE_URL).replace(/\/$/, ""),
    },
  };
}
