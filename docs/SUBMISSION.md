# Soroban browser diagnostics with real deployed-WASM inspection

Prepared October 8, 2026 for same-day Stellar Wave application.

## Implemented utility

Searchable error catalog and RPC workbench. ABI inspection fetches actual deployed WASM after checking network identity. Auth inspection decodes real authorization entries; simulation and batch tabs query user-provided inputs rather than returning fixed successes.

## Reproduce and evidence

Node 22+; npm ci, npm test, npm run build. Five decoder/spec tests passed October 8. Fresh live ABI observation is recorded in docs/live-abi-2026-10-08.json when available.

## Supported scope

Signatures remain unverified. Unknown transaction observations remain unknown. Storage activity is not TTL or archival verification. Existing deployed UI does not include these repairs until its reviewed changes are merged and deployed.

## Maintainers and application

Maintainers xteesamz and EthTobi were owner-confirmed across these project families; contact through GitHub, available anytime. Follow CONTRIBUTING.md and SECURITY.md (or organization defaults). Review the preparation PR and its CI before using its final revision in the application. Engineering issues and draft complexity do not establish Wave enrollment. No application has been submitted by this work.
