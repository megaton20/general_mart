


    function getDayName(appDate, seperator){
        // Name of the days as Array
        var dayNameArr = new Array ( "Sunday","Monday", "Tuesday", "Wednesday", "Thrusday", "Friday", "Saturday");
        var dateArr = appDate.split(seperator); // split the date into array using the date seperator
        var month = eval(dateArr[0]); 
        var day = eval(dateArr[1]);
        var year = eval(dateArr[2]);
        // Calculate the total number of days, with taking care of leapyear 
        var totalDays = day + (2*month) + parseInt(3*(month+1)/5) + year + parseInt(year/4) - parseInt(year/100) + parseInt(year/400) + 2;
       // Mod of the total number of days with 7 gives us the day number
       var dayNo = (totalDays%7);
       // if the resultant mod of 7 is 0 then its Saturday so assign the dayNo to 7
       if(dayNo == 0){
            dayNo = 7;
       }
     return dayNameArr[dayNo-1]; // return the repective Day Name from the array
    }
     
    module.exports = getDayName