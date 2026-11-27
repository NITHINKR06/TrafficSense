import { getViewer } from "@/lib/auth/server";
import { TopBar } from "./top-bar";
import { Dock } from "./dock";

export async function TopBarWithViewer() {
  const viewer = await getViewer();
  return <TopBar viewer={viewer ? { email: viewer.email ?? "", role: viewer.role } : null} />;
}

export async function DockWithViewer() {
  const viewer = await getViewer();
  return <Dock role={viewer?.role ?? null} />;
}
