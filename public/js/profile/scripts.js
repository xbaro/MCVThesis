jQuery(document).ready(function() {
    $('#keywords').tokenfield();
    // Update the list of institutions
    $("#institution option").remove();
    $.ajax({
        url: "/auth/institutions",
        dataType: "json",
        success: function(options) {
            var index, select, option;

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

            $("#institution").val($("#institution_id").val());

        }
    });
});
