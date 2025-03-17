class Nav{
	constructor(){
		this.sideBarNavChange();
	}
	
	sideBarNavChange() {
	    const navItems = document.querySelectorAll(".nav-item");
	    
	    navItems.forEach(navItem => {
	        navItem.addEventListener("click", (event) => {
	            navItems.forEach(item => item.classList.remove("active"));
	            
	            event.currentTarget.classList.add("active");
	        });
	    });
	}
	
	messageIconListener(){
		const chatIcon = document.getElementById("user-chat-button");
		const navItems = document.querySelectorAll(".nav-item");
		

	        chatIcon.addEventListener("click", () => {
	            navItems.forEach(item => item.classList.remove("active"));
	            
	            navItems.forEach(item => {
					if(item.span.innerText == "Messages"){
						item.classList.add("active");
					}
				})
	        });
   
	}
}

window.nav = new Nav();