QUnit.module('CountryProviderTest', function () {

    QUnit.test('shouldGetCountry_Germany', function (assert) {
        // Given
        const timeZone = 'Europe/Berlin';

        // When
        const country = CountryProvider.getCountry(timeZone);

        // Then
        assert.equal(country, 'Germany');
    });

    QUnit.test('shouldGetCountry_Australia', function (assert) {
        // Given
        const timeZone = 'Australia/Sydney';

        // When
        const country = CountryProvider.getCountry(timeZone);

        // Then
        assert.equal(country, 'Australia');
    });
});