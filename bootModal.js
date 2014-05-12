/*!
 * bootModal.js
 * https://github.com/wpagee/bootModal
 * MIT License (c) 2014 William P Agee
 */
 
!function (root, name, make) {
    if (typeof module != 'undefined' && module.exports) module.exports = make(require)
    else root[name] = make(function (id) { return root[id] })
}(this, 'BootModal', function (require) {
    "use strict";

    var $ = require('jQuery')
    ,   ko = require('ko') //[can be optional]    
    ,   activeDialogs = []
    ,   defaults = {
            buttons: null,
            closeOnBgClick: true,
            context: 'body',
            content: null,
            effectType: 'fade',
            events: {
                afterOpen: null,
                beforeOpen: null,
            },
            hideCancelButton: false,
            openAsModal: true,
            size: null, // [modal-sm, modal-lg]
            title: '',
            viewModel: null
        }
    ,   defaultButtons = {
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
        }
    ,   shouldPreventClose = false;

    if (typeof $().modal !== 'function') throw Error("BootModal requires Bootstrap's modal js file in order to run correctly.");


    var BootModal = function (options, callback) {
        this.opts = $.extend(true, {}, defaults, options);
        this.results = null;
        this.success = false;
        this.callback = callback;

        this.$dialog = this.build();
        this.attachBootstrapEventHandlers();
    };

    BootModal.alert = function (options, callback) {
        var userOpts = {};

        if (typeof options == 'object') {
            userOpts = options;
        } else {
            userOpts = {
                content: options,
            }
        };

        var opts = $.extend(true,
          {},
          defaults,
          {
              title: 'Alert',
              hideCancelButton: true,
              openAsModal: false
          },
          userOpts);

        return BootModal.open(opts, callback);
    };

    BootModal.confirm = function (options, callback) {
        var opts = $.extend(true,
          {},
          {
              title: 'Confirm'
          },
          options);

        return BootModal.open(opts, callback);
    };

    BootModal.open = function (options, callback) {
        var _dlg = new BootModal(options, callback);
        _dlg.open();

        return _dlg;
    };

    BootModal.prototype = {
        constructor: BootModal,

        attachBootstrapEventHandlers: function () {
            this.$dialog.on('shown.bs.modal', this.openComplete.bind(this));
            this.$dialog.on('hidden.bs.modal', this.closeComplete.bind(this));
        },

        bind: function() {
            if (this.opts.viewModel != null) {
                if (typeof ko !== 'object') throw Error("You forgot to include knockout.js");
                else ko.applyBindings(this.opts.viewModel, this.$dialog.get(0));
            }
        },

        build: function () {
            var $modalContainer = $('<div />', {
                                    class: ['modal', this.opts.effectType].join(' ')
                                  })
                                  .attr({
                                    'role': 'dialog',
                                    'data-backdrop': this.opts.closeOnBgClick === false ? 'static' : this.opts.openAsModal,
                                    'aria-labelledby': this.opts.title
                                  })

            ,   $modalDialog = $('<div />', { class: ['modal-dialog', this.opts.size].join(' ') })
            ,   $modalContent = $('<div />', { class: 'modal-content' })
            ,   $modalHeader = $('<div />', { class: 'modal-header' })
            ,   $modalBody = $('<div />', { class: 'modal-body' })
            ,   $modalFooter = $('<div />', { class: 'modal-footer' })
            ,   $closeBtn = $('<button />', {
                            class: 'close'
                            })
                            .attr({
                                'aria-hidden': true,
                                'type': 'button'
                            })
                            .html('&times;')
                            .on('click', function (e) {
                                this.close(false);
                            }.bind(this));

            $modalHeader.append($closeBtn);

            if (this.opts.title != null) {
                var $modalTitle = $('<h4 />', { class: 'modal-title', text: this.opts.title });
                $modalHeader.append($modalTitle);
            }

            //Load Content		
            $modalBody.append(this.opts.content);

            //Load Buttons
            if (this.opts.buttons == null) {
                if (!this.opts.hideCancelButton) {
                    $modalFooter.append(this.buttonFactory(defaultButtons.Cancel, 'Cancel'));
                }
                $modalFooter.append(this.buttonFactory(defaultButtons.Ok, 'Ok'));
            } else {
                if (typeof this.opts.buttons != 'object') {
                    throw Error('Buttons must be passed in a an object');
                }

                for (var btn in this.opts.buttons) {
                    $modalFooter.prepend(this.buttonFactory(this.opts.buttons[btn], btn));
                }
            }

            $modalContent.append($modalHeader, $modalBody, $modalFooter);
            $modalDialog.append($modalContent);
            $modalContainer.append($modalDialog);

            return $modalContainer;
        },

        buttonFactory: function (obj, text) {
            var btn = $.extend({}, {
                class: 'btn btn-default',
                callback: function () {
                    return false;
                },
                success: null
            }, obj);

            var event = (function ($scope, $btn) {
                var prevent = false;

                return {
                    target: $btn,
                    parent: $scope,
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
            })(this, btn);

            var $button = $('<button />')
                          .addClass(btn.class)
                          .text(text || ' ')
                          .on('click', function (e) {
                              event.relatedEvent = e;

                              this.results = this.gleanDialog();
                              btn.callback.call(this, event, this.results);

                              if (event.getPreventDefault() !== true) {
                                this.close(btn.success);
                              }
                          }.bind(this));

            return $button;
        },

        open: function (callback) {
            if (callback != null) {
                this.callback = callback;
            };

            // try to bind viewModal
            this.bind();

            //save to open dialogs for tracking
            activeDialogs.push(this);
            $(this.opts.context).append($(this.$dialog));

            if (this.opts.events.beforeOpen != null) {
                this.opts.events.beforeOpen.call(this);
            }

            this.$dialog.modal('show');
            this.unfocusAllDialogs();
        },

        openComplete: function (e) {
            if (this.opts.events.afterOpen != null) {
                this.opts.events.afterOpen.call(this);
            }
        },

        close: function (confirm) {
            this.success = confirm || false;
            this.$dialog.modal('hide');
        },

        closeComplete: function (e) {
            activeDialogs = activeDialogs.filter(function (dialog) { return dialog != this }.bind(this));
            if (activeDialogs.length > 0) {
                activeDialogs[activeDialogs.length - 1].focus();
            }

            $(this.$dialog).detach();

            if (this.callback != null) {
                this.callback.call(this, this.success, this.results);
            }
        },

        focus: function () {
            $(this.$dialog).css({
                'zIndex': 1040
            }).find('.modal-body').css({
                'zIndex': 1040
            });
        },

        unfocus: function () {
            $(this.$dialog).css({
                'zIndex': 1030
            }).find('.modal-body').css({
                'zIndex': 1030
            });
        },

        unfocusAllDialogs: function () {
            activeDialogs.forEach(function (dialog) {
                if (dialog != this) {
                    dialog.unfocus();
                }
            }.bind(this));
        },

        gleanDialog: function () {
            var _results = {},
                $results = this.$dialog.find('.modal-body').find(':input');

            $results.each(function (i, element) {
                var $element = $(element),
                    _id = $element.prop('id'),
                    _name = $element.prop('name'),
                    _type = $element.prop('type'),
                    _value = $element.prop('value');

                if (_name.length > 0) {
                    switch (_type) {
                        case 'checkbox':
                            _results[_name] = $(element).is(':checked');
                            break;
                        case 'radio':
                            if (_value != null && $element.is(':checked')) {
                                _results[_name] = {
                                    checked: $element.is(':checked'),
                                    value: _value
                                };
                            }
                            break;
                        default:
                            _results[_name] = _value;
                            break;
                    }
                } else if (_id != null) {
                    if (_type === 'checkbox') {
                        _results[_id] = $element.is(':checked');
                    } else {
                        _results[_id] = _value;
                    }
                }
            });

            return _results;
        }

    };

    return BootModal;
});
