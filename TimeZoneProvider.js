class TimeZoneProvider {

    static getUserTimeZone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
}