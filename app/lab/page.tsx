import type { Metadata } from "next";
import { ChatLab } from "@/components/lab/ChatLab";

// A bench for the Lumi chat's design, separate from the prototype itself so
// nothing here can reach the demo at "/". See docs/project/chat-lab.md.
export const metadata: Metadata = { title: "Chat lab — Lumi" };

export default function LabPage() {
  return <ChatLab />;
}
