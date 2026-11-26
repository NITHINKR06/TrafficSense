# TrafficSense mobile: build spec

This is the single source of truth for building the TrafficSense mobile app (React Native / Expo) from the redesign.
Read it fully before writing UI code.

## 0. Rules for whoever builds this (human or agent)

1. **Order of authority:** this file → `tokens/tokens.json` → the HTML reference files. If they disagree, this file wins.
2. **Do not invent UI.** Every screen, component, state, colour, size, radius, font size and animation is defined here. If something you need is not here, stop and ask. Do not improvise a new pattern.
3. **Only use tokens.** No hex values, font sizes, radii or durations in components except through the theme built from `tokens.json`.
4. **Both themes always.** Every component must render correctly in light and dark. The theme follows the system unless the user picks Light or Dark in Me → Appearance.
5. **Reference files are pixel targets.** Open the matching file in `screens/`, `components/` or `specs/` and match it. Screens are drawn at 390 × 844 pt.
6. **Keep honest data labels.** Anything simulated or modelled shows the dashed **Simulated** tag. Never remove it while the data is not live.
7. **Accessibility is not optional.** Every rule in section 8 is required.

---

## 1. Senior front-end review: what changed and why

### Added in this round
| Area | Addition | Why |
| --- | --- | --- |
| Report | **Sent** state: check animation, L1 card, View on map, Done, Undo (10 s) | Users had no confirmation that the report landed |
| Report | Photo button labelled **L5** | Tells users a photo raises trust, without extra text |
| Sign in | **Forgot password?**, inline **error state**, demo accounts folded into one row | Missing recovery path; demo list was clutter in production |
| Journeys | Live progress bar, Arrive / Delay tiles, employer share **switch** with consent line, week history with delay reasons | Old page was static and unclear about what is shared |
| Home | One **Simulated** tag instead of three, "via" line, **Start journey** label, amber on-route tile, row chevrons, dismissible confirm card | Less noise, clearer actions |
| Logo | 3D tile settle, layered road draw, stretch-and-squash pin, double ripple, swaying hills, blue "Sense", tagline tracking, **zoom through the pin** into Welcome | Feels like a brand moment, not a fade |

### Must exist in the app but are not separate mockups (build them from section 6)
Forgot password, Demo account sheet, Location permission prompt, Offline banner, Loading skeletons, Empty states, Toasts, Report guest gate, Pull to refresh.

### Removed
- The four quick-action tiles on Home (the nav bar already has them).
- Report shortcuts on Me (duplicate of nav).
- Step indicator, honesty card, trust card and Cancel button on Report (merged into one trust line plus the close button).
- Loading progress bar (the logo animation is the indicator).
- Demo account list from the main sign-in flow (moved into a sheet, **hidden in production builds**).

### Production rules
- Demo accounts and "Try a demo account" render **only** when `APP_ENV !== 'production'`.
- "Thursday · Mangaluru · 27°" and "+2 min than usual" need a weather source and a usual-time source. Hide the parts you don't have data for; don't show fake values.
- Google sign-in must use **Google's official button artwork** per Google's branding guidelines. The "G" circle in the mockups is a placeholder.

---

## 2. Foundations (values live in `tokens/tokens.json`)

### Colour roles
| Role | Use for | Never use for |
| --- | --- | --- |
| background | Screen background | Cards |
| surface | Cards, sheets, inputs, nav bar | Screen background |
| surface-2 | Icon tiles, tonal buttons, segmented track, skeletons | Text |
| border | 1 px card and input borders, dividers | Text |
| text / text-2 / text-3 | Primary / secondary / captions and meta | text-3 on surface-2 at < 14 px |
| accent | Primary buttons, active states, links, trust bars | Large backgrounds (except the selected category circle) |
| accent-soft | Active nav pill, selected chip background, avatar | Text |
| warning / warning-soft | Flooding, heavy traffic, delays, on-route alerts | Success |
| danger / danger-soft | Accidents, closures, errors, Sign out, Reject | Anything else |
| hero | The dark commute and journey cards (dark in both themes) | Other cards |

Category → colour: Accident, Closed = danger. Flooding, Traffic = warning. Road works, Other = neutral (surface-2 + text-2).

### Type (Inter only; system fallback)
| Style | Size / line | Weight | Use |
| --- | --- | --- | --- |
| display | 28 / 34, −2.5% | 650 | Screen titles |
| hero-number | 56 / 56, −4% | 650 | Commute minutes only |
| title | 20 / 26, −1.5% | 650 | Section and sheet titles |
| heading | 17 / 22 | 600 | Card titles |
| body | 15 / 22 | 400–600 | Rows, inputs, buttons (16 for L buttons) |
| secondary | 14 / 20 | 400 | Descriptions |
| caption | 13 / 18 | 400–500 | Meta, helper text |
| small | 12 / 16 | 500–600 | Tags, legal line |
| label | 11 / 13, +1% | 600 | Nav labels, dashed tags |

Numbers use tabular figures (`fontVariant: ['tabular-nums']`).

### Spacing, radius, elevation
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 48. Screen gutter **20**. Card padding **16** (hero cards 20–22). Card gap **12**. Section gap **20–24**.
- Radius: tag 8, icon tile 12, input/M button 14, L button 16, card 20, large card 24–28, sheet 28–32, pill 999.
- Elevation: light uses soft shadows (`0 1 2 rgba(16,24,32,.06)`, `0 8 24 rgba(16,24,32,.10)`). Dark uses **no visible shadow**: use a 1 px `rgba(255,255,255,.06–.07)` top edge and a lighter surface instead.

### Icons
Use **lucide-react-native**, stroke 2 (nav 1.8, 2.1 when active), rounded caps. Sizes: nav 22, buttons 18–20, rows 17–18, category circles 26.

| Meaning | Lucide name | Meaning | Lucide name |
| --- | --- | --- | --- |
| Home | `house` | Accident | `octagon-alert` |
| Map | `map` | Closed | `circle-minus` |
| Plan | `route` | Traffic | `car` |
| Me | `user-round` | Flooding | `droplet` |
| Ops (authority) | `shield-check` | Road works | `construction` (or `traffic-cone`) |
| Report | `plus` | Other | `circle-alert` |
| Search | `search` | Location | `navigation` (filled) |
| Filters | `sliders-horizontal` | Layers | `layers` |
| Swap | `arrow-up-down` | Back | `arrow-left` |
| Close | `x` | Check | `check` |
| Camera | `camera` | Bus | `bus` |
| Menu | `ellipsis` | Settings | `settings` |
| Help | `circle-help` | Privacy | `shield` |
| Terms | `file-text` | Licenses | `list` |
| Journeys | `clock` | Work | `briefcase` |
| Appearance | `moon` | Sign out | `log-out` |
| Save route | `bookmark` | Tide | `waves` |
| Demo | `flask-conical` | Your data | `mail` |
| Lock | `lock` | Show password | `eye` / `eye-off` |

### Motion tokens
| Token | Value | Use |
| --- | --- | --- |
| press | 100 ms, scale 0.97 (buttons) / 0.90 (nav, FAB), `(.2,0,0,1)` | Every pressable |
| fade | 160 ms | Text and colour changes |
| base | 240 ms, enter `(0,0,0,1)` | Cards appearing (8 px rise, 40 ms stagger, max 5) |
| screen | 320 ms, standard `(.2,0,0,1)` | Push (24 px slide + fade); back 240 ms exit `(.3,0,1,1)` |
| sheet | 420 ms, glide `(.32,.72,0,1)` | Sheets, nav indicator |
| pop | `(.34,1.56,.64,1)` | Success check, pin select |

Use Reanimated springs where noted: stiffness 380, damping 32 for the nav indicator. With **Reduce motion** on, replace all movement with 150 ms fades and show the logo's final frame.

---

## 3. Layout rules
- Respect safe areas on all edges. Drawn screens have no status bar. Add the device inset on top.
- Scroll views with the nav bar end **112 pt** above the bottom (nav 64 + offset 16 + breathing room).
- Map screens: the map is full-bleed under the status bar. Overlays sit 16 pt from the edges.
- Keyboard: forms scroll so the focused field and the primary button stay visible (`KeyboardAvoidingView`, `behavior="padding"` on iOS).
- Minimum touch target **48 × 48**. When a control is drawn smaller (36–44), add `hitSlop` to reach 48.
- Text never truncates mid-word on titles. Long names wrap to 2 lines, then ellipsis.

---

## 4. Navigation
```
Loading → (first launch) Welcome → Home
Loading → (returning)  Home
Tabs: Home · Map · Plan · Me (authority: Ops) + floating Report button (modal)
Me → Journeys, Privacy & legal, Appearance, Location
Home ⋯ → Settings (Me), Help, Privacy policy, Terms, Licenses (Privacy & legal)
Auth: Welcome/Me/Report gate → Sign in ↔ Create account; Sign in → Forgot password
```
- Tabs switch with a cross-fade (160 ms), never a slide.
- Report opens as a **modal sheet** from the bottom (420 ms glide) over the current tab's map context.
- Sign-in success uses `router.replace` (Back must not return to sign in). Authority accounts land on Ops.
- Signed-out users can use Home, Map and Plan. Report, Journeys and Me require sign-in (redirect with `?next=`).

---

## 5. Components

Each component lists anatomy → sizes → variants → states → motion → accessibility.

### 5.1 NavBar (floating) · ref `components/nav-bar.html`, `specs/navigation-bar.html`
- Capsule 284 × 64, radius 32, inset 16 from the left and bottom (+ safe area). Surface at 90% opacity + 20 blur (expo-blur), 1 px hairline, shadow (light only).
- 4 tabs, each 68 × 52. Icon 22 over label 11/13. The active indicator is a 68 × 52 pill, radius 26, accent-soft, 5 pt inset.
- Report action: separate 64 pt accent circle, 10 pt right of the capsule, plus icon 26, on-accent colour.
- States: default (text-3, 500), active (accent text in light / text in dark, 600, stroke 2.1), pressed (scale 0.90), focus (2 pt accent ring).
- Motion: indicator slides 420 ms glide. Colour 200 ms. Scrolling down > 24 pt compacts the bar to 52 high with labels hidden (160 ms); scrolling up restores it (240 ms).
- A11y: `accessibilityRole="tab"`, selected state; Report button label "Report a hazard". Light haptic on tab change, medium on Report.

### 5.2 Button · ref `specs/buttons.html`
| Size | Height | Pad X | Radius | Text |
| --- | --- | --- | --- | --- |
| L | 52 (56 for the single main CTA on a sheet) | 20 | 16 (18 at 56) | 16 / 600 |
| M | 44 | 16 | 14 | 14 / 600 |
| S | 36 | 12 | 18 (pill) | 13 / 600 |
- Variants: **primary** (accent / on-accent), **secondary** (surface + 1 px border), **tonal** (surface-2), **text** (accent text), **danger** (danger-soft + danger text; Sign out uses surface + danger text).
- States: pressed (scale 0.97 + one step darker: light `#08574D`, dark `#46B09D`), focus (2 pt accent ring, 2 pt gap), disabled (surface-2 bg, text-3, no shadow), loading (spinner replaces icon/label, width locked).
- One primary per screen or sheet. Labels are verbs in sentence case, max 3 words.

### 5.3 IconButton
- 44 circle. Variants: tonal (surface-2), outline (surface + border), glass (on map: surface + shadow), accent (Avoid, 44 square radius 14).
- Always has `accessibilityLabel`.

### 5.4 Inputs
- **TextField:** 60 high, radius 16, floating label 12/600 above the 16 pt value. Default border 1 px border. Focus 2 px accent (label turns accent). Error 2 px danger, label danger, message below with alert icon (13 pt, danger).
- **PasswordField:** same, plus a 44 eye toggle on the right.
- **SearchField:** pill 56 (Home) or 52 (Map), radius 26–28, search icon 20, optional trailing chip (Work) or avatar.
- **DetailField** (Report): 56 high, radius 20, single line, max 300 characters.

### 5.5 Chips, tags, badges
- **FilterChip:** 36 high, radius 18, 13/600. Selected uses the inverse colours (text bg, background text). Chip rows scroll horizontally and bleed off the right edge.
- **SegmentedControl:** track surface-2, radius full, 3 pt inset. Selected segment is surface + small shadow.
- **SimulatedTag:** 20–24 high, 1 px **dashed** text-3 border, 11/600 text-2. Text: "Simulated" (or "Test data" on auth).
- **TierBadge:** 6 vertical bars (3 wide, heights 4 → 14, 2 gap). The first *n* bars are accent, the rest are border. Then "L*n*" 12/600. Pill surface-2 26 high when standalone.
- **LiveDot:** 6 dot accent + time text, e.g. "● 09:42".
- **FreshnessChip:** warning-soft pill, "28 min ago" 12/600.

### 5.6 Cards and rows
- **Card:** surface, 1 px border, radius 20–24, padding 16–18.
- **HeroCard** (commute, active journey): `hero` background in both themes, radius 28, padding 20–22, white type, accent `#5CCFBB` (dark `#56C7B3`), warn `#F2B163`. Inner tiles `rgba(255,255,255,.06)`.
- **StatTile:** 88 high, radius 20, value 24/650 + label 12/500. The "On your route" tile uses warning-soft background and warning value.
- **ListGroup:** card with rows separated by 1 px border. Row height 58–68, 16 padding, 34–40 icon tile radius 10–12, chevron 16 text-3.
- **IncidentRow:** category tile (colour per category) + title 15/600 + meta "Category · age · distance" 13 text-3 + TierBadge + chevron.
- **IncidentCard** (map sheet carousel): 300 wide, radius 22. Header row, 2-line description, actions [Still there · n] tonal (flex), [Cleared] secondary, [Avoid] accent icon button. 10 gap, next card peeks.
- **ConfirmPrompt:** card with category tile, question "Still flooded at Jyothi?", meta, dismiss ×, two tonal buttons Yes / Cleared (48 high). Shown only for reports the user passed in the last 30 min.

### 5.7 Sheets, menus, feedback
- **MapSheet** (non-modal): radius 28 top, handle 36 × 5. Snap points: peek 132, half (default as drawn), full (64 pt of map stays visible). Map controls ride the sheet edge and hide above half.
- **ModalSheet** (Report, Place picker, Demo accounts): radius 32 top, scrim (light `rgba(18,22,25,.36)`, dark `rgba(0,0,0,.55)`). Swipe down or × to dismiss.
- **Menu** (Home ⋯): 240 wide, radius 20, items 44 high radius 12 with icon 18 + 15/500 text. Divider before the legal group. Appears with 160 ms fade + scale from 0.96, anchored top right.
- **Toast:** surface, radius 16, 52 high, bottom 112 pt (above the nav), rises 16 pt + fades in 240 ms, stays 4 s, optional action (Undo).
- **Banner:** warning-soft card, title 14/600 warning, body 13, optional M button.

### 5.8 States (use on every data screen)
| State | Pattern | Copy |
| --- | --- | --- |
| Loading | Skeleton: surface-2 blocks matching the final layout, no spinner on maps | none |
| Empty | Card: 40 icon tile, title 15/600, body 13 text-2, one secondary button | "No reports here" / "Nothing reported in this area in the last 3 hours." / "Clear filters" |
| Error | Same card, danger icon tile | "Couldn't update" / "The traffic service didn't respond. Showing the last data." / "Try again" |
| Offline | Banner pinned under the header | "You're offline · showing data from 09:42" |
| Location off | Card, warning icon tile | "Location is off" / "Pick a nearby junction instead. No GPS needed." / "Pick a junction" |

### 5.9 Controls
- **Switch:** 52 × 32 (46 × 28 inline), thumb 26, on = accent, off = border.
- **Radio:** 20 circle; selected = 6 pt accent ring on surface.
- **Checkbox:** 20 square radius 6.

### 5.10 Map layer · ref `components/map.html`
- Real map: OpenStreetMap tiles (MapLibre). Map styling: light land `#F2F3F0`, water `#CFE0E9`, park `#E1EADB`, roads white with `#DDE0DA` casing, labels `#6B757E`. Dark land `#121618`, water `#0C1B22`, park `#142019`, roads `#1F2528` / majors `#343C41`, labels `#7C878E`.
- **Category pin:** teardrop 24 × 31, category colour fill, 2 pt surface stroke, white glyph. Selected pin: scale 1.3 with pop easing + soft shadow.
- **You:** 18 accent dot, 3.5 pt border, 16% heading cone.
- **Route:** main 7 pt accent with 12 pt casing; alternative 5 pt grey. Time bubbles 62 × 26 radius 13 (main accent, alternative surface + border).
- **Traffic:** slow = warning, stopped = danger overlay on the road segment, 5 pt.
- **Controls:** vertical stack (layers / locate) in one 44-wide pill, glass style.
- **Attribution** "© OpenStreetMap" always visible, 10 pt, bottom left above the sheet.

### 5.11 Logo animation · ref `screens/01-loading.html`, `logo/trafficsense-logo-animated.svg`
Build with Reanimated (or export to Lottie). Tile 136 pt, radius 32. Timeline in ms:

| Part | Start | Duration | Motion |
| --- | --- | --- | --- |
| Tile | 0 | 900 | From translateY 26, rotateX 42°, rotateZ −8°, scale 0.55 → rest; easing `(.34,1.4,.64,1)`; perspective 640 |
| Green hill | 220 | 700 | Slide from −22 px, `(.22,1,.36,1)`; then sway ±1.6 px, 4 s loop |
| Blue hill | 280 | 700 | Slide from +22 px; sway loop |
| Road edge (white) | 340 | 700 | Stroke draws bottom → top, `(.65,0,.35,1)` |
| Road | 430 | 700 | Same draw |
| Lane dashes | 1050 | loop 800 | Dash 5/6 flows toward the viewer |
| Pin fall | 900 | 720 | From −74 px stretched (0.88, 1.16), gravity ease-in; lands at 45% squashed (1.22, 0.76); one 11 px bounce; settles |
| Ripples | 1224 / 1404 | 900 | Two rings scale 0.3 → 2.8, fade out |
| Headlight | 1300 | loop 1600 | Small light travels up the road |
| Name | 1250 | 560 each, 30 ms stagger | Letters rise 18 px with 6° tilt; "Traffic" text colour, "Sense" brand blue (`#1683E8` light / `#4BA6FF` dark) |
| Tagline | 1750 | 900 | Fades in while letter-spacing tightens 0.42em → 0.16em |
| Pin hop (loop while loading) | 2500 | loop 1800 | Crouch → jump 21 px with a full Y spin → squash → settle; shadow shrinks mid-air; ripple on landing |
| Exit to Welcome | on ready | 640 | Zoom 9× centred on the pin (75.8%, 35%), ease-in `(.7,0,.84,0)`; name fades 160 ms; Welcome rises in behind |
Minimum display 1.8 s (one full build), maximum until data is ready. Returning users skip Welcome.

---

## 6. Screens

For each screen: reference file, layout top → bottom, states, behaviour.

### 6.1 Loading · `screens/01-loading.html`
Centred logo animation (5.11), name and tagline "SAFER ROADS · SMARTER COMMUTES", "Mangaluru" 12 text-3 at 56 from the bottom. No progress bar, no buttons.

### 6.2 Welcome (first launch only) · `screens/02-welcome.html`
Header: icon 32 + "TrafficSense" 16/650, "Sign in" link right. Map card 420 high, radius 32, route scene with a "Flooding · Jyothi Circle" chip and a bottom card "18 min to Bejai · Avoids 1 report · arrive 10:32". Title "Know the road / before you go." 34/38. Body 16/23. Primary L-56 "Plan my route →" (→ Home). Text button "Explore the live map" (→ Map). Legal line "Terms · Privacy · Licenses".

### 6.3 Home · `screens/04-home.html`
1. Header: "Thursday · Mangaluru · 27°" (caption) + "Good morning" (display). Right: ⋯ menu button (44, surface) + avatar 44 (accent-soft, initial).
2. SearchField 56 "Where to?" + Work chip.
3. Commute HeroCard: "To work · Pumpwell Circle" + "via Kadri bypass"; "18 min" hero-number; "Arrive 10:32" + "+2 min than usual" (warn); route bar (accent / warn / accent segments with start ring and end dot) + labels; buttons "Start journey" (accent-filled) and "2 routes" (outline → Plan). Hidden when no Work place is saved; show a card "Add your work place" instead.
4. StatTiles ×3: Reports nearby, On your route (warning tint), High tide (hidden when there's no alert).
5. ConfirmPrompt (conditional).
6. "Around you" title + LiveDot time + SimulatedTag + "Open map" link; mini map 168 high, radius 24, with a "3 reports within 2 km" chip; ListGroup of IncidentRows (max 3).
7. Footer: lock + "Location is used only when you report", links Privacy · Terms · Licenses · © OpenStreetMap.
States: skeleton for the hero card, tiles and list; pull to refresh; offline banner.

### 6.4 Live map · `screens/05-live-map.html`
SearchField 52 with avatar; FilterChip row (All · n, Flooding, Traffic, Closures, Road works); status pill "● Updated 09:42" + SimulatedTag; map controls pill; attribution; MapSheet with "Nearby · 3 reports" + Map/List segmented, IncidentCard carousel with page dots. List mode replaces the carousel with IncidentRows. Tapping a pin selects it and scrolls the carousel to it (300 ms).

### 6.5 Plan route · `screens/06-plan-route.html`
Floating From/To card (dotted connector, swap button). Map route scene with time bubbles. Locate button. MapSheet: "Routes" + "Leave now ▾" chip + bus toggle icon; two route tiles (selected: 2 pt accent border + accent-soft); "Arrive 10:32 · via Kadri bypass" + SimulatedTag "Corridor model"; traffic-on-route bar (accent / warn / accent) with labels; warning row "Flooding at Jyothi Circle · L3 ›"; "Start journey" L + save icon button 52.

### 6.6 Place picker · `screens/07-place-picker.html`
ModalSheet from top 96: "Choose start" + ×; SearchField with focus ring; "Use my location" row (accent); "JUNCTIONS" label; rows 64 with pin tile, name, coordinates (tabular). The opposite field's value shows disabled at 45% with "Already set as destination". Selected row shows a 24 accent check.

### 6.7 Report · `screens/08-report.html` (requires sign-in)
**Compose** (ModalSheet over the map; a "Report here" chip above the accent pin):
"What's happening?" title + ×; category grid 3 × 2 of 64 circles (selected = accent fill, on-accent icon, 4 pt accent-soft ring, label 600); location row 64 ("Near Jyothi Circle · Your location · asked only now" + "Change" → Place picker); DetailField + photo button 56 (dashed border, camera + "L5"); trust line (TierBadge bars at L1 + "Starts as a single report. Rises as others confirm."); "Send report" L-56.
- Send is disabled until a category is picked. Location permission is requested **only when Send is pressed**. If denied → Location off state inside the sheet.
- **Sending:** button shows spinner, width locked.
- **Sent:** the sheet content swaps (fade 160 ms): 88 check circle (pop 520 ms, check stroke draws 360 ms, ring pulse); "Report sent" title 26; "Flooding near Jyothi Circle · thank you"; card with L1 badge "Visible to nearby commuters · Trust rises as others confirm it"; "View on map" L-56 (→ Map, pin selected); text buttons "Done" and "Undo · 10 s" (countdown, then hides). The pin chip becomes "Your report".
- **Guest:** the sheet shows the warning Banner "Sign in to send reports" + "Sign in" (→ Sign in, next=report).

### 6.8 Sign in · `screens/09-sign-in.html`
Back; centred icon 56 + "Welcome back" + "Sign in to report and confirm hazards."; Google button (official artwork, 52); divider "or with email"; Email TextField; PasswordField; row with error message (left, hidden by default) + "Forgot password?" (right); "Sign in" L; "New here? Create account". Bottom: "Try a demo account" dashed row (non-production only → Demo sheet), "Continue as guest" text button, legal line.
- Error state: password field danger border and label, message "Wrong email or password". Keep the email value. Clear the error on edit.
- Loading: Sign in button spinner; inputs disabled.
- **Demo sheet** (ModalSheet): title "Demo accounts" + Test data tag; ListGroup rows (avatar initial 34, "Commuter · Primary", email 12 text-3, chevron) for Commuter, Commuter B, Traffic Authority, Employer A.
- **Forgot password** (push screen, same layout as Create account): title "Reset password", body "We'll email you a link.", Email TextField, "Send link" L; success Banner (accent-soft) "Check your email".

### 6.9 Create account · `screens/10-create-account.html`
Same layout as Sign in: Google button, Email (focused), Password with a 4-segment strength meter + "At least 12 characters", "Create account" L, "Have an account? Sign in", legal line.

### 6.10 Me · `screens/11-me.html`
"Me" title; profile row (avatar 56, email, "Verified commuter" with shield-check in accent); groups: ACTIVITY (Journeys · Beta), SETTINGS (Appearance · System, Location · When reporting), ABOUT (Privacy policy, Terms of use, Open-source licenses, Map data · OpenStreetMap); "Sign out" (danger text, L, surface).

### 6.11 Journeys · `screens/12-journeys.html` (requires sign-in)
Back + SimulatedTag; "Journeys" title; active journey HeroCard: pulsing "On the road · 12 min" (accent dot pulse 1.6 s) + "Started 10:14"; route "Pumpwell → Hampankatta" 20/650 + corridor name; progress bar 6 pt with a 16 pt position knob and end labels; tiles Arrive / Delay (warn when late); "End journey" outline (confirm dialog before ending). Share row card: briefcase tile, "Share with your employer", "Corridor status only · never GPS", Switch. History: "THIS WEEK" + "Avg 26 min"; rows 68: date block (day 16/650 + month 10/600), title, delay line (warning when late, "On time" text-3), duration right.
- No active journey: replace the HeroCard with a card "No active journey" + "Start from Plan" (secondary → Plan).
- Not in an organisation: hide the share row; show caption "Join your organisation to share status."
- Turning sharing on the first time opens a consent ModalSheet (what is shared, an explicit checkbox, "Share").

### 6.12 Authority (Ops) · `screens/13-authority.html`
"Control room" + "L6 · Municipal ops"; refresh button; dismissible warning banner "2 reports need review"; segmented Active · n / History; incident cards with TierBadge and actions "Confirm L6" (primary, flex), "Resolve" (secondary), "Reject" (secondary, danger text; confirm dialog); "Recent actions" list.

### 6.13 Privacy & legal · `screens/14-privacy-legal.html`
Back; title; "How TrafficSense handles your data."; accent-soft card with three promises (navigation / camera / lock icons); ListGroup: Privacy policy, Terms of use, Open-source licenses, Map data (external link icon), Your data (copy or deletion request); "TrafficSense · Version x.y.z" footer. The Home ⋯ menu shows Settings, Help & feedback, divider, Privacy policy, Terms of use, Licenses.

---

## 7. Copy rules
- Sentence case everywhere. No exclamation marks. Verbs on buttons.
- Times are 24-hour (10:32). Durations "18 min". Distances "350 m" / "1.6 km".
- Category names: Accident, Closed, Traffic, Flooding, Road works, Other.
- Never claim live data when it is simulated. Never imply background tracking.

## 8. Accessibility checklist (required)
- Contrast ≥ 4.5:1 for text, ≥ 3:1 for large text and icons (the tokens already meet this; don't lighten them).
- Every icon-only control has `accessibilityLabel`. Tabs, radios, switches and checkboxes expose role and state.
- Dynamic type: layouts must hold at 130%. Allow 2-line wrapping on titles and buttons.
- Focus order follows visual order. Sheets trap focus and return it on close.
- Reduce motion respected (section 2).
- Colour is never the only signal: tier bars plus "L3", category icon plus label, error colour plus message.

## 9. Do not
- Do not add gradients (except inside the logo), glows, glassmorphism beyond the nav bar blur, neon or purple.
- Do not add new colours, fonts, shadows, radii or icon sets.
- Do not put more than one primary button on a screen or sheet.
- Do not use full-width old-style tab bars, raised centre FABs or hamburger menus.
- Do not remove SimulatedTags or the OpenStreetMap attribution.
- Do not show demo accounts in production.
- Do not request location before the user presses Send (Report) or "Use my location".

## 10. File map
| Need | Open |
| --- | --- |
| Pixel reference per screen | `screens/*.html` |
| Nav bar behaviour | `components/nav-bar.html`, `specs/navigation-bar.html` |
| All small components and states | `components/components-and-tokens.html` |
| Button sizes and states | `specs/buttons.html` |
| Spacing, radius, type | `specs/spacing-radius-type.html` |
| Motion | `specs/motion.html`, section 5.11 |
| Logo | `logo/` |
| Tokens | `tokens/tokens.json`, `tokens/tokens.css` |
