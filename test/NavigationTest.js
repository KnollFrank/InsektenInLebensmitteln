QUnit.module('NavigationTest', function () {

    QUnit.test('testNavigation', function (assert) {
        const navigation = new Navigation('root');
        assert.equal(navigation.getCurrentNode(), 'root');

        navigation.gotoParentNodeIfExists();
        assert.equal(navigation.getCurrentNode(), 'root');

        navigation.gotoChildNode('someChild');
        assert.equal(navigation.getCurrentNode(), 'someChild');
        assert.equal(navigation.getParentNode(), 'root');

        navigation.gotoParentNodeIfExists();
        assert.equal(navigation.getCurrentNode(), 'root');
    });
});