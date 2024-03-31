package de.keineInsektenImEssen.dataPreparation;

import com.google.gson.annotations.SerializedName;

import java.util.*;

import static de.keineInsektenImEssen.common.Utils.null2EmptySet;

class Category {

    @SerializedName("name")
    private final Map<String, String> nameByCountry;
    private final Set<String> children;
    private final Set<String> parents;

    public Category(
            final Map<String, String> nameByCountry,
            final Set<String> children,
            final Set<String> parents) {
        this.nameByCountry = nameByCountry;
        this.children = children;
        this.parents = parents;
    }

    public Map<String, String> getNameByCountry() {
        return nameByCountry == null ? Collections.emptyMap() : nameByCountry;
    }

    public Set<String> getChildren() {
        return null2EmptySet(children);
    }

    public Set<String> getParents() {
        return null2EmptySet(parents);
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        final Category that = (Category) o;
        return Objects.equals(nameByCountry, that.nameByCountry) && Objects.equals(children, that.children) && Objects.equals(parents, that.parents);
    }

    @Override
    public int hashCode() {
        return Objects.hash(nameByCountry, children, parents);
    }

    @Override
    public String toString() {
        return new StringJoiner(", ", Category.class.getSimpleName() + "[", "]")
                .add("nameByCountry=" + nameByCountry)
                .add("children=" + children)
                .add("parents=" + parents)
                .toString();
    }
}
