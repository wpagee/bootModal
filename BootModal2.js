(function ($, ko, undefined) {

    var defaults = {
        backdrop: true, // extended bootstrap options
        buttons: null,
        content: '',
        effectType: 'fade',
        title: '',
        keyboard: true, // extended bootstrap options
        labelledBy: null, // if empty defaults to headerTitle
        describedby: null,
        remote: true, // extended bootstrap options
        size: '',
        viewModel: null
    };

    var bootstrapDefaultEvents = {
        hide: null,
        hidden: null,
        loaded: null,
        show: null,
        shown: null
    };

    var defaultButtons = {
        Ok: {
            class: 'btn btn-primary',
            id: 'confirmWindow-ok-btn',
            success: true
        },
        Cancel: {
            class: 'btn btn-default',
            id: 'confirmWindow-cancel-btn',
            success: false
        }
    };

    bootModal = function (options, bootstrapEvents) {
        this.opts = $.extend({}, defaults, options);
        this.bsEvents = $.extend({}, bootstrapDefaultEvents, bootstrapEvents);
        this.$dialog = this._build();
    };

    //#region private methods

    bootModal.prototype._attachEvents = function () {
        var _keys = Object.keys(this.bsEvents);

        _keys.forEach(function (key) {
            if (this.bsEvents[key] != null && typeof (this.bsEvents[key]) === 'function') {
                var _eventType = [key, 'bs', 'modal'].join('.');
                this.$dialog.on(_eventType, this.bsEvents[key]);
            }
        }.bind(this));


        //add addition close event for removing dialog html
        this.$dialog.on('hidden.bs.modal', function () {
            this.$dialog.remove();
            this.$dialog = null;
        }.bind(this));
    };

    bootModal.prototype._build = function () {
        var $modalContainer = $('<div />', { class: ['modal', this.opts.effectType].join(' ') });
        $modalContainer.attr({
            'role': 'dialog',
            'aria-labelledby': this.opts.labelledBy || this.opts.title,
            'aria-describedby': this.opts.describedby || '',
            'aria-hidden': true
        });

        var $modalDialog = $('<div />', { class: ['modal-dialog', this.opts.size].join(' ') });
        var $modalContent = $('<div />', { class: 'modal-content' });
        var $modalHeader = $('<div />', { class: 'modal-header' });
        var $modalBody = $('<div />', { class: 'modal-body' });
        var $modalFooter = $('<div />', { class: 'modal-footer' });

        //#region header

        $modalHeader.html([
            '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>',
            '<h4 class="modal-title">',
            this.opts.title,
            '</h4>'
        ].join(''));

        //#endregion

        //#region content

        $modalBody.html(this.opts.content);

        //#endregion
        
        //#region footer
        var _buttons = this.opts.buttons || defaultButtons;

        for (var btn in _buttons) {
            $modalFooter.prepend(this._buttonFactory(_buttons[btn], btn));
        }

        //#endregion
        
        $modalContent.append($modalHeader, $modalBody, $modalFooter);
        $modalDialog.append($modalContent);
        $modalContainer.append($modalDialog);

        return $modalContainer;
    };

    bootModal.prototype._buttonFactory = function (button, btnText) {
        var _btn = $.extend({}, {
            class: 'btn btn-default',
            callback: function () {
                return false;
            },
            success: null
        }, button);

        var _localEventCallback = this._eventCallback(_btn);

        var $button = $('<button />', {
            class: _btn.class,
            text: btnText
        })
        .on('click', function (e) {
            _localEventCallback.relatedEvent = e;

            _btn.callback.call(this, _localEventCallback);

            if (_localEventCallback.getPreventDefault() !== true) {
                this.close();
            }
        }.bind(this));

        return $button;
    };

    bootModal.prototype._eventCallback = function (btn) {
        var self = this,
            prevent = false;

        return {
            target: btn,
            parent: self,
            preventDefault: function () {
                prevent = true;
            },
            getPreventDefault: function () {
                var _preventValue = prevent;
                prevent = false;
                return _preventValue;
            },
            relatedEvent: null
        };
    };

    //#endregion

    bootModal.prototype.open = function () {
        if (this.$dialog == null) {
            this.$dialog = this._build();
        }
        
        var _params = {
            backdrop: this.opts.backdrop,
            keyboard: this.opts.keyboard,
            remote: this.opts.remote
        };

        this.$dialog.modal(_params);
        this._attachEvents();
        this.applyBindings();


        this.$dialog.modal('show');
    };

    bootModal.prototype.close = function () {
        if (this.$dialog != null) {
            this.$dialog.modal('hide');
        }        
    };

    bootModal.prototype.applyBindings = function (viewModel) {
        var _vm = viewModel || this.opts.viewModel;

        if (_vm != null) {
            ko.applyBindings(_vm, this.$dialog.get(0));
        }
    };

    bootModal.open = function (options, bootstrapEvents) {
        var _modal = new bootModal(options, bootstrapEvents);
        _modal.open();

        return _modal;
    };

    bootModal.alert = function (dialogTitle, message, callback) {
        var _modal = new bootModal({
            buttons: {
                Ok: {
                    class: 'btn btn-success',
                    id: 'confirmWindow-ok-btn',
                    success: true,
                    callback: callback
                },
            },
            content: message,
            title: dialogTitle || 'Alert'
        });

        _modal.open();

        return _modal;
    };

    bootModal.confirm = function (options, callback) {
        var _opts = $.extend(true, {}, {
            buttons: {
                Save: {
                    class: 'btn btn-success',
                    id: 'confirmWindow-ok-btn',
                    success: true,
                    callback: callback
                },
                Cancel: {
                    class: 'btn btn-default',
                    id: 'confirmWindow-cancel-btn',
                    success: false,
                },
            },
            content: '',
            title: 'Confirm'
        }, options);

        var _modal = new bootModal(_opts);

        _modal.open();

        return _modal;
    };

    return bootModal

})(window.jQuery, window.Backbone, window.ko, window.kb);