# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v3.0.1] - 2025-04-25
### Changed
- Updated GitHub workflow to use Node.js 18

## [v3.0.0] - 2025-04-25
### Fixed
- Fix incorrect error message upon regex validation failure.
- Added option for custom branch name
- Added e2e and more testing
- Removed old shrinkwrap
- Better output validation
- Cleaning npm audit results

## [2.1.0] - 2021-06-11
### Added
- optional `regexOptions`.
### Changed
- Removed `xo` and moved to eslint.
### Fixed
- Email in license.
- dependencies and dev dependencies versions update

## [2.0.0] - 2021-02-03
### Changed
- Option changed. From `seperator` to `separator`.
- Option changed. From `msgseperatorRequiredL` to `msgseparatorRequiredL`.
- Now case sensitive on branch name and branch prefix.
- main branch instead of master.

## [1.4.1] - 2021-01-13
### Fixed
- Security Dependency check and fix.
- Moved to Github Action.

## [1.4.0] - 2020-07-05
### Added
- Regex support (no breaking change).

## [1.2.0] - 2020-05-02
### Added
- npx support.

## [1.1.5] - 2020-05-02
### Fixed
- Tests on Node.js LTS.
### Changed
- indexof to include.
### Added
- Badges and documentation.