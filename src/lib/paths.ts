export function encodePath(name: string) {
  return encodeURIComponent(name || "");
}

export function wikiPath(name: string) {
  return `/wiki/${encodePath(name)}`;
}

export function genericPath(name: string) {
  return `/generic/${encodePath(name)}`;
}

export function drugRefHref(kind: string, target: string) {
  if (kind === "generic") return genericPath(target);
  return `/search?q=${encodePath(target)}`;
}
