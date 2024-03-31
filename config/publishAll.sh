#!/bin/bash
srcDir=$(realpath $(dirname "$(realpath $0)")/..)
dstDir=$1
mkdir -p $dstDir

cd $srcDir/config
./publish.sh $dstDir

cd $srcDir/InsectsInFoodChecker/config
./publish.sh $dstDir/InsectsInFoodChecker
