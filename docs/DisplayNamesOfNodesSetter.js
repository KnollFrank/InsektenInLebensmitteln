class DisplayNamesOfNodesSetter {

    static setDisplayNamesOfNodesFromFile(nodes, displayNameByNameFile, continuation) {
        return fetch(displayNameByNameFile)
            .then(response => response.json())
            .then(displayNameByName => DisplayNamesOfNodesSetter.setDisplayNamesOfNodes(nodes, displayNameByName));
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