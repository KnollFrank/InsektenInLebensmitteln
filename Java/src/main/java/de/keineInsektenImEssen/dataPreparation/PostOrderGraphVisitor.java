package de.keineInsektenImEssen.dataPreparation;

import org.jgrapht.Graph;
import org.jgrapht.Graphs;

import java.util.HashSet;
import java.util.Set;
import java.util.function.Consumer;

import static de.keineInsektenImEssen.productsview.categoriesgraph.Graphs.getRootNode;

class PostOrderGraphVisitor<V, E> {

    private final Graph<V, E> graph;
    private final Consumer<V> onVisitNode;
    private final Set<V> visited = new HashSet<>();

    private PostOrderGraphVisitor(final Graph<V, E> graph, final Consumer<V> onVisitNode) {
        this.graph = graph;
        this.onVisitNode = onVisitNode;
    }

    public static <V, E> void visitGraphInPostOrder(final Graph<V, E> graph, final Consumer<V> onVisitNode) {
        new PostOrderGraphVisitor<>(graph, onVisitNode).visitGraphInPostOrder(getRootNode(graph));
    }

    // https://stackoverflow.com/questions/36188113/graph-pre-order-post-order-traversal
    private void visitGraphInPostOrder(final V start) {
        this.visited.add(start);
        for (final V childNode : Graphs.successorListOf(this.graph, start)) {
            if (!this.visited.contains(childNode)) {
                visitGraphInPostOrder(childNode);
            }
        }
        this.onVisitNode.accept(start);
    }
}
