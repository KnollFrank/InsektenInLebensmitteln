QUnit.module('UnwantedIngredientsPatternsFactoryTest', function () {

    QUnit.test('shouldfindAllMatches', function (assert) {
        // Given
        const unwantedIngredientsPatterns = UnwantedIngredientsPatternsFactory.createUnwantedIngredientsPatterns();

        // When
        const matches = unwantedIngredientsPatterns.findAllMatches(
            `E120, Schildlaus, Karmin, E904, Schellack, Tenebrio molitor,
            Mehlkäfer, Mehlwurm, Locusta migratoria, Wanderheuschrecke, Acheta domesticus,
            Hausgrille, Alphitobius diaperinus, Buffalowurm, Getreideschimmelkäfer`);

        // Then
        assert.deepEqual(
            matches.map(match => match.pattern),
            [
                'E120',
                'Schildlaus',
                'Karmin',
                'E904',
                'Schellack',
                'Tenebrio molitor',
                'Mehlkäfer',
                'Mehlwurm',
                'Locusta migratoria',
                'Wanderheuschrecke',
                'Acheta domesticus',
                'Hausgrille',
                'Alphitobius diaperinus',
                'Buffalowurm',
                'Getreideschimmelkäfer'
            ]);
    });
});