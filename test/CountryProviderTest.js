QUnit.module('CountryProviderTest', function () {

    QUnit.test.each(
        'getCountry',
        [
            [
                // urlSearchParams wins
                {
                    urlSearchParams: new URLSearchParams("?country=Germany"),
                    timeZone: 'Australia/Sydney',
                    defaultCountry: CountryController.ALL_COUNTRIES,
                    countryExpected: 'Germany'
                }
            ],
            [
                // urlSearchParams wins
                {
                    urlSearchParams: new URLSearchParams("?country=Germany"),
                    timeZone: 'Europe/Berlin',
                    defaultCountry: CountryController.ALL_COUNTRIES,
                    countryExpected: 'Germany'
                }
            ],
            [
                // timeZone wins
                {
                    urlSearchParams: new URLSearchParams(""),
                    timeZone: 'Europe/Berlin',
                    defaultCountry: CountryController.ALL_COUNTRIES,
                    countryExpected: 'Germany'

                }
            ],
            [
                // defaultCountry wins
                {
                    urlSearchParams: new URLSearchParams(""),
                    timeZone: 'dummyCountry/dummyCity',
                    defaultCountry: CountryController.ALL_COUNTRIES,
                    countryExpected: CountryController.ALL_COUNTRIES
                }
            ]
        ],
        (assert, [{ urlSearchParams, timeZone, defaultCountry, countryExpected }]) => {
            // Given

            // When
            const country = CountryProvider.getCountry(
                {
                    urlSearchParams,
                    searchParam: 'country',
                    timeZone,
                    defaultCountry
                });

            // Then
            assert.equal(country, countryExpected);
        });
});