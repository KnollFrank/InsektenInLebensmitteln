QUnit.module('NavigationTest', function () {

    QUnit.test('testNavigation', function (assert) {
        // root -> someChild
        const navigation = new Navigation();
        navigation.gotoChildNode({ child: 'root', scrollTopWithinParentOfChild: 815 });
        navigation.gotoChildNode({ child: 'someChild', scrollTopWithinParentOfChild: 4711 });
        assert.deepEqual(navigation.getCurrentNode(), { node: 'someChild', scrollTop: undefined });
        assert.deepEqual(navigation.getParentNode(), { node: 'root', scrollTop: 4711 });

        navigation.gotoParentNode();
        assert.deepEqual(navigation.getCurrentNode(), { node: 'root', scrollTop: 4711 });
    });
});