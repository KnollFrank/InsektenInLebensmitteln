package de.keineInsektenImEssen.textdetector.model;

import java.util.Objects;
import java.util.StringJoiner;

public record Pattern(String name, java.util.regex.Pattern regexp) {

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
