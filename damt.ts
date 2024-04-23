#!/usr/bin/env -S deno run --quiet --allow-read --allow-env=ACRODB --allow-write --unstable-temporal
/**
 * @file damt.ts
 * @brief Manage acronyms stored in a SQLite database.
 *
 * @author     simon rowe <simon@wiremoons.com>
 * @license    open-source released under "MIT License"
 * @source     https://github.com/wiremoons/damt
 *
 * @date originally created: 25 Feb 2022.
 * @date updated significantly: November 2022.
 * @date significant refactoring: April 2024.
 *
 * @details Program is used to manage acronyms stored in a SQLite database.
 * Application is written in TypeScript for use with the Deno runtime: https://deno.land/
 *
 * @note The program can be run directly from the GitHub repo using the command:
 * @code deno run --quiet --allow-read --allow-env=ACRODB --allow-write --unstable-temporal https://raw.githubusercontent.com/wiremoons/damt/main/damt.ts
 * @note A local copy of the program `damt.ts` can be run with Deno using the command:
 * @code deno run --quiet --allow-read --allow-env=ACRODB --allow-write --unstable-temporal damt.ts
 * @note A local copy of the program `damt.ts` can be installed to 'DENO_INSTALL_ROOT' to using the command:
 * @code deno install -f --quiet --allow-read --allow-env=ACRODB --allow-write --unstable-temporal damt.ts
 * @note A local copy of the program `damt.ts` can be compiled using the command:
 * @code deno compile --quiet --allow-read --allow-env=ACRODB --allow-write --unstable-temporal damt.ts
 */

//--------------------------------
// MODULE IMPORTS
//--------------------------------

// Deno stdlib imports
import { parseArgs } from "jsr:@std/cli@0.223.0/parse-args";
import { format } from "jsr:@std/fmt@0.223.0/bytes";
import {
  basename,
  dirname,
  fromFileUrl,
  join,
  normalize,
} from "jsr:@std/path@0.223.0";
import { bold } from "jsr:@std/fmt@0.223.0/colors";

// Other imports
import {
  cliVersion,
  existsFile,
  getFileModTime,
} from "https://deno.land/x/deno_mod@0.8.1/mod.ts";
import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";

//--------------------------------
// GLOBAL DECLARATIONS
//--------------------------------

// CLI VERSION OPTIONS DECLARATION

/** define options for `cliVersion()` function for application version data
 * @typedef versionOptions
 * @prop {string} version the current version of this application
 * @prop {string} copyrightName the name of the person that hold the copyright of this application
 * @prop {string} licenseUrl the web site address that holds a copy of this applications license
 * @prop {string} crYear the year(s) the copyright applies to for this application
 */
const versionOptions = {
  version: "0.4.0",
  copyrightName: "Simon Rowe",
  licenseUrl: "https://github.com/wiremoons/damt/",
  crYear: "2022-2024",
};

/** Define the command line argument switches and options to be used */
const cliOpts = {
  default: { h: false, l: false, s: false, v: false },
  alias: { h: "help", l: "latest", s: "search", v: "version" },
  stopEarly: true,
  //unknown: showUnknown,
};

//--------------------------------
// COMMAND LINE ARGS FUNCTIONS
//--------------------------------

/** obtain any command line arguments and exec them as needed */
async function execCliArgs(db: DB) {
  //console.log(parse(Deno.args,cliOpts));
  const cliArgs = parseArgs(Deno.args, cliOpts);

  if (cliArgs.search) {
    dbSearch(Deno.args[1], db);
    db.close();
    Deno.exit(0);
  }

  if (cliArgs.latest) {
    dbLatestRecords(db);
    db.close();
    Deno.exit(0);
  }

  if (cliArgs.help) {
    printHelp();
    db.close();
    Deno.exit(0);
  }

  if (cliArgs.version) {
    await printVersionInfo();
    db.close();
    Deno.exit(0);
  }
}

/** Function defined in `cliOpts` so is run automatically by `parse()` if an unknown
 * command line option is given by the user.
 * @code showUnknown(arg: string, k?: string, v?: unknown)
 */
// function showUnknown(arg: string) {
//   console.error(`\nERROR: Unknown argument: '${arg}'`);
//   printHelp();
//   Deno.exit(1);
// }

//--------------------------------
// UTILITY FUNCTIONS
//--------------------------------

/** Return the name of the currently running program without the path included. */
function getAppName(): string {
  return `${basename(Deno.mainModule) ?? "UNKNOWN"}`;
}

/** Using the filePath to obtain database file size
 * NB: `format` from "jsr:@std/fmt@0.223.0/bytes" to show DB size in bytes/MB/GB etc
 */
async function getFileSize(filePath: string): Promise<string> {
  // check have valid filePath
  if (typeof filePath !== "string") return "UNKNOWN";
  // check for URL path instead of OS path
  if (filePath.startsWith("file:")) {
    filePath = fromFileUrl(filePath);
  }
  // get file stat and extract size value
  try {
    const fileInfo = await Deno.lstat(filePath);
    if (fileInfo.isFile) {
      return format(fileInfo.size);
    }
  } catch (err) {
    console.error(`ERROR: Failed to get DB file size: '${err}'`);
    return "UNKNOWN";
  }
  return "UNKNOWN";
}

/**
 * Type Guards
 */
/** Type guard for string */
// deno-lint-ignore no-explicit-any
export function isString(arg: any): arg is string {
  return arg !== undefined && typeof arg === "string";
}

/** Convert epoch date to date and time for display in output as a string */
function getDisplayDateTime(epochTime: number): string {
  // console.log(`Epoch time for conversion to data and time: ${epochTime}`);
  // Set appearance of date and time when converted to a string for output.
  // Example for '1710315965' === 'Wed, 13 March 2024 at 07:46:05'
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour12: false,
    // timeZoneName: 'short',
    // timeZone: "UTC",
  };
  // See: https://tc39.es/proposal-temporal/docs/instant.html
  try {
    const instance: Temporal.Instant = Temporal.Instant.fromEpochSeconds(
      epochTime,
    );
    return instance.toLocaleString(undefined, options);
  } catch (e) {
    console.error(`Failed to convert epoch date: ${e}`);
    return "UNKNOWN";
  }
}

//--------------------------------
// DATABASE LOCATE FUNCTIONS
//--------------------------------

/** Check environment variable 'ACRODB' for a valid filename */
async function getDBEnv(): Promise<string | undefined> {
  const dbFile = Deno.env.get("ACRODB") || "";
  return await existsFile(dbFile) ? dbFile : undefined;
}

/** Check executable location for valid database file named: 'acronyms.db'  */
async function getLocalDBFile(): Promise<string | undefined> {
  const appDB = join(normalize(dirname(Deno.mainModule)), "acronyms.db");
  // DEBUG OUTPUT:
  //console.log(`Constructed filename: ${appDB}`);
  return await existsFile(appDB) ? appDB : undefined;
}

/** Attempts to find the database file on the local file system */
async function findDbFileLocation(): Promise<string> {
  // check environment first and fallback to executable directory
  const dbLocation = await getDBEnv() || await getLocalDBFile();
  if (!dbLocation) {
    return Promise.reject(
      new Error(
        "'findDbFileLocation()' failed to locate a valid database filename.",
      ),
    );
  }
  return dbLocation;
}

//--------------------------------
// DATABASE OPEN FUNCTION
//--------------------------------

/** Try to open the database file and return the `DB` handle to it
 * @param {string} dbLocation the path to the database file
 * @returns {DB | undefined} the handle to the open database or `undefined` on failure
 */
function openDB(dbLocation: string): DB | undefined {
  if (isString(dbLocation)) {
    return new DB(dbLocation);
  }
}

//-----------------------------------
// DISPLAY ACRONYM RECORD FUNCTIONS
//-----------------------------------

/** Display application version information when requested */
async function printVersionInfo(): Promise<void> {
  const versionData = await cliVersion(versionOptions);
  console.log(versionData);
}

/** Display database file location and stats  */
async function printDbInfo(dbLocation: string, db: DB): Promise<void> {
  console.log(`
Database file:      '${normalize(dbLocation)}'
Database modified:  '${await getFileModTime(dbLocation)}'
Database size:      '${await getFileSize(dbLocation)}'

SQLite version:     '${sqliteVersion(db)}'
Total acronyms:     '${recordCount(db)}'
Newest acronym:     '${lastAcronym(db)}'`);
}

/** Display application help when requested  */
function printHelp() {
  console.log(`
Managed acronyms stored in a SQLite database.

Usage: ${bold(getAppName())} [switches] [arguments]

[Switches]       [Arguments]   [Default Value]   [Description]
-l, --latest                        false        show the five newest acronyms records
-s, --search     acronym            false        acronym to search the database for
-h, --help                          false        display help information
-v, --version                       false        display program version`);
}

//--------------------------------
// Database SQL Functions
//--------------------------------

/** Obtain the total number of acronym records in the database */
function recordCount(db: DB): string {
  return db
    ? (db.query("select count(*) from acronyms;")).toLocaleString()
    : "ERROR";
}

/** Obtain the SQLite version */
function sqliteVersion(db: DB): string {
  return db ? (db.query("select sqlite_version();")).toString() : "ERROR";
}

/** Obtain the last acronym (ie newest) entered into the database */
function lastAcronym(db: DB): string {
  return db
    ? (db.query("select acronym from acronyms order by rowid desc limit 1;"))
      .toString()
    : "ERROR";
}

/** Search for the given string in the database `acronym` field and display any matching results */
function dbSearch(searchItem: string, db: DB) {
  if (isString(searchItem)) {
    const searchQuery = db.prepareQuery<
      [string, string, string, string, string, number]
    >(
      "select rowid,ifnull(Acronym,''),ifnull(Definition,''),ifnull(Source,''),ifnull(Description,''),ifnull(Changed,'') from ACRONYMS where Acronym like ? collate nocase order by Source;",
    );

    let resultCount = 0;
    // output any search results
    for (
      const [rowid, acronym, definition, source, description, changed]
        of searchQuery
          .iter([searchItem])
    ) {
      console.log(`
ID:          ${rowid}
ACRONYM:     '${acronym}' is: '${definition}'.
SOURCE:      '${source}'
LAST UPDATE: ${getDisplayDateTime(changed)}
DESCRIPTION: ${description}`);
      resultCount++;
    }
    console.log(
      `\nSearch of '${
        recordCount(db)
      }' records for '${searchItem}' found '${resultCount.toLocaleString()}' matches.`,
    );
    searchQuery.finalize();
  }
}

/** Show the last five new acronym records entered into the SQLite database */
function dbLatestRecords(db: DB) {
  const latestRecordsQuery = db.prepareQuery<
    [string, string, string, string, string, number]
  >(
    "select rowid,ifnull(Acronym,''),ifnull(Definition,''),ifnull(Source,''),ifnull(Description,''),ifnull(Changed,'') from ACRONYMS Order by rowid DESC LIMIT 5;",
  );

  let resultCount = 0;
  // output any search results
  for (
    const [rowid, acronym, definition, source, description, changed]
      of latestRecordsQuery.iter()
  ) {
    console.log(`
ID:          ${rowid}
ACRONYM:     '${acronym}' is: '${definition}'.
SOURCE:      '${source}'
LAST UPDATE: ${getDisplayDateTime(changed)}
DESCRIPTION: ${description}`);
    resultCount++;
  }
  console.log(
    `\nShowing latest '${resultCount}' records of '${
      recordCount(db)
    }' total records.`,
  );
  latestRecordsQuery.finalize();
}

//----------------------------------------------------------------
// MAIN : Deno script execution start
//----------------------------------------------------------------

if (import.meta.main) {
  // locate the SQlite database on the filesystem and get its full path
  const dbLocation = await findDbFileLocation().catch((e) =>
    console.error(`${e}`)
  );
  // check to ensure the path was located - otherwise exit.
  if (!dbLocation) {
    console.error("\n[!] FATAL ERROR: database not found. Exit.");
    Deno.exit(1);
  }
  // DEBUG OUTPUT:
  //console.log(`Found database file: ${dbLocation}`);

  // Open the database file to obtain `db` handle to the SQLite database
  const db = openDB(dbLocation);

  // Using the open `db` connection execute the required function.
  if (db) {
    // Check for any command line arguments:
    // NB: only returns if `execCliArgs()` call does not find options to execute.
    if (Deno.args.length > 0) await execCliArgs(db);

    // Check if search is needed but cli args `-s \ --search` were not provided.
    if (Deno.args.length === 1) {
      console.log(`Trying search with: '${Deno.args[0]}'`);
      dbSearch(Deno.args[0], db);
    } else {
      await printVersionInfo();
      await printDbInfo(dbLocation, db);
      printHelp();
    }

    // close the database
    if (db) {
      db.close();
    }
  }
}
