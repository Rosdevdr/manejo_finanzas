---
name: antigravity-awesome-skills
description: "Antigravity Awesome Skills repository and installer CLI playbook. Use when discovering, searching, adding, or managing reusable SKILL.md playbooks from sickn33/antigravity-awesome-skills and skills.sh."
---

# Antigravity Awesome Skills

Comprehensive playbook for discovering, installing, managing, and orchestrating over 2,300+ community and professional skills for Antigravity agents from `sickn33/antigravity-awesome-skills` and the `skills.sh` registry.

## Quick CLI Reference

```bash
# Search for skills across the entire awesome-skills registry
npx skills find "<query>"

# List available skills within a specific repository package
npx skills add <owner>/<repo> -l

# Install one or more skills directly to Antigravity project
npx skills add <owner>/<repo> --skill <skill-1> <skill-2> -y --copy

# Install globally to user profile
npx skills add <owner>/<repo> --skill <skill-name> -g -y

# List installed skills in the current project
npx skills list

# Update all project skills to the latest version
npx skills update -p -y
```

## Core Bundled Antigravity Skills

- `antigravity-skill-orchestrator`: Meta-skill that automatically analyzes task requirements, dynamically selects suitable skills, tracks combinations, and prevents skill overuse.
- `antigravity-workflows`: Multi-checkpoint workflows for SaaS MVPs, architecture audits, browser QA, and domain design.
- `antigravity-design-expert`: 3D CSS, spatial UI, GSAP motion, and glassmorphism interface engineering.

## Directory Structure in Antigravity

Skills are stored in `.agents/skills/<skill-name>/SKILL.md` with YAML frontmatter:
```markdown
---
name: <skill-name>
description: <purpose and triggers>
---
```
Antigravity automatically discovers and loads these skills into agent context.
