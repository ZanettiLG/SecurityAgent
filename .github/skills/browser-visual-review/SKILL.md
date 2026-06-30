---
context: fork
name: browser-visual-review
description: >
  Use when you need a visual critique of a rendered page, a screenshot review,
  or a comparison against a reference image. This skill focuses on identifying
  UX issues, missing elements, spacing problems, poor hierarchy, and visual
  mismatch.
applyTo: "**/*"
---

# Browser Visual Review

Use this skill when the task is not just to navigate, but to judge whether a
page looks right.

## When to Use

- Comparing a live page against a reference mockup or screenshot
- Reviewing whether the layout is visually close to a target
- Identifying issues such as alignment, spacing, contrast, hierarchy, or density
- Generating improvement suggestions for a UI implementation

## Review Criteria

Evaluate the page on:

- layout structure and section order
- alignment and spacing consistency
- visual hierarchy and emphasis
- text readability and contrast
- component proportions and balance
- completeness compared to the reference

## Review Output

Return a result in this shape:

```text
Status: similar / partially similar / different

Strengths:
- The overall composition is close to the reference.

Issues:
- The hero section is too compressed.
- The CTA is less prominent.

Suggested improvements:
- Increase spacing around the hero.
- Make the main action button larger and higher contrast.
```

## Notes

- Use this skill either with screenshots or with a browser snapshot plus visual
  reasoning.
- If the reference is only approximate, focus on the important differences and
  likely improvement areas rather than pretending to be exact.
- If the page is dynamic or requires interaction to reveal the real state, note
  that explicitly.
