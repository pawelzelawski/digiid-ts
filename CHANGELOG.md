# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - YYYY-MM-DD
### Security
- Fixed multiple security vulnerabilities by overriding transitive dependencies:
  - `elliptic` updated to `^6.6.1` to address CVE related to malformed input signature.
  - `lodash` updated to `^4.17.21` to address CVE related to Prototype Pollution.

## [1.0.0] - YYYY-MM-DD
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