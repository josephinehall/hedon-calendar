const disabledDates = [];
var googleCalData = [];
var calendar = null;
var multiNightCalendar = null;

const acuityEmbedUrls = {
  weekday1: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=12404888",
  weekday2: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=15539912",
  weekday3: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=15797860",
  weekday4: "https://app.acuityscheduling.com/schedule.php? owner=18755904&appointmentType=23398185",
  weekday5: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=48848561",
  weekend1: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=13051045",
  weekend2: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=13122085",
  weekday1Weekend1: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=15797909",
  weekday2Weekend1: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=15542319",
  weekday3Weekend1: "",
  weekday4Weekend1: "",
  weekday5Weekend1: "",
  weekday1Weekend2: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=15797947",
  weekday2Weekend2: "https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=32983138",
  weekday3Weekend2: "",
  weekday4Weekend2: "",
  weekday5Weekend2: "",
};

fetchGoogleCalData();
initaliseIframe();

function fetchGoogleCalData() {
  fetch("https://josephinehall.app.n8n.cloud/webhook/180c3e23-f93c-4ef2-b8f1-93ab398ffd26")
  .then(function(response) {
    if (response.ok) {
      return response.json();
    }
    throw new Error("Network response was not OK");
  })
  .then(function(data) {
    googleCalData = data;
    calculateDisabledDays();
    createCheckInCalendar();
    createMultiNightCalendar();

    calendar.calendarContainer.style.setProperty("top", "50px");
  })
  .catch(function(error) {
    console.error("Error:", error);
  });
};

function calculateDisabledDays() {
  googleCalData.forEach((event) => {
    var startDate;
    var endDate;

    if (event.start.hasOwnProperty("date")) {
      startDate = new Date(event.start.date);
    } else {
      startDate = new Date(event.start.dateTime);
    }

    disabledDates.push(startDate);

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

        disabledDates.push(date);
      }
    }
  });
}

function createCheckInCalendar() {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 12); // 4 months

  calendar = datepicker('.check-in', {
    id: 1,
    alwaysShow: true,
    disabledDates: disabledDates,
    disableYearOverlay: true,
    maxDate: maxDate,
    minDate: new Date(),
    onSelect: onSelectCheckIn,
  });
}

function createMultiNightCalendar() {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 4);

  multiNightCalendar = datepicker('.multi-night', {
    id: 1,
    alwaysShow: true,
    disabledDates: disabledDates,
    disableYearOverlay: true,
    maxDate: maxDate,
    minDate: new Date(),
    onSelect: onSelectMultiNight,
  });
}

function onSelectCheckIn(instance, date) {
  document.querySelector("#acuity").classList.add("hidden");
  document.querySelector("#acuity-embed").src = "";

  const start = multiNightCalendar.getRange().start;
  const end = multiNightCalendar.getRange().end;
  const differenceInDays = getDifferenceInDays(start, end);

  if (differenceInDays > 6) {
    multiNightCalendar.setDate();
    document.querySelector("#book-single-night").disabled = false;
    document.querySelector("#book-multi-night").disabled = true;
    document.querySelector("#multi-night").classList.add("hidden");
    return;
  }

  if (!date) {
    multiNightCalendar.setDate();
    multiNightCalendar.setMax();
    document.querySelector("#book-single-night").disabled = true;
    document.querySelector("#multi-night").classList.add("hidden");
    return;
  }

  var nextDay = new Date(date.getTime() + 86400000);
  var nextDayIsDisabled = isDisabled(nextDay);

  if (nextDayIsDisabled) {
    multiNightCalendar.setDate();
    multiNightCalendar.setMax();
    document.querySelector("#multi-night").classList.add("hidden");
  } else {
    var maxDate = new Date(nextDay.getTime() + (5 * 86400000));

    for(let i = 5; i > 0; i--) {
      var previousDay = new Date(nextDay.getTime() + (i * 86400000));

      if (isDisabled(previousDay)) {
        maxDate = new Date(previousDay);
      }
    }

    multiNightCalendar.setMax(maxDate);

    document.querySelector("#multi-night").classList.remove("hidden");
    multiNightCalendar.calendarContainer.style.setProperty("top", "50px");
  }

  if (!differenceInDays || differenceInDays > 6) {
    document.querySelector("#book-single-night").disabled = false;
  }
}

function onSelectMultiNight(instance, date) {
  document.querySelector("#acuity").classList.add("hidden");
  document.querySelector("#acuity-embed").src = "";

  if (!date || calendar.getRange().start.getTime() === calendar.getRange().end.getTime()) {
    document.querySelector("#book-multi-night").disabled = true;
    document.querySelector("#book-single-night").disabled = false;
    return;
  }

  var nextDay = new Date(date.getTime() + 86400000);
  var nextDayIsDisabled = isDisabled(nextDay);

  if (nextDayIsDisabled) {
    multiNightCalendar.setMax();
    multiNightCalendar.setMax(date);
  }

  document.querySelector("#book-multi-night").disabled = false;
  document.querySelector("#book-single-night").disabled = true;
}

function isDisabled(day) {
  return disabledDates.some((disabledDate) => {
    return disabledDate.getDate() === day.getDate() &&
            disabledDate.getMonth() === day.getMonth() &&
            disabledDate.getYear() === day.getYear();
  });
}

function handleSingleNight() {
  var checkInDay = calendar.getRange().start.getDay();

  if (checkInDay === 5 || checkInDay === 6){
    showEmbedder(acuityEmbedUrls.weekend1);
  } else {
    showEmbedder(acuityEmbedUrls.weekday1);
  }
}

function handleMultiNight() {
  var start = multiNightCalendar.getRange().start;
  var end = multiNightCalendar.getRange().end;
  var differenceInDays = getDifferenceInDays(start, end);
  var numberOfNights = differenceInDays + 1;

  if (numberOfNights === 7) {
    showEmbedder(acuityEmbedUrls.weekday5Weekend2);
  } else if (differenceInDays === 6) {
    if ([0, 6].includes(start) && [5, 4].includes(end)) {
      showEmbedder(acuityEmbedUrls.weekday5Weekend1);
    } else {
      showEmbedder(acuityEmbedUrls.weekday4Weekend2);
    }
  } else if (numberOfNights === 5) {
    if (start === 0 && end === 4) {
      showEmbedder(acuityEmbedUrls.weekday5);
    } else if ([1, 6].includes(start) && [5, 3].includes(start)) {
      showEmbedder(acuityEmbedUrls.weekday4Weekend1);
    } else {
      showEmbedder(acuityEmbedUrls.weekday3Weekend2);
    }
  } else if (numberOfNights === 4) {
    if (start >= 0 && end <= 4) {
      showEmbedder(acuityEmbedUrls.weekday4);
    } else if ([2, 6].includes(start) && [5, 2].includes(end)) {
      showEmbedder(acuityEmbedUrls.weekday3Weekend1);
    } else {
      showEmbedder(acuityEmbedUrls.weekday2Weekend2);
    }
  } else if (numberOfNights === 3) {
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

function showEmbedder(url) {
  document.querySelector("#acuity-embed").src = url;
  document.querySelector("#acuity").classList.remove("hidden");
}

function initaliseIframe() {
  document.querySelector("#book-single-night").addEventListener("click", handleSingleNight);
  document.querySelector("#book-multi-night").addEventListener("click", handleMultiNight);
  document.querySelector("#acuity-wrapper").innerHTML = '<iframe id="acuity-embed" src="https://app.acuityscheduling.com/schedule.php?owner=18755904&appointmentType=12404888" title="Schedule Appointment" width="100%" height="1200px" frameBorder="0"></iframe>';
}

function getDifferenceInDays(start, end) {
  const diffTime = Math.abs(start - end);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
