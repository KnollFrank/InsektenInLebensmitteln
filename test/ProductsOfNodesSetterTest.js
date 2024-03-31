QUnit.module('ProductsOfNodesSetterTest', function () {

    QUnit.test('shouldSetProductsOfNodes', function (assert) {
        // Given
        const preparedSaladsNode = new Node('en:prepared-salads');
        const sodas = new Node('en:sodas');
        const preparedSaladsProduct = ProductTestFactory.createSomeProduct(preparedSaladsNode.getName());

        // When
        ProductsOfNodesSetter.setProductsOfNodes(
            new Set([preparedSaladsProduct]),
            new Set([preparedSaladsNode, sodas]));

        // Then
        assert.deepEqual(preparedSaladsNode.getProducts(), new Set([preparedSaladsProduct]));
        assert.deepEqual(sodas.getProducts(), new Set());
    });
});