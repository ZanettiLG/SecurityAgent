---
context: fork
name: browser-layout-analysis
description: >
  Use when you need to understand the structure of a rendered UI, extract the
  important layout information from a page, or compare a page against a reference
  or design target. This skill combines DOM/CSS evidence with screenshots and
  produces actionable findings.
applyTo: "**/*"
---

# Browser Layout Analysis

Use this skill for tasks where the browser is not just a clicker, but a visual
and structural analyst.

## When to Use

- Understanding the layout of a page before editing or reproducing it
- Extracting regions, hierarchy, spacing, and component relationships
- Comparing a rendered page to a mockup, reference image, or target design
- Detecting layout regressions, broken alignment, or missing sections
- Reviewing a UI for quality, consistency, or visual similarity

## Recommended Workflow

### 1. Gather Evidence

Collect the strongest signals available:

- Screenshot of the current page or target region
- DOM structure and visible text
- Accessibility tree or semantic landmarks if available
- Computed styles such as spacing, alignment, typography, and size

Prefer DOM/CSS evidence first for most web pages. Use vision-based analysis
only when the page is ambiguous, highly visual, or dynamic.

### 2. Build a Layout Model

Produce a structured summary of the page with:

- top-level regions: header, hero, sidebar, content, footer
- important components: buttons, cards, forms, tables, navigation
- visual hierarchy: what stands out first, what is secondary
- spacing and alignment: margins, padding, grid behavior, consistency
- interaction intent: primary action, content flow, expected path

### 3. Compare Against a Reference

If a reference exists, compare the current page against it on:

- structure and section order
- alignment and spacing
- hierarchy and prominence
- content presence and completeness
- responsiveness and density

### 4. Report Findings

Return findings in a concise but structured format:

- What is present and what is missing
- What looks visually similar or different
- What seems broken, crowded, or misaligned
- What should be improved first

## Output Shape

Use a format like this:

```text
Summary:
- The page has a header, a hero section, and a content grid.
- The main CTA is visible but visually weaker than the reference.

Key Regions:
- Header: top navigation, logo, 3 links
- Hero: title, subtitle, primary button
- Content: 3 cards in a vertical stack

Issues:
- Spacing between hero elements is tighter than the reference.
- The primary button is lower contrast than expected.
- The content area is slightly too dense.

Recommendations:
- Increase vertical spacing around the hero.
- Strengthen CTA prominence.
- Reduce card density or add more spacing.
```

## Caveats

- For most websites, DOM/CSS + screenshot is enough.
- For games or highly animated interfaces, vision-first assessment may be
  necessary because the visual state is harder to infer from markup alone.
- If the evidence is incomplete, say so instead of guessing.
