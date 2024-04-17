package de.keineInsektenImEssen.textdetector.model;

import java.util.List;

public record Synonym(String name, List<Pattern> patterns) {
}
