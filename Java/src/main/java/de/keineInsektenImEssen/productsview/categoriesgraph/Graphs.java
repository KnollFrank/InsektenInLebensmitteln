package de.keineInsektenImEssen.productsview.categoriesgraph;

import de.keineInsektenImEssen.common.Utils;
import org.jgrapht.Graph;

import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Collectors;

public class Graphs {

    public static <V> Set<V> getRootNodes(final Graph<V, ?> graph) {
        return graph
                .vertexSet()
                .stream()
                .filter(node -> isRootNode(graph, node))
                .collect(Collectors.toSet());
    }

    private static <V> boolean isRootNode(final Graph<V, ?> graph, final V node) {
        return graph.inDegreeOf(node) == 0;
    }

    public static <V> V getRootNode(final Graph<V, ?> graph) {
        return Utils.getOnlyElement(getRootNodes(graph));
    }

    public static <V> V addAbsoluteRootNode(final Graph<V, ?> graph, final Supplier<V> absoluteRootNodeSupplier) {
        final Set<V> rootNodes = getRootNodes(graph);
        if (rootNodes.size() != 1) {
            org.jgrapht.Graphs.addOutgoingEdges(
                    graph,
                    absoluteRootNodeSupplier.get(),
                    rootNodes);
        }
        return getRootNode(graph);
    }
}
