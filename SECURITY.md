# Security Policy

## Supported scope
This repository is a portfolio/demo project, but security issues are still welcome.

## Reporting a vulnerability
Please do **not** open public issues for sensitive security findings.

Instead, report privately by contacting the repository owner directly (email in GitHub profile), and include:
- affected area (route/file)
- impact summary
- reproducible steps
- suggested remediation (if available)

## Response expectations
- Initial acknowledgment target: within 7 days
- Triage and remediation timing: best effort based on severity and availability

## Security best practices for contributors
- Never commit secrets (`.env`, tokens, credentials).
- Use placeholders in docs/examples.
- Prefer server-side auth checks and `httpOnly` cookies.
- Validate and sanitize user inputs in API routes.
