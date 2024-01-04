## v0.4.5
- Upgrade dependencies: `intl 0.19.0` (was 0.18.1) and `lints 3.0.0` (was 2.1.1).
- Update copyright year to include 2024.
- Add `library;` to satisfy dart analyse error for: "dangling_library_doc_comments".

## v0.4.4
- Update SQLite download version help for Windows when SQLite3.dll is missing.
- Fix various typo spelling errors across project files.

## v0.4.3
- Add instructions to the `README.md` to explain how to build a *SQLite* shared library for Linix.

## v0.4.2
- Improve build script to check for error at each step, and add `dart fix -n` as new check.
- Add instructions for SQLite library install for Debian and Ubuntu to the `README.md`.
- Update Github CI build to use Dart version 3.1.2.
- Updates to dependency versions in `pubspec.lock`.
- Catch exception when SQLite dynamic library is not found - provide instructions to install.

## v0.4.1
- Fixed spelling typos in the Unix build scipt: `build.sh`
- Remove unused function in `dbquery.dart` for showing the SQLite version as no included as a method
- Implement the `-l/--latest` cli option to show the 5 newest records added to the acronyms database

## v0.4.0
- Fix spelling typos in code comments and `CHANGELOG.md`
- Add remaining functionality to search for a specific acronym with `-s/--search` cli option
- Updates to supporting packages following update to Dart SDK `v3.1.0`
- Add new feature to perform search without use of `-s/--search` as a default execution

## v0.3.3
- Improve the search feature and its record output formatting
- Display the number of matching records found when a search succeeds
- Add ability to convert epoch to date time string for last record update output

## v0.3.2
- Correctly extract SQLite version data from `ResultSet`
- Correctly extract acronym record count from `ResultSet` and add thousands separator.
- Correctly extract last added acronym record from `ResultSet` and quote on output.
- Improve CLI flags parse error catch to be specific on incorrect input.
- Add start of search functionality.

## v0.3.1
- Add database connection handle to `Damt` class as late binding
- Add method to close database handle when needed

## v0.3.0
- Add database connectivity via new class `DbManage` in `dbquery.dart`
- Add new database queries to obtain record count, SQLite version, and newest acronym entered
- Add new database output to default run output

## v0.2.1
- update `.gitignore` simplified existing contents
- add build file for Windows as `win-build.bat`
- add `.gitattributes` to protect Windows file format on `win-build.bat`
- add `damt.exe` to `.gitignore`
- add features to `Damt` constructor to get path, filename, size, and last modified of located database
- update default output to provide a summary information for the application as a default output
- add ability to find database file named `acronyms.db` in the same directory as the `damt` binary

## v0.2.0
- Add initial code and support for interaction with SQLite databases
- Add new source code files: `dbquery.dart`, `records.dart`; and `sys_utils.dart`
- start detection of SQLite database file methods

## v0.1.3
- Uplift Dart SDK build version to: v3.0.0
- Updated packages to new major versions for better Dart v3 support.
- Improve the date format used for version display in the `build.sh` script

## v0.1.2
- Add GitHub Actions for CI builds
- Add additional step to run `dart pub get` in the `build.sh` script
- Start to add comments to support the code documentation
- Merge branch 'main' from edits made on website repo directly
- Update GitHub Action to use latest Dart SDK 2.19.5
- Add linting rule. Update version to v0.1.3. Make copyright statement in help output a const String
- Improve header comments in each source code file

## v0.1.1
- Version now builds and runs with basic cli command line params working

## v0.1.0
- Initial commit of source code basic file structure
- Additional entries added to Git ignore config file
