const disabledDatesForSingleNight = [];
const disabledDatesForMultiNight = [];
var googleCalData = [];
var singleNightCalendar = null;
var checkIncalendar = null;
var checkOutCalendar = null;
var availableMonths = 6;

const acuityEmbedUrls = {
  weekday1: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53831505",
  weekday2: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53831591",
  weekday3: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53831622",
  weekend1: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53832411",
  weekend2: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53832566",
  weekday1Weekend1: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53832162",
  weekday2Weekend1: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53832095",
  weekday1Weekend2: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53832352"
};

fetchGoogleCalData();
initalise();

function fetchGoogleCalData() {
  fetch("https://hedonhouse.app.n8n.cloud/webhook/naarm")
  .then(function(response) {
    if (response.ok) {
      return response.json();
    }
    throw new Error("Network response was not OK");
  })
  .then(function(data) {
    googleCalData = data;
    findDisabledDaysForSingleNight();
    createSingleNightCalendar();
    createCheckInCalendar();
    createCheckOutCalendar();

    singleNightCalendar.calendarContainer.style.setProperty("top", "60px");
    checkInCalendar.calendarContainer.style.setProperty("top", "90px");
    checkOutCalendar.calendarContainer.style.setProperty("left", "260px");
    checkOutCalendar.calendarContainer.style.setProperty("top", "90px");
  })
  .catch(function(error) {
    console.error("Error:", error);
  });
};

function findDisabledDaysForSingleNight() {
  googleCalData.forEach((event) => {
    var startDate;
    var endDate;

    if (event.start.hasOwnProperty("date")) {
      startDate = new Date(event.start.date);
    } else {
      startDate = new Date(event.start.dateTime);
    }

    disabledDatesForSingleNight.push(startDate);

    if (event.end.hasOwnProperty("date")) {
      endDate = new Date(event.end.date);
    } else {
      endDate = new Date(event.end.dateTime);
    }

    const durationInSeconds = Math.abs(endDate - startDate);
    const durationInDays = Math.ceil(durationInSeconds / (1000 * 60 * 60 * 24));

    if (durationInDays > 1) {
      for(let i = 1; i < durationInDays; i++) {
        const date = new Date(startDate.getTime() + (i * 86400000));

        disabledDatesForSingleNight.push(date);
      }
    }
  });
}

function createSingleNightCalendar() {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + availableMonths); // 4 months

  singleNightCalendar = datepicker('.single-night', {
    id: 2,
    alwaysShow: true,
    disabledDates: disabledDatesForSingleNight,
    disableYearOverlay: true,
    maxDate: maxDate,
    minDate: new Date(),
    onSelect: onSelectSingleNight,
  });
}

function showSingleNightCalendar() {
  document.querySelector("#multi-night-calendar").classList.add("hidden");
  document.querySelector("#single-night-calendar").classList.remove("hidden");
  document.querySelector("#acuity").classList.add("hidden");
  document.querySelector("#acuity-embed").src = "";
}

function onSelectSingleNight(instance, date) {
  document.querySelector("#acuity").classList.add("hidden");
  document.querySelector("#acuity-embed").src = "";

  if (!date) {
    singleNightCalendar.setDate();
    singleNightCalendar.setMax();
    document.querySelector("#book-single-night").disabled = true;
    return;
  }

  document.querySelector("#book-single-night").disabled = false;
}

function bookSingleNight() {
  var day = singleNightCalendar.dateSelected.getDay();

  if (day === 5 || day === 6){
    showEmbedder(acuityEmbedUrls.weekend1);
  } else {
    showEmbedder(acuityEmbedUrls.weekday1);
  }
}


function createCheckInCalendar() {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + availableMonths); // 4 months

  checkInCalendar = datepicker('.check-in', {
    id: 1,
    alwaysShow: true,
    disabledDates: disabledDatesForMultiNight,
    disableYearOverlay: true,
    maxDate: maxDate,
    minDate: new Date(),
    onSelect: onSelectCheckIn,
  });
}

function createCheckOutCalendar() {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + availableMonths);

  checkOutCalendar = datepicker('.check-out', {
    id: 1,
    alwaysShow: true,
    disabledDatesForSingleNight: disabledDatesForMultiNight,
    disableYearOverlay: true,
    maxDate: maxDate,
    minDate: new Date(),
    onSelect: onSelectCheckOut,
  });
}

function onSelectCheckIn(instance, date) {
  document.querySelector("#acuity").classList.add("hidden");
  document.querySelector("#acuity-embed").src = "";

  const start = checkOutCalendar.getRange().start;
  const end = checkOutCalendar.getRange().end;
  const differenceInDays = getDifferenceInDays(start, end);

  if (differenceInDays > 2) {
    checkOutCalendar.setDate();
    document.querySelector("#book-multi-night").disabled = true;
    document.querySelector("#multi-night-calendar").classList.add("hidden");
    return;
  }

  if (!date) {
    checkOutCalendar.setDate();
    checkOutCalendar.setMax();
    document.querySelector("#multi-night-calendar").classList.add("hidden");
    return;
  }

  var nextDay = new Date(date.getTime() + 86400000);
  var nextDayIsDisabled = isDisabled(nextDay);

  if (nextDayIsDisabled) {
    checkOutCalendar.setDate();
    checkOutCalendar.setMax();
    document.querySelector("#multi-night-calendar").classList.add("hidden");
  } else {
    var maxDate = new Date(nextDay.getTime() + (1 * 86400000));

    for(let i = 1; i > 0; i--) {
      var previousDay = new Date(nextDay.getTime() + (i * 86400000));

      if (isDisabled(previousDay)) {
        maxDate = new Date(previousDay);
      }
    }

    checkOutCalendar.setMax(maxDate);

    document.querySelector("#multi-night-calendar").classList.remove("hidden");
    checkOutCalendar.calendarContainer.style.setProperty("top", "90px");
  }

  // if (!differenceInDays || differenceInDays > 2) {
  //   document.querySelector("#book-single-night").disabled = false;
  // }
}

function onSelectCheckOut(instance, date) {
  document.querySelector("#acuity").classList.add("hidden");
  document.querySelector("#acuity-embed").src = "";

  if (!date || checkInCalendar.getRange().start.getTime() === checkInCalendar.getRange().end.getTime()) {
    document.querySelector("#book-multi-night").disabled = true;
    return;
  }

  var nextDay = new Date(date.getTime() + 86400000);
  var nextDayIsDisabled = isDisabled(nextDay);

  if (nextDayIsDisabled) {
    checkOutCalendar.setMax();
    checkOutCalendar.setMax(date);
  }

  document.querySelector("#book-multi-night").disabled = false;
}

function showMultiNightCalendar() {
  document.querySelector("#multi-night-calendar").classList.remove("hidden");
  document.querySelector("#single-night-calendar").classList.add("hidden");
  document.querySelector("#acuity").classList.add("hidden");
  document.querySelector("#acuity-embed").src = "";
  singleNightCalendar.setDate();
  document.querySelector("#book-single-night").disabled = true;
}

function bookMultiNight() {
  var start = checkOutCalendar.getRange().start;
  var end = checkOutCalendar.getRange().end;
  var differenceInDays = getDifferenceInDays(start, end);
  var numberOfNights = differenceInDays + 1;

  if (numberOfNights === 3) {
    if (start >= 0 && end <= 4) {
      showEmbedder(acuityEmbedUrls.weekday3);
    } else if ([3, 6].includes(start) && [5, 1].includes(end)) {
      showEmbedder(acuityEmbedUrls.weekday2Weekend1);
    } else {
      showEmbedder(acuityEmbedUrls.weekday1Weekend2);
    }
  } else if (numberOfNights === 2) {
    if (start >= 0 && end <= 4) {
      showEmbedder(acuityEmbedUrls.weekday2);
    } else if ([4, 6].includes(start) && [5, 0].includes(end)) {
      showEmbedder(acuityEmbedUrls.weekday1Weekend1);
    } else {
      showEmbedder(acuityEmbedUrls.weekend2);
    }
  }
}

function isDisabled(day) {
  return disabledDatesForSingleNight.some((disabledDate) => {
    return disabledDate.getDate() === day.getDate() &&
            disabledDate.getMonth() === day.getMonth() &&
            disabledDate.getYear() === day.getYear();
  });
}

function showEmbedder(url) {
  document.querySelector("#acuity-embed").src = url;
  document.querySelector("#acuity").classList.remove("hidden");
}

function initalise() {
  document.querySelector("#show-single-night").addEventListener("click", showSingleNightCalendar);
  document.querySelector("#book-single-night").addEventListener("click", bookSingleNight);

  document.querySelector("#show-multi-night").addEventListener("click", showMultiNightCalendar);
  document.querySelector("#book-multi-night").addEventListener("click", bookMultiNight);

  document.querySelector("#acuity-wrapper").innerHTML = '<iframe id="acuity-embed" src="https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53831505" title="Schedule Appointment" width="100%" height="1200px" frameBorder="0"></iframe>';
}

function getDifferenceInDays(start, end) {
  const diffTime = Math.abs(start - end);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
