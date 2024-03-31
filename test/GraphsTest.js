QUnit.module('GraphsTest', function () {

    QUnit.test('getRootNode', function (assert) {
        // Given
        const graph =
            new graphology.Graph(
                {
                    type: 'directed',
                    multi: false,
                    allowSelfLoops: false
                });

        graph.addNode('a');
        graph.addNode('b');
        graph.addEdge('a', 'b');

        // When
        const rootNode = Graphs.getRootNode(graph);

        // Then
        assert.equal(rootNode, 'a');
    });
});