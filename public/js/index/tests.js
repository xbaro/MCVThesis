function showAlarmData(id, title, text, data, columns) {

    var tag_id = '#' + id;
    var exist = false;
    if( $(tag_id).length) {
        exist = true;
    }

    if (!exist) {
        var code = '<div id="cont_' + id + '"><buton href="#' + id + '" class="btn btn-info btn-xs" data-toggle="collapse"><i class="glyphicon glyphicon-collapse-down"></i></buton> <strong>' + title + '</strong>' +
            '<p><em>' + text + '</em></p>' +
            '<div id="' + id + '" class="collapse">' +
            '<table id="' + 'table_' + id + '">' +
            '</table>' +
            '</div></div>';

        $('#warnings').append(code);

        $('#table_' + id).bootstrapTable({
            url: data,
            columns: columns,
            pagination: true,
            search: true,
            showExport: true,
            exportTypes: ['excel'],
            exportOptions: {
                fileName: 'exportName',
                ignoreColumn: ["Actions"]
            },
            pageSize: 5,
            pageList: [5, 10, 20],
            onLoadSuccess: function (data) {
                $('.thesis_action').off().on('click', function (e) {
                    e.preventDefault();
                    var action = e.currentTarget.dataset.action;
                    var thesisId = e.currentTarget.dataset.thesis_id;
                    switch (action) {
                        case 'edit':
                            break;
                        case 'delete':
                            bootbox.confirm("You will remove the thesis and all the related information.",
                                function (result) {
                                    if (result) {
                                        $.post("/thesis/" + thesisId + "/delete", 'json').done(function (data) {
                                            showAlarms();
                                        });
                                    }
                                });
                            break;
                        case 'accept':
                            $.post("/thesis/" + thesisId + "/approve", 'json').done(function (data) {
                                showAlarms();
                            });
                            break;
                    }
                });
            }
        });
        $('#' + id).on('shown.bs.collapse', function () {
           $(this).parent().find('a').find(".glyphicon").removeClass("glyphicon-collapse-up").addClass("glyphicon-collapse-down");
        });

        $('#' + id).on('hidden.bs.collapse', function () {
           $(this).parent().find('a').find(".glyphicon").removeClass("glyphicon-collapse-down").addClass("glyphicon-collapse-up");
        });


    } else {
        $('#' + id).find('em').val(text);
        $('#table_' + id).bootstrapTable('refresh', {silent: false});
    }


}

function getAdvisorList(value, row, index) {
    var retList = '';
    for(var i = 0; i<value.length; i++) {
        if(i>0) {
            retList+=', ';
        }
        retList += value[i].full_name + ' (' + value[i].organization + ')';
    }
    return retList;
}
function getActionButtons(value, row, index) {

    var allow_edit = false;
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

function showAlarms() {
    $.get('/admin/alerts/noslot', {}, 'json').done(function (data) {
        var id = 'no_slot_thesis';
        if (data && data instanceof Array && data.length > 0) {
            $('#no_warnings').hide();
            showAlarmData(id, 'Theses without slot', 'Found ' + data.length + ' theses that are not assigned to any defense slot.', '/admin/alerts/noslot',
                [{field: 'id', title: 'id', sortable: true},
                    {field: 'User.full_name', title: 'Author', sortable: true},
                    {field: 'title', title: 'Title', sortable: true},
                    {field: 'abstract', title: 'Abstract', sortable: true},
                    {field: 'Advised', title: 'Advisors', sortable: true, formatter: getAdvisorList},
                    {field: 'id', title: 'Actions', sortable: false, formatter: getActionButtons}
                ]);
        } else {
            if( $('#cont_' + id).length) {
                $('#cont_' + id).remove();
            }
        }
    });
    $.get('/admin/alerts/noadvisor', {}, 'json').done(function (data) {
        var id = 'no_advisor_thesis';
        if (data && data instanceof Array && data.length > 0) {
            $('#no_warnings').hide();
            showAlarmData(id, 'Theses without advisors', 'Found ' + data.length + ' theses that are not assigned to any advisor.', '/admin/alerts/noadvisor',
                [{field: 'id', title: 'id', sortable: true},
                    {field: 'User.full_name', title: 'Author', sortable: true},
                    {field: 'title', title: 'Title', sortable: true},
                    {field: 'abstract', title: 'Abstract', sortable: true},
                    {field: 'id', title: 'Actions', sortable: false, formatter: getActionButtons}
                ]);
        } else {
            if( $('#cont_' + id).length) {
                $('#cont_' + id).remove();
            }
        }
    });
    $.get('/admin/alerts/noauthor', {}, 'json').done(function (data) {
        var id = 'no_author_thesis';
        if (data && data instanceof Array && data.length > 0) {
            $('#no_warnings').hide();
            showAlarmData(id, 'Theses without author', 'Found ' + data.length + ' theses that are not assigned to any student.', '/admin/alerts/noauthor',
                [{field: 'id', title: 'id', sortable: true},
                    {field: 'title', title: 'Title', sortable: true},
                    {field: 'abstract', title: 'Abstract', sortable: true},
                    {field: 'Advised', title: 'Advisors', sortable: true, formatter: getAdvisorList},
                    {field: 'id', title: 'Actions', sortable: false, formatter: getActionButtons}
                ]);
        } else {
            if( $('#cont_' + id).length) {
                $('#cont_' + id).remove();
            }
        }
    });
    $.get('/admin/alerts/notapproved', {}, 'json').done(function (data) {
        var id = 'no_approved_thesis';
        if (data && data instanceof Array && data.length > 0) {
            $('#no_warnings').hide();
            showAlarmData(id, 'Theses that require to be approved', 'Found ' + data.length + ' theses that are not yest approved.', '/admin/alerts/notapproved',
                [{field: 'id', title: 'id', sortable: true},
                    {field: 'User.full_name', title: 'Author', sortable: true},
                    {field: 'title', title: 'Title', sortable: true},
                    {field: 'abstract', title: 'Abstract', sortable: true},
                    {field: 'Advised', title: 'Advisors', sortable: true, formatter: getAdvisorList},
                    {field: 'id', title: 'Actions', sortable: false, formatter: getActionButtons}
                ]);
        } else {
            if( $('#cont_' + id).length) {
                $('#cont_' + id).remove();
            }
        }
    });
    $.get('/admin/alerts/nocommittee', {}, 'json').done(function (data) {
        var id = 'no_committee_thesis';
        if (data && data instanceof Array && data.length > 0) {
            $('#no_warnings').hide();
            showAlarmData(id, 'Theses that requires committee assigment', 'Found ' + data.length + ' theses that require committee members.', '/admin/alerts/nocommittee',
                [{field: 'id', title: 'id', sortable: true},
                    {field: 'User.full_name', title: 'Author', sortable: true},
                    {field: 'title', title: 'Title', sortable: true},
                    {field: 'abstract', title: 'Abstract', sortable: true},
                    {field: 'Advised', title: 'Advisors', sortable: true, formatter: getAdvisorList},
                    {field: 'id', title: 'Actions', sortable: false, formatter: getActionButtons}
                ]);
        } else {
            if( $('#cont_' + id).length) {
                $('#cont_' + id).remove();
            }
        }
    });
}

jQuery(document).ready(function() {
    showAlarms();
});
