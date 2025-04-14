# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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