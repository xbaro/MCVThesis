/*******************************
* Util functions
*******************************/
function dateFormatter(value, row) {
    if(value) {
        return new Date(value).toLocaleDateString();
    }
    return '';
}

function strCapitalize(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

// Serrialize a form to a JSON object
$.fn.serializeFormJSON = function () {

    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
        if (o[this.name]) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

// Get a date value in the allowed format for date inputs
$.fn.getFormatedDate = function () {
    var date = new Date(this.val());

    var day = ("0" + date.getDate()).slice(-2);
    var month = ("0" + (date.getMonth() + 1)).slice(-2);

    return date.getFullYear() + "-" + (month) + "-" + (day);
};

// Assign a date to a date input
$.fn.setFormatedDate = function (date) {
    if(date) {
        var date = new Date(date);

        var day = ("0" + date.getDate()).slice(-2);
        var month = ("0" + (date.getMonth() + 1)).slice(-2);

        this.val(date.getFullYear() + "-" + (month) + "-" + (day));
    } else {
        this.val('');
    }
};
$.fn.setFormatedTime = function (date) {
    if(date) {
        var date = new Date(date);

        this.val(("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ':' + ("0" + date.getSeconds()).slice(-2));
    } else {
        this.val('');
    }
};

/*
jQuery(document).ready(function() {

    $('#periodsTable').on('check.bs.table', function (e, row, $element) {
        var start = new Date(row.start);
        var end = new Date(row.end);

        var s_day = ("0" + start.getDate()).slice(-2);
        var s_month = ("0" + (start.getMonth() + 1)).slice(-2);
        var s_value = start.getFullYear()+"-"+(s_month)+"-"+(s_day) ;

        var e_day = ("0" + end.getDate()).slice(-2);
        var e_month = ("0" + (end.getMonth() + 1)).slice(-2);
        var e_value = end.getFullYear()+"-"+(e_month)+"-"+(e_day) ;

        $('#periodTitle').val(row.title);
        $('#start').val(s_value);
        $('#end').val(e_value);

        $('#btnEditPeriod').removeClass('disabled');
        $('#btnDelPeriod').removeClass('disabled');
    });

    $(function () {
        var periodForm = $('#periodFormBox');

        var periodWindow = bootbox.dialog({
                title: "Add new Period",
                message: periodForm,
                show: false,
                buttons: {
                    success: {
                        label: "Create",
                        className: "btn-success",
                        callback: function () {
                            var  title= $('#periodTitle').val();
                            var start = $('#start').val();
                            var end = $('#end').val();
                            alert('default');
                        }
                    }
                }
            });

        $('#btnAddPeriod').on('click', function(e) {
            bootbox.dialog({
                title: "Add new Period",
                message: periodForm,
                buttons: {
                    success: {
                        label: "Create",
                        className: "btn-success",
                        callback: function () {
                            var  title= $('#periodTitle').val();
                            var start = $('#start').val();
                            var end = $('#end').val();
                            alert('created');
                        }
                    }
                }
            });
        });

        $('#btnEditPeriod').on('click', function(e) {
            bootbox.dialog({
                title: "Edit Period",
                message: periodForm,
                buttons: {
                    success: {
                        label: "Update",
                        className: "btn-success",
                        callback: function () {
                            var  title= $('#periodTitle').val();
                            var start = $('#start').val();
                            var end = $('#end').val();
                            alert('created');
                        }
                    }
                }
            });
        });
    });

});

*/