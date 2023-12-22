[![damt](https://github.com/wiremoons/damt/actions/workflows/dart.yml/badge.svg)](https://github.com/wiremoons/damt/actions/workflows/dart.yml)

# damt

Acronym Management Tool - written in Dart



## SQLite3 Supporting Libraries

To use a SQLite database with the application the *SQLite3* shared library is needed. It can be obtained freely as follows:

- *Fedora 38:* `sudo dnf install sqlite-devel`
- *Debian* or *Ubuntu:* `sudo apt install libsqlite3-dev`
- *macOS:* already included with macOS
- *Windows:* download the **DLL** file from the [SQLite3 Downloads](https://www.sqlite.org/download.html) page under the section: *Precompiled Binaries for Windows*.

On Windows, just place the downloaded `sqlite3.dll` file in the same folder as a the `damt.exe` program.


### Build an SQLite Shared Library on Linux

If you want to just build you own *SQLite* shared library on a Linux operation system, the steps below can be used.
This approach might be useful if you are running an OS such as Fedora Silverblue and dont want to layer in the package,
but do needed it for a specific application, so just want to have a shared library available.

To create a dynamic shared library for use on a Linux operating system, the following steps can be used:

1. Ensure you have GCC or equivalent C compiler installed.
2. Download the latest **SQLite amalgamation source code**: https://www.sqlite.org/download.html
3. Unzip the downloaded code and then run in the new directory containing the extract files:

```gcc
gcc -fPIC -shared -rdynamic sqlite3.c -o libsqlite3.so 
```

The output file **libsqlite3.so** is the shared library file that can be used with an application. For example to use it with `damt` just copy the file to the same directory as the program.
