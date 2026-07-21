# Pull Request

## 1. Description

Briefly describe what was implemented:

Example:

- Added user authentication
- Fixed issue with session expiration
- Refactored API request handling

If this PR depends on another PR or issue, add it in the **first PR comment** using one of the following formats:

- `Depends on #123`
- `Blocked by #123`

## 2. Type of Change

Select one:

- [ ] Feature
- [ ] Bugfix
- [ ] Refactor
- [ ] Hotfix
- [ ] Release

## 3. How to Test

Clear steps to verify:

Example:

1. Open /login page
2. Authenticate user
3. Verify session is created

If any setup is required before testing, include it here:

- required `.env` variables
- API keys
- local services that must be running
- seed/test data
- external dependencies

Example:

- Set `NEXT_PUBLIC_API_URL`
- Run `docker compose up redis`
- Use test wallet account with balance

## 4. Edge Cases

What has been considered/tested:

Example:

- Invalid input
- Empty state
- API failure

## 5. Potential Risks

What could go wrong:

Example:

- Breaking existing API contracts
- Performance degradation

## 6. UI Changes (if any)

- [ ] None
- [ ] Yes (attach screenshots/videos)

## 7. Technical Details (optional)

- Architecture decisions:
- New dependencies:
- Migrations (DB / API):

# Self-Review Checklist (Required)

> The author must complete this checklist before requesting review.  
> PR will not be reviewed if this section is not filled.

## Code Quality

- [ ] Code reviewed as a reviewer
- [ ] Clear naming
- [ ] No duplication
- [ ] Complex logic simplified

## Functionality

- [ ] Main flow tested
- [ ] Edge cases covered
- [ ] Error handling implemented

## Technical Checks

- [ ] Build passes
- [ ] Lint / format passed
- [ ] Tests pass (if applicable)

## Frontend (if applicable)

- [ ] Responsive
- [ ] Loading / Error / Empty states handled
- [ ] Matches design

## PR Constraints

- [ ] PR ≤ 1000 lines or justified if larger (reason must be described in Description)
- [ ] PR is properly decomposed

## Workflow

- Branch must follow: `feature/*` / `release/*` / `hotfix/*`
- Target branch: `develop` / `main`
- Direct push to `develop` / `main` is not allowed

## Important

- [ ] PR is complete and ready for review (no unfinished work)
- [ ] PR has full description
- [ ] Self-review completed
- [ ] Dependency comment added if this PR depends on another PR or issue

## For Reviewer

Focus areas:

- Architecture
- Code quality
- Performance
- Security
- Logic correctness

## Definition of Done

- [ ] Code review completed
- [ ] All must-fix comments resolved
- [ ] Approval received
- [ ] CI (build/lint/tests) passed

## Merge Rules

- Merge performed by: Lead
- Self-approve: NOT allowed
