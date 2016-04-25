/**
 * Javascript code for AnsPress fontend
 * @since 2.0
 * @package AnsPress
 * @author Rahul Aryan
 * @license GPL 2+
 */
(function($) {
    apFunctions = {}

    /* on start */
    $(function() {
        /* create document */
        AnsPress.site = new AnsPress.site();
        /* need to call init manually with $ */
        AnsPress.site.initialize();
    });
    /* namespace */
    window.AnsPress = {};
    AnsPress.site = function() {};
    AnsPress.site.prototype = {
        /** Initalize the class */
        initialize: function() {
            ApSite = this;
            this.ajax_id = new Object();
            this.loading = new Object();
            this.errors;
            this.ajaxData;
            this.appendFormError();
            this.appendMessageBox();
            this.ajaxBtn();
            this.ap_comment_form();
            this.afterPostingAnswer();
            this.ap_ajax_form();
            this.load_comment_form();
            this.delete_comment();
            this.vote();
            this.select_answer();
            this.ap_delete_post();
            this.ap_upload_field();
            this.avatarUploadCallback();
            this.change_status();
            this.load_profile_field();
            this.ap_post_upload_field();
            this.tinyMCEeditorToggle();
            this.tab();
            this.set_featured();
            this.modal();
            this.expand();
            this.follow();
            this.updateCover();
            this.hoverCard();
            this.delete_notification();
            this.mark_as_read();
            this.cancel_comment();
            this.questionSuggestion();
            this.checkboxUncheck();
        },
        doAjax: function(query, success, context, before, abort) {
            /** Shorthand method for calling ajax */
            context = context || false;
            success = success || false;
            before = before || false;
            abort = abort || false;            
            var action = apGetValueFromStr(query, 'ap_ajax_action');            
            if (abort && (typeof ApSite.ajax_id[action] !== 'undefined')) {
                ApSite.ajax_id[action].abort();
            }

            var req = $.ajax({
                type: 'POST',
                url: ajaxurl,
                data: query,
                beforeSend: function(){
                    if( context )
                        ApSite.showLoading(context);
                    
                    if( typeof before === 'function' )
                        before();
                },
                success: function(data){
                    ApSite.hideLoading(context);
                    var parsedData = apParseAjaxResponse(data);
                    if( typeof success === 'function' ){
                        data = $.isEmptyObject(parsedData) ? data : parsedData;
                        success(data, context);
                    }
                },
                context: context,
                cache:false
            });

            ApSite.ajax_id[action] = req;
            return req;
        },
        doAction: function(action) {
            var self = this;
            var action = typeof action !== 'undefined' ? '[data-action="' + action + '"]' : '[data-action]';
            var actions = new Object();
            $(action).each(function(i) {
                var action = $(this).attr('data-action');
                if (typeof actions[action] !== 'undefined') return;
                actions[action] = '1';
                //if (typeof self[action] === 'function')
                self[action]('[data-action="' + action + '"]');
                
            });
        },
        uniqueId: function() {
            return $('.ap-uid').length;
        },
        showLoading: function(elm) {
            /*hide any existing loading icon*/
            AnsPress.site.hideLoading(elm);
            var customClass = $(elm).data('loadclass')||'';
            var uid = this.uniqueId();
            var el = $('<div class="ap-loading-icon ap-uid '+customClass+'" id="apuid-' + uid + '"><i class="apicon-sync"><i></div>');
            $('body').append(el);
            var offset = $(elm).offset();
            var height = $(elm).outerHeight();
            var width = $(elm).outerWidth();

            //if($(elm).is('a, button, input[type="submit"], form')){
                el.css({
                    top: offset.top,
                    left: offset.left,
                    height: height,
                    width: width
                });
            /*}else{
                el.css({
                    top: offset.top + 14,
                    left: offset.left + width - 20
                });
            }*/

            $(elm).data('loading', '#apuid-' + uid);

            return '#apuid-' + uid;
        },
        
        hideLoading: function(elm) {
            if( 'all' == elm )
                $('.ap-loading-icon').hide();
            else
                $($(elm).data('loading')).hide();
        },

        ap_ajax_form: function() {
            $('body').delegate('[data-action="ap_ajax_form"]', 'submit', function() {
                AnsPress.site.showLoading(this);

                //Before submitting form callback
                if($(this).is('[data-before]')){
                    var before_callback = $(this).data('before');

                    if(typeof ApSite[before_callback] === 'function'){
                        if(false === ApSite[ before_callback](this) ) return false;
                    }
                }

                //Add this to form so this form can be identified as ajax form
                $(this).append('<input type="hidden" name="ap_ajax_action" value="'+ $(this).attr('name') +'">');
                $(this).append('<input type="hidden" name="action" value="ap_ajax">');

                if (typeof tinyMCE !== 'undefined') tinyMCE.triggerSave();

                $(this).ajaxSubmit({
                    type: 'POST',
                    url: ajaxurl,
                    success: function(data) {
                        AnsPress.site.hideLoading(this);
                        if (typeof tinyMCE !== 'undefined' && typeof data.type !== 'undefined' && data.type == 'success') tinyMCE.activeEditor.setContent('');
                    },
                    error: function(jqXHR, textStatus, errorThrown){
                        console.log(errorThrown);
                        AnsPress.site.hideLoading(this);
                    },
                    dataType: 'html',
                    context: this,
                    global: true,
                    cache:false
                });

                return false;
            })
        },
        appendFormError: function() {
            $(document).on('ap_after_ajax', function(e, data) {
                if (typeof data !== 'undefined' && typeof data.errors !== 'undefined') {
                    ApSite.clearFormErrors(data.form);
                    $.each(data.errors, function(i, message) {
                        var parent = $('#' + data.form).find('#' + i).closest('.ap-form-fields');
                        parent.addClass('ap-have-error');
                        ApSite.helpBlock(parent, message);
                    });
                }
            });
        },
        helpBlock: function(elm, message) {
            /* remove existing help block */
            if ($(elm).find('.ap-form-error-message').length > 0) $(elm).find('.ap-form-error-message').remove();
            $(elm).append('<p class="ap-form-error-message">' + message + '</p>');
        },
        clearFormErrors: function(form) {
            var elm = $('#' + form).find('.ap-have-error');
            elm.find('.ap-form-error-message').remove();
            elm.removeClass('ap-have-error');
        },
        appendMessageBox: function() {
            if ($('#ap-notify').length == '0') $('body').append('<div id="ap-notify"></div>');
        },
        addMessage: function(message, type) {
            var icon = aplang[type];
            $('<div class="ap-notify-item ' + type + '"><i class="' + icon + '"></i><div class="ap-notify-content">' + message + '</div></div>').appendTo('#ap-notify').animate({
                'margin-left': 0
            }, 500).delay(1000).fadeOut(200);
        },
        redirect: function(url) {
            if (typeof url !== 'undefined') window.location.replace(url);
        },
        reload: function(data) {
            location.reload();
        },
        append: function(data) {
            if (typeof data.container !== 'undefined') $(data.container).append(data.html);
        },

        /**
         * Update text of an element.
         * @param  {string} elm  Selector to update.
         * @param  {string} text Text.
         */
        updateText: function(elm, text) {
            if (text != '') $(elm).text(text);
        },

        /**
         * Replace content with new content.
         * @param  {string} elm  Element selector.
         * @param  {object} data Ajax success object.
         */
        replaceWith: function(elm, data) {
            $(elm).replaceWith(data);
        },

        /**
         * Update html of an element
         * @param  {string} elm  Selector.  
         * @param  {object} data Ajax success response.
         */
        updateHtml: function(elm, data) {
            if (typeof data.html !== 'undefined') $(elm).html(data.html);
        },

        /**
         * Toggle active class of an element.
         * @param  {string} data    Element selector.
         * @param  {string} active  Currently active selector.
         */
        toggle_active_class: function(elm, active) {
            if (typeof elm !== 'undefined'){
                $(elm).find('li').removeClass('active');
                $(elm).find(active).addClass('active');
                $(elm).toggleClass('active');
            }
        },
        
        /**
         * Remove a class from an element.
         * @param  {string} elm    Element selector.
         * @param  {string} classToRemove  Class to remove from selector.
         */
        removeClass: function(elm, classToRemove) {
            if ($(elm).length > 0){
               $(elm).removeClass(classToRemove);
            }
        },

        /**
         * Remove a class from an element.
         * @param  {string} elm    Element selector.
         * @param  {string} classToAdd  Class to add to selector.
         */
        addClass: function(elm, classToAdd) {
            if ($(elm).length > 0)
               $(elm).addClass(classToAdd);
        },

        /**
         * Append html before a selector.
         * @param  {string} elm Selector.
         */
        append_before: function(elm, data) {
            if (typeof elm !== 'undefined')
                $(elm).before(data.html);
        },
        
        /**
         * Remove an element if exists
         * @param  {string} elm elment selector.
         */
        remove_if_exists: function(elm) {
            if (typeof elm !== 'undefined' && $(elm).length > 0)
                $(elm).remove();
        },
        
        clearForm: function(data) {
            if (typeof tinyMCE !== 'undefined')
                tinyMCE.activeEditor.setContent('');
        },

        scrollToCommentForm: function(){
            if ($('#ap-commentform').length > 0) $('html, body').animate({
                scrollTop: ($('#ap-commentform').offset().top) - 150
            }, 500);
        },
        ajaxBtn: function() {
            $('body').delegate('[data-action="ajax_btn"]', 'click', function(e) {
                if($(this).is('.ajax-disabled'))
                    return;
                
                e.preventDefault();
                var q = $(this).apAjaxQueryString();

                ApSite.doAjax(q, function(data, context) {                             
                    if( $(context).data('cb') || false ){
                        var cb = $(context).data("cb");
                        console.log(apFunctions[cb]);
                                        
                        if( typeof apFunctions[cb] === 'function' ){
                            apFunctions[cb](data, context);
                        }
                    }
                }, this);
            });
        },
        load_comment_form: function() {
            $('body').delegate('[data-action="load_comment_form"]', 'click', function(e) {
                e.preventDefault();

                if($('#ap-commentform').length > 0){
                    $('#ap-commentform').remove();
                }
                var q = $(this).attr('data-query');
                ApSite.doAjax(apAjaxData(q), function(data) {
                    var button = $(this);
                    $(this).addClass('loaded');
                    
                        $(data.container).addClass('have-comments');
                        $(data.container).removeClass('no-comments');
                        $(data.container).append(data.html);
                    

                    ApSite.scrollToCommentForm();

                    jQuery('textarea.autogrow, textarea#post_content').keyup();

                    if (typeof button.attr('data-toggle') !== 'undefined') $(button.attr('data-toggle')).hide();
                    $('#ap-comment-textarea').focus();
                    $(button.attr('href')).addClass('have-comments').removeClass('no-comment');
                }, this, false, true);
                
            });
        },
        ap_comment_form: function() {
            $('body').delegate('#ap-commentform', 'submit', function() {
                if (typeof tinyMCE !== 'undefined') tinyMCE.triggerSave();
                ApSite.doAjax(apAjaxData($(this).formSerialize()), function(data) {
                    ApSite.hideLoading(this);
                    if (data['action'] == 'new_comment' && data['message_type'] == 'success') {
                        $('#post-c-' + data['comment_post_ID'] ).append($(data['html']).hide().slideDown(100));
                    } else if (data['action'] == 'edit_comment' && data['message_type'] == 'success') {
                        $('#comment-' + data.comment_ID+ ' .ap-comment-texts').html(data.html);
                        $('#comment-' + data.comment_ID).slideDown(400);
                        $('.ap-comment-form').remove();
                    }
                    $('.ap-comment-form').fadeOut(200, function() {
                        $(this).remove()
                    });
                    $('a[href="#comments-' + data.comment_post_ID+ '"]').removeClass('loaded');
                }, this);
                return false;
            })
        },
        delete_comment: function() {
            $('body').delegate('[data-action="delete_comment"]', 'click', function(e) {
                e.preventDefault();
                var q = $(this).attr('data-query');
                var elm = $(this);
                ApSite.doAjax(apAjaxData(q), function(data) {
                    if (typeof elm.attr('data-toggle') !== 'undefined' && data.message_type == 'success') 
                        $(elm.attr('data-toggle')).hide();
                }, this, false, true);
            });
        },
        ap_subscribe: function() {
            $('[data-action="ap_subscribe"]').click(function(e) {
                e.preventDefault();
                var q = $(this).attr('data-query');
                ApSite.doAjax(apAjaxData(q), function(data) {
                    AnsPress.site.hideLoading(this);
                    if (data.action == 'subscribed') {
                        $(this).addClass('active');
                        $(this).closest('.ap-subscribe').addClass('active');
                    } else {
                        $(this).removeClass('active');
                        $(this).closest('.ap-subscribe').removeClass('active');
                    }
                }, this, function() {
                    $(this).closest('.ap-subscribe').toggleClass('active');
                });
            });
        },
        vote: function() {
            $('body').delegate('[data-action="vote"] a', 'click', function(e) {
                e.preventDefault();
                var q = $(this).attr('data-query');
                var el = $(this);
                ApSite.doAjax(apAjaxData(q), function(data) {
                    var vote_c = el.parent();
                    vote_c.find('.ap-vote-fade').remove();
                    if (typeof data['action'] !== 'undefined' && data['action'] == 'voted' || data['action'] == 'undo') {
                        if (data['action'] == 'voted') {
                            el.addClass('voted');
                            if (data['type'] == 'vote_up') vote_c.find('.vote-down').addClass('disable');
                            if (data['type'] == 'vote_down') vote_c.find('.vote-up').addClass('disable');
                            el.trigger('voted', data);
                        } else if (data['action'] == 'undo') {
                            el.removeClass('voted');
                            if (data['type'] == 'vote_up') vote_c.find('.vote-down').removeClass('disable');
                            if (data['type'] == 'vote_down') vote_c.find('.vote-up').removeClass('disable');
                            el.trigger('undo_vote', data);
                        }
                        vote_c.find('.net-vote-count').text(data['count']);
                    }
                }, this, false);
            });
        },
        afterPostingAnswer: function() {
            $(document).on('ap_after_ajax', function(e, data) {
                if (typeof data !== 'undefined' && typeof data.action !== 'undefined' && data.action == 'new_answer') {
                    $('#description').val('');
                    if ($('#answers').length === 0) {
                        $('#question').after($(data['html']));
                        $(data.div_id).hide();
                        $(data.div_id).slideDown(500);
                    } else{
                        $('#answers').append($(data['html']).hide());
                        $(data.div_id).slideDown(500);
                    }
                }
            });
        },
        select_answer: function() {
            $('body').delegate('[data-action="select_answer"]', 'click', function(e) {
                e.preventDefault();
                var q = $(this).attr('data-query');
                ApSite.doAjax(apAjaxData(q), false, this);
            });
        },

        ap_delete_post: function() {
            $('#anspress').delegate('[data-action="ap_delete_post"]', 'click', function(e) {
                e.preventDefault();

                var q = $(this).attr('data-query');
                ApSite.doAjax(apAjaxData(q), function(data) {
                    if (typeof data.action !== 'undefined' && data.action == 'delete_answer') $(data.div_id).slideUp(500).fadeOut(300, function() {
                        $(this).remove();
                    })
                }, this, false);
            });
        },
        ap_upload_field: function() {
            var self = this;
            var form
            $('[data-action="ap_upload_field"]').change(function() {
                $(this).closest('form').submit();
            });
            $('[data-action="ap_upload_form"]').submit(function() {
                $(this).ajaxSubmit({
                    success: function(data) {
                        data = $(data);
                        data = JSON.parse(data.filter('#ap-response').html());
                        $('body').trigger('uploadForm', data);
                    },
                    url: ajaxurl
                });
                return false
            });
        },
        avatarUploadCallback: function(){
            $(document).on('uploadForm', function(e, data) {
                
                if (typeof data.action !== 'undefined' && data.action === 'avatar_uploaded') {
                    var src = $(data.html).attr('src');
                    $('[data-view="user_avatar_'+ data.user_id +'"]').attr('src', src);
                }
            });
        },
        change_status: function() {
            $('body').delegate('[data-action="ap_change_status"]', 'click', function(e) {
                e.preventDefault();
                var c = $(this).closest('ul').prev();
                var q = $(this).attr('data-query');
                ApSite.doAjax(apAjaxData(q), function(data) {
                    AnsPress.site.hideLoading(c);
                }, this, false, true);
            });
        },
        load_profile_field: function() {
            $('body').delegate('[data-action="ap_load_user_field_form"]', 'click', function(e) {
                e.preventDefault();
                var q = $(this).attr('data-query');
                ApSite.doAjax(apAjaxData(q), function(data) {
                    AnsPress.site.hideLoading(this);
                }, this, false);
            });
        },
        ap_post_upload_field: function() {
            $('body').on('click', '[data-action="ap_post_upload_field"]', function(e) {
                e.preventDefault();
                $('input[name="post_upload_image"]').trigger('click');
            });

            $('body').delegate('[name="post_upload_image"]', 'change', function(e) {
                $('#hidden-post-upload').submit();
            });

            $('body').delegate( '#hidden-post-upload', 'submit', function() {
                var cont = $('[data-action="ap_post_upload_field"]').closest('.ap-upload-o');

                $(this).ajaxSubmit({
                    beforeSubmit: function(){
                        ApSite.showLoading(cont);
                    },
                    success: function(data) {
                        ApSite.hideLoading(cont);
                        data = $(data);
                        data = JSON.parse(data.filter('#ap-response').html());
                        $('body').trigger('postUploadForm', data);

                        if(typeof data.html !== 'undefined' ){
                            ApSite.addImageInEditor(data.html);
                            $('.ap-post-upload-form').append('<input type="hidden" name="attachment_ids[]" value="'+data['attachment_id']+'" />');
                        }

                    },
                    url: ajaxurl,
                    type: 'POST'
                });

                return false;
            });

            $('body').delegate('.ap-upload-remote-link, [data-action="post_image_close"]', 'click', function(e) {
                e.preventDefault();
                $('.ap-upload-link-rc').toggle();
            });

            $('body').delegate('[data-action="post_image_ok"]', 'click', function(e) {
                e.preventDefault();
                $('.ap-upload-link-rc').toggle();
                if($(this).prev().val() != '' )
                    ApSite.addImageInEditor('<img src="'+$(this).prev().val()+'" />');
            });
        },
        addImageInEditor: function(html){
            if(typeof tinyMCE !== 'undefined')
                tinyMCE.activeEditor.execCommand('mceInsertContent',false, html);
            else
                $('.wp-editor-area').val($('.wp-editor-area').val() + html);
        },
        previewLocalImage: function readURL(input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();

                reader.onload = function (e) {
                    ApSite.addImageInEditor( '<img src="'+e.target.result+'" />' );
                }

                reader.readAsDataURL(input.files[0]);
            }
        },
        tinyMCEeditorToggle: function(){
            $('body').delegate('[data-action="ap_fullscreen_toggle"]', 'click', function(e) {
                e.preventDefault();
                $(this).toggleClass('active');
                tinyMCE.activeEditor.execCommand('mceFullscreen');
            });
        },
        tab: function(){
            $('body').delegate('.ap-tab-nav a', 'click', function(e) {
                e.preventDefault();
                var container = $(this).attr('href');
                $('.ap-tab-container > *').removeClass('active');
                $('.ap-tab-nav >li').removeClass('active');
                $(this).parent().addClass('active');
                $(container).toggleClass('active');
            });
        },

        set_featured: function(){
            $('body').delegate('[data-action="set_featured"]', 'click', function(e) {
                e.preventDefault();
                var c = $(this).closest('ul').prev();
                var q = $(this).attr('data-query');
                ApSite.doAjax(apAjaxData(q), function(data) {
                    
                }, this, false, true);
            });
        },

        modal: function(){
            $('body').delegate('[data-action="ap_modal"]', 'click', function(e) {
                e.preventDefault();

                var modal       = $( $(this).data('toggle') );
                modal.addClass('open');

                var mod_in      = modal.find('.ap-modal-inner');
                var mod_w       = mod_in.width();
                var mod_h       = mod_in.height();
                var screen_w    = $(window).width();
                var screen_h    = $(window).height();

                mod_in.css({ 'left' : (screen_w - mod_w)/2, 'top' :  (screen_h/2) - (mod_h/2) });

            });

            $('body').delegate('[data-action="ap_modal_close"]', 'click', function(e) {
                $('.ap-modal').removeClass('open');
            });
        },
        expand: function(){
            $('body').delegate('[data-action="ap_expand"]', 'click', function(e) {
                e.preventDefault();
                var el = $(this).data('expand'),
                    parent = $(el).parent();

                $(parent).animate({ 'height' : $(el).height() });

                $(this).hide();

            });
        },
        follow: function() {
            $('body').delegate('[data-action="ap_follow"]', 'click', function(e) {
                e.preventDefault();
                var q = $(this).attr('data-query');
                ApSite.doAjax(apAjaxData(q), function(data) {
                    AnsPress.site.hideLoading(this);
                    if (data.action == 'follow') {
                        $(this).addClass('active');
                    } else {
                        $(this).removeClass('active');
                    }
                }, this, function() {
                    $(this).toggleClass('active');
                });
            });
        },
        updateCover: function(){
            $(document).on('uploadForm', function(e, data) {
                if (typeof data.action !== 'undefined' && data.action === 'cover_uploaded') {
                    $('[data-view="user_cover_'+ data.user_id +'"]').css({'background-image': 'url('+data.image+')'});
                }
            });
        },
        hoverCard:function(){
            if(!disable_hover_card)
                $('[data-userid], [data-catid]').aptip({
                    theme: 'ap-hover-card',
                    interactive:true,
                    delay:500,
                    position: 'bottom right',
                    title: '<div class="hovercard-loading-bg"></div>'
                });
        },
        delete_notification: function() {
            $('body').delegate('[data-action="ap_delete_notification"]', 'click', function(e) {
                e.preventDefault();
                var q = $(this).attr('data-query');
                ApSite.doAjax(apAjaxData(q), function(data) {
                    AnsPress.site.hideLoading(this);
                    if(typeof data.container !== 'undefined')
                        $(data.container).slideUp('400', function() {
                            $(data.container).remove();
                        });
                }, this);
            });
        },
        mark_as_read: function() {
            $('body').delegate('[data-action="ap_markread_notification"]', 'click', function(e) {
                e.preventDefault();
                var q = $(this).attr('data-query');
                ApSite.doAjax(apAjaxData(q), function(data) {
                    AnsPress.site.hideLoading(this);

                }, this);
            });

            $(document).on('ap_after_ajax', function(e, data) {
                if (typeof data.action !== 'undefined') {
                    if(data.action === 'mark_read_notification'){
                        $(data.container).removeClass('unread');
                        $(data.container).find('.ap-btn-markread').remove();
                    }else if(data.action === 'mark_all_read' ){
                        $('.ap-notification-item').removeClass('unread');
                        $('.ap-notification-item').find('.ap-btn-markread').remove();
                    }
                }
            });
        },

        cancel_comment: function(){
            $('body').delegate('[data-action="cancel-comment"]', 'click', function(e) {
                e.preventDefault();
                var postID = $(this).data('id');
                $('[href="#comments-'+postID+'"]').removeClass('loaded');
                $(this).closest('.ap-comment-form').remove();
            });
        },

        questionSuggestion: function(){            
            $('[data-action="suggest_similar_questions"]').on('blur', function(){
                var title = $(this).val();
                if(title.length == 0)
                    return;

                ApSite.doAjax(
                    apAjaxData('action=ap_ajax&ap_ajax_action=suggest_similar_questions&ap_ajax_nonce='+ap_nonce+'&value='+title),
                    function(data) {                        
                        $("#similar_suggestions").html(data.html);      
                    },
                    this, 
                    false,
                    true
                );
            });
        },

        notificationAsRead: function(){
        	var ids = $('input[name="ap_loaded_notifications"]').val();
        	
        	if( ids.length == 0 || $(this).parent().is('.open') ){
        		return;
        	}

        	ApSite.doAjax(apAjaxData('ap_ajax_action=set_notifications_as_read&__nonce='+ap_nonce+'&ids='+ids ));
        },

        checkboxUncheck: function(){
            $('#anspress input[type="checkbox"]').click(function(){
                var name = $(this).attr('name');
                if ($(this).is(':checked')){
                    $('input[name="'+ name +'"][type="hidden"]').attr('name', '_hidden_'+ name );
                }else{
                    $('input[name="_hidden_'+ name +'"]').attr('name', name );
                }

                
            })
        }
    }

})(jQuery);

(function($) {
    function apDoActions(action, args, data){
        data = data|| '';
        if(typeof ApSite[action] === 'function'){                        
            if( typeof args === 'object' ){
                args.data = data;
                ApSite[action].apply(ApSite, args);
            }
            else{
                ApSite[action](args, data);
            }
        }
    }
    $(document).ajaxComplete(function(event, response, settings) {
        // Get response html.
        var data = apParseAjaxResponse(response.responseText);
        console.log(data);

        // Store template in global object.
        if( (data.apTemplate||false) && 'object' === typeof data.apTemplate && !apAutloadTemplate(data) )
            apLoadTemplate(data.apTemplate.name, data.apTemplate.template, function(template){
                apParseTemplate(data.apTemplate.name, data.apData, function(temp){
                    $(data.appendTo).append(temp);
                });
            });
        
        if (typeof data.message_type !== 'undefined') {            
            if( '' != data.message_type && '' != data.message){
                ApSite.addMessage(data.message, data.message_type);
            }

            if(typeof grecaptcha !== 'undefined' && data.message_type !== 'success')
                grecaptcha.reset(widgetId1);

            $(document).trigger('ap_after_ajax', data);

            AnsPress.site.hideLoading('all');
        }

        // Trigger custom actions after ajax
        if (typeof data.do !== 'undefined') {
            var action = data.do;

            //Check if data.do is object
            if( typeof action === 'object' ){
                $.each(action, function(index, el) {
                    if(typeof ApSite[index] === 'function'){  
                        apDoActions(index, el, data);
                    }else if(typeof el === 'object'){
                        $.each(el, function(i, obj) {
                            if( typeof obj.action !== 'undefined' && typeof ApSite[obj.action] === 'function' )
                                apDoActions(obj.action, obj.args, data);
                        });
                    }
                    
                });
            }else{
                if(typeof ApSite[action] === 'function'){
                    ApSite[action](data);
                }
            }
        }

        if (typeof data !== 'undefined' && typeof data.is_ap_ajax !== 'undefined' && typeof data.view !== 'undefined') {
            $.each(data.view, function(i, view) {
                try {
                   var html = $(view);
                }catch(err){
                    //console.log(err);
                }

                if(typeof data.view_html !== 'undefined' && typeof html !== 'undefined' && html.is('[data-view="' + i + '"]')){
                    html = html.children();
                    $('[data-view="' + i + '"]').html(html);
                }else{
                    $('[data-view="' + i + '"]').text(view);
                    $('[data-view="' + i + '"]').removeClass('ap-view-count-0');
                }
            });
        }

    }); 
})(jQuery);

function apAutloadTemplate(data){
    return 'undefined' !== typeof data.disableAutoLoad && data.disableAutoLoad;
}

