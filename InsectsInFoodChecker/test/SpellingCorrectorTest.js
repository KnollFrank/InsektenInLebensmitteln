QUnit.module('SpellingCorrectorTest', function () {

    QUnit.test.each(
        'shouldCorrectWordWithinString',
        [
            ["Zutaten", "Zutaten"],
            ["Zutten", "Zutaten"],

            ["Vanillin", "Vanillin"],

            // unwantedIngredients:
            ["Locusta", "Locusta"],
            ["Locosta", "Locusta"],

            ["Wanderheuschrecke", "Wanderheuschrecke"],
            ["Wanberheuschrecke", "Wanderheuschrecke"],

            ["E120", "E120"],

            ["Schildlaus", "Schildlaus"],
            ["SchildIaus", "Schildlaus"],

            ["Karmin", "Karmin"],
            ["Karmln", "Karmin"],

            ["E904", "E904"],

            ["Schellack", "Schellack"],
            ["Schelack", "Schellack"],

            ["Mehlkäfer", "Mehlkäfer"],
            ["Mehlkafer", "Mehlkäfer"],

            ["Mehlwurm", "Mehlwurm"],
            ["Mehlwürm", "Mehlwurm"],

            ["Mehlwürmer", "Mehlwürmer"],
            ["Mehlwurmer", "Mehlwürmer"],

            ["Hausgrille", "Hausgrille"],
            ["Hausgrle", "Hausgrille"],
            [", Hausgrle,", ", Hausgrille,"],

            ["Buffalowurm", "Buffalowurm"],
            ["Boffalawurm", "Buffalowurm"],

            ["Buffalowürmer", "Buffalowürmer"],
            ["Buffalowurmer", "Buffalowürmer"],

            ["Getreideschimmelkäfer", "Getreideschimmelkäfer"],
            ["Getreldeschimmelkafer", "Getreideschimmelkäfer"],

            // normal ingredients
            ["unknown", "unknown"],
            ["E320", "E320"]
        ],
        (assert, [word, correction]) => {
            // Given
            const spellingCorrector = new SpellingCorrector();

            // When
            const { correctedText: correctionActual } = spellingCorrector.correctWordWithinString(word);

            // When & Then
            assert.equal(correctionActual, correction, `${word} => ${correction}`);
        });

    QUnit.test.each(
        'shouldCorrectText',
        [
            [
                "Locsta miaratoria, E121, Alphitoblus diaperinus, Scheliack",
                "Locusta migratoria, E121, Alphitobius diaperinus, Schellack"
            ],
            [", Hausgrle,", ", Hausgrille,"],
            [", Loousta migratoria, ", ", Locusta migratoria, "],
            ["Locusta migratoria", "Locusta migratoria"],
            ["Locusta   migratoria", "Locusta   migratoria"]
        ],
        (assert, [text, correctedText]) => {
            // Given
            const spellingCorrector = new SpellingCorrector();

            // When
            const { correctedText: correctedTextActual } = spellingCorrector.correctText(text);

            // When & Then
            assert.equal(correctedTextActual, correctedText, `${text} => ${correctedText}`);
        });

    QUnit.test('test_correctWordWithinString_correctedTextIndex2TextIndex', function (assert) {
        // Given
        const spellingCorrector = new SpellingCorrector();
        //                             012345678
        const text             /**/ = ', Kamin,';
        const correctedTextExpected = ', Karmin,';

        // When
        const { correctedText: correctedTextActual, correctedTextIndex2TextIndex } = spellingCorrector.correctWordWithinString(text);

        // Then
        assert.equal(correctedTextActual, correctedTextExpected);
        assert.deepEqual(
            correctedTextIndex2TextIndex,
            [
                /* ',' index = 0 */ 0,
                /* ' ' index = 1 */ 1,
                /* 'K' index = 2 */ 2, // 'K' is now at index 2 in correctedText and was at index 2 in text
                /* 'a' index = 3 */ 2,
                /* 'r' index = 4 */ 2,
                /* 'm' index = 5 */ 6,
                /* 'i' index = 6 */ 6,
                /* 'n' index = 7 */ 6, // 'n' is now at index 7 in correctedText and was at index 6 in text
                /* ',' index = 8 */ 7
            ]);
    });

    QUnit.test('test_correctWordWithinString_correctedTextIndex2TextIndex_whiteSpace', function (assert) {
        // Given
        const spellingCorrector = new SpellingCorrector();
        //                             01
        const text             /**/ = '  ';
        const correctedTextExpected = text;

        // When
        const { correctedText: correctedTextActual, correctedTextIndex2TextIndex } = spellingCorrector.correctWordWithinString(text);

        // Then
        assert.equal(correctedTextActual, correctedTextExpected);
        assert.deepEqual(
            correctedTextIndex2TextIndex,
            [
                /* ' ' index = 0 */ 0,
                /* ' ' index = 1 */ 1,
            ]);
    });

    QUnit.test('test_correctText_correctedTextIndex2TextIndex', function (assert) {
        // Given
        const spellingCorrector = new SpellingCorrector();
        //                             0         1         2
        //                             012345678901234567890
        const text             /**/ = 'Hausgrle, Scheliack';
        const correctedTextExpected = 'Hausgrille, Schellack';

        // When
        const { correctedText: correctedTextActual, correctedTextIndex2TextIndex } = spellingCorrector.correctText(text);

        // Then
        assert.equal(correctedTextActual, correctedTextExpected);
        assert.deepEqual(
            correctedTextIndex2TextIndex,
            // FK-TODO: use Map instead of array?
            [
                /* 'H' index =  0 */ 0, // 'H' is now at index 0 in correctedText and was at index 0 in text
                /* 'a' index =  1 */ 0,
                /* 'u' index =  2 */ 0,
                /* 's' index =  3 */ 0,
                /* 'g' index =  4 */ 0,
                /* 'r' index =  5 */ 7,
                /* 'i' index =  6 */ 7,
                /* 'l' index =  7 */ 7,
                /* 'l' index =  8 */ 7,
                /* 'e' index =  9 */ 7, // 'e' is now at index 9 in correctedText and was at index 7 in text
                /* ',' index = 10 */ 8,
                /* ' ' index = 11 */ 9,
                /* 'S' index = 12 */ 10, // 'S' is now at index 12 in correctedText and was at index 10 in text
                /* 'c' index = 13 */ 10,
                /* 'h' index = 14 */ 10,
                /* 'e' index = 15 */ 10,
                /* 'l' index = 16 */ 18,
                /* 'l' index = 17 */ 18,
                /* 'a' index = 18 */ 18,
                /* 'c' index = 19 */ 18,
                /* 'k' index = 20 */ 18, // 'k' is now at index 20 in correctedText and was at index 18 in text
            ]);
    });
});