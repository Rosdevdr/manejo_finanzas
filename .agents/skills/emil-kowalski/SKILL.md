---
name: emil-kowalski
description: "Emil Kowalski's interaction design, micro-interactions, animation craft, and physics motion philosophy. Encompasses emil-design-eng, animate, review-animations, apple-design, and animation-vocabulary."
---

# Emil Kowalski - Design Engineering & Motion

Collection of skills and design philosophy from Emil Kowalski for building software that feels alive, physical, and crafted down to the sub-pixel.

## Key Principles

1. **Taste is trained, not innate**: Good taste is recognizing what elevates. Study Why great UI feels good. Reverse engineer interactions.
2. **Invisible details compound**: The micro-adjustments in layout shift, hover states, pressed active states, and sound cues combine to produce something extraordinary.
3. **Motion follows physics, not math timers**: Never use linear or abrupt easing curves for interactive elements. Use spring mechanics (`stiffness: 400`, `damping: 30`) or custom fast-out-slow-in curves (`cubic-bezier(0.16, 1, 0.3, 1)`).
4. **Immediate touch feedback**: 0ms touch feedback on pointer down. Instant active scale `transform: scale(0.98)` or background shift before network requests.
5. **No layout thrashing**: Avoid animating `width`, `height`, `top`, or `margin`. Always animate GPU-accelerated `transform` and `opacity`.

## Included Playbooks

- `emil-design-eng`: Core design engineering philosophy and craft playbook.
- `animate`: Decision trees for animations (purpose, curve, duration, interruptibility, exit).
- `review-animations`: In-depth critique and audit of existing motion in components.
- `apple-design`: Fluid gestures, sheets, translucent materials, and momentum transitions.
- `animation-vocabulary`: Precise interaction terminology.
- `improve-animations`: Prioritized motion upgrade roadmap.
