QUnit.module('UrlUtilsTest', function () {

    QUnit.test('isValidUrl_true', function (assert) {
        // Given
        const urlString = 'https://images.openfoodfacts.org/images/products/00125420/front_fr.4.400.jpg';

        // When
        const isValidUrl = UrlUtils.isValidUrl(urlString);

        // Then
        assert.true(isValidUrl);
    });

    QUnit.test('isValidUrl_false', function (assert) {
        // Given
        const urlString = '';

        // When
        const isValidUrl = UrlUtils.isValidUrl(urlString);

        // Then
        assert.false(isValidUrl);
    });

    QUnit.test('getOnlyElement_set', function (assert) {
        // Given
        const collection = new Set('a');

        // When
        const onlyElement = Utils.getOnlyElement(collection);

        // Then
        assert.equal(onlyElement, 'a');
    });

    QUnit.test('getOnlyElement_array', function (assert) {
        // Given
        const collection = ['b'];

        // When
        const onlyElement = Utils.getOnlyElement(collection);

        // Then
        assert.equal(onlyElement, 'b');
    });

    QUnit.test('getOnlyElement_twoElements', function (assert) {
        assert.throws(function () {
            Utils.getOnlyElement(['a', 'b']);
        });
    });
});