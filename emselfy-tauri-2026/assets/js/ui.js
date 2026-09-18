(($) => {
    $.widget('custom.combobox', {
        _create() {
            this.wrapper = $('<span>').addClass('custom-combobox').insertAfter(this.element);

            this.soption = $('<option>')
                .addClass('event-hidden')
                .attr('value', '')
                .text('custom value')
                .hide()
                .appendTo(this.element);

            this.element.hide();
            this._createAutocomplete();
            this._createShowAllButton();
        },

        _createAutocomplete() {
            const selected = this.element.children(':selected');
            const value = selected.val() ? selected.text() : '';

            this.input = $('<input>')
                .appendTo(this.wrapper)
                .val(value)
                .attr('title', '')
                .addClass(
                    'custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left',
                )
                .autocomplete({
                    delay: 0,
                    minLength: 0,
                    source: $.proxy(this, '_source'),
                });

            this._on(this.input, {
                autocompleteselect(event, ui) {
                    ui.item.option.selected = true;
                    this._trigger('select', event, { item: ui.item.option });
                },
                autocompletechange() {
                    this.soption.attr('value', this.input.val());
                    this.soption.prop('selected', true);
                    this.options.change.call(this);
                },
            });
        },

        _createShowAllButton() {
            const input = this.input;
            let wasOpen = false;

            $('<a>')
                .attr('tabIndex', -1)
                .attr('title', 'Show All Items')
                .appendTo(this.wrapper)
                .button({
                    icons: { primary: 'ui-icon-triangle-1-s' },
                    text: false,
                })
                .removeClass('ui-corner-all')
                .addClass('custom-combobox-toggle ui-corner-right')
                .on('mousedown', () => {
                    wasOpen = input.autocomplete('widget').is(':visible');
                })
                .on('click', () => {
                    input.trigger('focus');
                    if (wasOpen) return;
                    input.autocomplete('search', '');
                });
        },

        _source(request, response) {
            const matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), 'i');
            response(
                this.element
                    .children('option:not(.event-hidden)')
                    .map(function () {
                        const $this = $(this);
                        const text = $this.text();
                        if (this.value && (!request.term || matcher.test(text))) {
                            return { label: text, value: text, option: this };
                        }
                    })
                    .get(),
            );
        },

        _destroy() {
            this.wrapper.remove();
            this.soption.remove();
            this.element.show();
        },

        refresh() {
            this.input.val(this.element.val());
        },

        getinput() {
            return this.input;
        },
    });
})(jQuery);
