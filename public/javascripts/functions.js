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