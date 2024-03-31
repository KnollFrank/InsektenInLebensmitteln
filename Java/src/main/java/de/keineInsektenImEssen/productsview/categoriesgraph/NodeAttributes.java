package de.keineInsektenImEssen.productsview.categoriesgraph;

import de.keineInsektenImEssen.model.IProduct;

import java.util.HashSet;
import java.util.Set;

public class NodeAttributes {

    public final Set<IProduct> products = new HashSet<>();
    public String displayName;
}
