(function ($) {
    $.fn.seven20Grid = function (options) {
        var defaultOptions =
        {
            "contentType": '',
            'dataPath': '',
            'dataName': '',
            'gridSelector': '#gridUI',
            'outerContainerSelector': '#grid-inner-container',
            'innerContainerSelector': '#grid-inner-container .grid-items-list',
            'gridItemSelector': '.grid-items-list',
            'buildViewer': true,
            'timer': '',
            'filter': '',
            'downKey': 40,
            'upKey': 38,
            'selectKey': 32,
            'deleteKey': 46,
            'completeKey': 35,
            'editButtons': null,
            'globalButtonNames': ["refresh", "add"],
            'globalButtonIcons': ["refresh", "plus"],
            'editButtonNames': ["share", "edit", "publish", "archive", "delete"],
            'editButtonIcons': ["share", "edit", "globe", "inbox", "trash"],
            'viewerTemplate': '<div id="viewer" class="well grid-height span3"><div class="slide-left-button"><i class="icon-chevron-right"></i></div><h2><span class="view-path"></span></h2></spab><div id="view-items-list" class=""></div></div>',
            'gridTemplate': '<div id="grid" class="well grid-width span3"><div id="grid-inner-container" class="grid-width"><div class="grid-control-bar grid-width"><div class="control-group grid-width"><div class="left-padding"></div><div class="input-prepend input-append" style="display: inline-block;"><input type="checkbox" class="selectall"><input type="text" rows="30" id="filterText" class="input-medium"><a class="btn filter-button" href="#" data-original-title="Filter"><i class="icon-filter"></i></a></div><div class="global-buttons"></div><div class="edit-buttons"></div></div></div><div class="error-message"></div><table class="grid-items-list grid-width"></table></div></div>',
            'barButtonHtml': '<a class="btn ##name##-button" href="#" data-original-title="##tip##"><i class="icon-##icon##"></i></a>',
            'grid_item_html': '<tr class="grid-item grid-item-bar" ##data##><td class="left-padding"></td><td class="checkbox"><input type="checkbox" class="checkbox" /></td><td class="grid-item-content-area">##item-html##</td></tr>',
            'grid_item_data_html': '<td class="grid-item-left-tag-area"><td class="id-tag">##id##</td></td><td class="grid-item-title-area">##display##</td><td class="grid-item-date-area">##@type##</td>',
            'viewTemplate1': '<div class="view-row"><div class="view-name">',
            'viewTemplate2': '</div><div class="view-value">',
            'viewTemplate3': '</div></div>',
            'arrowHTML': '<div class="selected-item"></div>'
        };
        var o = $.extend(defaultOptions, options);

        return this.each(function () {
            var $t = $(this);

            function init() {
                buildGrid();
                if(o.buildViewer)
                    buildViewer();
                if(o.dataPath !== '')
                    LoadData();

                var editButtonSelector = configureButtons();
                o.editButtons = $t.find(editButtonSelector);
                o.editButtons.hide();

                configureButtonEvents();
                configureCheckboxes($t);
                configureGridItemClick();
            }

            function showLoadingAnimation() {
                $(o.innerContainerSelector).html('<div class="loading-results">Loading Results</div>');
            }

            $.fn.seven20Grid.insert = function(data, id) {
                insertRow(data, id);
            }

            $.fn.seven20Grid.clear = function(data, id) {
                $(o.innerContainerSelector).html('');
            }

            $.fn.seven20Grid.getSelectedItems = function() {
                return getSelectedItems();
            }

            $.fn.seven20Grid.setDataPath = function(dataPath) {
                o.dataPath = dataPath;
                $('#viewer').find('span.view-path').html(o.dataPath);
                $('#viewer').find('#view-items-list').html('');
            }

            function insertRow(item, id) {
                var item_html = o.grid_item_data_html;
                var data_html = '';
                var complete_html = o.grid_item_html;

                var count = 0;
                for (var key in item) {
                    item_html = item_html.replace('##' + key + '##', item[key]);
                    data_html += ' data-' + key + '="' + item[key] + '"';
                }
                item_html = item_html.replace('##id##', id);

                complete_html = complete_html.replace('##item-html##',item_html).replace('##data##', data_html);
                $(o.innerContainerSelector).append(complete_html);

            }

            function LoadData() {
                $('#viewer').find('span.view-path').html(o.dataPath);
                var data = remoteStorage.root.getListing(o.dataPath);
                if(data.length == 0)
                    $(o.innerContainerSelector).html('<div class="no-data">No Data To Show</div>');
                else
                    $(o.innerContainerSelector).html('');

                for(i = 0; i < data.length; ++i){
                    if(data[i].substr(-1) != '/')
                        insertRow(remoteStorage.root.getObject(o.dataPath + data[i]),o.dataPath + data[i]);
                }
            }

            function buildViewer() {
                $(o.gridSelector).append(o.viewerTemplate);
                $t.find('.slide-left-button').bind('click', function () {
                    $(this).parent().slideRight();
                });
            }

            function buildGrid() {
                $(o.gridSelector).append(o.gridTemplate);
            }

            function addCreatorItem() {
                addEditorItem();
            }

            function getRowID(row){
                var dataHolder = $(row).parent().parent();
                var itemID = dataHolder.find('.id-tag').html();
                return itemID;
            }

            function editItems(selectedItems) {
                $.each(selectedItems, function (i, item) {
                    var itemID = getRowID(item);
                    addEditorItem(itemID, $(item).parent().parent().data());
                });
            }

            function publishItems(selectedItems) {
                $.each(selectedItems, function (i, item) {
                    var itemID = getRowID(item);
                    var message = remoteStorage.root.publishObject(itemID);

                    showMessage(message, 'Publish successful');
                });
            }

            function archiveItems(selectedItems) {
                $.each(selectedItems, function (i, item) {
                    var itemID = getRowID(item);
                    var message = remoteStorage.root.archiveObject(itemID);

                    showMessage('Archived record at _id=' + itemID, 'Archive Successful');
                });
            }

            function deleteItems(selectedItems) {
                $.each(selectedItems, function (i, item) {
                    var itemID = getRowID(item);

                    remoteStorage.root.removeObject(itemID);
                    showMessage('Deleted record at _id=' + itemID,'Delete Successful');
                });
            }

            function addEditorItem(id, data) {
                $('#viewer').seven20Editor({contentId:id, data:data, target:'#viewer', contentName:o.dataPath});
            }

            function configureCheckboxes() {
                $t.find('.selectall').bind('click', function () {
                    if ($(this).is(':checked')) {
                        $(o.gridItemSelector).find(':checkbox:not(:checked)').attr('checked', 'checked').change();
                        //enableGridButtons();
                    } else {
                        $(o.gridItemSelector).find(':checkbox:checked').removeAttr('checked').change();
                        //disableGridButtons();
                    }
                });

                // Turn item bar yellow on checkbox click
                $(o.gridItemSelector).delegate(':checkbox', 'change', function () {
                    if ($(this).is(':checked')) {
                        $(this).parents('.grid-item').addClass('checked-grid-item-bar');
                        enableGridButtons();
                    } else {
                        $(this).parents('.grid-item').removeClass('checked-grid-item-bar');
                        if ($(o.gridItemSelector).find(":checked").length === 0) {
                            // Make complete and delete item buttons look disabled
                            disableGridButtons();
                        }
                    }
                });
            }

            function configureButtons() {
                var editButtonSelector = "";
                var globalButtonSelector = "";

                // Create the global buttons
                for (var i in o.globalButtonNames) {
                    globalButtonSelector += ", ." + o.globalButtonNames[i] + "-button";
                    var globalButtonHtml = o.barButtonHtml;
                    var camelName = o.globalButtonNames[i][0] = o.globalButtonNames[i][0].toUpperCase();
                    if (o.globalButtonNames[i].length > 1)
                        camelName += o.globalButtonNames[i].substr(1, o.globalButtonNames[i].length);
                    globalButtonHtml = globalButtonHtml.replace(/##name##/, o.globalButtonNames[i]);
                    globalButtonHtml = globalButtonHtml.replace(/##icon##/, o.globalButtonIcons[i]);
                    globalButtonHtml = globalButtonHtml.replace(/##tip##/, camelName);
                    $t.find('.global-buttons').append(globalButtonHtml);
                }
                globalButtonSelector = globalButtonSelector.replace(",", "");

                // Create the edit buttons
                for (var i in o.editButtonNames) {
                    editButtonSelector += ", ." + o.editButtonNames[i] + "-button";
                    var editButtonHtml = o.barButtonHtml;
                    var camelName = o.editButtonNames[i][0] = o.editButtonNames[i][0].toUpperCase();
                    if (o.editButtonNames[i].length > 1)
                        camelName += o.editButtonNames[i].substr(1, o.editButtonNames[i].length);
                    editButtonHtml = editButtonHtml.replace(/##name##/, o.editButtonNames[i]);
                    editButtonHtml = editButtonHtml.replace(/##icon##/, o.editButtonIcons[i]);;
                    editButtonHtml = editButtonHtml.replace(/##tip##/, camelName);
                    $t.find('.edit-buttons').append(editButtonHtml);
                }
                editButtonSelector = editButtonSelector.replace(",", "");

                $(editButtonSelector).tooltip({ placement: 'bottom' });
                $(globalButtonSelector).tooltip({ placement: 'bottom' });
                $('.filter-button').tooltip({ placement: 'bottom' });
                return editButtonSelector;
            }

            function configureButtonEvents() {
                // Refresh the grid results
                $t.find('.refresh-button').bind('click', function () {
                    $(this).parent().parent().find('#filterText').val('');
                    LoadData();
                });

                $("#filterText").keyup(function (event) {
                    if (event.keyCode == 13) {
                        $("div.filter-button").click();
                    }
                });

                // Add an item
                $t.find('.add-button').bind('click', function () {
                    addCreatorItem();
                });

                // Edit the selected items
                $t.find('.edit-button').bind('click', function () {

                    var selectedItems = getSelectedItems();
                    editItems(selectedItems);

                    removeItems(selectedItems);
                    disableGridButtons();
                });

                // Delete the selected items
                $t.find('.delete-button').bind('click', function () {
                    deleteItems(getSelectedItems());
                    clearCheckedItems(' items moved to trash', false);
                    disableGridButtons();
                });

                // Complete the selected item
                $t.find('.archive-button').bind('click', function () {
                    var selectedItems = getSelectedItems();
                    archiveItems(selectedItems);
                    clearCheckedItems(' items archived', true);
                    disableGridButtons();
                });

                // Complete the selected item
                $t.find('.publish-button').bind('click', function () {
                    var selectedItems = getSelectedItems();
                    publishItems(selectedItems);
                    clearCheckedItems(' items published', true);
                    disableGridButtons();
                });

                $t.find('.filter-button').bind('click', function () {
                    var filter = $(this).parent().find('#filterText').val();
                    if (filter == o.filter) {
                        return;
                    }
                    if (filter === "") {
                        $(o.gridItemSelector).find('.grid-item').show();
                        return;
                    }
                    o.filter = filter;
                    filterItems(o.filter);
                });
            }

            function configureGridItemClick() {
                // Add click event to the grid item content area for viewing the item
                $(o.gridItemSelector).delegate('.grid-item.grid-item-bar', 'click', function () {
                    // Show loading animation
                    $('#view-items-list').empty();

                    $(o.gridItemSelector).find('.selected-grid-item-bar').removeClass('selected-grid-item-bar');
                    $(this).addClass('selected-grid-item-bar');

                    showDataInViewer([$(this).data()]);
                });
            }

            function showDataInViewer(data, target, unused) {
                var view_html = "";

                for (var key in data[0]) {
                    view_html = o.viewTemplate1 + key + o.viewTemplate2 + data[0][key] + o.viewTemplate3;
                    $('#view-items-list').append(view_html);
                }
            }

            function filterItems(term) {
                var results = $(o.gridItemSelector).find('.grid-item:contains(' + term + ')');

                if (results.length === 0) {
                    $(o.gridItemSelector).find('.grid-item').fadeOut();
                    return;
                }
                var excess = $(o.gridItemSelector).find('.grid-item:not(:contains(' + term + '))');

                excess.fadeOut();
                results.show();
            }

            function getSelectedItems() {
                return $(o.gridItemSelector).find(":checked");
            }

            function clearCheckedItems(message, fade) {
                var selectedItems = getSelectedItems();

                // Prevent the arrow from being prepended if nothing's checked
                if (selectedItems.length === 0) {
                    // Alert the user that nothing's checked with a yellow alert message
                    showMessage('N/A', 'No items selected');
                    return;// false;
                }

                // Alert the user what's been removed
                removeItems(selectedItems, selectedItems.length + message, fade)
            }

            function removeItems(removeList, message, fadeout) {
                if (fadeout === true) {
                    removeList.parents('.grid-item').fadeOut('slow', function () {
                        $(this).remove();
                    });
                }
                else {
                    removeList.parents('.grid-item').remove();
                }
                if (message !== undefined)
                    showMessage(message, 'Success');
            }

            function disableGridButtons() {
                o.editButtons.fadeOut();
            }

            function enableGridButtons() {
                if (o.editButtons.is(':visible') != true) {
                    o.editButtons.fadeIn();
                }
            }

            init();
        });
    }
})(jQuery);