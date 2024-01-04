//
// Copyright 2023 Simon Rowe (simon@wiremoons.com).
//
/// Input: a string containing the question to ask the user
/// Returns: a boolean where user response is: true == yes || false == no
/// Description: the question string is printed to the screen so the
/// user can respond with a 'yes' or 'no' response. Accepts different
/// forms of 'yes' or 'no' to suit the user preferred approach to
/// answering.
//
library;

import 'dart:io';

bool yesNo({required String question}) {
  if (question.isEmpty) return false;

  while (true) {
    stdout.write("\n  >>  ${question}? [y/N] : ");
    String response = stdin.readLineSync()!.trim().toLowerCase();
    stdout.writeln("");
    if (response.compareTo("y") == 0) return true;
    if (response.compareTo("n") == 0) return false;
    stderr.writeln("ERROR: no match to requested input - please try again.");
  }
}
