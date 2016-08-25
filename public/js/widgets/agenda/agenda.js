!function( $ ) {
    "use strict";

    $.widget( "mcv-theses.agenda", {
        // default options
        options: {
            source: []
        },

        // The constructor
        _create: function() {
            this.element.addClass( "mcv-theses" );
            this.container = $('<div>').addClass('mcv-theses-container').appendTo(this.element);
            this.table_container = $('<div>').addClass('mcv-theses-table-container table-responsive').appendTo(this.container);
            this.table = $('<table>').addClass('table table-condensed table-bordered').appendTo(this.table_container);

            this.table_header = $('<thead>').appendTo(this.table);
            this.table_body = $('<tbody>').appendTo(this.table);
            this._refresh();
        },
        // Called when created, and later when changing options
        _refresh: function() {
            this.table_header.empty();
            this.table_body.empty();

            if (this.options.source instanceof Array) {
                this.source_data = this.options.source;
                this._loadData();
            } else {
                var widget = this;
                $.get(this.options.source, {}, 'json').done(function( data ) {
                    widget.source_data = data;
                    widget._loadData();
                });
            }
        },
        _formatDate: function(value) {
            var date = new Date(value);

            var day = ("0" + date.getDate()).slice(-2);
            var month = ("0" + (date.getMonth() + 1)).slice(-2);

            return date.getFullYear() + "-" + (month) + "-" + (day);
        },
        _formatTime: function(value) {
            var date = new Date(value);
            return date.getHours() + ":" + ("0" + date.getMinutes()).slice(-2);
        },
        _loadData: function() {

            if (!this.source_data || this.source_data.length==0) {
                this.table_body.append('No events to show');
            }
            var dates = {};
            var slot = {};
            var tracks = {};
            var newData = {};

            var widget = this;
            $.each(this.source_data, function(index, event){
                // Create a field for each date
                var d = widget._formatDate(event.date);
                dates[d] = {};
                if (!newData.hasOwnProperty(d)) {
                    newData[d] = {};
                }
                // Create a field for each temporal slot
                slot[event.start]={};
                if (!newData[d].hasOwnProperty(event.start)) {
                    newData[d][event.start] = {};
                }

                // Create a track object
                if (!tracks.hasOwnProperty(event.track_title)) {
                    tracks[event.track_title] = {};
                }

                if (!newData[d][event.start].hasOwnProperty(event.track_title)) {
                    newData[d][event.start][event.track_title] = {};
                }

                // Create a room object
                var roomName = event.room + '@' + event.place;
                if (!tracks[event.track_title].hasOwnProperty(roomName)) {
                    tracks[event.track_title][event.room] = {room: event.room, place: event.place};
                }
                if (!newData[d][event.start][event.track_title].hasOwnProperty(event.room)) {
                    newData[d][event.start][event.track_title][event.room] = {};
                }

                // Add this event in the structure
                newData[d][event.start][event.track_title][event.room][event.thesis_id] = event;
            });

            // Create the headers
            var h1 = $('<tr>').append(
                $('<th>').attr({colspan: 2, rowspan: 2}).append('Date')
            ).appendTo(this.table_header);
            var h2 = $('<tr>').appendTo(widget.table_header);

            $.each(Object.keys(tracks), function (i, t) {
                h1.append(
                    $('<th>').attr({colspan: Object.keys(tracks[t]).length}).append(t)
                );
                $.each(Object.keys(tracks[t]), function (j,r){
                    h2.append(
                        $('<th>').append(
                            $('<p>').append(tracks[t][r].room).append($('<div>').addClass('text-muted').append(tracks[t][r].place))
                        )
                    );
                });
            });

            // Create the dates rows
            $.each(Object.keys(newData), function(i, d) {
                var date_parts = new Date(d).toString().split(' ');
                var row = $('<tr>').appendTo(widget.table_body);
                newData[d].element=$('<td>').addClass('agenda-date').attr({rowspan: Object.keys(newData[d]).length}).append(
                    $('<div>').addClass('dayofmonth').append(date_parts[2])
                ).append(
                    $('<div>').addClass('dayofweek').append(date_parts[0])
                ).append(
                    $('<div>').addClass('shortdate text-muted').append(date_parts[1] + ' ' + date_parts[3])
                ).appendTo(row);

                if(widget._formatDate(new Date())==widget._formatDate(d)) {
                    newData[d].element.addClass('active');
                }


                $.each(Object.keys(newData[d]), function (k,s) {
                    var targetRow;
                    if (s != 'element') {
                        newData[d][s].element = $('<td>').addClass('agenda-time').append(s);
                        if (k == 0) {
                            targetRow = row;
                        } else {
                            targetRow = $('<tr>').appendTo(widget.table_body);
                        }
                        newData[d][s].element.appendTo(targetRow);
                    }
                    $.each(Object.keys(tracks), function (i_t, o_t) {
                        $.each(Object.keys(tracks[o_t]), function (i_r, o_r){
                            var newEvent = $('<td>').addClass('agenda-events');
                            if(newData[d][s].hasOwnProperty(o_t)) {
                                if(newData[d][s][o_t].hasOwnProperty(o_r)) {

                                    $.each(Object.keys(newData[d][s][o_t][o_r]), function(i_ce, o_ce) {
                                        $('<td>').addClass('agenda-event')
                                            .append(widget._renderEvent(o_ce, newData[d][s][o_t][o_r][o_ce]))
                                            .appendTo(newEvent);
                                    });
                                }
                            }
                            newEvent.appendTo(targetRow);
                        });
                    })
                });
            });
        },
        // Events bound via _on are removed automatically
        // revert other modifications here
        _destroy: function() {
            // remove generated elements
            this.changer.remove();

            this.element
                .removeClass( "mcv-theses" )
                .enableSelection();
            this.container.remove();
        },

        // _setOptions is called with a hash of all options that are changing
        // always refresh when changing options
        _setOptions: function() {
            // _super and _superApply handle keeping the right this-context
            this._superApply( arguments );
            this._refresh();
        },

        // _setOption is called for each individual option that is changing
        _setOption: function( key, value ) {
            // prevent invalid color values
            //if ( /red|green|blue/.test(key) && (value < 0 || value > 255) ) {
            //    return;
            //}
            this._super( key, value );
        },
        _renderEvent: function(id, object) {

            var advisors = '';
            for(var a=0; a<object.advisors.length; a++) {
                if (a>0) advisors += ', ';
                advisors += object.advisors[a].name + ' (' + object.advisors[a].organization + ')';
            }
            var committee = '<ul>' +
                                '<li><strong><em>President: </em></strong>' + object.committee['president'].name + ' (' + object.committee['president'].organization + ')</li>' +
                                '<li><strong><em>Secretary: </em></strong>' + object.committee['secretary'].name + ' (' + object.committee['secretary'].organization + ')</li>' +
                                '<li><strong><em>Vocal: </em></strong>' + object.committee['vocal'].name + ' (' + object.committee['vocal'].organization + ')</li>' +
                            '</ul>';

            return '<a href="#event_cell_' + id + '" class="btn btn-info btn-xs" data-toggle="collapse"><i class="glyphicon glyphicon-plus"></i></a> <strong>' + object.thesis_author_name + '</strong>' +
                    '<p><em>' + object.thesis_title + '</em></p>' +
                    '<div id="event_cell_' + id + '" class="collapse">' +
                        '<p><strong>Advisor/s: </strong>' + advisors + '</p>' +
                        '<p><strong>Abstract:</strong></p><p>' + object.thesis_abstract + '</p>' +
                        '<p><strong>Committee:</strong></p>' + committee +
                    '</div>';


            //return object.thesis_title;
        }
    });
}( window.jQuery );
