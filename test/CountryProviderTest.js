QUnit.module('CountryProviderTest', function () {

    QUnit.test.each(
        'getCountry',
        [
            [new URLSearchParams("?country=Germany"), 'Australia/Sydney', CountryController.ALL_COUNTRIES, 'Germany'],
            [new URLSearchParams("?country=Germany"), 'Europe/Berlin', CountryController.ALL_COUNTRIES, 'Germany'],
            [new URLSearchParams(""), 'Europe/Berlin', CountryController.ALL_COUNTRIES, 'Germany'],
            [new URLSearchParams(""), 'dummyCountry/dummyCity', CountryController.ALL_COUNTRIES, CountryController.ALL_COUNTRIES]
        ],
        (assert, [urlSearchParams, timeZone, defaultValue, countryExpected]) => {
            // Given

            // When
            const country = CountryProvider.getCountry(urlSearchParams, timeZone, defaultValue);

            // Then
            assert.equal(country, countryExpected);
        });
});