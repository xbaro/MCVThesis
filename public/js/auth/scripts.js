
jQuery(document).ready(function() {

	// Update the list of institutions
    $("#institution option").remove();
    $.ajax({
        url: "/auth/institutions",
        dataType: "json",
        success: function(options) {
            var index, select, option;

            if (select !== undefined) {
                // Get the raw DOM object for the select box
                select = document.getElementById('institution');

                // Clear the old options
                select.options.length = 0;
                select.options.add(new Option("", -1));

                // Load the new options
                for (index = 0; index < options.length; ++index) {
                    option = options[index];
                    select.options.add(new Option(option.name, option.id));
                }
            }
        }
    });

    /*
        Fullscreen background
    */
    $.backstretch("/images/auth/backgrounds/1.jpg");
    
    /*
        Form validation
    */
    $('.login-form input[type="text"], .login-form input[type="password"], .login-form textarea').on('focus', function() {
    	$(this).removeClass('input-error');
    });
    
    $('.login-form').on('submit', function(e) {
    	
    	$(this).find('input[type="text"], input[type="password"], textarea').each(function(){
    		if( $(this).val() == "" ) {
    			e.preventDefault();
    			$(this).addClass('input-error');
    		}
    		else {
    			$(this).removeClass('input-error');
    		}
    	});
    	
    });
    
    
});
