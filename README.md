# TrapTrace Soroban error explorer

A browser workbench for searching Soroban errors and inspecting Stellar RPC observations. The catalog contains 35 structured diagnostic entries with reproduction guidance and suggested fixes.

## Implemented workflows

- Transaction lookup through RPC and Horizon; absent or unavailable observations remain unknown.
- Transaction-envelope simulation with real RPC responses and visible failures.
- Deployed-WASM ABI inspection: verify network identity, fetch requested contract WASM, and decode declared functions with Stellar SDK.
- Structural authorization-entry inspection: decode actual signers and invocation trees; signature validity, nonce, expiry and acceptance remain unverified.
- Batch lookup of 1–20 transaction hashes with successful, failed and unknown counts.
- Local heuristic Rust source linting, resource estimates and suggested test/fix templates.
- Contract event polling and current-ledger lookup. The storage activity panel does not establish storage TTL or archival status.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run dev
```

Node 22+ is required. `npm test` runs real authorization/spec regression tests independently from the production build. Pull-request CI tests and builds; the main-branch workflow deploys accepted changes to GitHub Pages.

Testnet, Mainnet and Futurenet endpoints are configured in src/utils/stellarRpc.js. Endpoint availability varies; network failures are surfaced. Catalog matching is a diagnostic suggestion, not proof of causation. Historical catalog verification flags have been cleared until the named failures are reproduced; generic malformed-XDR rejection and network health do not establish verification.

## Submission and review

See [the submission brief](docs/SUBMISSION.md), [backlog](docs/WAVE_BACKLOG.md), CONTRIBUTING.md, MAINTAINERS.md and SECURITY.md. The existing hosted version remains separate from these repairs until merge and deployment. Review actual RPC observations and the final CI revision before describing live functionality. No adoption, audited security or production readiness is implied.
