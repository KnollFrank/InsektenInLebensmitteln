package de.keineInsektenImEssen.textdetector.model;

import java.util.List;

// FK-TODO: convert to record class
public class Synonym {

    public final String name;
    public final List<Pattern> patterns;

    public Synonym(final String name, final List<Pattern> patterns) {
        this.name = name;
        this.patterns = patterns;
    }

    @Override
    public String toString() {
        return "Synonym{" +
                "name='" + name + '\'' +
                ", patterns=" + patterns +
                '}';
    }
}
