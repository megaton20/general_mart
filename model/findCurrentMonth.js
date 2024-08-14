function getMonthName(appDate, separator) {
    // Array of month names
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    // Split the date into an array using the date separator
    let dateArr = appDate.split(separator);

    // Extract the year, month, and day from the array
    let year = parseInt(dateArr[0], 10);
    let month = parseInt(dateArr[1], 10) - 1;  // Month is 0-based in JavaScript Date object
    let day = parseInt(dateArr[2], 10);

    // Return the respective month name from the array
    return monthNames[month];
}

module.exports = getMonthName;