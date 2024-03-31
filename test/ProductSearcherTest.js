QUnit.module('ProductSearcherTest', function () {

    QUnit.test('shouldSearchProductsByProductName', function (assert) {
        // Given
        const budapesterSalat = {
            'barcode': '1',
            'unwantedIngredients': ['Karmin'],
            'categories_tags': new Set(['Salate']),
            'product_name': 'Budapester Salat',
            'brands': ['Nestle'],
            'countries': new Set(['France', 'Switzerland'])
        };
        const milch = {
            'barcode': '2',
            'unwantedIngredients': ['Karmin'],
            'categories_tags': new Set(['Milchprodukte']),
            'product_name': 'Müllermilch',
            'brands': ['Bauer um die Ecke'],
            'countries': new Set(['France', 'Switzerland'])
        };

        const productSearcher = new ProductSearcher([budapesterSalat, milch]);

        // When
        const productsFound = productSearcher.searchProductsBy('BuDaPest');

        // Then
        assert.deepEqual(productsFound, [budapesterSalat]);
    });

    QUnit.test('shouldSearchProductsByBrands', function (assert) {
        // Given
        const budapesterSalat = {
            'barcode': '1',
            'unwantedIngredients': ['Karmin'],
            'categories_tags': new Set(['Salate']),
            'product_name': 'Budapester Salat',
            'brands': ['Nestle'],
            'countries': new Set(['France', 'Switzerland'])
        };
        const milch = {
            'barcode': '2',
            'unwantedIngredients': ['Karmin'],
            'categories_tags': new Set(['Milchprodukte']),
            'product_name': 'Müllermilch',
            'brands': ['dummy brand', 'Bauer um die Ecke'],
            'countries': new Set(['France', 'Switzerland'])
        };

        const productSearcher = new ProductSearcher([budapesterSalat, milch]);

        // When
        const productsFound = productSearcher.searchProductsBy('BAUER');

        // Then
        assert.deepEqual(productsFound, [milch]);
    });
});