# Wave engineering backlog

Drafted October 8, 2026 against current implementation. These are proposed contributor tasks, not Wave enrollment or earned points. Complexity requires maintainer review in the app.

## 1. Add browser acceptance for real ABI and auth inspection

## Context

Verify actual method names, invalid XDR, wrong network and visible unavailable-RPC states; capture desktop/mobile screenshots and stale-result behavior.

## Acceptance criteria

- Implement and document the specific behavior above.
- Cover positive, negative and unavailable-input cases appropriate to the change.
- Pass the repository documented build/test checks and required CI.
- Preserve exact identities/amounts and uncertain evidence outcomes.

## Relevant files

src/components/AbiInspectorTab.jsx, src/components/AuthCheckerTab.jsx

## Proposed complexity

medium; planning only. Actual Wave complexity and enrollment are set by maintainers in the Drips app.

## Contribution

Open a focused feat/fix/test/docs branch. PRs explain behavior and actual validation and include Closes #<issue_id>. Follow CONTRIBUTING.md and SECURITY.md.

## 2. Validate batch response identity and stale requests

## Context

Prevent old network/input results from replacing newer ones; reject mismatched returned hashes and preserve unknown counts on unavailable providers.

## Acceptance criteria

- Implement and document the specific behavior above.
- Cover positive, negative and unavailable-input cases appropriate to the change.
- Pass the repository documented build/test checks and required CI.
- Preserve exact identities/amounts and uncertain evidence outcomes.

## Relevant files

src/components/BatchInspectorTab.jsx, src/utils/stellarRpc.js

## Proposed complexity

medium; planning only. Actual Wave complexity and enrollment are set by maintainers in the Drips app.

## Contribution

Open a focused feat/fix/test/docs branch. PRs explain behavior and actual validation and include Closes #<issue_id>. Follow CONTRIBUTING.md and SECURITY.md.

## 3. Replace synthetic transaction presets with reviewed captures

## Context

Use real public synthetic Testnet captures or label fixtures as offline; never present invented hashes as successful live observations.

## Acceptance criteria

- Implement and document the specific behavior above.
- Cover positive, negative and unavailable-input cases appropriate to the change.
- Pass the repository documented build/test checks and required CI.
- Preserve exact identities/amounts and uncertain evidence outcomes.

## Relevant files

src/components/LiveStudio.jsx

## Proposed complexity

medium; planning only. Actual Wave complexity and enrollment are set by maintainers in the Drips app.

## Contribution

Open a focused feat/fix/test/docs branch. PRs explain behavior and actual validation and include Closes #<issue_id>. Follow CONTRIBUTING.md and SECURITY.md.

## 4. Implement actual storage entry TTL inspection

## Context

Query requested contract storage/TTL ledger keys, distinguish live/archived/unavailable state and test before claiming a TTL auditor.

## Acceptance criteria

- Implement and document the specific behavior above.
- Cover positive, negative and unavailable-input cases appropriate to the change.
- Pass the repository documented build/test checks and required CI.
- Preserve exact identities/amounts and uncertain evidence outcomes.

## Relevant files

src/utils/stellarRpc.js, src/components/LiveStudio.jsx

## Proposed complexity

high; planning only. Actual Wave complexity and enrollment are set by maintainers in the Drips app.

## Contribution

Open a focused feat/fix/test/docs branch. PRs explain behavior and actual validation and include Closes #<issue_id>. Follow CONTRIBUTING.md and SECURITY.md.

## 5. Decode diagnostic-event XDR structurally

## Context

Use supported XDR types rather than printable-byte heuristics; reject malformed entries and preserve contract/topic/value identity with fixtures.

## Acceptance criteria

- Implement and document the specific behavior above.
- Cover positive, negative and unavailable-input cases appropriate to the change.
- Pass the repository documented build/test checks and required CI.
- Preserve exact identities/amounts and uncertain evidence outcomes.

## Relevant files

src/utils/stellarRpc.js

## Proposed complexity

high; planning only. Actual Wave complexity and enrollment are set by maintainers in the Drips app.

## Contribution

Open a focused feat/fix/test/docs branch. PRs explain behavior and actual validation and include Closes #<issue_id>. Follow CONTRIBUTING.md and SECURITY.md.

## 6. Document RPC endpoints and hosted revision

## Context

Record public deployment revision and endpoint availability, known CORS/network limits and exactly which accepted repairs the hosted UI contains.

## Acceptance criteria

- Implement and document the specific behavior above.
- Cover positive, negative and unavailable-input cases appropriate to the change.
- Pass the repository documented build/test checks and required CI.
- Preserve exact identities/amounts and uncertain evidence outcomes.

## Relevant files

README.md, docs/

## Proposed complexity

trivial; planning only. Actual Wave complexity and enrollment are set by maintainers in the Drips app.

## Contribution

Open a focused feat/fix/test/docs branch. PRs explain behavior and actual validation and include Closes #<issue_id>. Follow CONTRIBUTING.md and SECURITY.md.
