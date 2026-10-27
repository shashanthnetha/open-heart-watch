// Re-read wall-clock time every frame. Never accumulate ticks in a sleeping tab.
export function clockState(date=new Date()){
 const seconds=date.getSeconds()+date.getMilliseconds()/1000;
 const minutes=date.getMinutes()+seconds/60;
 return {seconds,minutes,hours:date.getHours()%12+minutes/60,day:date.getDay(),date:date.getDate(),key:date.getFullYear()+'-'+date.getMonth()+'-'+date.getDate()};
}
export const weekdays=['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
export function handRotation(baseAngle,fraction){return baseAngle-fraction*Math.PI*2;}
