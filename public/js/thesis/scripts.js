/*var abstract_editor = $('#abstract').wysihtml5({
            "events":      {
                "load": function () {
                    jQuery('.wysihtml5').addClass('nicehide');
                }
            }
        });
*/
var abstract_editor;
function getActionButtons(value, row, index) {

    var allow_edit = true;
    var allow_approve = !row.approved;
    var allow_delete = true;

    var toolbar='<div class="form-inline" role="form"><div class="btn-group">';
    if(allow_edit) {
        toolbar += '<button class="btn btn-default btn-xs thesis_action" type="button" data-action="edit" data-thesis_id="' + value + '">' +
            '<span class="glyphicon glyphicon-pencil" aria-hidden="true" />' +
            '</button>';
    }
    if(allow_approve) {
        toolbar += '<button class="btn btn-default btn-xs thesis_action" type="button" data-action="accept" data-thesis_id="' + value + '">' +
                        '<span class="glyphicon glyphicon-check" aria-hidden="true" />' +
                    '</button>';
    }
    if(allow_delete) {
        toolbar += '<button class="btn btn-default btn-xs thesis_action" type="button" data-action="delete" data-thesis_id="' + value + '">' +
                       '<span class="glyphicon glyphicon-trash" aria-hidden="true" />' +
                    '</button>';
    }
    toolbar += '</div></div>';
    return toolbar;
}

function getSlotInfo(value, row, index) {
    var slot = '';
    if(row.Slot) {
        slot = dateFormatter(row.Slot.start);
    }
    return slot;
}

function getAdvisorsValue(value, row, index) {
    var advisors = '';
    if(row.Advised.length > 0 ) {
        advisors += '<ul>';
        $.each(row.Advised, function(idx, adv) {
            advisors += '<li>' + adv.full_name + ' (' + adv.organization + ') </li>'
        });
        advisors += '</ul>';
    }
    return advisors;
}

function getCommitteeValue(value, row, index) {
    var committee = '';
    if(row.Reviewed.length > 0 ) {
        committee += '<ul>';
        $.each(row.Reviewed, function(idx, rev) {
            committee += '<li><a href="mailto:' + rev.email + '">' + rev.full_name + '</a> (' + rev.organization + ')</li>';
        });
        committee += '</ul>';
    }
    return committee;
}

jQuery(document).ready(function() {

    /*abstract_editor = $('#abstract').wysihtml5({
            "events":      {
                "load": function () {
                    jQuery('.wysihtml5').addClass('nicehide');
                }
            }
        });
*/
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
        var authorName = '<undefinded>';
        if(thesis['User']) {
            authorName = thesis['User'].full_name;
        }
        var header = $('<div>').addClass("panel-heading").append(
            $("<div>").addClass("panel-title").append(
                $('<p>').append("<strong>" +  thesis['title'] + "</strong>")
            ).append(
                $('<p>').append("<i>by " + authorName + "</i>")
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

            if (current_user.teacher || current_user.admin || current_user.config.students_edit) {
                $('<button>').addClass('btn').addClass('btn-success').addClass('edit-thesis').append("Edit").appendTo(footer_btn);
            }
            if (current_user.teacher || current_user.admin || current_user.config.students_delete) {
                $('<button>').addClass('btn').addClass('btn-danger').addClass('del-thesis').append("Delete").appendTo(footer_btn);
            }

            if ((current_user.teacher || current_user.admin)) {
                $('<button>').addClass('btn').addClass('btn-info').addClass('approve-thesis').append("Approve").appendTo(footer_btn);
            }
        }
    }



    function editThesis(id) {
        $.get('/thesis/' + id , {}, 'json').done(function(thesis) {
            if (thesis && !thesis.hasOwnProperty('error')) {
                // Reset the form data
                $('#thesisFormModal').find('form').trigger("reset");

                // Assign the values
                $('#thesis_id').val(thesis.id);
                $('#title').val(thesis.title);
                //$('#abstract').val(thesis.abstract);
                if ($("#abstract").data("wysihtml5")) {
                    $("#abstract").data("wysihtml5").editor.setValue(thesis.abstract);
                } else {
                    $('#abstract').val(thesis.abstract);
                }
                $('#keywords').val(thesis.keywords);
                if (thesis['nda'] == true) {
                    $('#nda').attr('checked', true);
                } else {
                    $('#nda').attr('checked', false);
                }

                var advisors = [];
                $.each(thesis.Advised, function(idx, adv) {
                    advisors.push(adv.full_name);
                });
                $('#advisors').val(advisors.join(', '));
                selected_advisors = thesis.Advised;

                $('#author').val(thesis.User.full_name);
                $('#author_username').val(thesis.User.username);
                $('#virtual_room').val(thesis.virtual_room);
                $('#rubrics_folder').val(thesis.rubrics_folder);

                // Check the status for the author field
                if(current_user.teacher || current_user.admin) {
                    $('#author').attr('readonly', false);
                } else {
                    $('#author').attr('readonly', true);
                }

                // Adapt the form for update
                $('#thesisFormModal').find('.modal-title').text('Edit thesis');
                $('#thesisFormModal').find('.btn-primary').text('Update');
                $('#thesisFormModal').find('.btn-primary').data('action', 'edit');

                // Show the window
                $('#thesisFormModal').modal('show');
            }
        });
    }

    function getThesisId(event) {
        var div_id=event.target.closest('.panel').attributes['id'].value;
        return parseInt(div_id.split('_')[1]);
    }

    function setAutocompletCurrentValue(id, value) {
       $(id).val(value);
       var textToShow = $(id).find(":selected").text();
       $(id).parent().find("span").find("input").val(textToShow);
    }

    function showTheses() {
        $('#panel_myThesis').empty();
        $('#panel_advisedThesis').empty();
        $('#thesesTable').bootstrapTable('refresh');

        $.get( "/thesis/authored", 'json').done(function( data ) {
            $.each(data, function (i, t) {
                addThesis(t, 'mt_', $('#panel_myThesis'));
            });

            $.get( "/thesis/advised", 'json').done(function( data ) {
                $.each(data, function (i, t) {
                    addThesis(t, 'at_', $('#panel_advisedThesis'));
                });
                $('.edit-thesis').on('click', function(e) {
                    editThesis(getThesisId(e));
                });

                $('.del-thesis').on('click', function(e) {
                    bootbox.confirm("You will remove the thesis and all the related information.",
                        function (result) {
                            if (result) {
                                $.post("/thesis/" + getThesisId(e) + "/delete", 'json').done(function (data) {
                                    showTheses();
                                });
                            }
                        });
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
        var ad_ids=[];
        var new_list = [];

        $.each(selected_advisors, function(i, n){
            var user_exist = false;
            var repeated = false;
            $.each(new_list, function(idx, u_obj){
                if(u_obj.username==n['username']) {
                    repeated=true;
                }
            });
            if(!repeated) {
                $.each(sel, function (idx, u_fn) {
                    if (u_fn == n['full_name']) {
                        user_exist = true;
                    }
                });
                if (user_exist) {
                    ad_ids.push(n['username']);
                    new_list.push(n);
                }
            }
        });

        selected_advisors = new_list;
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
                    $('#author_username').val(ui.item.username);

                    return false;
                  }
        }).autocomplete( "instance" )._renderItem = function( ul, item ) {
            return $( "<li>" )
                .append( "<div>" + item.full_name + "</div>" )
                .appendTo( ul );
            };

        $( "#author" ).autocomplete( "option", "appendTo", "#thesisFormModal" );
    });


    $.get( "/thesis/user_data").done(function( data ) {
        current_user = data;
        $.get( "/config").done(function( conf ) {
            current_user.conf = conf;
            showTheses();
            if (data.teacher || data.admin) {
                $('#btnNewThesis').show();
                if (!data.admin) {
                    $("#advisors").val(current_user.full_name);
                    var item = current_user;
                    item.label = item.full_name;
                    selected_advisors.push(item);
                }
            } else {
                $("#author").val(current_user.full_name);
                $("#author").autocomplete('disable');
                $('#author').prop('readonly', true);

                if (!conf.students_create) {
                    $('#btnNewThesis').hide();
                }
            }
        });
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
                selected_advisors.push(ui.item);
                var terms = [];
                $.each(selected_advisors, function (i,u){
                    terms.push(u.full_name);
                });

                //var terms = split(this.value);
                // remove the current input
                //terms.pop();
                // add the selected item
                //terms.push(ui.item.full_name);
                // add placeholder to get the comma-and-space at the end
                //terms.push("");
                //selected_advisors.push(ui.item);
                $( "#advisors" ).val(terms.join(", "));
                return false;
            }
        }).autocomplete( "instance" )._renderItem = function( ul, item ) {
            return $( "<li>" )
                .append( "<div>" + item.full_name + "</div>" )
                .appendTo( ul );
        };
        $( "#advisors" ).autocomplete( "option", "appendTo", "#thesisFormModal" );

    $('#thesisFormModal').on('shown.bs.modal', function () {
        $('#abstract').wysihtml5({
            "events":      {
                "load": function () {
                    jQuery('.wysihtml5').addClass('nicehide');
                }
            }
        });
    });

    $('#btnRefresh').on('click', function(e) {
        showTheses();
    });

    $('#btnNewThesis').on('click', function(e) {
        // Reset the form data
        $('#thesisFormModal').find('form').trigger("reset");
        //$('#abstract').val('');
        if ($("#abstract").data("wysihtml5")) {
            $("#abstract").data("wysihtml5").editor.setValue("");
        } else {
            $('#abstract').val('');
        }
        selected_advisors=[];

        // Ensure that username is enabled for edit
        $('#user_username').attr('readonly', false);

        // Adapt the form for creation
        $('#thesisFormModal').find('.modal-title').text('Add new thesis');
        $('#thesisFormModal').find('.btn-primary').text('Add');
        $('#thesisFormModal').find('.btn-primary').data('action', 'add');

        // Show the window
        $('#thesisFormModal').modal('show', $('#btnNewThesis'));
    });

    $('#btnAcceptThesis').on('click', function(e) {
        var action = $(this).data('action');

        // Get the data from the form
        var thesis = $('#thesisFormModal').find('form').serializeFormJSON();

        // Process special fields
        var author = $('#author_username').val();
        thesis['advisors'] = get_advisors();
        if (current_user.teacher || current_user.admin) {
            thesis['author'] = author;
        } else {
            thesis['author'] = current_user.username;
        }

        thesis['nda'] = $("#nda").is(":checked");

        // Set the action
        var post_action = '';
        var msg_title = 'Error';
        var msg_body = '';
        switch (action) {
            case 'add':
                post_action = '/thesis/new';
                msg_title = 'Add new thesis';
                msg_body = 'Created thesis for <strong>' + thesis.author + '</strong>';
                break;
            case 'edit':
                post_action = '/thesis/' + thesis['id'] + '/update';
                msg_title = 'Update thesis';
                msg_body = 'Thesis of <strong>' + thesis.author + '</strong> successfully updated'
                break;
        }

        // Perform the action
        $.ajax({
            type: "POST",
            url: post_action,
            data: JSON.stringify(thesis),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        }).done(function( data ) {
                // Show the message
                if(data.hasOwnProperty('error') && !data.error) {
                    $.notify({
                        title: '<strong>' + msg_title +'</strong>',
                        message: msg_body,
                        newest_on_top: true
                    }, {
                        type: 'success',
                        element: '#thesisForm_messages'
                    });
                    // Close the modal form
                    $('#thesisFormModal').modal('hide');
                    showTheses();

                } else {
                    $.notify({
                        title: '<strong>Error</strong>',
                        message: 'Unexpected error processing the request [action='+ action + ', msg=' + data.message + '].',
                        newest_on_top: true
                    },{
                        type: 'danger',
                        element: '#thesis_modalBody'
                    });
                }

        }).fail(function() {
            $.notify({
                title: '<strong>Error</strong>',
                message: 'Unexpected error processing the request [action='+ action + ', author=' + thesis.author + '].',
                newest_on_top: true
            },{
                type: 'danger',
                element: '#thesis_modalBody'
            });
        });

    });


    $('#thesesTable').on('load-success.bs.table',  function (data) {
        $('.thesis_action').off().on('click', function (e) {
            e.preventDefault();
            var action = e.currentTarget.dataset.action;
            var thesisId = e.currentTarget.dataset.thesis_id;
            switch (action) {
                case 'edit':
                    editThesis(thesisId);
                    break;
                case 'delete':
                    bootbox.confirm("You will remove the thesis and all the related information.",
                        function (result) {
                            if (result) {
                                $.post("/thesis/" + thesisId + "/delete", 'json').done(function (data) {
                                    showTheses();
                                });
                            }
                        });
                    break;
                case 'accept':
                    $.post("/thesis/" + thesisId + "/approve", 'json').done(function (data) {
                        showTheses();
                    });
                    break;
            }
        });
    });
    $('#thesesTable').on('post-body.bs.table',  function (data) {
        $('.thesis_action').off().on('click', function (e) {
            e.preventDefault();
            var action = e.currentTarget.dataset.action;
            var thesisId = e.currentTarget.dataset.thesis_id;
            switch (action) {
                case 'edit':
                    editThesis(thesisId);
                    break;
                case 'delete':
                    bootbox.confirm("You will remove the thesis and all the related information.",
                        function (result) {
                            if (result) {
                                $.post("/thesis/" + thesisId + "/delete", 'json').done(function (data) {
                                    showTheses();
                                });
                            }
                        });
                    break;
                case 'accept':
                    $.post("/thesis/" + thesisId + "/approve", 'json').done(function (data) {
                        showTheses();
                    });
                    break;
            }
        });
    });
});
