class Graphs {

    static getNodes(graph) {
        return graph.nodes().map(node => graph.getNodeAttributes(node));
    }

    static getRootNode(graph) {
        return Utils.getOnlyElement(Graphs.#getRootNodes(graph));
    }

    static #getRootNodes(graph) {
        return graph.nodes().filter(node => Graphs.#isRootNode(graph, node));
    }

    static #isRootNode(graph, node) {
        return graph.inNeighbors(node).length === 0;
    }
}