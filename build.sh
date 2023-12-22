#!/usr/bin/env zsh
#
# Dart AOT Build file for '$DARTAPP' - set name below:

DARTAPP="damt"

##############################################################################
#  HELPER FUNCTION: check_status
#  Check to ensure any command run has a 0 exit code - otherwise abort
##############################################################################
check_status () {
  local LAST_EXIT_CODE=$?
  #printf "Exit code: '%s'\n" "$LAST_EXIT_CODE"
  if [[ $LAST_EXIT_CODE -ne 0 ]]; then
    printf "\n\n ❌ ERROR: last command failed with exit code: '%s'.\nABORT.\n\n" "$LAST_EXIT_CODE"
    exit -99
  fi
  return
}

printf "\n\n [*]  Running 'dart pub update' to check packages are current...\n\n"
dart pub update
check_status
printf "\n\n [*]  Running 'dart format' to check source code files...\n\n"
# to apply formating fixes run:  dart format .
dart format --output=none --set-exit-if-changed .
check_status
printf "\n\n [*]  Running 'dart analyse' to check source code files...\n\n"
dart analyze
check_status
printf "\n\n [*]  Running 'dart fix' to check source code files...\n\n"
# to apply fixes run:  dart fix 
dart fix -n
check_status
printf "\n\n [*]  Building '%s'...\n\n" "$DARTAPP"
if [[ ! -d ./build ]]; then
  mkdir ./build
  check_status
fi
dart compile exe -DDART_BUILD="Built on: $(date '+%a %d %b %Y @ %H:%M:%S %Z')" ./bin/$DARTAPP.dart -o ./build/$DARTAPP
check_status
printf "\n [✔]  Build completed.  Run: ./build/%s\n" "$DARTAPP"
