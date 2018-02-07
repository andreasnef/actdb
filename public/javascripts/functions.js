function toggle_visibility(id) {
       var e = document.getElementById(id);
//       e.preventDefault();
       if(e.style.display == 'block')
          e.style.display = 'none';
       else
          e.style.display = 'block';
       return false;    
} 

function loadProfile(type, code) {  
        $('#sideProfile').load('/profile/?type='+type+'&code='+code);
    }

function showFields(type) {
        if(type){
         typeValue = document.getElementById("input_type").value;
              if(typeValue == "Interview") {
                document.getElementById("location").style.display = "block";
                document.getElementById("date").style.display = "block"; 
                document.getElementById("focus").style.display = "block";
                document.getElementById("interviewee").style.display = "block";  
                document.getElementById("interviewer").style.display = "block"; 
                document.getElementById("related").style.display = "block";
                document.getElementById("notes").style.display = "block";
                document.getElementById("number").style.display = "block";
                document.getElementById("duration").style.display = "none";
                document.getElementById("attendant").style.display = "none";
                document.getElementById("subtype").style.display = "none";
                document.getElementById("name").style.display = "none";
                document.getElementById("title").style.display = "none";
                document.getElementById("author").style.display = "none";
                document.getElementById("publication").style.display = "none";
                document.getElementById("production").style.display = "none";
                document.getElementById("fileUpload").style.display = "block";
              } else if(typeValue == "Field Visit"){
                document.getElementById("location").style.display = "block";
                document.getElementById("date").style.display = "block";
                document.getElementById("duration").style.display = "block";
                document.getElementById("number").style.display = "block";
                document.getElementById("attendant").style.display = "block";
                document.getElementById("related").style.display = "block";
                document.getElementById("notes").style.display = "block";
                document.getElementById("subtype").style.display = "none";
                document.getElementById("name").style.display = "none";
                document.getElementById("title").style.display = "none";
                document.getElementById("focus").style.display = "none";
                document.getElementById("author").style.display = "none";
                document.getElementById("publication").style.display = "none";
                document.getElementById("production").style.display = "none";
                document.getElementById("fileUpload").style.display = "block";
                document.getElementById("interviewee").style.display = "none";  
                document.getElementById("interviewer").style.display = "none"; 
              } else if (typeValue == "News"){
                document.getElementById("subtype").style.display = "block";
                document.getElementById("name").style.display = "block";  
                document.getElementById("title").style.display = "block";
                document.getElementById("date").style.display = "block";
                document.getElementById("focus").style.display = "block";
                document.getElementById("author").style.display = "block";
                document.getElementById("publication").style.display = "block";
                document.getElementById("related").style.display = "block";
                document.getElementById("production").style.display = "none";
                document.getElementById("location").style.display = "none";
                document.getElementById("duration").style.display = "none";
                document.getElementById("number").style.display = "none";
                document.getElementById("attendant").style.display = "none";
                document.getElementById("notes").style.display = "none";
                document.getElementById("fileUpload").style.display = "block";
                document.getElementById("interviewee").style.display = "none";  
                document.getElementById("interviewer").style.display = "none"; 
              } else if (typeValue == "Literature"){
                document.getElementById("subtype").style.display = "block";
                document.getElementById("title").style.display = "block";
                document.getElementById("date").style.display = "block";
                document.getElementById("focus").style.display = "block";
                document.getElementById("author").style.display = "block";
                document.getElementById("publication").style.display = "block";
                document.getElementById("related").style.display = "block";
                document.getElementById("production").style.display = "none";
                document.getElementById("location").style.display = "none";
                document.getElementById("duration").style.display = "none";
                document.getElementById("number").style.display = "none";
                document.getElementById("attendant").style.display = "none";
                document.getElementById("notes").style.display = "none";
                document.getElementById("name").style.display = "none";
                document.getElementById("fileUpload").style.display = "block";
                document.getElementById("interviewee").style.display = "none";  
                document.getElementById("interviewer").style.display = "none"; 
              } else if (typeValue == "Human Rights organizations"){
                document.getElementById("subtype").style.display = "block";
                document.getElementById("title").style.display = "block";
                document.getElementById("date").style.display = "block";
                document.getElementById("focus").style.display = "block";
                document.getElementById("author").style.display = "block";
                document.getElementById("related").style.display = "block";
                document.getElementById("production").style.display = "none";
                document.getElementById("location").style.display = "none";
                document.getElementById("duration").style.display = "none";
                document.getElementById("number").style.display = "none";
                document.getElementById("attendant").style.display = "none";
                document.getElementById("notes").style.display = "none";
                document.getElementById("name").style.display = "none";
                document.getElementById("publication").style.display = "none";
                document.getElementById("fileUpload").style.display = "block";
                document.getElementById("interviewee").style.display = "none";  
                document.getElementById("interviewer").style.display = "none"; 
              } else if (typeValue == "Documentaries"){
                document.getElementById("title").style.display = "block";
                document.getElementById("date").style.display = "block"; 
                document.getElementById("focus").style.display = "block"; 
                document.getElementById("author").style.display = "block";
                document.getElementById("related").style.display = "block";
                document.getElementById("duration").style.display = "block";
                document.getElementById("production").style.display = "block";
                document.getElementById("location").style.display = "none";
                document.getElementById("number").style.display = "none";
                document.getElementById("attendant").style.display = "none";
                document.getElementById("notes").style.display = "none";
                document.getElementById("subtype").style.display = "none";
                document.getElementById("name").style.display = "none";
                document.getElementById("publication").style.display = "none";
                document.getElementById("fileUpload").style.display = "block";
                document.getElementById("interviewee").style.display = "none";  
                document.getElementById("interviewer").style.display = "none"; 
              } else if (typeValue == "Political groups"){
                document.getElementById("subtype").style.display = "block";
                document.getElementById("title").style.display = "block";
                document.getElementById("date").style.display = "block";
                document.getElementById("focus").style.display = "block";
                document.getElementById("author").style.display = "block";
                document.getElementById("related").style.display = "block";
                document.getElementById("production").style.display = "block";
                document.getElementById("location").style.display = "none";
                document.getElementById("duration").style.display = "none";
                document.getElementById("number").style.display = "none";
                document.getElementById("attendant").style.display = "none";
                document.getElementById("notes").style.display = "none";
                document.getElementById("name").style.display = "none";
                document.getElementById("publication").style.display = "none";
                document.getElementById("fileUpload").style.display = "block";
                document.getElementById("interviewee").style.display = "none";  
                document.getElementById("interviewer").style.display = "none"; 
              } else if (typeValue == "Social Media"){
                document.getElementById("subtype").style.display = "block";
                document.getElementById("title").style.display = "block";
                document.getElementById("date").style.display = "block";
                document.getElementById("focus").style.display = "block";
                document.getElementById("author").style.display = "block";
                document.getElementById("related").style.display = "block";
                document.getElementById("production").style.display = "none";
                document.getElementById("location").style.display = "none";
                document.getElementById("duration").style.display = "none";
                document.getElementById("number").style.display = "none";
                document.getElementById("attendant").style.display = "none";
                document.getElementById("notes").style.display = "none";
                document.getElementById("name").style.display = "none";
                document.getElementById("publication").style.display = "none";
                document.getElementById("fileUpload").style.display = "block";
                document.getElementById("interviewee").style.display = "none";  
                document.getElementById("interviewer").style.display = "none"; 
              } else{
                document.getElementById("location").style.display = "none";
                document.getElementById("date").style.display = "none";
                document.getElementById("duration").style.display = "none";
                document.getElementById("number").style.display = "none";
                document.getElementById("attendant").style.display = "none";
                document.getElementById("related").style.display = "none";
                document.getElementById("production").style.display = "none";
                document.getElementById("notes").style.display = "none";
                document.getElementById("subtype").style.display = "none";
                document.getElementById("name").style.display = "none";
                document.getElementById("title").style.display = "none";
                document.getElementById("focus").style.display = "none";
                document.getElementById("author").style.display = "none";
                document.getElementById("publication").style.display = "none";
                document.getElementById("fileUpload").style.display = "none";
                document.getElementById("interviewee").style.display = "none";  
                document.getElementById("interviewer").style.display = "none"; 
              }
          }
}     
   