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
 *
 * @details Program is used to manage acronyms stored in a SQLite database.
 * Application is written in TypeScript for use with the Deno runtime: https://deno.land/
 *
 * @note The program can be run directly from the GitHub repo using the command:
 * @code deno run --quiet --allow-read --allow-env=ACRODB --allow-write --unstable-temporal https://github.com:wiremoons/damt/damt.ts
 * @note The program can be run with Deno using the command:
 * @code deno run --quiet --allow-read --allow-env=ACRODB --allow-write --unstable-temporal
 * @note The program can be installed to 'DENO_INSTALL_ROOT' to using the command:
 * @code deno install -f --quiet --allow-read --allow-env=ACRODB --allow-write --unstable-temporal damt.ts
 * @note The program can be compiled using the command:
 * @code deno compile --quiet --allow-read --allow-env=ACRODB --allow-write --unstable-temporal damt.ts
 */

//--------------------------------
// MODULE IMPORTS
//--------------------------------

// Deno stdlib imports
import { parseArgs } from "https://deno.land/std@0.220.1/cli/parse_args.ts";
import { format } from "https://deno.land/std@0.220.1/fmt/bytes.ts";
import {
  basename,
  dirname,
  fromFileUrl,
  join,
  normalize,
} from "https://deno.land/std@0.220.1/path/mod.ts";
import {
  //blue,
  bold,
  //underline,
} from "https://deno.land/std@0.220.1/fmt/colors.ts";

// Other imports
import {
  cliVersion,
  existsFile,
  getFileModTime,
  //isNumber,
  isString,
} from "https://deno.land/x/deno_mod@0.8.1/mod.ts";
import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";

//--------------------------------
// GLOBAL DECLARATIONS
//--------------------------------

// DATABASE INTERFACE DECLARATION

interface DamtInterface {
  dbFileName: string;
  dbFullPath: string;
  dbSize?: string;
  dbLastAccess?: string;
  dbSqliteVersion?: string;
  dbRecordCount?: string;
  dbNewestAcronym?: string;
}

// CLI VERSION OPTIONS DECLARATION

/** define options for `cliVersion()` function for application version data */
const versionOptions = {
  version: "0.3.0",
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
async function execCliArgs(db: DB, dbData: DamtInterface) {
  //console.log(parse(Deno.args,cliOpts));
  const cliArgs = parseArgs(Deno.args, cliOpts);

  if (cliArgs.search) {
    dbSearch(Deno.args[1], db, dbData);
    Deno.exit(0);
  }

  if (cliArgs.latest) {
    dbLatestRecords(db, dbData);
    Deno.exit(0);
  }

  if (cliArgs.help) {
    printHelp();
    Deno.exit(0);
  }

  if (cliArgs.version) {
    await printVersionInfo();
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

/**
 * Type Guard for DamtInterface interface object
 */
// deno-lint-ignore no-explicit-any
function isObject(arg: any): arg is DamtInterface {
  return arg !== undefined;
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

  // Use https://deno.land/std/fmt/ to show DB size in formatted bytes/MB/GB etc
  const prettyDBSze = await getFileSize(dbLocation).then((size) =>
    size ? format(size) : "UNKNOWN"
  );

  return {
    dbFileName: basename(dbLocation),
    dbFullPath: normalize(dbLocation),
    dbSize: prettyDBSze,
    dbLastAccess: await getFileModTime(dbLocation),
  };
}

//** Try to open the database file and return the handle to it
function openDB(dbData: DamtInterface): DB | undefined {
  if ((isObject(dbData)) && (isString(dbData.dbFullPath))) {
    return new DB(dbData.dbFullPath);
  }
}

//--------------------------------
// DISPLAY INFO FUNCTIONS
//--------------------------------

/** Display application version information when requested */
async function printVersionInfo() {
  const versionData = await cliVersion(versionOptions);
  console.log(versionData);
}

/** Display database data collected when requested */
function printDbInfo(dbData: DamtInterface) {
  console.log(`
Database file:      '${dbData.dbFullPath}'
Database size:      '${dbData.dbSize}'
Database modified:  '${dbData.dbLastAccess}'

SQLite version:     '${dbData.dbSqliteVersion}'
Total acronyms:     '${dbData.dbRecordCount}'
Newest acronyms:    '${dbData.dbNewestAcronym}'
`);
}

/** Display application help when requested  */
function printHelp() {
  console.log(`
Managed acronyms stored in a SQLIte database.

Usage: ${bold(getAppName())} [switches] [arguments]

[Switches]       [Arguments]   [Default Value]   [Description]
-l, --latest                        false        show the five newest acronyms records
-s, --search     acronym            false        acronym to search the database for
-h, --help                          false        display help information
-v, --version                       false        display program version
`);
}

//--------------------------------
// Database SQL Functions
//--------------------------------

//** Search for the given string in the acronym field and display any matching results
function dbSearch(searchItem: string, db: DB, dbData: DamtInterface) {
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
      `\nSearch of '${dbData.dbRecordCount}' records for '${searchItem}' found '${resultCount.toLocaleString()}' matches.`,
    );
    searchQuery.finalize();
  }
}

//** Show the last five new acronym records entered into the SQLite database
function dbLatestRecords(db: DB, dbData: DamtInterface) {
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
    `\nShowing latest '5' records of '${dbData.dbRecordCount}' records.`,
  );
  latestRecordsQuery.finalize();
}

//** Obtain the total number of acronym records in the database
function recordCount(db: DB): string {
  return db
    ? (db.query("select count(*) from acronyms;")).toLocaleString()
    : "ERROR";
}

//** Obtain the SQLite version
function sqliteVersion(db: DB): string {
  return db ? (db.query("select sqlite_version();")).toString() : "ERROR";
}

//** Obtain the last acronym (ie newest) entered into the database
function lastAcronym(db: DB): string {
  return db
    ? (db.query("select acronym from acronyms order by rowid desc limit 1;"))
      .toString()
    : "ERROR";
}

//** Complete the population of the remaining data values in the DamtInterface
function dbDataPopulate(db: DB, dbData: DamtInterface) {
  if (db) {
    dbData.dbSqliteVersion = sqliteVersion(db);
    dbData.dbNewestAcronym = lastAcronym(db);
    dbData.dbRecordCount = recordCount(db);
  }
}

// sqlite3_prepare_v2(amtdb->db,
// "select rowid,ifnull(Acronym,''), "
// "ifnull(Definition,''), "
// "ifnull(Source,''), "
// "ifnull(Description,'') "
// "from ACRONYMS "
// "Order by rowid DESC LIMIT 5;",

//select rowid,ifnull(Acronym,''),ifnull(Definition,''),ifnull(Source,''), ifnull(Description,''),ifnull(Changed,'') from ACRONYMS Order by rowid DESC LIMIT 5;

//----------------------------------------------------------------
// MAIN : Deno script execution start
//----------------------------------------------------------------

if (import.meta.main) {
  const dbData = await setDbData().catch((e) =>
    console.error(`Exit as database file not found:\n${e}`)
  );
  if (!isObject(dbData)) {
    console.error("ERROR creating database data object");
  } else {
    //console.table(dbData);
    const db = openDB(dbData);
    if (db) {
      dbDataPopulate(db, dbData);
      //console.table(dbData);
    }
    if (db) {
      dbDataPopulate(db, dbData);

      // only returns if execCliArgs() did not find options to execute
      if (Deno.args.length > 0) await execCliArgs(db, dbData);

      // Check if search is needed
      if (Deno.args.length === 1) {
        console.log(`Trying search with: '${Deno.args[0]}'`);
        dbSearch(Deno.args[0], db, dbData);
      } else {
        await printVersionInfo();
        printDbInfo(dbData);
        printHelp();
      }
    }
    // close the database
    if (db) {
      db.close();
    }
  }
}
