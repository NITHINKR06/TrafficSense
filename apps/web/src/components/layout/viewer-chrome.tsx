import { getViewer } from "@/lib/auth/server";
import { TopBar } from "./top-bar";
import { Dock } from "./dock";

export async function TopBarWithViewer() {
  let viewer: Awaited<ReturnType<typeof getViewer>> = null;
  try {
    viewer = await getViewer();
  } catch {
    viewer = null;
  }
  return <TopBar viewer={viewer ? { email: viewer.email ?? "", role: viewer.role } : null} />;
}

export async function DockWithViewer() {
  let viewer: Awaited<ReturnType<typeof getViewer>> = null;
  try {
    viewer = await getViewer();
  } catch {
    viewer = null;
  }
  return <Dock role={viewer?.role ?? null} />;
}
