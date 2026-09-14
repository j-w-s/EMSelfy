var lib = {
    qs: {
        stringify: function (obj) {
            var parts = [];
            for (var key in obj) {
                if (!Object.prototype.hasOwnProperty.call(obj, key)) {
                    continue;
                }
                var value = obj[key];
                if (Array.isArray(value)) {
                    for (var i = 0; i < value.length; i++) {
                        parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value[i]));
                    }
                } else {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
                }
            }
            return parts.join('&');
        },
        parse: function (str) {
            var obj = {};
            str = String(str || '');
            if (str.charAt(0) === '?') {
                str = str.substring(1);
            }
            if (str.length === 0) {
                return obj;
            }
            var pairs = str.split('&');
            for (var i = 0; i < pairs.length; i++) {
                if (pairs[i].length === 0) {
                    continue;
                }
                var idx = pairs[i].indexOf('=');
                var key, value;
                if (idx === -1) {
                    key = decodeURIComponent(pairs[i]);
                    value = '';
                } else {
                    key = decodeURIComponent(pairs[i].substring(0, idx));
                    value = decodeURIComponent(pairs[i].substring(idx + 1).replace(/\+/g, ' '));
                }
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    if (Array.isArray(obj[key])) {
                        obj[key].push(value);
                    } else {
                        obj[key] = [obj[key], value];
                    }
                } else {
                    obj[key] = value;
                }
            }
            return obj;
        },
    },
};

$(window).on('init', function () {
    var win = $(window);

    //left bar begin

    (function () {
        var minBar = $('.l-bar');

        $('.e_l_menu').on('click', function () {
            minBar.toggleClass('min');
        });

        $('.panel_toggle_btn')
            .on('click', function () {
                var $this = $(this);
                var panel = $this.data('panel');
                $('.panel_toggle_btn.active').removeClass('active');

                $this.addClass('active');
                minBar.addClass('min');
                var panels = $('.panel_toggle_p');
                panels.filter('.active').removeClass('active').trigger('leave');

                panels
                    .filter('.' + panel)
                    .addClass('active')
                    .trigger('enter');

                win.trigger('resize');
            })
            .eq(0)
            .trigger('click');
    })();

    //left bar end

    //windodw resize
    (function () {
        var FLASH_SIZE = { width: 130, height: 190 };

        var div = $('.l-selfy'),
            rpanel = $('.r-panel');

        win.on('resize', function () {
            var win_size, flash_size;
            win_size = { width: win.width(), height: win.height() };
            flash_size = {};

            flash_size.height = win_size.height - 31;
            flash_size.width = parseInt(flash_size.height * (FLASH_SIZE.width / FLASH_SIZE.height));

            div.css(flash_size);
            $('.selfy_flash').attr(flash_size);
            rpanel.css({
                'margin-left': flash_size.width + 44,
                width: win_size.width - flash_size.width - 44 - 2,
            });
        });
    })();

    //left flash
    (function () {
        var flash_tmp = new baidu.template('tp:flash');

        var selfy_items = $('.l-selfy .selfy-li');

        var selfy_history = [];

        window.set_clothes_url = function (url) {
            set_clothes('clear', undefined, false);
            url = lib.qs.parse(url.substring(url.indexOf('?') + 1));
            for (var name in url) {
                set_clothes(name, url[name], false);
            }
            update_clothes();
        };

        window.set_clothes = function (category, id, auto) {
            auto = auto == false ? false : true;

            category = category.toLocaleLowerCase();
            if (category == 'clear') {
                $('img', selfy_items).attr('src', '');
                selfy_items.data('id', '');
            } else {
                var item = selfy_items.filter(function () {
                    return $(this).data('category') == category;
                });

                id = id == 0 ? '' : id;

                item.data('id', id);
                if (id) {
                    $('img', item).attr(
                        'src',
                        window.serverurl + '/imgs/' + category + '/' + id + '.png',
                    );
                } else {
                    $('img', item).attr('src', '');
                }

                var exist = false;
                if (!id) {
                    for (var i in selfy_history) {
                        var item = selfy_history[i];
                        if (item == id) {
                            exist = true;
                            break;
                        }
                    }
                }
                if (!exist) {
                    selfy_history.push(id);
                }
            }
            if (auto) {
                update_clothes();
            }
        };
        window.update_clothes = function () {
            var obj = {};
            selfy_items.each(function () {
                var item = $(this);
                var category = item.data('category');
                var id = item.data('id');
                if (!id || !category) {
                    return;
                }
                obj[category] = id;
            });
            window.selfy_query = lib.qs.stringify(obj);
            $('.e-selfy-flash').html(flash_tmp({ query: window.selfy_query }));
            win.trigger('resize');
            if (selfy_history.length == 0) return;
            $.post(
                window.serverurl +
                    '/history?' +
                    lib.qs.stringify({ action: 'add', ids: selfy_history }),
            );
            selfy_history = [];
            $('.selfy_items .l-s > .history').data('onequery', false);
        };

        update_clothes();

        $('.l-selfy .selfy-li .seach').on('click', function () {
            var $this = $(this).parents('.selfy-li:eq(0)');
            var str = 'cat:' + $this.data('category') + ' ';
            if ($this.data('id')) {
                str += 'id:' + $this.data('id') + ' ';
            }
            $('.e_seach_input').val(str).parents('form:eq(0)').trigger('submit');
        });
        $('.l-selfy .selfy-li .del').on('click', function () {
            var $this = $(this).parents('.selfy-li:eq(0)');
            set_clothes($this.data('category'), '');
        });
    })();

    (function () {
        var seach_key = $('.s-input input'),
            seach_input = seach_key.parents('.s-b-key:eq(0)');
        var more = $('.s-b-key .s-ico'),
            more_box = $('.s-b-key .s-b-more');

        seach_key.on('focus context focusout', function (e) {
            if (e.type == 'context') {
                if (this.value.trim() == '') {
                    seach_input.removeClass('focus');
                } else {
                    seach_input.addClass('focus');
                }
                return;
            }

            if (e.type == 'focus') {
                seach_input.addClass('focus');
                more_box.stop().slideUp(100);
            } else if (this.value.trim() == '') {
                seach_input.removeClass('focus');
            }
        });

        more.on('click', function () {
            more_box.stop().slideToggle(100);

            var objs = utils.toSeachObj(seach_key.val());
            var inputs = $('[name]', more_box).val('');
            for (var key in objs) {
                var item = inputs
                    .filter(function () {
                        return $(this).attr('name') == key;
                    })
                    .val(objs[key]);

                item.children('option.event-hidden')
                    .attr('value', objs[key])
                    .prop('selected', true);
            }
            updateui();
            return false;
        });

        var more = $('.e_seach_more'),
            input = $('.e_seach_input');

        var updatekey = function () {
            var qs = {};
            $('input,select', more).each(function (i, v) {
                v.name && (qs[v.name] = v.value);
            });
            input.val(utils.toSeachStr(qs));
            seach_key.trigger('context');
            return true;
        };
        var updateui = function () {
            $('.e_category,.e_server,.e_coin').selectmenu('refresh');
            $('.e_color,.e_source').combobox('refresh');
        };

        $('.e_category,.e_server,.e_coin').selectmenu({ change: updatekey });
        $('.e_color,.e_source').combobox({ change: updatekey });

        $('.e_color').combobox('getinput').autocomplete('instance')._renderItem = function (
            ul,
            item,
        ) {
            return $('<li>').css('color', item.value).text(item.label).appendTo(ul);
        };

        $('.e_m_key').on('change', updatekey);

        $('.s-m-btn .reset').on('click', function () {
            $('.e_category,.e_server,.e_coin').val('');
            $('.e_color,.e_source').val('');
            $('.e_m_key').val('');
            updateui();
            updatekey();
        });

        $('.s-m-btn .seach').on('click', function () {
            input.trigger('focus');
            input.parents('form:eq(0)').trigger('submit');
        });

        $('.selfy_items .l-s > .panel_toggle_p')
            .on('enter', function () {
                var $this = $(this);
                var input = $this.data('input'),
                    params = $this.data('params'),
                    onequery = $this.data('onequery');
                input = input || '';
                seach_key.val(input).trigger('context');
                if (!onequery) {
                    seach_key.parents('form:eq(0)').trigger('submit');
                    $this.data('onequery', true);
                }
            })
            .on('leave', function () {
                var $this = $(this);
                $this.data('input', seach_key.val());
                //var input = $this.data("input"), params = $this.data("params");
            });

        $('.e_seach_btn').on('click', function () {
            $('.e_seach_form').trigger('submit');
        });
        var view_btn = $('.e_view_btn').on('click', function () {
            view_box.toggleClass('active');
        });
        $('.s-l-v .btn-text').on('click', function () {
            var $this = $(this);
            $('i', view_btn).attr('class', $('i', $this).attr('class'));
            view_box.removeClass('active');

            if ($this.hasClass('max')) {
                $('.l-s').removeClass('min');
                $('.l-s').addClass('max');
            }
            if ($this.hasClass('min')) {
                $('.l-s').removeClass('max');
                $('.l-s').addClass('min');
            }
            win.trigger('resize');
        });

        var tp_item = baidu.template('tp:selfy_item'),
            view_box = $('.s-l-v');
        var query = function (queryobj, callback) {
            var qs = typeof queryobj == 'string' ? lib.qs.parse(queryobj) : queryobj;
            qs.pn = isNaN(qs.pn) ? 0 : qs.pn;
            $.ajax({
                url: window.serverurl + '/getList',
                data: qs,
                success: function (r) {
                    var p = { data: r, query: qs };
                    var html = tp_item(p);
                    callback(html, p);
                    win.trigger('resize');
                },
                timeout: 20000,
            });
        };

        var event_list = function (html, params) {
            var b = $('.selfy_items .l-s > .' + params.query.type).data('params', params);

            b.data('nodata', params.data.count == 0);
            b.data('isloading', false);

            if (localStorage['loadtype'] == '1') {
                b.html(html);
                var go_page = function (old, p) {
                    var q_pn = (p - 1) * old.data.value.pagesize;
                    if (old.query.pn == q_pn) {
                        return;
                    }
                    old.query.pn = q_pn;
                    query(old.query, event_list);
                };

                $('.page-bottom .paging span[data-p]', b).on('click', function () {
                    var old = $(this)
                        .parents('.' + params.query.type)
                        .data('params');
                    go_page(old, $(this).data('p'));
                });
                $('.page-bottom .paging .input input', b).on('click', function () {
                    return false;
                });
                $('.page-bottom .paging .input', b).on('click', function () {
                    var old = $(this)
                        .parents('.' + params.query.type)
                        .data('params');
                    go_page(old, $('input', this).val());
                });
                b.parent().scrollTop(0);
            } else {
                $('.page-bottom', b).remove();
                if (params.query.pn == 0) {
                    b.html(html);
                } else {
                    b.append(html);
                }
            }

            var effect_selfy = new baidu.template('tp:effect-selfy');

            var effect_box_to = function (from, to, data) {
                (from = $(from)), (to = $(to));
                var html = effect_selfy(data);
                var from_off = from.offset(),
                    to_off = to.offset();
                var e = $('<div>').html(html).addClass('effect-selfy').css({
                    top: from_off.top,
                    left: from_off.left,
                    width: from.width(),
                    height: from.height(),
                    opacity: 1,
                });
                e.appendTo('body');
                e.animate(
                    {
                        top: to_off.top,
                        left: to_off.left,
                        width: to.width(),
                        height: to.height(),
                    },
                    500,
                    function () {
                        e.animate({ opacity: 0 }, 500, function () {
                            e.remove();
                        });
                    },
                );
            };

            $('.l-s-item .wear', b).on('click', function () {
                var $this = $(this).parents('.l-s-item:eq(0)');

                effect_box_to(
                    $('img', $this),
                    '.l-selfy .selfy-li.' + $this.data('category') + ' img',
                    { img: $('img', $this).attr('src') },
                );
                set_clothes($this.data('category'), $this.data('id'));

                var left = $('.l-selfy .l-selfy-panel');
                left.addClass('hover');
                setTimeout(function () {
                    left.removeClass('hover');
                }, 500);
            });

            $('.l-s-item .favorites', b).on('click', function () {
                var t = $(this);
                var ico = $('i', t);
                var $this = t.parents('.l-s-item:eq(0)');
                $('.selfy_items .l-s > .favorites').data('onequery', false);
                if ($this.data('favorites')) {
                    $.get(
                        window.serverurl + '/favorites',
                        { action: 'del', id: $this.data('id') },
                        function (msg) {
                            $this.data('favorites', !$this.data('favorites'));
                            ico.attr('class', 'iconfont icon-Collection');
                        },
                        'json',
                    );
                } else {
                    $.get(
                        window.serverurl + '/favorites',
                        { action: 'add', id: $this.data('id') },
                        function (msg) {
                            effect_box_to($('img', $this), '.l-bar li[data-panel=favorites]', {
                                img: $('img', $this).attr('src'),
                            });
                            $this.data('favorites', !$this.data('favorites'));
                            ico.attr('class', 'iconfont icon-shoucang');
                        },
                        'json',
                    );
                }
            });
        };

        $('.selfy_items .l-s').on('scroll', function (e) {
            if (localStorage['loadtype'] != '2') {
                return;
            }
            var $this = $(this),
                panel = $('.selfy_items .l-s .active.panel_toggle_p'),
                falls = $('.falls', panel);

            if (panel.data('nodate') || panel.data('isloading')) {
                return;
            }

            var q = panel.data('params').query;

            var bottom = $this.scrollTop() + $this.height();
            var h = panel.height() - 30;
            q.pn = $('.l-s-item:not(.not)', panel).length;

            if (bottom > h) {
                panel.data('isloading', true);
                query(q, event_list);
            }
        });

        $('.e_seach_form')
            .on('submit', function (e) {
                e.preventDefault();
                more_box.stop().slideUp(100);
                var $this = $(this);

                var qs = lib.qs.parse($this.serialize());
                var p = $('.panel_toggle_p.active[data-type]');
                qs['type'] = p.data('type');
                p.parent().scrollTop(0);
                query(qs, event_list);
            })
            .trigger('submit');

        win.trigger('resize');
    })();

    (function () {
        var ITEM_SIZE_A = { width: 120, height: 145 },
            ITEM_SIZE_B = { width: 240, height: 110 };

        var rpanel = $('.r-panel'),
            seach = $('.s-seach', rpanel),
            ls = $('.selfy_items .l-s', rpanel);

        win.on('resize', function () {
            ls.height(rpanel.height() - seach.height());
            var type = $('.panel_toggle_p.active[data-type]').data('type');

            var box = $('> .' + type, ls);

            var items = $('.l-s-item', box);

            var box_size = { width: rpanel.width() - 15, height: rpanel.height() };

            var item_size = $('.l-s').hasClass('min') ? ITEM_SIZE_A : ITEM_SIZE_B;

            var col_num = parseInt(box_size.width / item_size.width);
            var col_width = box_size.width / col_num;

            items.each(function (i, v) {
                var $this = $(this);
                $this.css({
                    left: (i % col_num) * col_width + (col_width / 2 - item_size.width / 2),
                    top: 10 + parseInt(i / col_num) * item_size.height,
                });
            });

            box.css({ height: Math.ceil(items.length / col_num) * item_size.height + 10 + 30 });
        });
    })();

    (function () {
        $('.file .e_img_export').on('click', function () {
            window.__TAURI__.dialog
                .save({
                    filters: [{ name: 'em selfy', extensions: ['emselfy'] }],
                })
                .then(function (path) {
                    if (!path) {
                        return;
                    }
                    return ipc.invoke('write_text_file', {
                        path: path,
                        contents: window.selfy_query,
                    });
                });
        });

        $('.file .e_img_import').on('click', function () {
            window.__TAURI__.dialog
                .open({
                    multiple: false,
                    filters: [{ name: 'em selfy', extensions: ['emselfy'] }],
                })
                .then(function (path) {
                    if (!path) {
                        return;
                    }
                    return ipc.invoke('read_text_file', { path: path }).then(function (data) {
                        window.set_clothes_url(data);
                    });
                });
        });

        $('.file .e_url_import').on('click', function () {
            $('.url_dialog .content').text('请输入DreamSelfy或EmSelfy 的URL!');
            $('.dig_btn_urlimport').show();
            $('.dig_btn_urlclose').hide();
            $('.url_dialog').show();
        });

        $('.file .e_url_export').on('click', function () {
            $('.url_dialog .content').text('请复制文本框内的文本,记录在记事本或其他程序中!');
            $('.url_dialog input').val(selfy_query);
            $('.dig_btn_urlimport').hide();
            $('.dig_btn_urlclose').show();
            $('.url_dialog').show();
        });

        $('.file .e_to_selfyme').on('click', function () {
            var url = 'http://www.dreamself.me/clothes.php?action=change&' + window.selfy_query;
            console.log(url);
            utils.openURL(url);
        });

        $('.file .e_to_atgame').on('click', function () {
            var url =
                'http://img.atgames.jp/selfy_motion.swf?' +
                window.selfy_query +
                '&_from=emselfy&_ver=1.0';
            console.log(url);
            utils.openURL(url);
        });

        $('.dig_btn_urlimport').on('click', function () {
            set_clothes_url($('.url_dialog input').val());
            $('.url_dialog').hide();
        });

        $('.dig_btn_urlclose').on('click', function () {
            $('.url_dialog').hide();
        });
    })();

    (function () {
        $('.c_load_type')
            .val(localStorage['loadtype'])
            .selectmenu({
                change: function () {
                    localStorage['loadtype'] = $(this).val();

                    $('.selfy_items .l-s > .panel_toggle_p').data('onequery', false);
                },
            });

        $('.c_language_sort').sortable({
            axis: 'y',
            stop: function () {
                var obj = [];
                $('.c_language_sort li').each(function () {
                    obj.push($(this).data('type'));
                });
                localStorage['language_sort'] = JSON.stringify(obj);
                $('.selfy_items .l-s > .panel_toggle_p').data('onequery', false);
            },
        });
    })();
});
window.flashLoad = function (arg) {
    // Flash ExternalInterface callback - arg is load status code
    console.log('[flashLoad]', arg);
};
