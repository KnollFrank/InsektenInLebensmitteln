QUnit.module('DisplayNamesOfNodesSetterTest', function () {

    QUnit.test('setDisplayNamesOfNodes', function (assert) {
        // Given
        const node = new Node('en:plant-based-foods');

        // When
        DisplayNamesOfNodesSetter.setDisplayNamesOfNodes(
            new Set([node]),
            {
                'en:plant-based-foods': 'Pflanzliche Lebensmittel',
            });

        // Then
        assert.equal(node.getDisplayName(), 'Pflanzliche Lebensmittel');
    });

    QUnit.test('setDisplayNamesOfNodes_not_defined', function (assert) {
        // Given
        const node = new Node('en:plant-based-foods');

        // When
        DisplayNamesOfNodesSetter.setDisplayNamesOfNodes(new Set([node]), {});

        // Then
        assert.equal(node.getDisplayName(), node.getName());
    });

    QUnit.test('setDisplayNamesOfNodesFromFile', function (assert) {
        // Given
        const node = new Node('en:plant-based-foods');
        const done = assert.async();

        // When
        DisplayNamesOfNodesSetter
            .setDisplayNamesOfNodesFromFile(
                new Set([node]),
                '/test/data/displayNameByName.json')
            .then(
                () => {
                    // Then
                    assert.equal(node.getDisplayName(), 'Pflanzliche Lebensmittel');
                    done();
                });
    });
});