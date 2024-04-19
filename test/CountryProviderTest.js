QUnit.module('CountryProviderTest', function () {

    QUnit.test.each(
        'getCountry',
        [
            [
                // urlSearchParams wins
                {
                    urlSearchParams: new URLSearchParams("?country=Germany"),
                    timeZone: 'Australia/Sydney',
                    defaultValue: CountryController.ALL_COUNTRIES,
                    countryExpected: 'Germany'
                }
            ],
            [
                // urlSearchParams wins
                {
                    urlSearchParams: new URLSearchParams("?country=Germany"),
                    timeZone: 'Europe/Berlin',
                    defaultValue: CountryController.ALL_COUNTRIES,
                    countryExpected: 'Germany'
                }
            ],
            [
                // timeZone wins
                {
                    urlSearchParams: new URLSearchParams(""),
                    timeZone: 'Europe/Berlin',
                    defaultValue: CountryController.ALL_COUNTRIES,
                    countryExpected: 'Germany'

                }
            ],
            [
                // defaultValue wins
                {
                    urlSearchParams: new URLSearchParams(""),
                    timeZone: 'dummyCountry/dummyCity',
                    defaultValue: CountryController.ALL_COUNTRIES,
                    countryExpected: CountryController.ALL_COUNTRIES
                }
            ]
        ],
        (assert, [{ urlSearchParams, timeZone, defaultValue, countryExpected }]) => {
            // Given

            // When
            const country = CountryProvider.getCountry(urlSearchParams, timeZone, defaultValue);

            // Then
            assert.equal(country, countryExpected);
        });
});