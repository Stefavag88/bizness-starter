const define=(id,title,el,summary,greek,suggestedTheme,rooms=false)=>Object.freeze({id,version:1,title:Object.freeze({en:title,el}),summary:Object.freeze({en:summary,el:greek}),suggestedTheme,rooms});
export const presetCatalog=Object.freeze([
 define('neutral','Neutral foundation','Ουδέτερη βάση','A minimal starting point for your own composition.','Μια απλή βάση για τη δική σας σύνθεση.','neutral'),
 define('professional-services','Professional services','Επαγγελματικές υπηρεσίες','Services, process, people and useful insights.','Υπηρεσίες, διαδικασία, ομάδα και χρήσιμα άρθρα.','neutral'),
 define('trades','Trades and local services','Τεχνικές και τοπικές υπηρεσίες','Practical services, service areas and direct contact.','Πρακτικές υπηρεσίες, περιοχές εξυπηρέτησης και άμεση επικοινωνία.','trades'),
 define('accommodation','Accommodation','Φιλοξενία','Rooms, amenities and local information; no reservations.','Δωμάτια, παροχές και τοπικές πληροφορίες, χωρίς κρατήσεις.','accommodation',true),
 define('studio','Studio and wellness','Studio και ευεξία','Classes, instructors and an informational studio schedule.','Μαθήματα, εκπαιδευτές και ενδεικτικό πρόγραμμα studio.','wellness'),
]);
