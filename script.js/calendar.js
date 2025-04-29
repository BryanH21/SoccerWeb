document.addEventListener("DOMContentLoaded", function () {
    const currentMonthYear = document.getElementById("current-month-year");
    const calendarDates = document.getElementById("calendar-dates");
    const prevMonthBtn = document.getElementById("prev-month");
    const nextMonthBtn = document.getElementById("next-month");

    let today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    function generateCalendar(month, year) {
        calendarDates.innerHTML = "";
        currentMonthYear.textContent = `${getMonthName(month)} ${year}`;

        let firstDay = new Date(year, month, 1).getDay();
        let daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            let emptyCell = document.createElement("div");
            emptyCell.classList.add("empty");
            calendarDates.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            let dateCell = document.createElement("div");
            dateCell.classList.add("date");
            dateCell.textContent = day;

            let eventList = document.createElement("div");
            eventList.classList.add("event-list");
            dateCell.appendChild(eventList);

            if (
                year === today.getFullYear() &&
                month === today.getMonth() &&
                day === today.getDate()
            ) {
                dateCell.classList.add("today");
            }

            calendarDates.appendChild(dateCell);
        }

        loadEvents();
    }

    function getMonthName(month) {
        return [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ][month];
    }

    prevMonthBtn.addEventListener("click", () => {
        if (currentMonth === 0) {
            currentMonth = 11;
            currentYear--;
        } else {
            currentMonth--;
        }
        generateCalendar(currentMonth, currentYear);
    });

    nextMonthBtn.addEventListener("click", () => {
        if (currentMonth === 11) {
            currentMonth = 0;
            currentYear++;
        } else {
            currentMonth++;
        }
        generateCalendar(currentMonth, currentYear);
    });

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

    function loadEvents() {
        if (currentMonth >= 3 && currentMonth <= 9) { // April to October
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(currentYear, currentMonth, day);
                const weekday = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

                if ([1, 2, 4].includes(weekday)) { // Mon, Tues, Thurs
                    const label = `Training: 5:20PM–6:20PM<br>Location: NUSC Fields`;
                    addEvent(currentMonth, day, label);
                }
            }
        }
    }

    generateCalendar(currentMonth, currentYear);
});