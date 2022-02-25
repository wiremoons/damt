#!/usr/bin/env -S deno run --quiet --allow-read
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
import {cliVersion} from "https://deno.land/x/deno_mod@0.7.4/mod.ts";
import { parse } from "https://deno.land/std@0.127.0/flags/mod.ts";
import { basename } from "https://deno.land/std@0.127.0/path/mod.ts";
import { underline, bold, blue } from "https://deno.land/std@0.127.0/fmt/colors.ts";
import { DB } from "https://deno.land/x/sqlite@v3.2.1/mod.ts";

//--------------------------------
// COMMAND LINE ARGS FUNCTIONS
//--------------------------------

/** Define the command line argument switches and options to be used */
const cliOpts = {
  default: { h: false, s:false, v: false },
  alias: { h: "help", s: "search", v: "version" },
  stopEarly: true,
  unknown: showUnknown,
};

/** define options for `cliVersion()` function for application version data */
const versionOptions = {
  version: "0.1.0",
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

//--------------------------------
// APPLICATION FUNCTIONS
//--------------------------------

/** Return the name of the currently running program without the path included. */
function getAppName(): string {
  return `${basename(Deno.mainModule) ?? "UNKNOWN"}`;
}

function dbSetup() {

}


function dbSearch(){
  console.log(`${underline("Search function called\n")}`);
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
// MAIN
//--------------------------------
if (import.meta.main) {
  console.log(`${blue(getAppName())} is running...`);

  if (Deno.args.length > 0) await getCliArgs();



}





