QUnit.module('TextNormalizerTest', function () {

    QUnit.test('shouldRemoveHyphenFromCompoundWords_singleWord', function (assert) {
        test_removeHyphenFromCompoundWords('Glukose- sirup', 'Glukosesirup', assert);
    });

    QUnit.test('shouldRemoveHyphenFromCompoundWords_multipleWords', function (assert) {
        test_removeHyphenFromCompoundWords(
            'Vollkorn-Haferflocken, Voll- korn-Weizenflocken, Glukose-Fruktose- Sirup, Hafer-Vollkornmehl, Glukose- sirup',
            'Vollkorn-Haferflocken, Vollkorn-Weizenflocken, Glukose-FruktoseSirup, Hafer-Vollkornmehl, Glukosesirup',
            assert);
    });

    function test_removeHyphenFromCompoundWords(text, normalizedTextExpected, assert) {
        // Given

        // When
        const { normalizedText: normalizedTextActual } = TextNormalizer.removeHyphenFromCompoundWords(text);

        // Then
        assert.equal(normalizedTextActual, normalizedTextExpected);
    }

    QUnit.test('test_removeHyphenFromCompoundWords_normalizedTextIndex2TextIndex', function (assert) {
        // Given
        //                              0123
        const text              /**/ = 'A- B';
        const normalizedTextExpected = 'AB';

        // When
        const { normalizedText: normalizedTextActual, normalizedTextIndex2TextIndex } = TextNormalizer.removeHyphenFromCompoundWords(text);

        // Then
        assert.equal(normalizedTextActual, normalizedTextExpected);
        assert.deepEqual(
            normalizedTextIndex2TextIndex,
            [
                /* 'A' index = 0 */ 0, // 'A' is now at index 0 in normalizedText and was at index 0 in text
                /* 'B' index = 1 */ 3  // 'B' is now at index 1 in normalizedText and was at index 3 in text
            ]);
    });
});
