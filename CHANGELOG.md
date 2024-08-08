# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

-   **Decoration System Overhaul!**
    -   **Multiple editor support introduced.**
    -   **Significant performance improvements.**
    -   **In-line changes update decorations.**
    -   **Occurrence updates only occur when needed.**
    -   Context retention is enabled for webviews.
-   **Drag n Drop rules from workspace to global and vice versa!**
    -   _It was a struggle to get this working, including some crazy race conditions in TS (see the boolean lock in ruleFactory...)_
    -   _In a later story, we can move this to be a proper mutex lock._
-   **Introduced a release notes page that shows on any major or minor update.**
-   **Introduced a walkthrough for grepc.**
-   Added appropriate support for multi-line regex.
-   Added more badges to the README.
-   Introduced prettier and eslint for the codebase.
-   Improved unit tests.

### Changed

-   Updated icon for marketplace and README to appropriate 128x128 and larger icon size.
-   Updated displayName to more accurately reflect what extension does.
-   Refactored previous drag n drop to use HTML drag and drop instead of mouse events. [Obligatory](https://www.quirksmode.org/blog/archives/2009/09/the_html5_drag.html)
    -   _This took me... a lot of time._

### Removed

-   getRulesArray() does not have side effects anymore :)

## [1.1.2]

### Removed

-   Removed coverage folder from package.
-   Removed unnecessary comments.

## [1.1.1]

### Changed

-   Bug Fix: Fixed occurrence text that was longer than view size being cut off.

## [1.1.0]

### Added

-   Field validation for all rules. This includes a red border around the rule and the field itself when an invalid rule is input.

### Changed

-   Placeholders now feature better examples more in-line with VS Code conventions.
-   Placeholders will now only appear when the input field is focused on.

## [1.0.1]

### Added

-   Sponsor links to the github and marketplace page.

### Changed

-   Fixed numerous light mode visual issues.

### Removed

-   Left over onboarding files.

## [1.0.0]

-   Initial release.
