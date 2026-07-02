# Moving the Lumber Calculator to claude.ai/design — Steps

You'll do this in the browser at **https://claude.ai/design**. Nothing to install.

## What's in this folder
- `DESIGN_PROMPT.md` — the prompt to paste in (the main thing)
- `DESIGN_SPEC.md` — exact colors/type/screens to attach for higher fidelity
- `STEPS.md` — this file
- (optional) a screenshot of the current app — attach if you have one

## Steps

1. **Open** https://claude.ai/design and start a new design.

2. **Grab the prompt.** Open `DESIGN_PROMPT.md`, copy everything inside the box
   (from "Design a mobile-first web app…" down to the end). Paste it as your
   first message.

3. **Attach the spec (recommended).** Add `DESIGN_SPEC.md` as an attachment in
   the same message. It locks in the exact hex colors, type sizes, and the
   example values for each screen, so the result matches the real app closely.

4. **Attach a screenshot (optional but powerful).** If you take a screenshot of
   the working app (open `index.html` on your phone or computer), attach it too
   and add one line: "Match the layout and proportions in the attached
   screenshot." This gives the best fidelity.

5. **Generate**, then preview on the phone-width view. It should show the
   Board Feet screen first with the green header and 6-tab bottom bar.

6. **Iterate** using the refinement prompts below — one change per message works
   best.

7. **Share / save.** Use the share button in claude.ai/design to get a link, or
   export, depending on what the tool offers that day.

## Refinement prompts (paste one at a time as needed)

- "Make the result number bigger and bolder, and add more breathing room above
  and below the result card."
- "The tab bar feels cramped — increase spacing between tabs and make the active
  tab's green top border more obvious."
- "Tighten the Board Feet line items: the four small fields should sit on one
  row on a 390px screen without wrapping; shrink labels if needed."
- "Add a subtle pressed/active state to the Copy button and the preset pills."
- "Show all six screens as separate frames side by side so I can review them at
  once."
- "Increase contrast on the gray sub-text so it passes WCAG AA on the
  light-green result card."
- "Add the amber 'double-check your inputs' warning strip to the Load Estimator
  screen as an example."

## Going from the design back to a real app

claude.ai/design produces a visual design, not the production PWA. When the look
is locked, you have two easy paths:

- **Keep the working app, restyle it:** tell me "apply the new claude.ai/design
  look to the existing index.html / styles.css" and I'll port the visual changes
  into your real, functioning files (all the math, toggles, and offline support
  stay intact).
- **Start fresh from the design:** paste the generated design code back here and
  I'll wire up the live calculators on top of it.

Recommended: keep your current working app as the source of truth and have me
restyle it to match — that way you never lose the verified formulas.
