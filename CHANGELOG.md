# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2026-10-04
### Changed
- **Breaking:** Raised the minimum supported Node.js version to `22.12.0` (previously `20.19.0`).
- Updated runtime dependencies to their latest stable releases:
  - `@noble/curves` to `^2.4.0`.
  - `@noble/hashes` to `^2.4.0`.
- Updated development tooling to the latest stable releases, including `vite` 8, `vitest` 5, `eslint` 10, `vite-plugin-dts` 5, and `@types/node` 26. TypeScript is held at `6.0.3`, the latest release supported by the `@typescript-eslint` toolchain.

### Security
- Resolved all `npm audit` findings by upgrading the affected tooling and transitive dependencies:
  - `brace-expansion` to `5.0.12`, addressing quadratic-time expansion and uncontrolled-recursion CPU denial-of-service issues.
  - `@humanfs/node` to `0.16.8`, addressing a symlink-following recursive copy.
  - `vitest`, `@vitest/mocker`, and `@vitest/coverage-v8` to `5.0.3`, addressing a path-traversal / arbitrary file read.
- Removed obsolete `overrides` entries that were only required for the previously pinned dependency versions.

## [3.0.2] - 2026-07-26
### Security
- Upgraded transitive `fast-uri` to 4.1.1, resolving its IDN canonicalization and backslash authority-delimiter host-confusion vulnerabilities.
- Upgraded transitive `brace-expansion` to 5.0.8 and `postcss` to 8.5.23, resolving all remaining npm audit findings.

### Changed
- Updated compatible development tooling dependencies to their latest stable releases.

## [2.0.4] - 2026-05-15
### Security
- Pinned transitive `fast-uri` to `^3.1.2` via `overrides` to address:
  - Path traversal via percent-encoded dot segments (`GHSA-q3j6-qgpj-74h6`, `CVE-2026-6321`).
  - Host confusion via percent-encoded authority delimiters (`GHSA-v39h-62p7-jpjc`, `CVE-2026-6322`).

## [2.0.3] - 2026-04-18
### Security
- Upgraded `vite` dev dependency to `^6.4.2` to address two CVEs:
  - Arbitrary file read via Vite dev server WebSocket (`fetchModule` bypass of `server.fs` checks).
  - Path traversal in optimized deps `.map` handling.
- Added/updated `overrides` for transitive dependencies to address additional CVEs:
  - `lodash` pinned to `^4.18.0`: code injection via `_.template` imports key names and prototype pollution via array path bypass in `_.unset`/`_.omit`.
  - `brace-expansion` pinned to `^2.0.3`: zero-step sequence causes process hang and memory exhaustion.
  - `flatted` pinned to `^3.4.2`: unbounded recursion DoS and prototype pollution in `parse()`.
  - `picomatch` pinned to `^4.0.4`: method injection via POSIX character classes and ReDoS via extglob quantifiers.

## [1.1.0] - YYYY-MM-DD
### Fixed
- Corrected signature verification for DigiByte Bech32 addresses (starting with `dgb1...`). Signatures from these addresses were previously unverifiable due to issues in the underlying `digibyte-message` dependency.

### Changed
- Replaced internal `digibyte-message` dependency with `bitcoinjs-message` to enable correct verification across all address types (Legacy, SegWit P2SH, Bech32).

## [1.0.1] - 2024-07-25
### Fixed
- Correct type exports for CJS/UMD builds.

## [1.0.0] - 2024-07-25
### Added
- Initial release of `digiid-ts`.
- Core functionality for generating Digi-ID URIs (`generateDigiIDUri`).
- Core functionality for verifying Digi-ID callbacks (`verifyDigiIDCallback`).
- Comprehensive TypeScript types.
- Unit tests.
- Usage examples.

[Unreleased]: https://github.com/pawelzelawski/digiid-ts/compare/v4.0.0...HEAD
[4.0.0]: https://github.com/pawelzelawski/digiid-ts/compare/v3.0.2...v4.0.0
[3.0.2]: https://github.com/pawelzelawski/digiid-ts/compare/v3.0.1...v3.0.2
[2.0.4]: https://github.com/pawelzelawski/digiid-ts/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/pawelzelawski/digiid-ts/compare/v1.1.0...v2.0.3
[1.1.0]: https://github.com/pawelzelawski/digiid-ts/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/pawelzelawski/digiid-ts/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/pawelzelawski/digiid-ts/releases/tag/v1.0.0
