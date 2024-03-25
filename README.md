[![damt](https://github.com/wiremoons/damt/actions/workflows/deno.yml/badge.svg)](https://github.com/wiremoons/damt/actions/workflows/deno.yml)

# damt

Acronym Management Tool - written in _Typescript_ for the
[Deno](https://deno.land/) runtime.

## Installation and Usage

You will need to have a copy of the _Deno_ runtime installed on your computer.
Instructions to achieve this are available from the _Deno_ web page here:
[https://docs.deno.com/runtime/manual/getting_started/installation](https://docs.deno.com/runtime/manual/getting_started/installation).

The installation of _Deno_ is easy, as it is just a single binary executable
file - just download a copy and add it to a directory in your path.

Once _Deno_ is installed, the `damt.ts` source can be run directly with the
command:

```console
deno run --quiet --allow-read --allow-env=ACRODB --allow-write --unstable-temporal https://raw.githubusercontent.com/wiremoons/damt/main/damt.ts
```

The program can be run with _Deno_ using a local copy the file `damt.ts` and the
commands listed below. Clone this repo with `` to obtain a local copy first.

To run the program using the local copy of the `damt.ts` file:

```console
deno run --quiet --allow-read --allow-env=ACRODB --allow-write --unstable-temporal damt.ts
```

A local copy fo the `damt.ts` file can be installed to '`DENO_INSTALL_ROOT`' to
using the command:

```console
`deno install -f --quiet --allow-read --allow-env=ACRODB --allow-write --unstable-temporal damt.ts`
```

A local copy of the program can be compiled using the command:

```console
deno compile --quiet --allow-read --allow-env=ACRODB --allow-write --unstable-temporal damt.ts
```

## Database Setup

WIP

## License

Licensed with the [MIT License](./LICENSE).
