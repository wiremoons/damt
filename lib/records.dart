// Copyright 2023 Simon Rowe (simon@wiremoons.com).
// https://github.com/wiremoons/damt
//
// Disable some specific linting rules in this file only
// ignore_for_file: unnecessary_brace_in_string_interps, unnecessary_string_interpolations
library;

import 'dart:io';
import 'package:path/path.dart' as p;

// local source code imports
import 'package:damt/sys_utils.dart';
import 'package:damt/dbquery.dart';

class Damt {
  String dbFullPath;
  String dbFileName;
  String? dbSize;
  String? dbLastAccess;
  String? dbSqliteVersion;
  String? dbRecordCount;
  String? dbNewestAcronym;
  late DbManage dbConn;

  // Initial constructor - sets [dbFileName] to an empty value.
  Damt()
      : dbFullPath = "",
        dbFileName = "";

  create() async {
    // check the [create()] method has not already be run
    if (dbFileName.isNotEmpty) {
      stdout.writeln("ERROR:  [!] 'Damt.create()' method already run.");
      return;
    }
    // find a database file to be used, else display an error and exit.
    String dbPath = "";
    bool exists = false;
    (dbPath, exists) = await _findDbPath();
    if (!exists) {
      stderr.writeln("ABORT: No SQLite database file available.");
      exit(1);
    }
    // Populate the Damt class fields with SQLite database info:
    dbFullPath = dbPath;
    dbFileName = dbPath;
    dbSize = await fileSizeAsString(dbFullPath, 2);
    dbLastAccess = await fileLastModified(dbFullPath);
    // Access the database to extract the required information
    dbConn = DbManage(dbFullPath);
    dbSqliteVersion = dbConn.sqliteVersion();
    dbRecordCount = dbConn.recordCount();
    dbNewestAcronym = dbConn.lastAcronym();
  }

  int dbSearch(String findme) {
    return dbConn.acronymSearch(findme);
  }

  int dbLatest() {
    return dbConn.latestAcronyms();
  }

  void dbClose() {
    // TODO: check exists before call
    dbConn.closeDatabase();
  }

  /////////////////////////////////////////////////////////////////////////////
  //    PRIVATE METHODS BELOW
  /////////////////////////////////////////////////////////////////////////////

  // Check for a file to be used for the SQLite database.
  Future<(String, bool)> _findDbPath() async {
    String dbPath = "";
    bool exists = false;
    (dbPath, exists) = await _envHasDb();
    if (exists) return (dbPath, true);
    (dbPath, exists) = await _localHasDb();
    if (exists) return (dbPath, true);
    return ("", false);
  }

  Future<(String, bool)> _envHasDb() async {
    final envDb = Platform.environment["ACRODB"];
    if (envDb == null || envDb.isEmpty) return ("", false);
    if (await File(envDb).exists()) {
      return (envDb, true);
    }
    return ("", false);
  }

  Future<(String, bool)> _localHasDb() async {
    final fullAppPath = Platform.resolvedExecutable;
    // remove executable name from fill path
    String onlyAppPath = "";
    bool exists = false;
    (onlyAppPath, exists) = await directoryNameOnly(fullAppPath);
    if (!exists) {
      return ("", false);
    }
    final localDb = p.join(onlyAppPath, "acronyms.db");
    if (await File(localDb).exists()) {
      return (localDb, true);
    }
    return ("", false);
  }
}
