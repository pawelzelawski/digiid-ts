# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[Unreleased]: https://github.com/pawelzelawski/digiid-ts/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/pawelzelawski/digiid-ts/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/pawelzelawski/digiid-ts/releases/tag/v1.0.0 