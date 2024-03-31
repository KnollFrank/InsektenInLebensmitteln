package de.keineInsektenImEssen.dataPreparation;

import de.keineInsektenImEssen.productsview.categoriesgraph.Graph;
import de.keineInsektenImEssen.productsview.categoriesgraph.Node;
import de.keineInsektenImEssen.productsview.categoriesgraph.NodeAttributes;
import de.keineInsektenImEssen.productsview.categoriesgraph.NodeDAO;
import org.jgrapht.Graphs;
import org.jgrapht.graph.DefaultDirectedGraph;
import org.jgrapht.graph.DefaultEdge;

import java.util.Map;
import java.util.Set;

import static de.keineInsektenImEssen.dataPreparation.Nodes.names2Nodes;

class CategoryByName2GraphConverter {

    public static Graph<Node, DefaultEdge, NodeAttributes> categoryByName2Graph(final Map<String, Category> categoryByName) {
        final Graph<Node, DefaultEdge, NodeAttributes> graph =
                new Graph<>(
                        new DefaultDirectedGraph<>(DefaultEdge.class),
                        new NodeDAO());
        categoryByName.forEach(
                (name, category) -> {
                    final Node node = new Node(name, graph.nodeAttributesDAO);
                    graph.graph.addVertex(node);
                    addChildren(graph.graph, node, names2Nodes(category.getChildren(), graph.nodeAttributesDAO));
                    addParents(graph.graph, node, names2Nodes(category.getParents(), graph.nodeAttributesDAO));
                });
        return graph;
    }

    private static void addChildren(
            final org.jgrapht.Graph<Node, DefaultEdge> graph,
            final Node parent,
            final Set<Node> children) {
        Graphs.addOutgoingEdges(graph, parent, children);
    }

    private static void addParents(
            final org.jgrapht.Graph<Node, DefaultEdge> graph,
            final Node child,
            final Set<Node> parents) {
        Graphs.addIncomingEdges(graph, child, parents);
    }
}
