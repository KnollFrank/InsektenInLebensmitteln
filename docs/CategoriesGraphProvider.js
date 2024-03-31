class CategoriesGraphProvider {

    static loadCategoriesGraph(file) {
        return fetch(file)
            .then(response => response.json())
            .then(CategoriesGraphProvider.#loadCategoriesGraph);
    }

    static #loadCategoriesGraph(json) {
        const graph =
            new graphology.Graph(
                {
                    type: 'directed',
                    multi: false,
                    allowSelfLoops: false
                });
        CategoriesGraphProvider.#addNodes(graph, json.nodes);
        CategoriesGraphProvider.#addEdges(graph, json.edges);
        return graph;
    }

    static #addNodes(graph, nodes) {
        for (const node of nodes) {
            graph.addNode(node.id, new Node(node.id));
        }
    }

    static #addEdges(graph, edges) {
        for (const edge of edges) {
            graph.addEdge(edge.source, edge.target);
        }
    }
}