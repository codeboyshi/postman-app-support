var CollectionSidebar = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;

        model.on("add", this.renderOneCollection, this);
        model.on("remove", this.removeOneCollection, this);
        model.on("updateCollectionMeta", this.updateCollectionMeta, this);
        model.on("updateCollectionRequest", this.updateCollectionRequest, this);

        $('#collection-items').html("");
        $('#sidebar-section-collections').append(Handlebars.templates.message_no_collection({}));

        var $collection_items = $('#collection-items');
        $collection_items.on("mouseenter", ".sidebar-collection .sidebar-collection-head", function () {
            var actionsEl = jQuery('.collection-head-actions', this);
            actionsEl.css('display', 'block');
        });

        $collection_items.on("mouseleave", ".sidebar-collection .sidebar-collection-head", function () {
            var actionsEl = jQuery('.collection-head-actions', this);
            actionsEl.css('display', 'none');
        });

        $collection_items.on("click", ".sidebar-collection-head-name", function () {
            var id = $(this).attr('data-id');
            view.toggleRequestList(id);
        });

        $collection_items.on("click", ".collection-head-actions .label", function () {
            var id = $(this).parent().parent().parent().attr('data-id');
            view.toggleRequestList(id);
        });

        $collection_items.on("click", ".collection-actions-edit", function () {
            var id = $(this).attr('data-id');
            var c = model.get(id);
            model.trigger("showEditModal", c);
        });

        $collection_items.on("click", ".collection-actions-delete", function () {
            var id = $(this).attr('data-id');
            var name = $(this).attr('data-name');

            pm.indexedDB.getCollection(id, function (collection) {
                $('#modal-delete-collection-yes').attr('data-id', id);
                $('#modal-delete-collection-name').html(collection.name);
            });
        });

        $collection_items.on("click", ".collection-actions-download", function () {
            var id = $(this).attr('data-id');

            $("#modal-share-collection").modal("show");

            $('#share-collection-get-link').attr("data-collection-id", id);
            $('#share-collection-download').attr("data-collection-id", id);
            $('#share-collection-link').css("display", "none");
        });

        $('#collection-items').on("mouseenter", ".sidebar-request", function () {
            var actionsEl = jQuery('.request-actions', this);
            actionsEl.css('display', 'block');
        });

        $('#collection-items').on("mouseleave", ".sidebar-request", function () {
            var actionsEl = jQuery('.request-actions', this);
            actionsEl.css('display', 'none');
        });

        $collection_items.on("click", ".request-actions-load", function () {
            var id = $(this).attr('data-id');
            $('.sidebar-collection-request').removeClass('sidebar-collection-request-active');
            $('#sidebar-request-' + id).addClass('sidebar-collection-request-active');
            model.getCollectionRequest(id);
        });


        $collection_items.on("click", ".request-actions-delete", function () {
            var id = $(this).attr('data-id');
            model.trigger("deleteCollectionRequest", id);
        });

        $collection_items.on("click", ".request-actions-edit", function () {
            var id = $(this).attr('data-id');
            var request = model.getRequestById(id);
            console.log("Triggering request edit", model.getRequestById(id));
            model.trigger("editCollectionRequest", request);
        });
    },

    addRequestListeners:function () {
        $('#sidebar-sections').on("mouseenter", ".sidebar-request", function () {
            var actionsEl = jQuery('.request-actions', this);
            actionsEl.css('display', 'block');
        });

        $('#sidebar-sections').on("mouseleave", ".sidebar-request", function () {
            var actionsEl = jQuery('.request-actions', this);
            actionsEl.css('display', 'none');
        });
    },

    emptyCollectionInSidebar:function (id) {
        $('#collection-requests-' + id).html("");
    },

    removeOneCollection:function (model, pmCollection) {
        var collection = model.toJSON();
        $('#collection-' + collection.id).remove();
    },

    renderOneCollection:function (model, pmCollection) {
        var collection = model.toJSON();
        console.log("render collection", collection);

        function requestFinder(request) {
            return request.id === collection["order"][j]
        }

        $('#sidebar-section-collections .empty-message').css("display", "none");

        var currentEl = $('#collection-' + collection.id);

        var collectionSidebarListPosition = -1;
        var insertionType;
        var insertTarget;

        var model = this.model;
        var collections = this.model.toJSON();

        collectionSidebarListPosition = arrayObjectIndexOf(collections, collection.id, "id");

        //Does this exist already?
        if (currentEl.length) {
            //Find current element list position
            if (collectionSidebarListPosition === 0) {
                insertionType = "before";
                insertTarget = $('#collection-' + collections[collectionSidebarListPosition + 1].id);
                console.log(insertTarget);
            }
            else {
                insertionType = "after";
                insertTarget = $('#collection-' + collections[collectionSidebarListPosition - 1].id);
            }

            //Found element
            currentEl.remove();

            //TODO Will be added inside AddCollectionRequestModal
            $('#select-collection option[value="' + collection.id + '"]').remove();
        }
        else {
            //New element
            if (collectionSidebarListPosition === collections.length - 1) {
                insertionType = "append";
            }
            else {
                var nextCollectionId = collections[collectionSidebarListPosition + 1].id;
                insertTarget = $("#collection-" + nextCollectionId);

                if (insertTarget.length > 0) {
                    insertionType = "before";
                }
                else {
                    insertionType = "append";
                }
            }
        }

        //TODO Will be added inside AddCollectionRequestModal
        $('#select-collection').append(Handlebars.templates.item_collection_selector_list(collection));

        if (insertionType) {
            if (insertionType === "after") {
                $(insertTarget).after(Handlebars.templates.item_collection_sidebar_head(collection));
            }
            else if (insertionType === "before") {
                $(insertTarget).before(Handlebars.templates.item_collection_sidebar_head(collection));
            }
            else {
                $("#collection-items").append(Handlebars.templates.item_collection_sidebar_head(collection));
            }
        } else {
            $("#collection-items").append(Handlebars.templates.item_collection_sidebar_head(collection));
        }

        $('a[rel="tooltip"]').tooltip();

        $('#collection-' + collection.id + " .sidebar-collection-head").droppable({
            accept: ".sidebar-collection-request",
            hoverClass: "ui-state-hover",
            drop: model.handleRequestDropOnCollection
        });

        if ("requests" in collection) {
            var id = collection.id;
            var requests = collection.requests;
            var targetElement = "#collection-requests-" + id;
            var count = requests.length;
            var requestTargetElement;

            if (count > 0) {
                for (var i = 0; i < count; i++) {
                    pm.urlCache.addUrl(requests[i].url);

                    if (typeof requests[i].name === "undefined") {
                        requests[i].name = requests[i].url;
                    }

                    requests[i].name = limitStringLineWidth(requests[i].name, 40);

                    //Make requests draggable for moving to a different collection
                    requestTargetElement = "#sidebar-request-" + requests[i].id;
                    $(requestTargetElement).draggable({});
                }

                //Sort requests as A-Z order
                if (!("order" in collection)) {
                    requests.sort(sortAlphabetical);
                }
                else {
                    if(collection["order"].length === requests.length) {
                        var orderedRequests = [];
                        for (var j = 0, len = collection["order"].length; j < len; j++) {
                            var element = _.find(requests, requestFinder);
                            orderedRequests.push(element);
                        }
                        requests = orderedRequests;
                    }
                }

                //Add requests to the DOM
                $(targetElement).append(Handlebars.templates.collection_sidebar({"items":requests}));


                $(targetElement).sortable({
                    update:function (event, ui) {
                        var target_parent = $(event.target).parents(".sidebar-collection-requests");
                        var target_parent_collection = $(event.target).parents(".sidebar-collection");
                        var collection_id = $(target_parent_collection).attr("data-id");
                        var ul_id = $(target_parent.context).attr("id");
                        var collection_requests = $(target_parent.context).children("li");
                        var count = collection_requests.length;
                        var order = [];

                        for (var i = 0; i < count; i++) {
                            var li_id = $(collection_requests[i]).attr("id");
                            var request_id = $("#" + li_id + " .request").attr("data-id");
                            order.push(request_id);
                        }

                        pmCollection.updateCollectionOrder(collection_id, order);
                    }
                });
            }

        }
    },

    updateCollectionMeta: function(collection) {
        console.log("On update collection meta", collection);
        var id = collection.id;

        var currentClass = $("#collection-" + id + " .sidebar-collection-head-dt").attr("class");
        var collectionHeadHtml = '<span class="sidebar-collection-head-dt"><img src="img/dt.png"/></span>';
        collectionHeadHtml += " " + collection.name;

        $('#collection-' + collection.id + " .sidebar-collection-head-name").html(collectionHeadHtml);
        $('#select-collection option[value="' + collection.id + '"]').html(collection.name);

        if(currentClass.indexOf("open") >= 0) {
            $("#collection-" + id + " .sidebar-collection-head-dt").addClass("disclosure-triangle-open");
        }
        else {
            $("#collection-" + id + " .sidebar-collection-head-dt").addClass("disclosure-triangle-close");
        }
    },

    updateCollectionRequest: function(request) {
        var requestName;
        requestName = limitStringLineWidth(request.name, 43);
        $('#sidebar-request-' + request.id + " .request .request-name").html(requestName);
        $('#sidebar-request-' + request.id + " .request .label").html(request.method);
        $('#sidebar-request-' + request.id + " .request .label").addClass('label-method-' + request.method);

        noty({
            type:'success',
            text:'Saved request',
            layout:'topCenter',
            timeout:750
        });
    },

    openCollection:function (id) {
        var target = "#collection-requests-" + id;
        $("#collection-" + id + " .sidebar-collection-head-dt").removeClass("disclosure-triangle-close");
        $("#collection-" + id + " .sidebar-collection-head-dt").addClass("disclosure-triangle-open");

        if ($(target).css("display") === "none") {
            $(target).slideDown(100, function () {
            });
        }
    },

    toggleRequestList:function (id) {
        var target = "#collection-requests-" + id;
        var label = "#collection-" + id + " .collection-head-actions .label";
        if ($(target).css("display") === "none") {
            $("#collection-" + id + " .sidebar-collection-head-dt").removeClass("disclosure-triangle-close");
            $("#collection-" + id + " .sidebar-collection-head-dt").addClass("disclosure-triangle-open");

            $(target).slideDown(100, function () {
            });
        }
        else {
            $("#collection-" + id + " .sidebar-collection-head-dt").removeClass("disclosure-triangle-open");
            $("#collection-" + id + " .sidebar-collection-head-dt").addClass("disclosure-triangle-close");
            $(target).slideUp(100, function () {
            });
        }
    }
});