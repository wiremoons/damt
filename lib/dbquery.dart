// Copyright 2023 Simon Rowe (simon@wiremoons.com).
// https://github.com/wiremoons/damt
//
// Disable some specific linting rules in this file only
// ignore_for_file: unnecessary_brace_in_string_interps, unnecessary_string_interpolations

// LAST ACRONYM:
//     select acronym from acronyms order by rowid desc limit 1;

// SQLIte Version:
//     select sqlite_version();

// RECORD COUNT:
//     select count(*) from acronyms;

// LAST 5 NEW RECORDS:
//     "select rowid,ifnull(Acronym,''),ifnull(Definition,''),ifnull(Source,''),ifnull(Description,''),ifnull(Changed,'') from ACRONYMS Order by rowid DESC LIMIT 5;",

// SEARCH:
//       "select rowid,ifnull(Acronym,''),ifnull(Definition,''),ifnull(Source,''),ifnull(Description,''),ifnull(Changed,'') from ACRONYMS where Acronym like ? collate nocase order by Source;",

import 'dart:io';

import 'package:sqlite3/sqlite3.dart';
import 'package:intl/intl.dart';

class DbManage {
  static late final String dbPath;
  static late final Database db;

  DbManage(String dBPath) {
    dbPath = dBPath;
    try {
      db = sqlite3.open(dbPath);
    } catch (e) {
      stdout.writeln("${sqliteLibError()}");
      stderr.writeln("ERROR: failed to open the SQLite database: '${dbPath}'.");
      stderr.writeln("${e}");
      exit(1);
    }
  }

  // Search for the provided acronym in the SQLite database and output any records found.
  // Search the SQLite database for [findValue] and return `true` if any records are found.
  int acronymSearch(String findValue) {
    int findCount = 0;
    // fail immediately if no search value if provided
    if (findValue.isEmpty) return findCount;
    // execute the search using [findValue] as the search value.
    ResultSet searchResult = db.select(
        "select rowid, ifnull(Acronym,'') as acronym, ifnull(Definition,'') as definition, ifnull(Source,'') as source,ifnull(Description,'') as description, ifnull(Changed,'') as changed from ACRONYMS where Acronym like ? collate nocase order by Source;",
        [findValue]);
    // check a result was found by the SQLite search - otherwise return
    if (searchResult.isEmpty) return findCount;
    stdout.writeln("");
    DateFormat dTFormatter =
        DateFormat('E dd MMMM yyyy @ HH:mm:ss'); // yyyy-MM-dd HH:mm:ss
    // output any results found tracking the number of records output
    for (final Row row in searchResult) {
      String lastChanged;
      int epoch = int.tryParse(row['changed']) ?? 0;
      epoch > 0
          ? lastChanged = dTFormatter
              .format(
                  DateTime.fromMillisecondsSinceEpoch(epoch * 1000).toLocal())
              .toString()
          : lastChanged = "Unknown";
      stdout.writeln("""
ID:          '${row['rowid']}'
ACRONYM:     '${row['acronym']}' is '${row['definition']}'.
SOURCE:      '${row['source']}'
LAST CHANGE: '${lastChanged}'
DESCRIPTION: ${row['description']}
        """);
      findCount++;
    }
    return findCount;
  }

  // Search for the latest 5 newest acronyms in the SQLite database and output any records found.
  // Return `true` if any records are found.
  int latestAcronyms() {
    int findCount = 0;
    ResultSet searchResult = db.select(
      "select rowid, ifnull(Acronym,'') as acronym, ifnull(Definition,'') as definition, ifnull(Source,'') as source,ifnull(Description,'') as description, ifnull(Changed,'') as changed from ACRONYMS Order by rowid DESC LIMIT 5;",
    );
    // check a result was found by the SQLite search - otherwise return
    if (searchResult.isEmpty) return findCount;
    stdout.writeln("");
    DateFormat dTFormatter =
        DateFormat('E dd MMMM yyyy @ HH:mm:ss'); // yyyy-MM-dd HH:mm:ss
    // output any results found tracking the number of records output
    for (final Row row in searchResult) {
      String lastChanged;
      int epoch = int.tryParse(row['changed']) ?? 0;
      epoch > 0
          ? lastChanged = dTFormatter
              .format(
                  DateTime.fromMillisecondsSinceEpoch(epoch * 1000).toLocal())
              .toString()
          : lastChanged = "Unknown";
      stdout.writeln("""
ID:          '${row['rowid']}'
ACRONYM:     '${row['acronym']}' is '${row['definition']}'.
SOURCE:      '${row['source']}'
LAST CHANGE: '${lastChanged}'
DESCRIPTION: ${row['description']}
        """);
      findCount++;
    }
    return findCount;
  }

  // Obtain the SQLite database version
  String sqliteVersion() {
    ResultSet versionResult = db.select("select sqlite_version();");
    if (versionResult.isEmpty) return "";
    // extract from:  [{sqlite_version(): 3.39.5}]
    return versionResult[0]["sqlite_version()"];
  }

  // Obtain the number of acronyms in the database
  String recordCount() {
    ResultSet countResult = db.select("select count(*) from acronyms;");
    if (countResult.isEmpty) return "";
    // extract from:  [{count(*): 18188}]
    int count = countResult[0]["count(*)"];
    // configure the number formatter to add thousands separator and no decimal places.
    NumberFormat formatter = NumberFormat.decimalPatternDigits(
      locale: 'en_uk',
      decimalDigits: 0,
    );
    return count.isFinite ? formatter.format(count).toString() : "";
  }

  // Obtain the last acronym entered into the database
  String lastAcronym() {
    ResultSet lastAcronymResult =
        db.select("select acronym from acronyms order by rowid desc limit 1;");
    if (lastAcronymResult.isEmpty) return "";
    // extract from:  [{Acronym: IV}]
    return lastAcronymResult[0]["Acronym"];
  }

  // Close the database connection
  void closeDatabase() {
    db.dispose();
  }

  // Display help on how to install the SQLite dynamic library to allow this application to
  // function.
  String sqliteLibError() {
    if (!Platform.isWindows) {
      return """

PLEASE NOTE:

The SQLite shared library is needed to execute the application. Please install 
it using your operating system package manager. The dynamic library is normally
available on Linux as a file named: 'libsqlite3.so'.

Example commands to install the library on a few common operating systems, or 
Linux distributions, are shown below:

        Fedora:    sudo dnf install sqlite-devel
        Debian:    sudo apt install libsqlite3-dev
        Ubuntu:    sudo apt install libsqlite3-dev
        macOS:     already included with macOS 
        FreeBSD:   sudo pkg install sqlite3

        """;
    }
    return """

PLEASE NOTE:

The SQLite shared library is needed to execute the application. Please install 
the Dynamic Link Library (DLL) file normally named 'sqlite3.dll' in the same location
as this application. The Windows DLL can be freely obtained from:

       SQLite3 Downloads : https://www.sqlite.org/download.html

page under the section: *Precompiled Binaries for Windows*. Example Steps to follow are:
      
       curl -OL https://sqlite.org/2023/sqlite-dll-win-x64-3440200.zip
       unzip sqlite-dll-win-x64-3440200.zip
       copy the 'sqlite3.dll' to the same directory as this application: 'damt.exe'

    """;
  }
}
