class IngredientsWithInsectsFinder {

    #spellingCorrector;

    constructor() {
        this.#spellingCorrector = new SpellingCorrector();
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
            matches: Synonyms.findAllMatches(UnwantedIngredientsProvider.synonyms, correctedNormalizedIngredients),
            indexMapper: IndexMapper.combineIndexMappings(normalizedTextIndex2TextIndex, correctedTextIndex2TextIndex)
        };
    }
}