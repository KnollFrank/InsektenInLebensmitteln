QUnit.module('ProductsProvider', function () {

    QUnit.test('shouldProvideProducts_categories_tags_is_a_set', function (assert) {
        const done = assert.async();
        // When
        ProductsProvider
            .loadProducts('/test/data/products.json')
            .then(products => {
                // Then
                assert.deepEqual(products[0].categories_tags, new Set(['en:bonbons']));
                assert.deepEqual(products[0].countries, new Set(['France', 'Switzerland']));
                done();
            });
    });
});