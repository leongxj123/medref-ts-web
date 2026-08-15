import { getLinkTrie } from "@/lib/data";
import { linkifyToNodes } from "@/lib/linkify";

export async function LinkedBody({ text }: { text: string }) {
  if (!text) return null;
  const trie = await getLinkTrie();
  return (
    <div className="body linked-body" style={{ whiteSpace: "pre-wrap" }}>
      {linkifyToNodes(text, trie)}
    </div>
  );
}
