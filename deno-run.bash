#!/usr/bin/env bash
# You need deno to run this... get it from https://deno.land
deno run --importmap ./import_map.json "$@"
