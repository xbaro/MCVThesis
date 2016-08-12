jQuery(document).ready(function() {
    var roles = ['admin','teacher'];

	$('#roles').tokenfield({
		  autocomplete: {
			source: roles,
			delay: 100
		  },
		  showAutocompleteOnFocus: true
	});

    $('#roles_edt').tokenfield({
		  autocomplete: {
			source: roles,
			delay: 100
		  },
		  showAutocompleteOnFocus: true
	});

    $('#roles').on('tokenfield:createtoken', function (event) {
        var exists = true;
        $.each(roles, function(index, token) {
            if (token === event.attrs.value)
                exists = false;
        });
        if(exists === true) {
            event.preventDefault();
        } else {
            exists = false;
            var selected = [].concat($(event.currentTarget).tokenfield('getTokensList'));
            $.each(selected, function (index, token) {
                if (token === event.attrs.value)
                    exists = true;
            });
            if (exists === true)
                event.preventDefault();
        }
    });

    $('#roles_edt').on('tokenfield:createtoken', function (event) {
        var exists = true;
        $.each(roles, function (index, token) {
            if (token === event.attrs.value)
                exists = false;
        });
        if (exists === true) {
            event.preventDefault();
        } else {
            exists = false;
            var selected = [].concat($(event.currentTarget).tokenfield('getTokensList'));
            $.each(selected, function (index, token) {
                if (token === event.attrs.value)
                    exists = true;
            });
            if (exists === true)
                event.preventDefault();
        }
    });



    $('#usersTable').on('dbl-click-row.bs.table', function (e, row, $element, field) {
        $('#username_edt').val(row.username);
        $('#name_edt').val(row.name);
        $('#surname_edt').val(row.surname);
        $('#email_edt').val(row.email);
        $('#organization_edt').val(row.organization);
        $('#roles_edt').tokenfield('setTokens', row.roles);

        $('#user_edt').show();
        $('html, body').animate({
            scrollTop: $("#user_edt").offset().top
        }, 2000);
    });

    $('#delete_user').on('click', function(e) {
        var r = confirm("You will remove the user " + $('#username_edt').val() + " and all related assignations.");
        if (r == true) {
            var username = $('#username_edt').val();
            $.post( "/admin/user/delete", { username:  username} )
                .done(function( data ) {
                    $('#user_edt').hide();
                    $('#usersTable').bootstrapTable('refresh');
                    $('html, body').animate({
                        scrollTop: $("#usersTable").offset().top
                    }, 2000);

                });
        }
    });

    $('#cancel_user').on('click', function(e) {
        $('#user_edt').hide();
        $('html, body').animate({
            scrollTop: $("#usersTable").offset().top
        }, 2000);
    });

});
