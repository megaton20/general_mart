

    function getMonthName(appDate, seperator){

        let dateArr = appDate.split(seperator); // split the date into array using the date seperator
        let day = eval(dateArr[1]);

        // return the repective Day Name from the array

       return day

    }
     
    module.exports = getMonthName