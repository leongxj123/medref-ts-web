import Link from "next/link";
import type { ReactNode } from "react";
import { genericPath, wikiPath } from "@/lib/paths";

type Term = { kind: "wiki" | "generic"; name: string };

type TrieNode = {
  next: Map<string, TrieNode>;
  term?: Term;
};

function addTerm(root: TrieNode, name: string, kind: Term["kind"]) {
  if (name.length < 2) return;
  let node = root;
  for (const ch of name) {
    let child = node.next.get(ch);
    if (!child) {
      child = { next: new Map() };
      node.next.set(ch, child);
    }
    node = child;
  }
  // Prefer longer / first-registered; don't overwrite longer terms with shorter at same node
  if (!node.term || node.term.name.length < name.length) {
    node.term = { kind, name };
  }
}

export function buildLinkTrie(wikiNames: string[], genericNames: string[]): TrieNode {
  const root: TrieNode = { next: new Map() };
  // Generics first, then wiki (wiki wins on exact same string via overwrite if equal length — prefer wiki for disease context)
  for (const name of genericNames) addTerm(root, name, "generic");
  for (const name of wikiNames) addTerm(root, name, "wiki");
  return root;
}

function hrefFor(term: Term) {
  return term.kind === "wiki" ? wikiPath(term.name) : genericPath(term.name);
}

/** Greedy longest-match linkify for plain section text. */
export function linkifyToNodes(text: string, trie: TrieNode): ReactNode[] {
  if (!text) return [];
  const out: ReactNode[] = [];
  let i = 0;
  let buf = "";
  const flush = () => {
    if (buf) {
      out.push(buf);
      buf = "";
    }
  };

  while (i < text.length) {
    let node: TrieNode | undefined = trie;
    let match: Term | null = null;
    let matchLen = 0;
    for (let j = i; j < text.length; j++) {
      node = node.next.get(text[j]);
      if (!node) break;
      if (node.term) {
        match = node.term;
        matchLen = j - i + 1;
      }
    }
    if (match && matchLen > 0) {
      flush();
      const slice = text.slice(i, i + matchLen);
      out.push(
        <Link key={`${i}-${slice}`} className="drug-link" href={hrefFor(match)}>
          {slice}
        </Link>
      );
      i += matchLen;
    } else {
      buf += text[i];
      i += 1;
    }
  }
  flush();
  return out;
}
