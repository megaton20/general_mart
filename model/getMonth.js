function getMonthName(appDate, seperator){

    let dateArr = appDate.split(seperator); // split the date into array using the date seperator
    let year = eval(dateArr[0]);

    // return the repective Day Name from the array

   return year

}
 
module.exports = getMonthName