package de.keineInsektenImEssen.dataPreparation;

import com.google.common.collect.Streams;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.function.Predicate;
import java.util.stream.Collectors;

class CSVHelper {

    private final String[] headers;

    public CSVHelper(final String[] headers) {
        this.headers = headers;
    }

    public Iterable<CSVRecord> readCsvRecords(final File file) throws IOException {
        return this
                .getCSVBuilder()
                .setSkipHeaderRecord(true)
                .build()
                .parse(new FileReader(file));
    }

    public void persistCsvRecords(final Iterable<CSVRecord> records, final File file) throws IOException {
        try (final CSVPrinter printer = new CSVPrinter(new FileWriter(file), getCSVBuilder().build())) {
            printer.printRecords(records);
        }
    }

    public Iterable<CSVRecord> filter(final Iterable<CSVRecord> records, final Predicate<CSVRecord> recordPredicate) {
        return Streams
                .stream(records)
                .filter(recordPredicate)
                .collect(Collectors.toList());
    }

    private CSVFormat.Builder getCSVBuilder() {
        return CSVFormat
                .DEFAULT
                .builder()
                .setHeader(this.headers);
    }
}
