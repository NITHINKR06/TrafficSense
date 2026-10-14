import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, chmod } from "node:fs/promises";
import { readLocalStatus, internalSupabaseUrl } from "./local-status.mjs";

if (process.env.DEMO_MODE !== "true" || process.env.SUPABASE_URL !== internalSupabaseUrl) {
  throw new Error("Synthetic seeding is restricted to the configured local demo.");
}
const status = await readLocalStatus();
const supabase = createClient(internalSupabaseUrl, status.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const orgA = "10000000-0000-4000-8000-000000000001";
const orgB = "10000000-0000-4000-8000-000000000002";
const organisations = await supabase.from("organisations").upsert([
  { id: orgA, name: "SIMULATED · Harbour employer" },
  { id: orgB, name: "SIMULATED · Junction employer" },
]);
if (organisations.error) throw new Error("Could not seed local organisations; apply migrations first.");
const existing = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (existing.error) throw new Error("Could not inspect synthetic accounts.");
const definitions = [
  { label: "commuter", role: "commuter" },
  { label: "employer-a", role: "employer", orgId: orgA },
  { label: "employer-b", role: "employer", orgId: orgB },
  { label: "employer-unassigned", role: "employer" },
  { label: "authority", role: "authority" },
  { label: "admin", role: "admin" },
];
const accounts = [];
for (const definition of definitions) {
  const email = `${definition.label}@demo.trafficsense.test`;
  const password = randomBytes(24).toString("base64url");
  const found = existing.data.users.find((user) => user.email === email);
  const attributes = { password, email_confirm: true, user_metadata: { simulated: true } };
  const result = found
    ? await supabase.auth.admin.updateUserById(found.id, attributes)
    : await supabase.auth.admin.createUser({ email, ...attributes });
  if (result.error || !result.data.user) throw new Error(`Could not seed ${definition.label}.`);
  const id = result.data.user.id;
  const profile = await supabase.from("profiles").update({ role: definition.role }).eq("id", id).select("id").single();
  if (profile.error) throw new Error(`Could not assign ${definition.label}.`);
  const clear = await supabase.from("memberships").delete().eq("user_id", id);
  if (clear.error) throw new Error("Could not reset synthetic memberships.");
  if (definition.orgId) {
    const membership = await supabase.from("memberships").insert({ user_id: id, org_id: definition.orgId });
    if (membership.error) throw new Error("Could not assign synthetic membership.");
  }
  accounts.push({ ...definition, email, password, id });
}
await mkdir("supabase/.temp", { recursive: true, mode: 0o700 });
await writeFile("supabase/.temp/demo-accounts.json", `${JSON.stringify(accounts, null, 2)}\n`, { mode: 0o600 });
await chmod("supabase/.temp/demo-accounts.json", 0o600);
console.log("Created six synthetic accounts. Local passwords are in the ignored supabase/.temp/demo-accounts.json file; do not publish it.");
