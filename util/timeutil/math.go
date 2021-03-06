package timeutil

import (
	"time"
)

// AddClock will add the provided number of clock hours to the given time, taking
// things like DST into account.
func AddClock(t time.Time, c Clock) time.Time {
	c += NewClockFromTime(t)
	days, c := c.Days()

	start := StartOfDay(t)
	if days != 0 {
		start = start.AddDate(0, 0, days)
	}
	return c.FirstOfDay(start)
}

// HoursBetween will return the number of full hours from a to b with
// respect to clock time and DST.
//
// It is assumed a and b are of the same location.
func HoursBetween(a, b time.Time) int {
	diff := b.Sub(a)

	_, offsetA := a.Zone()
	_, offsetB := b.Zone()
	if offsetA == offsetB {
		return int(diff / time.Hour)
	}
	diff += time.Duration(offsetB-offsetA) * time.Second
	return int(diff / time.Hour)
}

// ClockDiff will return the amount of clock time from a to b with
// respect to DST.
//
// It is assumed a and b are of the same location.
func ClockDiff(a, b time.Time) Clock {
	diff := b.Sub(a)

	_, offsetA := a.Zone()
	_, offsetB := b.Zone()
	if offsetA == offsetB {
		return Clock(diff)
	}
	diff += time.Duration(offsetB-offsetA) * time.Second
	return Clock(diff)
}

// StartOfDay will return the start of the day in t's location.
func StartOfDay(t time.Time) time.Time {
	y, m, d := t.Date()
	return time.Date(y, m, d, 0, 0, 0, 0, t.Location())
}
