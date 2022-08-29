#!/bin/bash

SOURCE_JS=( jqueryPatch.js colResize.js gramjs.js tagConfig.js \
  scraper.js ui.js main.js )

./prepare-index source.html > dist/index.html
npx terser --output dist/out.js \
  --compress --mangle -- \
  "${SOURCE_JS[@]}"

