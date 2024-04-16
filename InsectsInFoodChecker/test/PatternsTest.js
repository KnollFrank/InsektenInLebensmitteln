QUnit.module('PatternsTest', function () {

    QUnit.test('shouldfindAllMatches', function (assert) {
        // Given
        const patterns =
            [
                new Pattern('Schellack', /Schellack/gi),
                new Pattern('E120', /E120/g)
            ];

        // When
        const matches = Patterns.findAllMatches(patterns, 'SchelLACK, Zucker, E120');

        // Then
        assert.deepEqual(
            matches,
            [
                {
                    pattern: 'Schellack',
                    matchedStr: 'SchelLACK',
                    startIndex: 0,
                },
                {
                    pattern: 'E120',
                    matchedStr: 'E120',
                    startIndex: 19
                }
            ]);
    });

    QUnit.test('test_findAllMatches_multipleOccurences', function (assert) {
        // Given
        const patterns = [new Pattern('E120', /E120/g)];

        // When
        const matches = Patterns.findAllMatches(patterns, 'E120, Zucker, E120');

        // Then
        assert.deepEqual(
            matches,
            [
                {
                    pattern: 'E120',
                    matchedStr: 'E120',
                    startIndex: 0
                },
                {
                    pattern: 'E120',
                    matchedStr: 'E120',
                    startIndex: 14
                }
            ]);
    });

    QUnit.test('shouldfindAllMatches2', function (assert) {
        // Given
        const patterns =
            [
                new Pattern('Alphitobius diaperinus', /Alphitobius\s+diaperinus/g)
            ];

        // When
        const matches = Patterns.findAllMatches(patterns, 'Alphitobius    diaperinus');

        // Then
        assert.deepEqual(
            matches,
            [
                {
                    pattern: 'Alphitobius diaperinus',
                    matchedStr: 'Alphitobius    diaperinus',
                    startIndex: 0
                }
            ]);
    });
});