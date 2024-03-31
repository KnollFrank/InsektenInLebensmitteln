package de.keineInsektenImEssen.productsview.categoriesgraph;

import java.util.HashMap;
import java.util.Map;

public class NodeDAO implements NodeAttributesDAO<Node, NodeAttributes> {

    private final Map<Node, NodeAttributes> nodeAttributesByNode = new HashMap<>();

    @Override
    public NodeAttributes getNodeAttributes(final Node node) {
        if (!this.nodeAttributesByNode.containsKey(node)) {
            this.nodeAttributesByNode.put(node, new NodeAttributes());
        }
        return this.nodeAttributesByNode.get(node);
    }
}
