QUnit.module('TimeZone2CountryConverterTest', function () {

    QUnit.test.each(
        'timeZone2Country',
        [
            ['Australia/Sydney', 'Australia'],
            ['Europe/Berlin', 'Germany'],
            ['dummyCountry/dummyCity', undefined]
        ],
        (assert, [timeZone, countryExpected]) => {
            // Given

            // When
            const country = TimeZone2CountryConverter.timeZone2Country(timeZone);

            // Then
            assert.equal(country, countryExpected);
        });
});