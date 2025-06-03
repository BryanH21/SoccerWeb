document.addEventListener("DOMContentLoaded", function () {
    const currentMonthYear = document.getElementById("current-month-year");
    const calendarDates = document.getElementById("calendar-dates");
    const prevMonthBtn = document.getElementById("prev-month");
    const nextMonthBtn = document.getElementById("next-month");

    if (!currentMonthYear || !calendarDates || !prevMonthBtn || !nextMonthBtn) {
        console.error("Calendar DOM elements are missing.");
        return;
    }

    let today = new Date();

    const MONTH_NAMES = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    // Returns the month name for a given month index
    function getMonthName(month) {
        return MONTH_NAMES[month];
    }

    function generateCalendar(month, year) {
        calendarDates.innerHTML = "";
        currentMonthYear.textContent = `${getMonthName(month)} ${year}`;

        const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, ..., 6 = Sat
        const totalDays = new Date(year, month + 1, 0).getDate();

        // Add empty cells to align the first day correctly
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.classList.add("empty");
            calendarDates.appendChild(emptyCell);
        }

        // Generate calendar day cells
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const weekday = date.getDay(); // 0 = Sun ... 6 = Sat

            const dateCell = document.createElement("div");
            dateCell.classList.add("date");
            dateCell.textContent = day;

            if (
                year === today.getFullYear() &&
                month === today.getMonth() &&
                day === today.getDate()
            ) {
                dateCell.classList.add("today");
            }

            const eventList = document.createElement("div");
            eventList.classList.add("event-list");
            dateCell.appendChild(eventList);

            calendarDates.appendChild(dateCell);
        }

        loadEvents();
    }

    // Handles clicking the previous month button
    function handlePrevMonth() {
        if (currentMonth === 0) {
            currentMonth = 11;
            currentYear--;
        } else {
            currentMonth--;
        }
        generateCalendar(currentMonth, currentYear);
    }

    // Handles clicking the next month button
    function handleNextMonth() {
        if (currentMonth === 11) {
            currentMonth = 0;
            currentYear++;
        } else {
            currentMonth++;
        }
        generateCalendar(currentMonth, currentYear);
    }

    prevMonthBtn.addEventListener("click", handlePrevMonth);
    nextMonthBtn.addEventListener("click", handleNextMonth);

    function addEvent(monthIndex, day, text) {
        if (monthIndex !== currentMonth) return;

        const eventDiv = document.createElement("div");
        eventDiv.classList.add("event");
        eventDiv.innerHTML = `${text} <br><a href="https://www.google.com/maps/place/8501+E+196th+St,+Noblesville,+IN+46062" target="_blank" style="color: #3498db;">Directions</a>`;

        const days = document.querySelectorAll("#calendar-dates .date");
        days.forEach(d => {
            if (parseInt(d.textContent) === day) {
                d.appendChild(eventDiv);
            }
        });
    }

    // Loads events for the current month
    function loadEvents() {
        if (currentMonth >= 3 && currentMonth <= 9) { // April to October
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(currentYear, currentMonth, day);
                const weekday = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

                if ([2, 4].includes(weekday)) { // Tues, Thurs
                    const label = `Foundry Soccer Academy Training: 5:20PM–6:20PM<br>Location: NUSC Fields`;
                    addEvent(currentMonth, day, label);
                }
            }
        }
    }

    generateCalendar(currentMonth, currentYear);
});