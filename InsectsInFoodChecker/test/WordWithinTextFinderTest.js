QUnit.module('WordWithinTextFinderTest', function () {

    QUnit.test.each(
        'findWordWithinText_prefixWordSuffix',
        [
            [
                ', Hausgrle,',
                {
                    prefix: ', ',
                    word: 'Hausgrle',
                    suffix: ','
                }
            ],
            [
                '(E120)',
                {
                    prefix: '(',
                    word: 'E120',
                    suffix: ')'
                }
            ],
            [
                '[E120]',
                {
                    prefix: '[',
                    word: 'E120',
                    suffix: ']'
                }
            ],
            [
                'Hausgrille',
                {
                    prefix: '',
                    word: 'Hausgrille',
                    suffix: ''
                }
            ],
            [
                ' ',
                null
            ]
        ],
        function (assert, [text, prefixWordSuffix]) {
            // Given

            // When
            const prefixWordSuffixActual = WordWithinTextFinder.findWordWithinText(text);

            // Then
            assert.deepEqual(prefixWordSuffixActual, prefixWordSuffix, `"${text}" => ${JSON.stringify(prefixWordSuffix)}`);
        });

    QUnit.test('findWordWithinText_null', function (assert) {
        // Given
        const text = '';

        // When
        const prefixWordSuffix = WordWithinTextFinder.findWordWithinText(text);

        // Then
        assert.strictEqual(prefixWordSuffix, null);
    });
});
