# Changelog
All notable changes to this project will be documented in this file.

## [1.5.0-dev] - 2026-01-31
### Added
- **Android Support:** Added v0.1.0 APK for Android Tablets (Keyboard-first design).
- **Linux Support:** Added official `.AppImage` build for Linux platforms.
- **Action Description:** New description field in the Action Builder for better documentation of custom logic.
- **Action Type Indicators:** Visual badges (Mouse/Terminal) in the sidebar to distinguish between Buttons and Commands.
- **Nested Array Parsing:** Code block parameters now support array syntax (e.g., `key=["val1", "val2"]`).
- **Dev Instance Mode:** New app identifier (`...contextpad.dev`) allowing parallel execution with installed production versions.

### Fixed
- **Startup Reliability:** Refactored file-opening logic to prevent duplicate tabs and improve "Open With" context menu stability.
- **Category Casing:** Removed forced uppercase normalization for categories in all managers.
- **Accessibility:** Added missing aria-labels to sidebar action buttons.
- **Code Hygiene:** Removed unused Rust secrets structures.

## [1.5.0] - 2026-01-25
### Added
- **Welcome Document:** Interactive introduction loaded on first launch or when no tabs are present.
- **Workflow Smart Navigation:** Single-click to navigate to existing tab; double-click to force fresh copy.
- **Tab Bar "+" Button:** Anchored to the far right for consistent access.
- **Bulk Operations:** Multi-select delete, toggle, and pinning in all managers.
- **GitHub Integration:** Repository links and sync-ready structure.

### Changed
- **UI Refinement:** Standardized scrollbars and category collapse persistence.
- **About Info:** Updated to reflect v1.5.0 features and philosophy.
- **Documentation:** Complete refactor of README, User Guide, and Developer Notes following new guidelines.

### Fixed
- **Category Persistence:** Fixed an issue where collapsed categories would expand on component remount.
- **Tab Bar Layout:** Fixed horizontal shifting of the new tab button.

## [1.0.0] - 2026-01-03
### Added
- First production-ready release.
- Core Action and Template systems.
- Markdown locking mechanism.
- Token estimation logic.
