#!/bin/bash
srcDir=$(realpath $(dirname "$(realpath $0)")/..)

cd $srcDir
npm install browserify
npm install --legacy-peer-deps
browserify test.js --standalone symSpell -o symSpell.js
