# TrafficSense — design files

**Start with `BUILD_SPEC.md`.** It defines every component, screen, state and animation, and the rules for building them. The HTML files are the pixel reference.

Every screen and component of the redesign as its own file. Open `index.html`
in a browser to browse everything, or open any single file directly. No build
step and no install. Files work offline, except the Inter font, which loads from
Google Fonts.

## Folders

| Folder | What's inside |
| --- | --- |
| `screens/` | One file per app screen, light and dark side by side: loading, welcome, launch-flow prototype, home, live map, plan route, place picker, report, sign in, create account, me, journeys, authority, privacy & legal |
| `components/` | Navigation bar (tap the tabs), map in every scene and theme, components & tokens sheet (colours, type, buttons, inputs, chips, menu, states, icons) |
| `specs/` | Navigation bar, buttons, spacing/radius/type, motion— measurements and timings for development |
| `logo/` | `trafficsense-logo-animated.svg` (the loading animation, plays on its own), `trafficsense-logo.svg` (static vector), original icon PNG |
| `tokens/` | `tokens.css` (CSS variables, light + dark) and `tokens.json` (colours, spacing, radius, type, motion, sizes) |
| `runtime/` | `ts-runtime.js`, the small script that renders the HTML files. You don't need it in the app |
| `assets/` | App icon used by the screens |

## Interactive files

- `components/nav-bar.html`: tap tabs, and the indicator slides (420 ms, `cubic-bezier(.32,.72,0,1)`)
- `screens/03-launch-flow.html`: loading → welcome → tap "Plan my route" → home, with Replay and theme toggle
- `screens/01-loading.html`: Replay the logo animation
- `screens/04-home.html`: tap ⋯ for the menu (Settings, Help, Privacy policy, Terms, Licenses)
- `screens/03-launch-flow.html`: also shows the zoom-through-the-pin exit from loading to Welcome
- `specs/buttons.html`, `specs/motion.html`: press states, loading button, sheet / pin / card demos

## Building the real app (React Native / Expo)

- Colours, spacing, radius, type and motion values: `tokens/tokens.json`
- Exact sizes and timings per component: `specs/`
- Logo animation: CSS keyframes inside `logo/trafficsense-logo-animated.svg` (tile pop 760 ms, road draw 720 ms, pin fall 700 ms, pin hop + spin loop 1.8 s); rebuild with Reanimated or Lottie
- Follow `BUILD_SPEC.md` section 0 (rules) and section 9 (do-not list)
- Placeholders to replace: the "G" on the Google button (use Google's official sign-in button artwork), "Version 1.0.0", and the sample data (reports, times, demo accounts)
- Maps in these files are illustrations. The app keeps its real map (OpenStreetMap; keep the attribution visible)
