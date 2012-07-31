function addNewField(target, type)
{
    var id = 0;

    while($(target + ' #new-field' + id).length !== 0)
    {
        ++id;
    }

    id = 'new-field' + id;

    if(type === 'text')
    {
    }

    var inputHtmlAttributes = 'type="text" id="' + id + '-##kind##" placeholder="field ##kind##..." name="' + id + '-##kind##"';
    var inputHtml = '<input class="input-large" ##attributes##>';
	var html = '<div id="' + id + '" class="control-group"><div class="controls">##inputs##</div></div>';
    var fieldNameHtml = inputHtml.replace("##attributes##",inputHtmlAttributes.replace(/##kind##/g,"name"));
    var fieldValueHtml = inputHtml.replace("##attributes##",inputHtmlAttributes.replace(/##kind##/g,"value"));
    $(html.replace("##inputs##",fieldNameHtml + fieldValueHtml)).insertBefore($(target).find('.form-actions'));
}

function fadeAndRemove(target){
    $(target).fadeAndRemove();
}

(function ($) {
    $.fn.seven20Editor = function (options) {
        var defaultOptions =
        {
            'data': '',
            "contentName": '',
            "contentId": '',
            'target': '',
            'targetForm': '',
            'fieldTypes': ['text'],
            'propertiesHtml':'<input name="id" class="span6" type="text" placeholder="identifier..." ##value##><select class="span2" name="type">##types##</select>',
            'buttonHtml': '<button onclick="javascript:addNewField(\'#form-##id##\'); return false;" class="btn btn-primary right-padding"><i class="icon-plus"></i></button><button type="submit" class="btn btn-success" data-original-title="Save"><i class="icon-ok"></i></button><button onclick="javascript:fadeAndRemove(\'#editor-##id##\'); return false;" class="btn btn-danger" data-original-title="Cancel"><i class="icon-remove"></i></button>',
			'formEntryHtml': '<div class="control-group"><label class="control-label" for="input-##inputname##">##displayname##</label><div class="controls"><input type="##type##" class="input-large" id="input-##inputname##" name="##inputname##" value="##value##"></div></div>',
			'formHtml':'<div id="editor-##id##" class="editor-box"><hr><h4>##heading##</h4><form id="form-##id##" class="form-horizontal" method="post" ><div class="form-actions">##buttons##</div></form></div>'
        };
        var o = $.extend(defaultOptions, options);

        return this.each(function () {
            var elem = $(this);
			
            function init() {		
				// If the editor should create new content
				if(o.contentId === '')
				{
					// Attempt to create a contentId that denotes a new document
					for(i = 0; i < 10; i++)
					{
						// If there is not another editor with the same ID
						if($('#editor-newcontent' + i).length === 0)
						{
							o.contentId = "newcontent" + i;
							break;
						}
						// Else if there are 10 other editors creating new content
						else if(i == 9)
							// Do not create the editor
							return;
					}
				}
				
                buildForm();
            }
			
			function buildForm() {
				var myForm = o.formHtml;
				if(o.contentId.indexOf("newcontent") != -1)
				{
					myForm = myForm.replace(/##heading##/g, "Create new " + o.contentName + " document");
				}
				else
					myForm = myForm.replace(/##heading##/g, "Edit " + o.contentName + " document with id:" + o.contentId);

                var typeOptions = '';
                for(i = 0; i < o.fieldTypes.length; ++i) {
                    typeOptions += '<option>' + o.fieldTypes[i] + '</option>';
                }

				myForm = myForm.replace(/##buttons##/g, o.propertiesHtml + o.buttonHtml).replace(/##types##/g, typeOptions).replace(/##id##/g, o.contentId);
				myForm = myForm.replace("##value##", 'value="' + o.contentName + o.contentId + '"');


				$(o.target).append(myForm);
				o.targetForm = '#form-' + o.contentId;

                $.each(o.data, function(k, v) {
                    buildFormEntry(k, v, '', 'text');
                });

                $(o.targetForm).validate({
                    submitHandler: validateForm
                });
			}

            function setNewFields(data) {
                for(var i in data) {
                    if(i.indexOf('new-field') !== -1 && i.substr(i.length-4,4) === 'name')
                    {
                        var valName = i.replace("name","value");
                        var value = $(o.targetForm + ' #' + valName).val();
                        var key = data[i];
                        delete data[i];
                        delete data[valName];
                        data[key] = value;
                    }
                }

                return data;
            }

            function validateForm(form) {
                var data = setNewFields($(form).serializeFormJSON());
                var type = data.type;
                delete data.type;
                var id = data.id;
                delete data.id;

                remoteStorage.root.setObject(type, id, data);
                showMessage('Document saved as ' + id, 'Document save successful');
                $(o.targetForm).parent().fadeAndRemove();
            }

//            function insertFormValues(data) {
//                if (data.error) {
//                }
//                else {
//
//                    $.each(data, function (i, item) {
//                        for (var key in item) {
//                            $(o.targetForm).find('#' + key).val(item[key]);
//                        }
//                    });
//                }
//            }

//            function getValidationClassFromSqlColumn(nullable) {
//                var cssText = "";
//
//                if (nullable == "NO") {
//                    cssText += "required ";
//                }
//
//                return cssText;
//            }
//
//            function getValidationHtmlFromSqlColumn(maxLength) {
//                if (maxLength > 0) {
//                }
//
//                return "";
//            }

            function buildFormEntry(entryName, entryValue, entryClass, entryType, validationEntries) {
                if (entryName == "_id") {
                    entryClass = entryClass.replace("required", "");
                    validationEntries += " readonly=readonly "
                }
                var newEntry = o.formEntryHtml.replace(/##displayname##/g, entryName);
                newEntry = newEntry.replace(/##class##/g, entryClass);
                newEntry = newEntry.replace(/##inputname##/g, $.trim(entryName));
                newEntry = newEntry.replace(/##type##/g, entryType);
                newEntry = newEntry.replace(/##value##/g, entryValue);
                newEntry = newEntry.replace(/##validation##/g, validationEntries);

                $(newEntry).insertBefore(o.targetForm + ' .form-actions');
            }

            init();
        });
    }
})(jQuery);