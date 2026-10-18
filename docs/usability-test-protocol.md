# Usability Test Protocol — Legal Directory & Know Your Rights

JN-12 · EP-06 / EP-07 · Member 3 (IT23665170)

Covers the four screens owned by EP-06 and EP-07: Find Legal Help, Request
Support, Know Your Rights, and a rights category page.

---

## 1. What we are testing

Whether someone who has just experienced a rights violation can, without help:

1. Find an organisation that fits their issue, language and budget.
2. Understand what a rights category covers before opening it.
3. Reach the reporting flow from a rights page.

These follow from the research that shaped the designs: 63% of survey
respondents named long waits and 37% named "not knowing where to look" as
barriers to legal aid, so discovery is the thing under test, not aesthetics.

## 2. Participants

Five participants — enough to surface the majority of usability problems at
this stage, and the number JN-61 budgets for.

Recruit for a spread across:

- At least two who would use Sinhala or Tamil over English.
- At least one aged 45+, since the research flagged low digital confidence.
- No one who has seen the Figma designs.

## 3. Setup

- The app running on a phone, not a laptop — these screens are designed mobile-first.
- Backend running so the directory and rights content load from the database.
- Screen recording only with spoken consent, recorded at the start.
- One moderator, one note-taker.

## 4. Before starting — say this

> This is a test of the app, not of you. If something is confusing, that is
> useful information for us, so please say it out loud. You can stop at any
> time. Nothing you say here is linked to your name.

Then confirm: *"Are you happy for me to record the screen?"*

## 5. Tasks

Give each task verbally. Do not point, and do not name any button.

| # | Task | Success looks like |
|---|------|--------------------|
| 1 | "You were dismissed from work and think it was unfair. Find an organisation that could help you, for free, in your language." | Reaches an org card using the category, cost and language filters |
| 2 | "You have found one. Ask them for help with your case." | Opens Request Support, selects a support type, gives consent |
| 3 | "You are not sure what rights you have at work. Find out." | Reaches Workplace Rights from the directory or the nav bar |
| 4 | "You have read your rights and want to report what happened." | Uses the Report an incident button on the rights page |
| 5 | "Switch the app to Sinhala." | Finds the toggle in the header without prompting |

## 6. What to measure

For each task record:

- **Completed** — unaided / with a hint / not completed.
- **Time** to first correct action.
- **Wrong turns** — every screen opened that was not on the path.
- **Spoken confusion** — quote it verbatim, do not paraphrase.

Plus, at the end, ask each participant:

1. What would you do if none of these organisations fitted your problem?
2. Did anything on these screens make you uncomfortable about your privacy?
3. Was any wording hard to understand? Which?

## 7. Known things to watch for

Flag these specifically, since they are open risks rather than settled design:

- The filter row scrolls sideways. Do participants discover the cost and
  language filters at the end of it, or do they never scroll?
- Do participants read "Verified" as *government approved*? It does not mean that.
- Is the distance in kilometres understood as distance from them, given we do
  not yet ask for their location?
- Sinhala and Tamil are only ~3% translated. Warn participants before task 5 so
  they are not testing an obviously unfinished translation.

## 8. After the sessions

Write up per the S4 findings report: one row per observed problem, with the
number of participants who hit it, a severity (blocks the task / slows it /
cosmetic), and the screen it belongs to. Severity drives what gets fixed in
the S4 polish pass.
