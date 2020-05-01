#!/usr/bin/env bash
# You need deno to run tests... get it from https://deno.land
deno run --importmap ./import_map.json examples/tap/example.test.ts
