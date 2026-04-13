// Dart Acronym Management Tool (DAMT)
// Copyright 2023 Simon Rowe (simon@wiremoons.com).
// https://github.com/wiremoons/damt
//
// Build exe with:
//   dart compile exe -DDART_BUILD="Built on: $(date)" ./bin/damt.dart -o ./build/damt.exe
// Run with:
//   dart run
//
// Disable some specific linting rules in this file only
// ignore_for_file: unnecessary_brace_in_string_interps, unnecessary_string_interpolations

import 'dart:io';
import 'package:args/args.dart';
import 'package:dav/dav.dart';

// import local code
import 'package:damt/records.dart';

// set values to be used with package: dav and for help output
const String applicationVersion = "0.5.0";
const String copyright =
    "Copyright © 2023-2024 Simon Rowe <simon@wiremoons.com>";

void main(List<String> arguments) async {
  var parser = ArgParser();
  late ArgResults cliResults;

  parser.addFlag('delete',
      abbr: 'd',
      negatable: false,
      defaultsTo: false,
      help: 'Delete an acronym record for provided id.');
  parser.addFlag('latest',
      abbr: 'l',
      negatable: false,
      defaultsTo: false,
      help: 'Show the five newest acronyms records.');
  parser.addOption('search',
      abbr: 's', help: 'Search database for provided acronym.');
  parser.addFlag('version',
      abbr: 'v',
      negatable: false,
      defaultsTo: false,
      help: 'Display the applications version.');
  parser.addFlag('help',
      abbr: 'h',
      negatable: false,
      help: 'Display additional help information.', callback: (help) {
    if (help) {
      stdout.writeln(
          "\nCommand-line application to manage a database of acronyms.\n");
      stdout.writeln("Usage:\n${parser.usage}\n");
      stdout.writeln("${copyright}");
      stdout.writeln("https://github.com/wiremoons/damt");
      exit(0);
    }
  });

  try {
    cliResults = parser.parse(arguments);
  } on FormatException catch (e) {
    // code for handling FormatException
    stderr.writeln("ERROR: incorrect input '${e}'");
    stderr.writeln("\nValid options are:\n${parser.usage}");
    exit(1);
  } catch (e) {
    stderr.writeln("\nERROR: unknown exception '${e}'");
    stderr.writeln("\nValid options are:\n${parser.usage}");
    exit(1);
  }

  // display application version information if requested on the command line
  if (cliResults.wasParsed('version')) {
    final version = Dav(appVersion: applicationVersion);
    version.display();
    exit(0);
  }

  // search the database for the value provided on the command line
  if (cliResults.wasParsed('search')) {
    final searchItem = cliResults['search'];
    bool _ = await searchDataBase(searchItem);
    exit(0);
  }

  // display the latest newly added 5 entries in the database
  if (cliResults.wasParsed('latest')) {
    Damt damt = Damt();
    await damt.create();
    int found = damt.dbLatest();
    if (found != 5) {
      stderr.writeln(
          "\nERROR: expecting five (5) records for latest records search but got: '${found}'.");
      exit(3);
    }
    stdout.writeln(
        "Search of '${damt.dbRecordCount}' records found '${found}' matches.");
    damt.dbClose();
    exit(0);
  }

  // delete the database acronym record provided on the command line
  if (cliResults.wasParsed('delete')) {
    stdout.writeln("delete - not implemented yet...");
    exit(0);
  }

  // managed any unexpected additional arguments - perform search for first value or show error
  if (cliResults.rest.isNotEmpty) {
    final searchItem = cliResults.rest[0].toString();
    bool found = await searchDataBase(searchItem);
    if (!found) {
      stderr.writeln(
          "\nERROR: no command matches input: '${cliResults.rest.toString()}'");
      stderr.writeln("\nValid options are:\n${parser.usage}");
      exit(2);
    }
    exit(0);
  }

  // no command line options selected so print summary of application info and exit the application
  final version = Dav(appVersion: applicationVersion);
  version.display();
  stdout.writeln("");
  Damt damt = Damt();
  await damt.create();
  stdout.writeln("Database full path:        ${damt.dbFileName}");
  stdout.writeln("Database file size:        ${damt.dbSize}");
  stdout.writeln("Database last modified:    ${damt.dbLastAccess}");
  stdout.writeln("");
  stdout.writeln("SQLite version:            ${damt.dbSqliteVersion}");
  stdout.writeln("Total acronyms:            ${damt.dbRecordCount}");
  stdout.writeln("Last acronym added:        '${damt.dbNewestAcronym}'");
  stderr.writeln("\nValid options are:\n${parser.usage}");
  damt.dbClose();
  exit(0);
}

// perform search of the database for provided [findme] string value
Future<bool> searchDataBase(String findItem) async {
  stdout.writeln("\nSearching for acronym: '${findItem}'...");
  Damt damt = Damt();
  await damt.create();
  int findCount = damt.dbSearch(findItem);
  stdout.writeln(
      "Search of '${damt.dbRecordCount}' records for '${findItem}' found '${findCount}' matches.");
  damt.dbClose();
  return findCount > 0 ? true : false;
}
