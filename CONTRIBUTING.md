# Contributing Guidelines

Thanks for your interest in improving this project.

## Development workflow
1. Create a feature branch.
2. Make focused changes with clear commit messages.
3. Run local checks before pushing:
   ```bash
   npm run build
   ```
4. Open a PR with:
   - what changed
   - why it changed
   - how it was tested

## Code expectations
- Keep changes small and reviewable.
- Preserve existing coding style and TypeScript strictness.
- Avoid introducing hardcoded credentials or sensitive information.
- Prefer environment variables for any configuration that might be private.

## Documentation
If you change setup, auth, deployment, or user flow behavior, update documentation in the same PR.

## Pull request checklist
- [ ] No secrets committed
- [ ] Build succeeds locally
- [ ] Docs updated (if behavior/config changed)
- [ ] Screenshots added for meaningful UI changes
