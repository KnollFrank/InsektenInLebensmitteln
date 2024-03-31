package de.keineInsektenImEssen.productsview.categoriesgraph;

import de.keineInsektenImEssen.model.IProduct;

import java.util.Collections;
import java.util.Objects;
import java.util.Set;
import java.util.StringJoiner;

public class Node {

    private final String name;
    private final NodeAttributesDAO<Node, NodeAttributes> nodeAttributesDAO;

    public Node(final String name, final NodeAttributesDAO<Node, NodeAttributes> nodeAttributesDAO) {
        this.name = name;
        this.nodeAttributesDAO = nodeAttributesDAO;
    }

    public String getName() {
        return name;
    }

    public String getDisplayName() {
        return getNodeAttributes().displayName;
    }

    public void setDisplayName(final String displayName) {
        getNodeAttributes().displayName = displayName;
    }

    public Set<IProduct> getProducts() {
        return Collections.unmodifiableSet(this.getMutableProducts());
    }

    public void addProduct(final IProduct product) {
        this.getMutableProducts().add(product);
        product.getCategoriesTags().add(this.name);
    }

    public void removeProduct(final IProduct product) {
        this.getMutableProducts().remove(product);
        product.getCategoriesTags().remove(this.name);
    }

    private Set<IProduct> getMutableProducts() {
        return getNodeAttributes().products;
    }

    private NodeAttributes getNodeAttributes() {
        return this.nodeAttributesDAO.getNodeAttributes(this);
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        final Node node = (Node) o;
        return name.equals(node.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.name);
    }

    @Override
    public String toString() {
        return new StringJoiner(", ", Node.class.getSimpleName() + "[", "]")
                .add("name='" + this.name + "'")
                .toString();
    }
}
