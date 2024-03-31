class IngredientsWithInsectsFinder {

    #spellingCorrector;
    #unwantedIngredientsPatterns;

    constructor() {
        this.#spellingCorrector = new SpellingCorrector();
        this.#unwantedIngredientsPatterns = UnwantedIngredientsPatternsFactory.createUnwantedIngredientsPatterns();
    }

    findIngredientsWithInsects(ingredients) {
        const {
            normalizedText: normalizedIngredients,
            normalizedTextIndex2TextIndex: normalizedTextIndex2TextIndex
        } = TextNormalizer.removeHyphenFromCompoundWords(ingredients);

        const {
            correctedText: correctedNormalizedIngredients,
            correctedTextIndex2TextIndex: correctedTextIndex2TextIndex
        } = this.#spellingCorrector.correctText(normalizedIngredients);

        return {
            matches: this.#unwantedIngredientsPatterns.findAllMatches(correctedNormalizedIngredients),
            indexMapper: IndexMapper.combineIndexMappings(normalizedTextIndex2TextIndex, correctedTextIndex2TextIndex)
        };
    }
}