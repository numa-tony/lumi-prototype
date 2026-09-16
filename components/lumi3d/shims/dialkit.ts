// A stand-in for the `dialkit` package, which the prototype does not install.
//
// The vendored cube imports `type DialConfig` to describe its tunables. That
// type is the only part of DialKit that reaches this repo — the panel itself
// stays in branding-v2. A tsconfig path alias points "dialkit" here, so the
// vendored files resolve unmodified and re-syncing never has to patch them.
export type DialValue = number | string | boolean;
export type DialConfig = {
  [key: string]: DialValue | readonly DialValue[] | DialConfig | undefined;
};
