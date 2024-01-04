//
// Copyright 2023 Simon Rowe (simon@wiremoons.com).
//
/// Misc supporting functions to perform system utility actions in support of
/// the main application.
///
library;

// Disable some specific linting rules in this file only
// ignore_for_file: unnecessary_brace_in_string_interps, unnecessary_string_interpolations
import 'dart:io';
import 'dart:math';
import 'package:path/path.dart' as p;

/// Set execute permissions on parameter [file].
///
/// Dart has no ability to change a file permissions so the Unix command line
/// program `chmod` is called instead. The provided [file] name has its
/// permissions set to `755`. Only executes the command on non Windows platforms.
/// Possible improvements: check file exists first; return OK or error record;
Future<void> makeExecutable(File file) async {
  if (!Platform.isWindows) {
    ProcessResult result = await Process.run("chmod", ["755", file.path]);
    if (result.exitCode != 0) {
      stderr.writeln(
          "\n\n [!] ERROR: failed to set execute file permissions for file: '${file}' due to: '${result.stderr}'");
    }
  }
}

/// Identify a suitable directory to download and save working files too.
///
/// Return the path to a directory that can be used to work on files that require
/// further processing.
/// Will use [$HOME/scratch] by default - will create it if it does not exist.
Future<String> setDownLoadPath() async {
  final homePath = homePathLocation();
  //
  // check for $HOME/scratch - create it if does not exist
  final downLoadPath = p.join(homePath, "scratch");
  if (!await Directory(downLoadPath).exists()) {
    stdout.writeln(" [!]  Creating download directory: '${downLoadPath}'");
    await Directory(downLoadPath).create(recursive: true);
  }
  return downLoadPath;
}

/// Locate the Users 'HOME' or 'USERPROFILE' directory.
///
/// Check for an environment variable `%USERPROFILE%` on Windows or on other
/// systems use environment variable '$HOME' and return the result. On failure
/// return an empty string.
String homePathLocation() {
  // Account for no 'HOME' environment variable on Windows:
  final envHomePath = Platform.isWindows
      ? Platform.environment["USERPROFILE"]
      : Platform.environment["HOME"];
  if (envHomePath == null || envHomePath.isEmpty) {
    stderr.writeln(
        "\n  ERROR: either '\$HOME' or '%USERPROFILE%' not found in environment variables - deletion failure.");
    return "";
  }
  return envHomePath;
}

/// Show the size of a file with the correct suffix such as 'MB' or 'GB' etc
//
// For the provided filename and path [filePath] - check the file size and return it as a String
// with an appended suffix to reflect if it is 'MB', 'TB', etc.
// The [displayDecimals] parameter controls how many decimal places should be included in the
// file size string.
Future<String> fileSizeAsString(String filePath, int displayDecimals) async {
  // TODO: check for non existent file scenario before checking its length?
  int bytes = await File(filePath).length();
  if (bytes <= 0) return "0 B";
  const sizeSuffixes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  var i = (log(bytes) / log(1024)).floor();
  return "${(bytes / pow(1024, i)).toStringAsFixed(displayDecimals)} ${sizeSuffixes[i]}";
}

/// Locate the full path to the specificed program
///
/// Search the [PATH] environment for the stated program filename, appending *.exe*
/// to the filename provided, if executing on a Windows system.
/// If found return the full path to the program as a [String].
Future<String> findAppInPath(String appName) async {
  // check the environment [PATH] for 'appName' or 'appName.exe' file
  // Use [splitChar] as Windows and Unix delimit env PATH with ';' or ':'
  String splitChar = Platform.isWindows ? ";" : ":";
  final envPath = Platform.environment["PATH"]?.split(splitChar);
  if (envPath == null || envPath.isEmpty) {
    stderr.writeln("\n  [!] ERROR: no 'PATH' environment variables found.");
    return "";
  }
  //
  // final path = envPath.firstWhere((path) => await exeFileExists(path), orElse: () => "");
  //
  // check each environment PATH entry for a dart file - return on first found
  for (final path in envPath) {
    if (await exeFileExists(path, appName)) {
      // the dart executable is normally in the Dart SDK 'bin/' sub directory - so trim the path
      // Ensure the '/bin' or '\bin' element is managed cross platform
      String binValue = "${Platform.pathSeparator}bin";
      final idx = path.lastIndexOf(binValue);
      return idx == -1 ? path : path.substring(0, idx);
    }
  }
  return "";
}

/// Check the provided [dirPath] for a file named [appName.exe] or [appName].
///
/// Confirm if the [appName] exists in the provided directory path [dirPath]
Future<bool> exeFileExists(String dirPath, String appName) async {
  if ((dirPath.isEmpty) || (appName.isEmpty)) {
    stderr.writeln(
        "\n  [!] ERROR: no path ['$dirPath'] or executable ['$appName'] found.");
    return false;
  }
  // set correct 'AppName executable name as different on Windows as will hace '.exe' suffix
  final findExe = Platform.isWindows ? "${appName}.exe" : appName;
  // check of the executable exists at the provided path
  final exePath = File(p.join(dirPath, findExe));
  return await exePath.exists();
}

/// Obtain the [file] last modified date if the file exists and return it.
///
///
Future<String> fileLastModified(String file) async {
  if (await File(file).exists()) {
    try {
      DateTime fileDT = await File(file).lastModified();
      return fileDT.toLocal().toString();
    } catch (e) {
      stderr.writeln("ERROR: unable to obtain '$file}' modified time: {e}");
      return "UNKNOWN";
    }
  }
  return "UNKNOWN";
}

// Return just the path element of a full path - so removing any file name.
//
//
Future<(String, bool)> directoryNameOnly(String filePath) async {
  if (await File(filePath).exists()) {
    return (p.dirname(filePath), true);
  }
  return ("", false);
}
