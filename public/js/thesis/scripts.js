jQuery(document).ready(function() {

    var current_user;

    $.get( "/thesis/user_data").done(function( data ) {
            current_user = data;
    });

    $('#btnNewThesis').on('click', function(e) {
        $('#author').tagsinput({
            itemValue: 'username',
            itemText: 'full_name',
            source: [].concat(current_user)
        });

        $('#author').tagsinput('removeAll');
        $('#author').tagsinput('add',current_user);
        $('#thesis_edt').show();
    });
    $('#btnCancelNew').on('click', function(e) {
        $('#thesis_edt').hide();
    });

    $('#usersTable').on('dbl-click-row.bs.table', function (e, row, $element, field) {
        $('#username_edt').val(row.username);
        $('#name_edt').val(row.name);
        $('#surname_edt').val(row.surname);
        $('#email_edt').val(row.email);
        $('#organization_edt').val(row.organization);
        $('#roles_edt').tokenfield('setTokens', row.roles);
        $('#keywords_edt').tokenfield('setTokens', row.keywords);

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
