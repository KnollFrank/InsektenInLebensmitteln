package de.keineInsektenImEssen.productsview.categoriesgraph;

public class Graph<V, E, A> {

    public final org.jgrapht.Graph<V, E> graph;
    public final NodeAttributesDAO<V, A> nodeAttributesDAO;

    public Graph(final org.jgrapht.Graph<V, E> graph, final NodeAttributesDAO<V, A> nodeAttributesDAO) {
        this.graph = graph;
        this.nodeAttributesDAO = nodeAttributesDAO;
    }
}