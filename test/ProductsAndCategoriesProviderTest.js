QUnit.module('ProductsAndCategoriesProviderTest', function () {

    QUnit.test('getProductsAndCategories', function (assert) {
        // Given
        const categoriesGraph =
            new graphology.Graph(
                {
                    type: 'directed',
                    multi: false,
                    allowSelfLoops: false
                });
        const nodeA = new Node('a');
        const product = ProductTestFactory.createSomeProduct('a');
        nodeA.addProduct(product);

        const nodeB = new Node('b');

        categoriesGraph.addNode(nodeA.getName(), nodeA);
        categoriesGraph.addNode(nodeB.getName(), nodeB);
        categoriesGraph.addEdge(nodeA.getName(), nodeB.getName());

        const productsAndCategoriesProvider = new ProductsAndCategoriesProvider(categoriesGraph);

        // When
        const { products, categories } = productsAndCategoriesProvider.getProductsAndCategories(nodeA);
        
        // Then
        assert.deepEqual(products, [product]);
        assert.deepEqual(getNamesOfNodes(categories), [nodeB.getName()]);
    });

    function getNamesOfNodes(nodes) {
        return nodes.map(node => node.getName());
    }
});