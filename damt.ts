#!/usr/bin/env -S deno run --quiet --allow-read --allow-env=ACRODB
/**
 * @file damt.ts
 * @brief Manage acronyms stored in a SQLite database.
 *
 * @author     simon rowe <simon@wiremoons.com>
 * @license    open-source released under "MIT Licence"
 * @source     https://github.com/wiremoons/damt
 *
 * @date originally created: 25 Feb 2022
 * @date updated significantly: tbc
 *
 * @details Program is used to manage acronyms stored in a SQLite database.
 * Application is written in TypeScript for use with the Deno runtime: https://deno.land/
 *
 * @note The program can be run with Deno using the command:
 * @code deno run --quiet --allow-read damt.ts
 * @note The program can be installed to 'DENO_INSTALL_ROOT' to using the command:
 * @code deno install -f --quiet --allow-read damt.ts
 */

//--------------------------------
// MODULE IMPORTS
//--------------------------------
import {
  cliVersion,
  existsFile,
  getFileModTime,
} from "https://deno.land/x/deno_mod@0.8.1/mod.ts";

import { parse } from "https://deno.land/std@0.127.0/flags/mod.ts";
import { prettyBytes } from "https://deno.land/std@0.127.0/fmt/bytes.ts";
import {
  basename,
  dirname,
  fromFileUrl,
  join,
  normalize,
} from "https://deno.land/std@0.127.0/path/mod.ts";
import {
  blue,
  bold,
  underline,
} from "https://deno.land/std@0.127.0/fmt/colors.ts";

import { DB } from "https://deno.land/x/sqlite@v3.2.1/mod.ts";

//--------------------------------
// DATABASE INTERFACE
//--------------------------------

interface DamtInterface {
  dbFileName?: string;
  dbFullPath?: string;
  dbSize?: string;
  dbLastAccess?: string;
  dbSqliteVersion?: string;
}

//--------------------------------
// COMMAND LINE ARGS FUNCTIONS
//--------------------------------

/** Define the command line argument switches and options to be used */
const cliOpts = {
  default: { h: false, s: false, v: false },
  alias: { h: "help", s: "search", v: "version" },
  stopEarly: true,
  unknown: showUnknown,
};

/** define options for `cliVersion()` function for application version data */
const versionOptions = {
  version: "0.2.0",
  copyrightName: "Simon Rowe",
  licenseUrl: "https://github.com/wiremoons/damt/",
  crYear: "2022",
};

/** obtain any command line arguments and exec them as needed */
async function getCliArgs() {
  //console.log(parse(Deno.args,cliOpts));
  const cliArgs = parse(Deno.args, cliOpts);

  if (cliArgs.search) {
    dbSearch();
    Deno.exit(0);
  }

  if (cliArgs.help) {
    showHelp();
    Deno.exit(0);
  }

  if (cliArgs.version) {
    const versionData = await cliVersion(versionOptions);
    console.log(versionData);
    Deno.exit(0);
  }
}

/** Function defined in `cliOpts` so is run automatically by `parse()` if an unknown
 * command line option is given by the user.
 * @code showUnknown(arg: string, k?: string, v?: unknown)
 */
function showUnknown(arg: string) {
  console.error(`\nERROR: Unknown argument: '${arg}'`);
  showHelp();
  Deno.exit(1);
}

/** Display when help when unknown command lines options are entered or is requested by the user */
function showHelp() {
  console.log(`
Managed acronyms stored in a SQLIte database.

Usage: ${bold(getAppName())} [switches] [arguments]

[Switches]       [Arguments]   [Default Value]   [Description]
-s, --search     acronym            false        acronym to search the database for
-h, --help                          false        display help information
-v, --version                       false        display program version
`);
}

//--------------------------------
// UTILITY FUNCTIONS
//--------------------------------

/** Obtain `filePath` file size */
async function getFileSize(filePath: string): Promise<number | undefined> {
  // check for URL path instead of OS path
  if (filePath.startsWith("file:")) {
    filePath = fromFileUrl(filePath);
  }
  // get file stat and extract size value
  try {
    const fileInfo = await Deno.lstat(filePath);
    if (fileInfo.isFile) {
      return fileInfo.size;
    }
  } catch {
    return undefined;
  }
}

//--------------------------------
// APPLICATION FUNCTIONS
//--------------------------------

/** Return the name of the currently running program without the path included. */
function getAppName(): string {
  return `${basename(Deno.mainModule) ?? "UNKNOWN"}`;
}

/** Check executable location for valid database file named: 'acronyms.db'  */
async function getLocalDBFile(): Promise<string | undefined> {
  const appDB = join(normalize(dirname(Deno.mainModule)), "acronyms.db");
  console.log(`Constructed filename: ${appDB}`);
  return await existsFile(appDB) ? appDB : undefined;
}

/** Check environment variable 'ACRODB' for a valid filename */
async function getDBEnv(): Promise<string | undefined> {
  const dbFile = Deno.env.get("ACRODB") || "";
  return await existsFile(dbFile) ? dbFile : undefined;
}

//** Populate the field in the 'DamtInterface' with the database information */
async function setDbData(): Promise<DamtInterface> {
  // check environment first and fallback to executable directory looking DB file location
  const dbLocation = await getDBEnv() || await getLocalDBFile();
  if (!dbLocation) {
    return Promise.reject(
      new Error("failed to locate a valid database filename."),
    );
  }

  const prettyDBSze = await getFileSize(dbLocation).then((size) =>
    size ? prettyBytes(size) : "UNKNOWN"
  );

  return {
    dbFileName: basename(dbLocation),
    dbFullPath: normalize(dbLocation),
    dbSize: prettyDBSze,
    dbLastAccess: await getFileModTime(dbLocation),
  };
}

//--------------------------------
// Database SQL Functions
//--------------------------------

function dbSearch() {
  console.log(`${underline("Search function called\n")}`);
}

//--------------------------------
// MAIN
//--------------------------------
if (import.meta.main) {
  console.log(`\n${blue(getAppName())} is running...`);

  if (Deno.args.length > 0) await getCliArgs();

  //const dbData = {} as DamtInterface;
  const dbData: DamtInterface | void = await setDbData().catch((e) =>
    console.error(`Exit as database file not found:\n${e}`)
  );

  console.table(dbData);
}
