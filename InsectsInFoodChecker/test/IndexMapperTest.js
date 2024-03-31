QUnit.module('IndexMapperTest', function () {

    QUnit.test('test_combineIndexMappings', function (assert) {
        // Given
        const {
            normalizedText: normalizedIngredients,
            normalizedTextIndex2TextIndex: indexMapping1
        } = TextNormalizer.removeHyphenFromCompoundWords(', Mehl- wrm, ');
        assert.deepEqual(
            [
                /* ',' index =  0 */ 0,
                /* ' ' index =  1 */ 1,
                /* 'M' index =  2 */ 2,
                /* 'e' index =  3 */ 3,
                /* 'h' index =  4 */ 4,
                /* 'l' index =  5 */ 5,
                /* 'w' index =  6 */ 8,
                /* 'r' index =  7 */ 9,
                /* 'm' index =  8 */ 10,
                /* ',' index =  9 */ 11,
                /* ' ' index = 10 */ 12
            ],
            indexMapping1);
        const {
            correctedText: correctedNormalizedIngredients,
            correctedTextIndex2TextIndex: indexMapping2
        } = new SpellingCorrector().correctText(normalizedIngredients);
        assert.deepEqual(
            [
                /* ',' index =  0 */ 0,
                /* ' ' index =  1 */ 1,
                /* 'M' index =  2 */ 2,
                /* 'e' index =  3 */ 2,
                /* 'h' index =  4 */ 2,
                /* 'l' index =  5 */ 2,
                /* 'w' index =  6 */ 8,
                /* 'u' index =  7 */ 8,
                /* 'r' index =  8 */ 8,
                /* 'm' index =  9 */ 8,
                /* ',' index = 10 */ 9,
                /* ' ' index = 11 */ 10
            ],
            indexMapping2);

        // When
        const combinedIndexMapping = IndexMapper.combineIndexMappings(indexMapping1, indexMapping2);

        // Then
        assert.deepEqual(
            combinedIndexMapping,
            [
                /* ',' index =  0 */ 0,
                /* ' ' index =  1 */ 1,
                /* 'M' index =  2 */ 2,
                /* 'e' index =  3 */ 2,
                /* 'h' index =  4 */ 2,
                /* 'l' index =  5 */ 2,
                /* 'w' index =  6 */ 10,
                /* 'u' index =  7 */ 10,
                /* 'r' index =  8 */ 10,
                /* 'm' index =  9 */ 10,
                /* ',' index = 10 */ 11,
                /* ' ' index = 11 */ 12
            ]);
    });
});
