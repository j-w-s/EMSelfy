const lib = {
    qs: {
        stringify(obj) {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(obj)) {
                for (const v of Array.isArray(value) ? value : [value]) {
                    params.append(key, v);
                }
            }
            return params.toString();
        },
        parse(str) {
            const obj = {};
            for (const [key, value] of new URLSearchParams(str ?? '')) {
                obj[key] = Object.hasOwn(obj, key) ? [].concat(obj[key], value) : value;
            }
            return obj;
        },
    },
};

$(window).on('init', function () {
    const $win = $(window);
    const LOCAL_KEY_LOADTYPE = 'loadtype';
    const LOCAL_KEY_LANGSORT = 'language_sort';

    (function initLeftBar() {
        const $minBar = $('.l-bar');

        $('.e_l_menu').on('click', () => $minBar.toggleClass('min'));

        $('.panel_toggle_btn')
            .on('click', function () {
                const $this = $(this);
                const panel = $this.data('panel');

                $('.panel_toggle_btn.active').removeClass('active');
                $this.addClass('active');
                $minBar.addClass('min');

                const $panels = $('.panel_toggle_p');
                $panels.filter('.active').removeClass('active').trigger('leave');
                $panels.filter(`.${panel}`).addClass('active').trigger('enter');

                $win.trigger('resize');
            })
            .eq(0)
            .trigger('click');
    })();

    (function initResize() {
        const FLASH_ASPECT = 130 / 190;
        const TITLEBAR_H = 31;
        const RAIL_W = 44;
        const GAP = 2;

        const $flash = $('.l-selfy');
        const $rpanel = $('.r-panel');

        $win.on('resize', function () {
            const winW = $win.width();
            const winH = $win.height();

            const flashH = winH - TITLEBAR_H;
            const flashW = Math.round(flashH * FLASH_ASPECT);

            $flash.css({ width: flashW, height: flashH });
            $('.selfy_flash').attr({ width: flashW, height: flashH });
            $rpanel.css({
                'margin-left': flashW + RAIL_W,
                width: winW - flashW - RAIL_W - GAP,
            });
        });
    })();

    (function initSelfy() {
        const flashTpl = new baidu.template('tp:flash');
        const $selfyItems = $('.l-selfy .selfy-li');
        const selfyHistory = [];

        window.set_clothes_url = function (url) {
            window.set_clothes('clear', undefined, false);
            const params = lib.qs.parse(url.slice(url.indexOf('?') + 1));
            for (const name in params) {
                window.set_clothes(name, params[name], false);
            }
            window.update_clothes();
        };

        window.set_clothes = function (category, id, auto = true) {
            category = category.toLocaleLowerCase();

            if (category === 'clear') {
                $('img', $selfyItems).attr('src', '');
                $selfyItems.data('id', '');
            } else {
                const $item = $selfyItems.filter(function () {
                    return $(this).data('category') === category;
                });

                id = id === 0 ? '' : id;
                $item.data('id', id);

                if (id) {
                    $('img', $item).attr('src', `${window.serverurl}/imgs/${category}/${id}.png`);
                } else {
                    $('img', $item).attr('src', '');
                }

                if (!selfyHistory.includes(id)) selfyHistory.push(id);
            }

            if (auto) window.update_clothes();
        };

        window.update_clothes = function () {
            const obj = {};
            $selfyItems.each(function () {
                const $item = $(this);
                const category = $item.data('category');
                const id = $item.data('id');
                if (!id || !category) return;
                obj[category] = id;
            });

            window.selfy_query = lib.qs.stringify(obj);
            $('.e-selfy-flash').html(flashTpl({ query: window.selfy_query }));
            $win.trigger('resize');

            if (selfyHistory.length === 0) return;

            $.post(
                `${window.serverurl}/history?${lib.qs.stringify({
                    action: 'add',
                    ids: selfyHistory,
                })}`,
            );

            selfyHistory.length = 0;
            $('.selfy_items .l-s > .history').data('onequery', false);
        };

        window.update_clothes();

        $('.l-selfy .selfy-li .seach').on('click', function () {
            const $li = $(this).parents('.selfy-li:eq(0)');
            let str = `cat:${$li.data('category')} `;
            if ($li.data('id')) str += `id:${$li.data('id')} `;
            $('.e_seach_input').val(str).parents('form:eq(0)').trigger('submit');
        });

        $('.l-selfy .selfy-li .del').on('click', function () {
            const $li = $(this).parents('.selfy-li:eq(0)');
            window.set_clothes($li.data('category'), '');
        });
    })();

    (function initSearch() {
        const $searchKey = $('.s-input input');
        const $searchBox = $searchKey.parents('.s-b-key:eq(0)');
        const $moreToggle = $('.s-b-key .s-ico');
        const $moreBox = $('.s-b-key .s-b-more');

        $searchKey.on('focus context focusout', function (e) {
            if (e.type === 'context') {
                $searchBox.toggleClass('focus', this.value.trim() !== '');
                return;
            }
            if (e.type === 'focus') {
                $searchBox.addClass('focus');
                $moreBox.stop().slideUp(100);
            } else if (this.value.trim() === '') {
                $searchBox.removeClass('focus');
            }
        });

        $moreToggle.on('click', function () {
            $moreBox.stop().slideToggle(100);

            const objs = utils.toSeachObj($searchKey.val());
            const $inputs = $('[name]', $moreBox).val('');
            for (const key in objs) {
                const $field = $inputs
                    .filter(function () {
                        return $(this).attr('name') === key;
                    })
                    .val(objs[key]);

                $field
                    .children('option.event-hidden')
                    .attr('value', objs[key])
                    .prop('selected', true);
            }
            refreshWidgets();
            return false;
        });

        const $morePanel = $('.e_seach_more');
        const $searchInput = $('.e_seach_input');

        const syncKey = () => {
            const qs = {};
            $('input,select', $morePanel).each(function () {
                if (this.name) qs[this.name] = this.value;
            });
            $searchInput.val(utils.toSeachStr(qs));
            $searchKey.trigger('context');
            return true;
        };

        const refreshWidgets = () => {
            $('.e_category,.e_server,.e_coin,.e_color,.e_source').selectmenu('refresh');
        };

        $('.e_category,.e_server,.e_coin,.e_color,.e_source').selectmenu({ change: syncKey });

        $('.e_m_key').on('change', syncKey);

        $('.s-m-btn .reset').on('click', function () {
            $('.e_category,.e_server,.e_coin').val('');
            $('.e_color,.e_source').val('');
            $('.e_m_key').val('');
            refreshWidgets();
            syncKey();
        });

        $('.s-m-btn .seach').on('click', function () {
            $searchInput.trigger('focus');
            $searchInput.parents('form:eq(0)').trigger('submit');
        });

        $('.selfy_items .l-s > .panel_toggle_p')
            .on('enter', function () {
                const $this = $(this);
                const input = $this.data('input') ?? '';
                const onequery = $this.data('onequery');

                $searchKey.val(input).trigger('context');

                if (!onequery) {
                    $searchKey.parents('form:eq(0)').trigger('submit');
                    $this.data('onequery', true);
                }
            })
            .on('leave', function () {
                $(this).data('input', $searchKey.val());
            });

        $('.e_seach_btn').on('click', () => {
            $('.e_seach_form').trigger('submit');
        });

        const $viewBox = $('.s-l-v');

        const $viewBtn = $('.e_view_btn').on('click', () => {
            $viewBox.toggleClass('active');
        });

        $('.s-l-v .btn-text').on('click', function () {
            const $this = $(this);
            $('i', $viewBtn).attr('class', $('i', $this).attr('class'));
            $viewBox.removeClass('active');

            const $ls = $('.l-s');
            if ($this.hasClass('max')) {
                $ls.removeClass('min').addClass('max');
            } else if ($this.hasClass('min')) {
                $ls.removeClass('max').addClass('min');
            }
            $win.trigger('resize');
        });

        const itemTpl = new baidu.template('tp:selfy_item');
        const effectTpl = new baidu.template('tp:effect-selfy');

        const query = (queryobj, callback) => {
            const qs = typeof queryobj === 'string' ? lib.qs.parse(queryobj) : queryobj;
            qs.pn = Number.isNaN(Number(qs.pn)) ? 0 : Number(qs.pn);

            $.ajax({
                url: `${window.serverurl}/getList`,
                data: qs,
                success(r) {
                    const p = { data: r, query: qs };
                    callback(itemTpl(p), p);
                    $win.trigger('resize');
                },
                error(xhr, status, err) {
                    console.error('[getList] request failed', {
                        qs,
                        status,
                        err,
                        response: xhr.responseText,
                    });
                    const $panel = $(`.selfy_items .l-s > .${qs.type}`);
                    $panel.data('isloading', false);
                },
                timeout: 20000,
            });
        };

        const flyTo = (from, to, data) => {
            const $from = $(from);
            const $to = $(to);
            const fromOff = $from.offset();
            const toOff = $to.offset();

            const $fly = $('<div>')
                .html(effectTpl(data))
                .addClass('effect-selfy')
                .css({
                    top: fromOff.top,
                    left: fromOff.left,
                    width: $from.width(),
                    height: $from.height(),
                    opacity: 1,
                })
                .appendTo('body');

            $fly.animate(
                {
                    top: toOff.top,
                    left: toOff.left,
                    width: $to.width(),
                    height: $to.height(),
                },
                500,
                () => {
                    $fly.animate({ opacity: 0 }, 500, () => $fly.remove());
                },
            );
        };

        const renderList = (html, params) => {
            const $box = $('.selfy_items .l-s > .' + params.query.type).data('params', params);
            $box.data('nodata', params.data.count === 0);
            $box.data('isloading', false);

            if (localStorage.getItem(LOCAL_KEY_LOADTYPE) === '1') {
                // paginated mode
                $box.html(html);

                const goPage = (old, page) => {
                    const qpn = (page - 1) * old.data.value.pagesize;
                    if (old.query.pn === qpn) return;
                    old.query.pn = qpn;
                    query(old.query, renderList);
                };

                $('.page-bottom .paging span[data-p]', $box).on('click', function () {
                    const old = $(this).parents(`.${params.query.type}`).data('params');
                    goPage(old, $(this).data('p'));
                });

                $('.page-bottom .paging .pg-jump input', $box).on('click', () => false);
                $('.page-bottom .paging .pg-jump', $box).on('click', function () {
                    const old = $(this).parents(`.${params.query.type}`).data('params');
                    goPage(old, $('input', this).val());
                });

                $box.parent().scrollTop(0);
            } else {
                // infinite-scroll mode
                $('.page-bottom', $box).remove();
                if (params.query.pn === 0) {
                    $box.html(html);
                } else {
                    const $newItems = $(html).find('.l-s-item');
                    $('.items-grid', $box).append($newItems);
                }
            }

            $('.l-s-item .wear', $box).on('click', function () {
                const $item = $(this).parents('.l-s-item:eq(0)');
                flyTo($('img', $item), `.l-selfy .selfy-li.${$item.data('category')} img`, {
                    img: $('img', $item).attr('src'),
                });
                window.set_clothes($item.data('category'), $item.data('id'));

                const $left = $('.l-selfy .l-selfy-panel');
                $left.addClass('hover');
                setTimeout(() => $left.removeClass('hover'), 500);
            });

            $('.l-s-item .favorites', $box).on('click', function () {
                const $btn = $(this);
                const $ico = $('i', $btn);
                const $item = $btn.parents('.l-s-item:eq(0)');
                const isFav = !!$item.data('favorites');

                $('.selfy_items .l-s > .favorites').data('onequery', false);

                $.get(
                    `${window.serverurl}/favorites`,
                    { action: isFav ? 'del' : 'add', id: $item.data('id') },
                    () => {
                        if (!isFav) {
                            flyTo($('img', $item), '.l-bar li[data-panel=favorites]', {
                                img: $('img', $item).attr('src'),
                            });
                        }
                        $item.data('favorites', !isFav);
                        $btn.toggleClass('is-active', !isFav);
                        $ico.attr(
                            'class',
                            isFav ? 'iconfont icon-Collection' : 'iconfont icon-shoucang',
                        );
                    },
                    'json',
                );
            });
        };

        $('.selfy_items .l-s').on('scroll', function () {
            if (localStorage.getItem(LOCAL_KEY_LOADTYPE) !== '2') return;

            const $this = $(this);
            const $panel = $('.selfy_items .l-s .active.panel_toggle_p');

            if ($panel.data('nodata') || $panel.data('isloading')) return;

            const q = $panel.data('params').query;
            const bottom = $this.scrollTop() + $this.height();
            const h = $panel.height() - 30;
            q.pn = $('.l-s-item:not(.not)', $panel).length;

            if (bottom > h) {
                $panel.data('isloading', true);
                query(q, renderList);
            }
        });

        $('.e_seach_form')
            .on('submit', function (e) {
                e.preventDefault();
                $moreBox.stop().slideUp(100);

                const qs = lib.qs.parse($(this).serialize());
                const $active = $('.panel_toggle_p.active[data-type]');
                qs.type = $active.data('type');
                $active.parent().scrollTop(0);
                query(qs, renderList);
            })
            .trigger('submit');

        $win.trigger('resize');
    })();

    (function initLayout() {
        const $rpanel = $('.r-panel');
        const $search = $('.s-seach', $rpanel);
        const $ls = $('.selfy_items .l-s', $rpanel);

        $win.on('resize', () => {
            $ls.height($rpanel.height() - $search.height());
        });
    })();

    (function initFileIO() {
        const FILE_FILTER = [{ name: 'em selfy', extensions: ['emselfy'] }];

        $('.file .e_img_export').on('click', () => {
            window.__TAURI__.dialog.save({ filters: FILE_FILTER }).then((path) => {
                if (!path) return;
                return appIpc.invoke('write_text_file', {
                    path,
                    contents: window.selfy_query,
                });
            });
        });

        $('.file .e_img_import').on('click', () => {
            window.__TAURI__.dialog.open({ multiple: false, filters: FILE_FILTER }).then((path) => {
                if (!path) return;
                return appIpc.invoke('read_text_file', { path }).then((data) => {
                    window.set_clothes_url(data);
                });
            });
        });

        $('.file .e_url_import').on('click', () => {
            $('.url_dialog .content').text('请输入DreamSelfy或EmSelfy 的URL!');
            $('.dig_btn_urlimport').show();
            $('.dig_btn_urlclose').hide();
            $('.url_dialog').show();
        });

        $('.file .e_url_export').on('click', () => {
            $('.url_dialog .content').text('请复制文本框内的文本,记录在记事本或其他程序中!');
            $('.url_dialog input').val(window.selfy_query);
            $('.dig_btn_urlimport').hide();
            $('.dig_btn_urlclose').show();
            $('.url_dialog').show();
        });

        $('.file .e_to_selfyme').on('click', () => {
            utils.openURL(
                `http://www.dreamself.me/clothes.php?action=change&${window.selfy_query}`,
            );
        });

        $('.file .e_to_atgame').on('click', () => {
            utils.openURL(
                `http://img.atgames.jp/selfy_motion.swf?${window.selfy_query}&_from=emselfy&_ver=1.0`,
            );
        });

        $('.dig_btn_urlimport').on('click', () => {
            window.set_clothes_url($('.url_dialog input').val());
            $('.url_dialog').hide();
        });

        $('.dig_btn_urlclose').on('click', () => {
            $('.url_dialog').hide();
        });
    })();

    (function initConfig() {
        $('.c_load_type')
            .val(localStorage.getItem(LOCAL_KEY_LOADTYPE))
            .selectmenu({
                change() {
                    localStorage.setItem(LOCAL_KEY_LOADTYPE, $(this).val());
                    $('.selfy_items .l-s > .panel_toggle_p').data('onequery', false);
                },
            });

        $('.c_language_sort').sortable({
            axis: 'y',
            stop() {
                const types = [];
                $('.c_language_sort li').each(function () {
                    types.push($(this).data('type'));
                });
                localStorage.setItem(LOCAL_KEY_LANGSORT, JSON.stringify(types));
                $('.selfy_items .l-s > .panel_toggle_p').data('onequery', false);
            },
        });
    })();
});

window.flashLoad = function (arg) {
    console.log('[flashLoad]', arg);
};
