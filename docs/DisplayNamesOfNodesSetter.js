class DisplayNamesOfNodesSetter {

    static setDisplayNamesOfNodesFromFileAndContinue(nodes, displayNameByNameFile, continuation) {
        return fetch(displayNameByNameFile)
            .then(response => response.json())
            .then(displayNameByName => DisplayNamesOfNodesSetter.setDisplayNamesOfNodes(nodes, displayNameByName))
            .then(continuation);
    }

    static setDisplayNamesOfNodes(nodes, displayNameByName) {
        for (const node of nodes) {
            DisplayNamesOfNodesSetter.#setDisplayNameOfNode(node, displayNameByName);
        }
    }

    static #setDisplayNameOfNode(node, displayNameByName) {
        node.setDisplayName(displayNameByName[node.getName()] ?? node.getName());
    }
}