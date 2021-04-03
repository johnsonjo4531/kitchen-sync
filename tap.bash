#!/usr/bin/env bash
# You need deno to run tests... get it from https://deno.land
deno run --unstable --importmap ./import_map.json examples/deno/tap/example2.test.ts
