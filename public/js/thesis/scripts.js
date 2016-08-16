jQuery(document).ready(function() {

    var current_user;
    var selected_advisors=[];

    function split( val ) {
      return val.split( /,\s*/);
    }
    function extractLast( term ) {
      return split( term ).pop();
    }
    function addThesis(thesis, suffix , parent) {

        var advisors = '';
        $.each(thesis['Advised'], function(i, a) {
            if (i>0) {
                advisors+= ', ';
            }
            advisors+=a['full_name'];
        });

        var committee = '';

        var newThesis = $('<div/>',{id: suffix + thesis['id']}).addClass("panel").appendTo(parent);

        if (thesis['approved']) {
            newThesis.addClass("panel-default").addClass('.margin-bottom-40');
        } else {
            newThesis.addClass("panel-warning").addClass('.margin-bottom-40');
        }

        var header = $('<div>').addClass("panel-heading").append(
            $("<div>").addClass("panel-title").append(
                $('<p>').append("<strong>" +  thesis['title'] + "</strong>")
            ).append(
                $('<p>').append("<i>by " + thesis['User'].full_name + "</i>")
            )
        ).appendTo(newThesis);

        if (!thesis['approved']) {
            header.append($('<p>').append("<strong><i>Requires teacher approval</i></strong>"))
        }

        var body = $('<div>').addClass("panel-body").append(
            $("<div>").addClass("panel-title").append(
                $('<p>').append("<strong>Abstract:</strong>")
            ).append(
                $('<p>').append(thesis['abstract'])
            )
        ).append(
            $("<div>").addClass("panel-title").append(
                $('<p>').append("<strong>Keywords:</strong>")
            ).append(
                $('<p>').append("<i>" + thesis['keywords'] + "</i>")
            )
        ).append(
            $("<div>").addClass("panel-title").append(
                $('<p>').append("<strong>Advisor/s:</strong>")
            ).append(
                $('<p>').append("<i>" + advisors + "</i>")
            )
        ).appendTo(newThesis);

        var footer = $('<div>').addClass("panel-footer").appendTo(newThesis);

        if(thesis['approved']) {
            if (current_user.teacher || current_user.admin) {
                var footer_btn = $('<div>').addClass('button-group').appendTo(footer);
                $('<button>').addClass('btn').addClass('btn-success').addClass('edit-thesis').append("Edit").appendTo(footer_btn);
                $('<button>').addClass('btn').addClass('btn-danger').addClass('del-thesis').append("Delete").appendTo(footer_btn);
            }
        } else {
            var footer_btn = $('<div>').addClass('button-group').appendTo(footer);
            $('<button>').addClass('btn').addClass('btn-success').addClass('edit-thesis').append("Edit").appendTo(footer_btn);
            $('<button>').addClass('btn').addClass('btn-danger').addClass('del-thesis').append("Delete").appendTo(footer_btn);

            if ((current_user.teacher || current_user.admin)) {
                $('<button>').addClass('btn').addClass('btn-info').addClass('approve-thesis').append("Approve").appendTo(footer_btn);
            }
        }
    }

    function getThesisId(event) {
        var div_id=event.target.closest('.panel').attributes['id'].value;
        return parseInt(div_id.split('_')[1]);
    }

    function showTheses() {
        $('#panel_myThesis').empty();
        $('#panel_advisedThesis').empty();

        $.get( "/thesis/authored", 'json').done(function( data ) {
            $.each(data, function (i, t) {
                addThesis(t, 'mt_', $('#panel_myThesis'));
            });

            $.get( "/thesis/advised", 'json').done(function( data ) {
                $.each(data, function (i, t) {
                    addThesis(t, 'at_', $('#panel_advisedThesis'));
                });
                $('.edit-thesis').on('click', function(e) {
                    alert( 'edit (' + getThesisId(e) + ')' );
                });

                $('.del-thesis').on('click', function(e) {
                    var r = confirm("You will remove the thesis and all its related information.");
                    if (r == true) {
                        $.post("/thesis/" + getThesisId(e) + "/delete", 'json').done(function (data) {
                            showTheses();
                        });
                    }
                });

                $('.approve-thesis').on('click', function(e) {
                    $.post("/thesis/" + getThesisId(e) + "/approve", 'json').done(function( data ) {
                        showTheses();
                    });
                });
            });

        });
    }

    function get_advisors() {
        var sel = split($('#advisors').val());
        //TODO: Check that all advisors in selected_advisors are in sel. Discard the differences.
        var ad_ids=[];
        $.map(selected_advisors, function(n, i){
            var ad = {};
            //ad.username = n['username'];
            //ad_ids.push(ad);
            ad_ids.push(n['username']);
        });
        return ad_ids;
    }

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


    $.get( "/thesis/user_data").done(function( data ) {
        current_user = data;
        showTheses();
        if (data.teacher || data.admin) {

        } else {
            $("#author").val(current_user.full_name);
            $("#author").autocomplete('disable');
            $('#author').prop('readonly', true);
        }
    });

    $("#advisors").on( "keydown", function( event ) {
        if ( event.keyCode === $.ui.keyCode.TAB &&
            $( this ).autocomplete( "instance" ).menu.active ) {
                event.preventDefault();
            }
        }).autocomplete({
            minLength: 0,
            source: function(request, response){
                var c = [];
                var term = extractLast( request.term );
                $.get( "/thesis/teachers?term=" + term).done(function( teachers ) {
                    if (teachers) {
                        teachers = [].concat(teachers);
                    } else {
                        teachers = [];
                    }
                    $.each(teachers, function (i, a) {
                        a.label = a.full_name;
                        c.push(a);
                      });
                    response(c);
                });
            },
            focus: function( event, ui ) {
                    return false;
                },
            select: function( event, ui ) {
                var terms = split(this.value);
                // remove the current input
                terms.pop();
                // add the selected item
                terms.push(ui.item.full_name);
                // add placeholder to get the comma-and-space at the end
                terms.push("");
                selected_advisors.push(ui.item);
                $( "#advisors" ).val(terms.join(", "));
                return false;
            }
        }).autocomplete( "instance" )._renderItem = function( ul, item ) {
            return $( "<li>" )
                .append( "<div>" + item.full_name + "</div>" )
                .appendTo( ul );
        };

    $('#btnNewThesis').on('click', function(e) {
        $('#thesis_edt').show();
        $('#btnNewThesis').hide();
    });
    $('#btnCancelNew').on('click', function(e) {
        $('#thesis_edt').hide();
    });
    $('#thesis_edt').submit(function( event ) {
        event.preventDefault();
        var $form = $(event.target);
        var data = {};
        $.map($form.serializeArray(), function(n, i){
            data[n['name']] = n['value'];
        });

        var author = $('#author').autocomplete('instance').selectedItem;
        data['advisors'] = get_advisors();
        if (current_user.teacher || current_user.admin) {
            data['author'] = author.username;
        } else {
            data['author'] = current_user.username;
        }

        $.ajax({
            type: "POST",
            url: $form.attr('action'),
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        }).done(function(data) {
            $('#btnNewThesis').show();
            showThesis();
        });
    });
});
