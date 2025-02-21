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
    price: "460",
  },
  weekday2: {
    url: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53831591",
    price: "835",
  },
  weekday3: {
    url: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53831622",
    price: "1280",
  },
  weekend1: {
    url: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53832411",
    price: "515",
  },
  weekend2: {
    url: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53832566",
    price: "930",
  },
  weekday1Weekend1: {
    url: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53832162",
    price: "880",
  },
  weekday2Weekend1: {
    url: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53832095",
    price: "1325",
  },
  weekday1Weekend2: {
    url: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=53832352",
    price: "1375",
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
  document.querySelector("#multi-night-info-message").classList.add("hidden");
  document.querySelector("#single-night-calendar").classList.remove("hidden");
  document.querySelector("#acuity").classList.add("hidden");
  document.querySelector("#acuity-embed").src = "";
  checkInCalendar.setDate();
  checkOutCalendar.disabled = true;
  checkOutCalendar.calendarContainer.classList.add("disabled");
}

function onSelectSingleNight(instance, date) {
  document.querySelector("#acuity").classList.add("hidden");
  document.querySelector("#acuity-embed").src = "";

  if (!date) {
    singleNightCalendar.setDate();
    singleNightCalendar.setMax();
    document.querySelector("#book-single-night").disabled = true;
    document.querySelector("#single-night-price").textContent = null;
    return;
  }

  var acuityObject = findAcuityEmbedObject(singleNightCalendar.dateSelected.getDay())

  document.querySelector("#single-night-price").textContent = `Total: $${acuityObject.price}`;
  document.querySelector("#book-single-night").disabled = false;
}

function findAcuityEmbedObject(day) {
  if (day === 5 || day === 6){
    return acuityEmbedUrls.weekend1
  } else {
    return acuityEmbedUrls.weekday1
  }
}

function bookSingleNight() {
  var acuityObject = findAcuityEmbedObject(singleNightCalendar.dateSelected.getDay())
  showEmbedder(acuityObject.url);
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

  if (!!checkInCalendar.maxDate) {
    checkInCalendar.setMax();
  }

  if (!date) {
    checkOutCalendar.setDate();
    checkOutCalendar.disabled = true;
    checkOutCalendar.calendarContainer.classList.add("disabled");
    document.querySelector("#multi-night-calendar").classList.add("hidden");
    document.querySelector("#multi-night-info-message").classList.add("hidden");
    return;
  }

  showInfoMessage();

  if (date && checkInCalendar.getRange().end) {
    if (date.getTime() < (checkInCalendar.getRange().end.getTime() - (3 * 86400000))) {
      checkOutCalendar.setDate();
      document.querySelector("#book-multi-night").disabled = true;
    } else if (date.getTime() === (checkInCalendar.getRange().end.getTime() - (2 * 86400000))) {
      document.querySelector("#book-multi-night").disabled = false;
    }
  }

  var maxDate = new Date(date.getTime() + (3 * 86400000));

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

function showInfoMessage() {
  if (checkInCalendar.getRange().start && checkInCalendar.getRange().end) {
    if (checkInCalendar.getRange().end.getTime() - checkInCalendar.getRange().start.getTime() >= (2 * 86400000)){
      document.querySelector("#multi-night-info-message").classList.add("hidden");
    } else if (checkInCalendar.getRange().end.getTime() - checkInCalendar.getRange().start.getTime() >= 86400000) {
      document.querySelector("#multi-night-info-message").classList.remove("hidden");
    }

  }
}

function onSelectCheckOut(instance, date) {
  if (
    !date ||
    checkInCalendar.getRange().start.getTime() === checkInCalendar.getRange().end.getTime() ||
    (checkInCalendar.getRange().start.getTime() + 86400000) === checkInCalendar.getRange().end.getTime()
  ) {
    document.querySelector("#book-multi-night").disabled = true;
    document.querySelector("#multi-night-info-message").classList.remove("hidden");
    return;
  }

  document.querySelector("#book-multi-night").disabled = false;
  document.querySelector("#multi-night-info-message").classList.add("hidden");
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
  document.querySelector("#single-night-price").textContent = null;
}

function bookMultiNight() {
  var start = checkOutCalendar.getRange().start;
  var end = checkOutCalendar.getRange().end;
  var differenceInDays = getDifferenceInDays(start, end);

  if (differenceInDays === 3) {
    if (start >= 0 && end <= 4) {
      showEmbedder(acuityEmbedUrls.weekday3.url);
    } else if ([3, 6].includes(start) && [5, 1].includes(end)) {
      showEmbedder(acuityEmbedUrls.weekday2Weekend1.url);
    } else {
      showEmbedder(acuityEmbedUrls.weekday1Weekend2.url);
    }
  } else if (differenceInDays === 2) {
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
