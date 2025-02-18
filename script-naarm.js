const disabledDatesForSingleNight = [];
var disabledDatesForMultiNight = [];
var googleCalData = [];
var orderedGoogleCalData = [];
var singleNightCalendar = null;
var checkInCalendar = null;
var checkOutCalendar = null;
var availableMonths = 6;

const acuityEmbedUrls = {
  weekday1: {
    url: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53831505",
    price: "",
  },
  weekday2: {
    url: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53831591",
    price: "",
  },
  weekday3: {
    url: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53831622",
    price: "",
  },
  weekend1: {
    url: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53832411",
    price: "",
  },
  weekend2: {
    url: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53832566",
    price: "",
  },
  weekday1Weekend1: {
    url: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53832162",
    price: "",
  },
  weekday2Weekend1: {
    url: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53832095",
    price: "",
  },
  weekday1Weekend2: {
    url: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53832352",
    price: "",
  },
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

    orderedGoogleCalData = Array.from(googleCalData);
    orderedGoogleCalData.sort((a,b) => {
      return new Date(a.start.dateTime) - new Date(b.start.dateTime);
    });

    findDisabledDaysForSingleNight();
    findDisabledDaysForMultiNight();
    createSingleNightCalendar();
    createCheckInCalendar();
    createCheckOutCalendar();

    singleNightCalendar.calendarContainer.style.setProperty("top", "60px");
    checkInCalendar.calendarContainer.style.setProperty("top", "90px");
    checkOutCalendar.calendarContainer.style.setProperty("left", "260px");
    checkOutCalendar.calendarContainer.style.setProperty("top", "90px");
    checkOutCalendar.calendarContainer.classList.add("disabled");

    checkOutCalendar.disabled = true;

  })
  .catch(function(error) {
    console.error("Error:", error);
  });
};

function findDisabledDaysForSingleNight() {
  googleCalData.forEach((event) => {
    var startDate = new Date(event.start.dateTime);
    var endDate = new Date(event.end.dateTime);

    disabledDatesForSingleNight.push(startDate);

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

function findDisabledDaysForMultiNight() {
  disabledDatesForMultiNight = Array.from(disabledDatesForSingleNight);

  orderedGoogleCalData.forEach((event, index) => {

    var eventEndDate = new Date(event.end.dateTime);
    var nextEvent = orderedGoogleCalData[index + 1];

    if (!nextEvent) return;

    var nextEventStartDate = new Date(nextEvent.start.dateTime);

    const durationInSeconds = Math.abs(nextEventStartDate - eventEndDate);
    const durationInDays = Math.floor(durationInSeconds / (1000 * 60 * 60 * 24));

    if (durationInDays === 1) {
      disabledDatesForMultiNight.push(eventEndDate);
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
  checkInCalendar.setDate();
  if (checkOutCalendar) checkOutCalendar.remove();
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
    showEmbedder(acuityEmbedUrls.weekend1.url);
  } else {
    showEmbedder(acuityEmbedUrls.weekday1.url);
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
  if (!!checkInCalendar.maxDate) {
    checkInCalendar.setMax();
  }

  document.querySelector("#acuity").classList.add("hidden");
  document.querySelector("#acuity-embed").src = "";


  if (!date) {
    checkOutCalendar.setDate();
    checkOutCalendar.disabled = true;
    checkOutCalendar.calendarContainer.classList.add("disabled");
    document.querySelector("#multi-night-calendar").classList.add("hidden");
    return;
  }


  var maxDate = new Date(date.getTime() + (4 * 86400000));

  for(let i = 3; i > 0; i--) {
    var previousDay = new Date(date.getTime() + (i * 86400000));

    if (isDisabled(previousDay)) {
      maxDate = new Date(previousDay);
    }
  }

  checkOutCalendar.setMax(maxDate);
  checkOutCalendar.disabled = false;
  checkOutCalendar.calendarContainer.classList.remove("disabled");
}

function onSelectCheckOut(instance, date) {
  if (
    !date ||
    checkInCalendar.getRange().start.getTime() === checkInCalendar.getRange().end.getTime() ||
    (checkInCalendar.getRange().start.getTime() + 86400000) === checkInCalendar.getRange().end.getTime()
  ) {
    // Show message you must select 2 or more nights
    document.querySelector("#book-multi-night").disabled = true;
    return;
  }

  document.querySelector("#book-multi-night").disabled = false;
}

function showMultiNightCalendar() {
  document.querySelector("#multi-night-calendar").classList.remove("hidden");
  document.querySelector("#single-night-calendar").classList.add("hidden");
  document.querySelector("#acuity").classList.add("hidden");
  document.querySelector("#acuity-embed").src = "";
  if (singleNightCalendar) {
    singleNightCalendar.setDate();
  }
  document.querySelector("#book-single-night").disabled = true;
}

function bookMultiNight() {
  var start = checkOutCalendar.getRange().start;
  var end = checkOutCalendar.getRange().end;
  var differenceInDays = getDifferenceInDays(start, end);
  var numberOfNights = differenceInDays + 1;

  if (numberOfNights === 3) {
    if (start >= 0 && end <= 4) {
      showEmbedder(acuityEmbedUrls.weekday3.url);
    } else if ([3, 6].includes(start) && [5, 1].includes(end)) {
      showEmbedder(acuityEmbedUrls.weekday2Weekend1.url);
    } else {
      showEmbedder(acuityEmbedUrls.weekday1Weekend2.url);
    }
  } else if (numberOfNights === 2) {
    if (start >= 0 && end <= 4) {
      showEmbedder(acuityEmbedUrls.weekday2.url);
    } else if ([4, 6].includes(start) && [5, 0].includes(end)) {
      showEmbedder(acuityEmbedUrls.weekday1Weekend1.url);
    } else {
      showEmbedder(acuityEmbedUrls.weekend2.url);
    }
  }
}

function isDisabled(day) {
  return disabledDatesForMultiNight.some((disabledDate) => {
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
