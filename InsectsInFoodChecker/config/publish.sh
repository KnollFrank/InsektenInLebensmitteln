#!/bin/bash
srcDir=$(realpath $(dirname "$(realpath $0)")/..)
dstDir=$1

# publish InsectsInFoodChecker/node-symspell
# FK-FIXME: reactivate
# cd $srcDir/node-symspell/config
# ./publish.sh

# publish InsectsInFoodChecker
cd $srcDir
mkdir -p $dstDir

mkdir -p $dstDir/highlight-within-textarea/
cp ./highlight-within-textarea/jquery.highlight-within-textarea.js $dstDir/highlight-within-textarea/

mkdir -p $dstDir/node-symspell
cp ./node-symspell/symSpell.js $dstDir/node-symspell/

cp -t $dstDir/ \
   ./UnaryFunctionCache.js \
   ./Pattern.js \
   ./Patterns.js \
   ./Synonym.js \
   ./Synonyms.js \
   ./UnwantedIngredientsProvider.js \
   ./TextNormalizer.js \
   ./IndexMapper.js \
   ./WordWithinTextFinder.js \
   ./SpellingCorrector.js \
   ./HighlightWithinTextarea.js \
   ./IngredientsWithInsectsFinder.js \
   ./IngredientsWithInsectsHtmlProvider.js \
   ./InsectsInFoodCheckerActivity.js
mkdir -p $dstDir/css/
cp css/style.css $dstDir/css/
cp highlight-within-textarea/jquery.highlight-within-textarea.css $dstDir/highlight-within-textarea/jquery.highlight-within-textarea.css

cp index.html $dstDir/index.html
# cp privacy.html ~/DotToDot/
