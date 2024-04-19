QUnit.module('CountryProviderTest', function () {

    QUnit.test.each(
        'shouldGetCountry',
        [
            ['Australia/Sydney', 'Australia'],
            ['Europe/Berlin', 'Germany'],
            ['dummyCountry/dummyCity', undefined]
        ],
        (assert, [timeZone, countryExpected]) => {
            // Given

            // When
            const country = CountryProvider.getCountry(timeZone);

            // Then
            assert.equal(country, countryExpected);
        });
});