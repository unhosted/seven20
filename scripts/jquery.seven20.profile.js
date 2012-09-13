(function ($) {
    $.fn.seven20Profile = function (options) {
        var defaultOptions =
        {
            'pictureHtml':  '<div class="">' +
                            '<img id="profile_image">' +
                            '</div>',
            'fieldHtml' :   '<label>##heading##</label>' +
                            '<input id="##id##" type="text" placeholder="Type something…">',
            'sectionHtml' : '<div class="accordion-group">' +
                            '<div class="accordion-heading">' +
                            '<a class="accordion-toggle" data-toggle="collapse" data-parent="##accordion_parent##" href="###collapse##">' +
                            '##heading##' +
                            '</a>' +
                            '</div>' +
                            '<div id="##collapse##" class="accordion-body collapse in">' +
                            '<div class="accordion-inner"></div>' +
                            '</div>' +
                            '</div>',
            'uploadVcardHtml':  '<div id="uploadVcard" class="accordion-body collapse in">' +
                                '<div class="accordion-inner">' +
                                '<input type="file" id="upload">' +
                                '<button id="loadVcard">Load vCard</button>' +
                                '<h1>IN:</h1>' +
                                '<pre id="input"></pre>' +
                                '<h1>OUT:</h1>' +
                                '<pre id="output"></pre>' +
                                '</div></div>',
            'parent': '#profileSections',
            'showUpload': true,
            'showPicture': true,
            'sectionNames': ["Profile", "Name", "Location", "Upload vCard"],
            'sections': {
                            'Name':
                                    {"fn":"Full name", "family-name":"Last name","given-name":"First name","honorific-prefix":"Prefix","honorific-suffix":"Suffix"}
                        }
        };
        var o = $.extend(defaultOptions, options);

        return this.each(function () {
            var t = $(this);

            function init() {
                if(o.showPicture)
                {
                    buildSectionAccordion("profile", o.sectionNames[0])
                }
                buildSections();
                if(o.showUpload)
                {
                    buildSectionAccordion("uploader", o.sectionNames[o.sectionNames.length -1], o.uploadVcardHtml);
                    $("#loadVcard").bind('click',loadVCard);
                }
            }

            function buildSectionAccordion(sectionName, heading, innerHtml)
            {
                $(o.parent).append(o.sectionHtml.replace(/##collapse##/g, sectionName).replace(/##heading##/g, heading).replace(/##accordion_parent##/g, o.parent.substr(1)));
                $('#' + sectionName).find('div.accordion-inner').append(innerHtml);
            }

            function loadVCard() {
                var fileReader = new FileReader();
                var vCardInfo;

                fileReader.onloadend = function() {
                    $(o.parent).find('#input').html(fileReader.result);

                    VCF.parse(fileReader.result, function(vc) {
                        loadVCardIntoFields(vc);
                        $(o.parent).find('#output').html(JSON.stringify(vc));
                    });
                };

                fileReader.readAsText(document.getElementById('upload').files[0]);
            }

            function loadVCardIntoFields(vCardInfo)
            {
                for (var i in vCardInfo) {
                    if($.isPlainObject(vCardInfo[i])){
                        loadVCardIntoFields(vCardInfo[i]);
                    }
                    else {
                        $('#' + i).val(vCardInfo[i]);
                    }
                }
            }

            function buildSections()
            {
                var count = 2;
                for (var i in o.sections) {
                    var sectionName = o.sectionNames[count++];
                    buildSectionAccordion(sectionName, i,'');
                    buildFields('#' + sectionName, o.sections[i]);
                }
            }

            function buildFields(target, fields)
            {
                for (var i in fields) {
                    $(target).find('div.accordion-inner').append(o.fieldHtml.replace(/##heading##/g, fields[i]).replace(/##id##/g, i.toLowerCase().replace(/\s/g, "")));
                }
            }

            init();
        });
    }
})(jQuery);