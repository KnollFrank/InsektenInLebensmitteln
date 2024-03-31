package de.keineInsektenImEssen.textdetector.model;

import java.util.Objects;
import java.util.StringJoiner;
import java.util.function.Predicate;

public class Pattern {

    private final String name;
    // FK-TODO: wie in Pattern.js einen regexp anstatt eines matcher verwenden.
    private final Predicate<String> matcher;

    public Pattern(final String name, final Predicate<String> matcher) {
        this.name = name;
        this.matcher = matcher;
    }

    public String getName() {
        return name;
    }

    public Predicate<String> getMatcher() {
        return matcher;
    }

    @Override
    public String toString() {
        return new StringJoiner(", ", Pattern.class.getSimpleName() + "[", "]")
                .add("name='" + name + "'")
                .toString();
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        final Pattern pattern = (Pattern) o;
        return name.equals(pattern.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name);
    }
}
