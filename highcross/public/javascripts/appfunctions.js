
function rejectImage(image){
	$.get( "reject/"+image, function(data) {
		//$( ".result" ).html( data );
		//alert(data);
		location.reload(); //Not the best way to do this as it calls the API all over again. Would improve if I had time. 
	});

}// JavaScript Document
function approveImage(image){
	
	$.get( "approve/"+image, function(data) {
		//$( ".result" ).html( data );
		location.reload();
	});

}
function fetchImages(){
	
	$.get( "fetch", function(data) {
		//$( ".result" ).html( data );
		location.reload();
	});

}