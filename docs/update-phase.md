Phase 1: Find out what really works
Get a database running. The project needs Supabase (Postgres 17 with PostGIS, plus Supabase's auth schema). The easiest path is Docker, using the repo's compose.yaml and scripts/local-supabase.sh, following docs/docker.md and docs/setup.md. Install Docker Engine 28+ on your machine. If you can't use Docker, you'd need a local Postgres 17 with PostGIS and the Supabase auth shims, which is harder.
Apply the 20 migrations in supabase/migrations/ in order. Check that each one applies without errors.
Run the 13 integration tests that are currently excluded from npm test. Record which pass and which fail. This is the most important step, because it covers login, reports, verification, route alerts, journeys, and analytics.
Walk through each user flow by hand in a browser: register, log in, submit a report, see it on the map, check its verification level, request a route, open the authority dashboard. Write down what happens at each step, including errors.
Fix the type error in src/app/employer/[orgId]/page.tsx so pnpm tsc --noEmit passes.
Self-host the fonts using next/font/local, so the build works offline and in any country.

At the end of this phase you'll have a real table: each feature marked as works, partial, or broken, with the evidence.

Phase 2: Make the core loop solid

Only the core loop should be worked on here: citizen report → verification → route alert. For each step:

Fix what fails in Phase 1, starting with the most basic break.
Make errors visible. /api/incidents and /api/route should return a clear message when the database or routing service is down, not a generic 500 or an empty result.
Replace the public routing server. router.project-osrm.org is a shared demo service with rate limits. Either self-host OSRM with the Mangaluru road data from OpenStreetMap (a Docker container, and a one-time data extract), or add a fallback that clearly says routing is unavailable.
Add a test for each core step that runs in the default pnpm test, so regressions are caught.
Phase 3: Real data

This is the step that changes the project from a demo to something that can be evaluated. The synthetic fixture has to be replaced for at least one corridor.

Choose the data source. Options, roughly from most to least feasible:
Volunteer phone traces: a small group of people who opt in to share their GPS for a fixed trip, deleted after processing. This is the most honest option for your privacy claims. You'll need a consent form and a data retention policy.
Publicly available speed data, if your city or a provider publishes any for Mangaluru. Check the licence first.
Crowd reports only, with no speed data. This means the system can only show reports, not verified slowdowns. Be clear about this if you go this way.
Collect the data over enough days to cover peak and off-peak periods on the chosen corridor. For a useful evaluation, you need several weeks, not a single afternoon.
Replace the fixture with the collected data, keeping the labels honest about the source.
Phase 4: Measure it
Write an evaluation script that replays the recorded data and compares the system's alerts against measured delays. Report precision, recall, abstention rate, and false-alert rate.
Set your pass thresholds before you run it, and write them down. For example, precision above 80% on the chosen corridor. Publish the result whether it passes or not.
Run it on data the system hasn't seen (a held-out period), so the result isn't tuned to the data.
Phase 5: Make it reachable
Deploy it to a hosting provider (Vercel for the Next.js app, hosted Supabase for the database). Set up environment variables and check that a fresh deployment works.
Test on a phone with a stranger's device and no setup. The time from opening the URL to submitting a report should be under a minute. Watch someone do it and note where they get stuck.
Set up CI (GitHub Actions or similar) so the tests run on every change, and add the badge to the README.
Phase 6: Validate the problem
Talk to 5–10 real commuters in Mangaluru, or the employer the brief describes. Ask how they currently handle delays, what information they'd act on, and whether they'd report problems. Record their answers.
Ask whether they'd use it, and what would make them stop. Quote them honestly, including negative feedback.
Run a small real trial with a few users for a set period, and record how many used it and whether it changed any decision.
Phase 7: Clean up the project
Cut the extra modules from the demo and README: employer sharing, journey tracking, protected receipts, mobile plans. Keep them in a separate branch if you want, but out of the main story.
Remove or clearly label the synthetic analytics (history.ts and the authority dashboard's hardcoded history).
Shrink the docs. Replace the long planning files with one README covering: what it does, how to run it, a status table (works / partial / not built), the evaluation results, and known limits.