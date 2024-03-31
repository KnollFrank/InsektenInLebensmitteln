QUnit.module('ProductFilterTest', function () {

    QUnit.test('shouldGetProductsBelongingToStore', function (assert) {
        // Given
        const product1 = { 'stores': new Set(['Aldi', 'Lidl']) };
        const product2 = { 'stores': new Set(['Aldi', 'Penny']) };

        // When
        const products = ProductFilter.getProductsBelongingToStore([product1, product2], 'Lidl');

        // Then
        assert.deepEqual(products, [product1]);
    });
});