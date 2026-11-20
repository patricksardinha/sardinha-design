export type TokenKind = "color" | "font" | "length" | "duration" | "shadow";
export type ThemeName = "light" | "dark";

export interface CategoryInfo {
  key: string;
  kind: TokenKind;
  themed?: boolean;
  positive?: boolean;
  cssPrefix: string;
  label: string;
  required: string[];
}

export interface TokenError {
  path: string;
  message: string;
}

export type TokenGroup = Record<string, string>;

export interface Tokens {
  $description?: string;
  color: { $description?: string; light: TokenGroup; dark: TokenGroup };
  [category: string]: unknown;
}

export type ValidationResult = { ok: true; tokens: Tokens } | { ok: false; errors: TokenError[] };

export const CATEGORIES: CategoryInfo[];
export const THEMES: ThemeName[];
export const DESCRIPTION_KEY: "$description";
export function kebab(name: string): string;
export function cssVarName(categoryKey: string, name: string): string;
export function checkValue(
  kind: TokenKind,
  raw: unknown,
  options?: { positive?: boolean },
): { value: string; error?: undefined } | { error: string; value?: undefined };
export function validateTokens(input: unknown): ValidationResult;
export function formatErrors(errors: TokenError[]): string;
export function generateCss(tokens: Tokens): string;
export function serializeTokens(tokens: Tokens): string;
export function requiredCssVars(): string[];
