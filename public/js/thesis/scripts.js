jQuery(document).ready(function() {

    var current_user;

    $.get( "/thesis/user_data").done(function( data ) {
        current_user = data;
        if (data.teacher || data.admin) {
            $.get( "/thesis/students").done(function( data ) {
                $("#author").autocomplete({
                    minLength: 0,
                    source: function(d,e){
                        var c = [];
                        $.get( "/thesis/students?term=" + d.term).done(function( students ) {
                            students = [].concat(students);
                            $.each(students, function (i, a) {
                                a.label = a.full_name;
                                c.push(a);
                              });
                              e(c);
                        });
                    },
                    focus: function( event, ui ) {
                                $( "#author" ).val( ui.item.full_name );
                            return false;
                          },
                    select: function( event, ui ) {
                            $( "#author" ).val( ui.item.full_name );

                            return false;
                          }
                }).autocomplete( "instance" )._renderItem = function( ul, item ) {
                    return $( "<li>" )
                        .append( "<div>" + item.full_name + "</div>" )
                        .appendTo( ul );
                    };
            });
        } else {
            $( "#author" ).autocomplete({
                source: [].concat(current_user),
                appendTo: current_user,
                disabled: true
            }).autocomplete( "instance" )._renderItem = function( ul, item ) {
                return $( "<li>" )
                            .attr( "data-value", item.fullname )
                            .append( item.username )
                            .appendTo( ul );
            };
        }
    });

    $('#btnNewThesis').on('click', function(e) {
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
