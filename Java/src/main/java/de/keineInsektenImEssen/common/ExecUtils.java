package de.keineInsektenImEssen.common;

import org.apache.commons.exec.CommandLine;
import org.apache.commons.exec.DefaultExecutor;

import java.io.IOException;

public class ExecUtils {

    public static void executeCommandLine(final String cmdLine) throws IOException {
        executeCommandLine(createCommandLine(cmdLine));
    }

    private static void executeCommandLine(final CommandLine commandLine) throws IOException {
        final int exitValue = new DefaultExecutor().execute(commandLine);
        final boolean isSuccess = exitValue == 0;
        if (!isSuccess) {
            throw new RuntimeException();
        }
    }

    private static CommandLine createCommandLine(final String cmdLine) {
        return new CommandLine("sh")
                .addArgument("-c")
                .addArgument(cmdLine, false);
    }
}
