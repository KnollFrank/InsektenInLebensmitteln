QUnit.module('CategoriesGraphProviderTest', function () {

    QUnit.test('loadCategoriesGraph', function (assert) {
        const done = assert.async();
        // When
        CategoriesGraphProvider
            .loadCategoriesGraph('/test/data/categoriesGraph.json')
            .then(categoriesGraph => {
                // Then
                assert.deepEqual(categoriesGraph.nodes(), ['en:candies', 'en:gummi-candies']);
                assert.true(categoriesGraph.hasEdge('en:candies', 'en:gummi-candies'));
                const node = categoriesGraph.getNodeAttributes('en:candies');
                assert.equal(node.getName(), 'en:candies');
                done();
            });
    });
});