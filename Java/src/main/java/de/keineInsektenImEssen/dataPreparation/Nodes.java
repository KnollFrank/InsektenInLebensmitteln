package de.keineInsektenImEssen.dataPreparation;

import de.keineInsektenImEssen.productsview.categoriesgraph.Node;
import de.keineInsektenImEssen.productsview.categoriesgraph.NodeAttributes;
import de.keineInsektenImEssen.productsview.categoriesgraph.NodeAttributesDAO;

import java.util.Set;
import java.util.stream.Collectors;

class Nodes {

    public static Set<Node> names2Nodes(final Set<String> names, final NodeAttributesDAO<Node, NodeAttributes> nodeAttributesDAO) {
        return names
                .stream()
                .map(name -> new Node(name, nodeAttributesDAO))
                .collect(Collectors.toSet());
    }

    public static Set<String> nodes2Names(final Set<Node> nodes) {
        return nodes
                .stream()
                .map(Node::getName)
                .collect(Collectors.toSet());
    }
}
