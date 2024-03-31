#!/bin/bash
srcDir=$(realpath $(dirname "$(realpath $0)")/..)
dstDir=$1
cd $srcDir

mkdir -p $dstDir/graphology
cp -t $dstDir/graphology/ \
   graphology/graphology.js \
   graphology/graphology-library.js

cp -t $dstDir/ \
   Utils.js \
   UrlUtils.js \
   UIUtils.js \
   Graphs.js \
   Config.js \
   ProductCardViewFactory.js \
   CategoryCardViewFactory.js \
   ProductsView.js \
   CategoriesView.js \
   ProductsViewActivity.js \
   Node.js \
   Navigation.js \
   CategoriesGraphProvider.js \
   ProductsProvider.js \
   ProductsAndCategoriesProvider.js \
   ProductsAndCategoriesView.js \
   NodeView.js \
   ProductsOfNodesSetter.js \
   ProductSearcher.js \
   SearchController.js \
   DisplayNamesOfNodesSetter.js \
   NavigationController.js \
   Overlay.js \
   InfoDialogController.js \
   CountryController.js \
   StoreController.js \
   ProductFilter.js
mkdir -p $dstDir/css
cp css/style.css $dstDir/css/

rm -fr $dstDir/data/
mkdir -p $dstDir/data/
cp -r data/* $dstDir/data/

mkdir -p $dstDir/img
cp img/* $dstDir/img/
cp index.html $dstDir/index.html
# cp privacy.html ~/DotToDot/
