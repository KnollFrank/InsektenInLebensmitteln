QUnit.module('UnwantedIngredientsProviderTest', function () {

    QUnit.test('shouldFindAllMatches', function (assert) {
        // Given
        const unwantedIngredientsSynonyms = UnwantedIngredientsProvider.synonyms;

        // When
        const matches =
            Synonyms.findAllMatches(
                unwantedIngredientsSynonyms,
                `E120, E 120, Schildlaus, Karmin, E904, E  904, Schellack, Tenebrio molitor,
                 Mehlkäfer, Mehlwurm, Locusta migratoria, Wanderheuschrecke, Acheta domesticus,
                 Hausgrille, HausGrille, Alphitobius diaperinus, Buffalowurm, Getreideschimmelkäfer`);

        // Then
        assert.deepEqual(
            matches.map(match => match.pattern),
            [
                'E120',
                'E120',
                'Schildlaus',
                'Karmin',
                'E904',
                'E904',
                'Schellack',
                'Tenebrio molitor',
                'Mehlkäfer',
                'Mehlwurm',
                'Locusta migratoria',
                'Wanderheuschrecke',
                'Acheta domesticus',
                'Hausgrille',
                'Hausgrille',
                'Alphitobius diaperinus',
                'Buffalowurm',
                'Getreideschimmelkäfer'
            ]);
    });
});