QUnit.module('NavigationTest', function () {

    QUnit.test('testNavigation', function (assert) {
        const navigation = new Navigation('root');
        assert.equal(navigation.getCurrentNode(), 'root');

        navigation.gotoChildNode('someChild', 4711);
        assert.deepEqual(navigation.getCurrentNode(), { node: 'someChild', scrollTop: 4711 });
        assert.equal(navigation.getParentNode(), 'root');

        navigation.gotoParentNode();
        assert.equal(navigation.getCurrentNode(), 'root');
    });
});