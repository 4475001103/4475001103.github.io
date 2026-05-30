/*globals window, document, RSVP, rJS, XMLHttpRequest, domsugar, Date, console */
/*jslint indent: 2, maxlen: 180 regexp: true*/
(function (window, document, RSVP, rJS, XMLHttpRequest, domsugar, Date) {
  "use strict";

  var NAV_ITEM_LIST = ".navigation ul",
    NAVIGATION = ".navigation",
    HAMBURGER = ".hamburger-menu",
    OPEN = "open",
    CLOSE = "close",
    SCM_ITEM_LIST = ".scm-menu ul",
    LANG_URL = {
      "en": "en/languages.html",
      "fr": "langues.html",
      "de": "de/sprachen.html"
    },
    LANG_TERM = {
        "en": "Languages",
        "fr": "Langues",
        "de": "Sprachen"
    };

  function promiseEventListener(target, type, useCapture) {
    //////////////////////////
    // Resolve the promise as soon as the event is triggered
    // eventListener is removed when promise is cancelled/resolved/rejected
    //////////////////////////
    var handle_event_callback;

    function canceller() {
      target.removeEventListener(type, handle_event_callback, useCapture);
    }

    function resolver(resolve) {
      handle_event_callback = function (evt) {
        canceller();
        evt.stopPropagation();
        evt.preventDefault();
        resolve(evt);
        return false;
      };

      target.addEventListener(type, handle_event_callback, useCapture);
    }
    return new RSVP.Promise(resolver, canceller);
  }

  function jio_ajax(param) {
    var xhr = new XMLHttpRequest();
    return new RSVP.Promise(function (resolve, reject) {
      var k;
      xhr.open(param.type || "GET", param.url, true);
      xhr.responseType = param.dataType || "";
      if (typeof param.headers === 'object' && param.headers !== null) {
        for (k in param.headers) {
          if (param.headers.hasOwnProperty(k)) {
            xhr.setRequestHeader(k, param.headers[k]);
          }
        }
      }
      xhr.addEventListener("load", function (e) {
        if (e.target.status >= 400) {
          return reject(e);
        }
        resolve(e);
      });
      xhr.addEventListener("error", reject);
      if (typeof param.xhrFields === 'object' && param.xhrFields !== null) {
        for (k in param.xhrFields) {
          if (param.xhrFields.hasOwnProperty(k)) {
            xhr[k] = param.xhrFields[k];
          }
        }
      }
      if (param.timeout !== undefined && param.timeout !== 0) {
        xhr.timeout = param.timeout;
        xhr.ontimeout = function () {
          return reject(xhr);
        };
      }
      if (typeof param.beforeSend === 'function') {
        param.beforeSend(xhr);
      }
      xhr.send(param.data);
    }, function () {
      xhr.abort();
    });
  }

  function renderSocialMediaList(social_media_list, container) {
    var child_list = [],
      item,
      i;
    for (i = 0; i < social_media_list.length; i += 1) {
      item = social_media_list[i];
      child_list.push(
        domsugar('li', [
          domsugar('a', {
            "href": item.href,
            "role": 'button',
            "aria-label": item.title,
            "title": item.title,
            "target": '_blank',
            "rel": "noopener noreferrer"
          }, [
            domsugar('i', {
              "class": item.icon_class_string
            })
          ])
        ])
      );
    }
    domsugar(container, child_list);    
  }

  function renderSitemap(sitemap, nav_menu, language) {
    var child_list =  [],
      i;

    for (i = 0; i < sitemap.child_list.length; i += 1) {
      child_list.push(
        domsugar('li', [
          domsugar('a', {
            text: sitemap.child_list[i].text,
            href: sitemap.child_list[i].href
          })
        ])
      );
    }

    domsugar(nav_menu, [
      child_list,
      domsugar("li", {'class': 'scm-dropdown', 'html': SOCIAL_DROPDOWN_HTML}),
      domsugar("li", [
        domsugar("a", {
          'href': "/" + LANG_URL[language],
          'class': "lang-wrapper"
        }, [
          domsugar('i', {
            'class': "sven-lang sven-lang-" + language
          }),
          domsugar('span', {
            'class': "navbar-language",
            'text': LANG_TERM[language]
          })
        ])
      ])
    ]);
  }

  // ---------------------- Header social dropdown ---------------------------
  // The header has a dropdown that lists all the social buttons. Its button is
  // the old Twitter bird; clicking it "kills" the bird (it falls away and the X
  // is revealed) and quietly turns every other Twitter button on the page into
  // the X — no animation — before the visitor scrolls down to notice.

  // The old Twitter bird, drawn inline because the site's icon font only has the
  // X logo, not the bird.
  var BIRD_SVG = '<svg class="scm-bird-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.39.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"/></svg>';

  // The dropdown's own markup: the bird/X button (with chevron) and the
  // vertical list of every social button. Built here so it can be slotted into
  // the menu, between the last menu item and the language flag.
  var SOCIAL_DROPDOWN_HTML =
    '<button class="scm-toggle x-egg" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Social media" title="Social media">' +
    '<span class="x-egg__icon">' +
    '<span class="x-egg__face x-egg__x"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></span>' +
    '<span class="x-egg__face x-egg__bird"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.39.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"/></svg></span>' +
    '</span>' +
    '<span class="scm-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></span>' +
    '</button>' +
    '<ul class="scm-dropdown-menu">' +
    '<li><a role="button" aria-label="Follow me on YouTube" title="Follow me on YouTube" href="https://www.youtube.com/@SvenFranckVolt" target="_blank" rel="noopener noreferrer"><i class="fab fa-youtube"></i></a></li>' +
    '<li><a role="button" aria-label="Follow me on LinkedIn" title="Follow me on LinkedIn" href="https://www.linkedin.com/in/sven-franck-94219023/" target="_blank" rel="noopener noreferrer"><i class="fab fa-linkedin"></i></a></li>' +
    '<li><a role="button" aria-label="Follow me on Facebook" title="Follow me on Facebook" href="https://www.facebook.com/sven.franck" target="_blank" rel="noopener noreferrer"><i class="fab fa-facebook"></i></a></li>' +
    '<li><a role="button" aria-label="Follow me on Instagram" title="Follow me on Instagram" href="https://www.instagram.com/sven.franck.volt/" target="_blank" rel="noopener noreferrer"><i class="fab fa-instagram"></i></a></li>' +
    '<li><a role="button" aria-label="Follow me on Bluesky" title="Follow me on Bluesky" href="https://bsky.app/profile/svenfranck.bsky.social" target="_blank" rel="noopener noreferrer"><i class="fab fa-bluesky"></i></a></li>' +
    '<li><a role="button" aria-label="Follow me on Mastodon" title="Follow me on Mastodon" href="https://mastodon.world/@svenfranckvolt" target="_blank" rel="noopener noreferrer"><i class="fab fa-mastodon"></i></a></li>' +
    '<li><a role="button" aria-label="Follow me on Threads" title="Follow me on Threads" href="https://www.threads.com/@sven.franck.volt" target="_blank" rel="noopener noreferrer"><i class="fab fa-threads"></i></a></li>' +
    '<li><a role="button" aria-label="Follow me on Twitter" title="Follow me on Twitter" href="https://twitter.com/SvenFranck" target="_blank" rel="noopener noreferrer"><i class="fab fa-x-twitter"></i></a></li>' +
    '<li><a role="button" aria-label="Follow me on TikTok" title="Follow me on TikTok" href="https://www.tiktok.com/@svenfranckvolt" target="_blank" rel="noopener noreferrer"><i class="fab fa-tiktok"></i></a></li>' +
    '</ul>';

  // Show every Twitter button on the page either as the old bird or as the X.
  function setTwitterBird(gadget, to_bird) {
    var links = gadget.element.querySelectorAll('a[href*="twitter.com/SvenFranck"]'),
      i;
    for (i = 0; i < links.length; i += 1) {
      links[i].innerHTML = to_bird ? BIRD_SVG : '<i class="fab fa-x-twitter"></i>';
    }
  }

  // Kill the bird on the dropdown button: reveal the X, drop the blue bird and a
  // feather, and quietly switch every other Twitter button to the X.
  function killBird(gadget, toggle) {
    var icon = toggle.querySelector('.x-egg__icon'),
      bird_svg = toggle.querySelector('.x-egg__bird svg'),
      rect = icon ? icon.getBoundingClientRect() : null,
      falling = document.createElement('span'),
      feather = document.createElement('span'),
      sway = document.createElement('span');
    toggle.classList.add('is-dead');
    falling.className = 'x-egg__falling';
    if (bird_svg) {
      falling.innerHTML = bird_svg.outerHTML;
    }
    falling.addEventListener('animationend', function () { falling.remove(); });
    sway.className = 'x-egg__feather-sway';
    sway.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="9" ry="5" fill="currentColor"/></svg>';
    feather.className = 'x-egg__feather';
    feather.appendChild(sway);
    feather.addEventListener('animationend', function () { feather.remove(); });
    if (rect) {
      // Drop the bird and feather from the button's exact spot, fixed to the
      // screen so they fall the whole way down the page without being clipped.
      falling.style.left = rect.left + 'px';
      falling.style.top = rect.top + 'px';
      feather.style.left = (rect.left + 5) + 'px';
      feather.style.top = rect.top + 'px';
    }
    if (icon) {
      icon.appendChild(falling);
      icon.appendChild(feather);
    }
    setTwitterBird(gadget, false);
  }

  // Wire up the dropdown once the header and footer are on the page.
  function setupSocialEasterEgg(gadget) {
    var toggle = gadget.element.querySelector('.scm-toggle'),
      dropdown = gadget.element.querySelector('.scm-dropdown');
    if (!toggle || !dropdown || toggle.getAttribute('data-egg-wired')) {
      return;
    }
    toggle.setAttribute('data-egg-wired', '1');
    // Start every Twitter button as the old bird, so there's a bird to kill.
    setTwitterBird(gadget, true);

    toggle.addEventListener('click', function (evt) {
      var is_open;
      evt.preventDefault();
      evt.stopPropagation();
      if (!toggle.classList.contains('is-dead')) {
        killBird(gadget, toggle);
      }
      is_open = dropdown.classList.toggle('open');
      toggle.setAttribute('aria-expanded', is_open ? 'true' : 'false');
    });

    // A click anywhere else closes the menu.
    document.addEventListener('click', function (evt) {
      if (dropdown.classList.contains('open') && !dropdown.contains(evt.target)) {
        dropdown.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  rJS(window)
    .declareMethod("render", function (html_content, parsed_content) {
      var gadget = this,
        state = {
          language_list: JSON.stringify(parsed_content.language_list || []),
          sitemap: JSON.stringify(parsed_content.sitemap || {}),
          page_title: parsed_content.page_title || "",
          portal_status_message: parsed_content.portal_status_message || "",
          html_content: html_content || "",
          footer_html_content: JSON.stringify(parsed_content.footer_html_content || ""),
          social_media_list : JSON.stringify(parsed_content.social_media_list || ""),
          render_count: this.state.render_count + 1,
          base_url: parsed_content.sitemap.href,
          current_language: parsed_content.language
        };
      return gadget.changeState(state);
    })

    .onStateChange(function (modification_dict) {
      var gadget = this,
        language_list,
        document_list,
        child_list,
        i,
        div_list,
        input,
        html_content,
        div,
        container;

      if (modification_dict.hasOwnProperty('page_title')) {
        document.title = gadget.state.page_title;
      }
      if (modification_dict.hasOwnProperty('gadget_style_url')) {
        domsugar(gadget.element.querySelector('p#gadget_style_url'), {
          text: gadget.state.gadget_style_url
        });
      }
      if (modification_dict.hasOwnProperty('render_count')) {
        domsugar(gadget.element.querySelector('p#render_count'), {
          text: 'render count: ' + gadget.state.render_count
        });
      }
      if (modification_dict.hasOwnProperty('language_list')) {
        language_list = JSON.parse(gadget.state.language_list);
        if (language_list.length > 1) {
          child_list = [];
          for (i = 0; i < language_list.length; i += 1) {
            child_list.push(
              domsugar('li', [
                domsugar('a', {
                  href: language_list[i].href
                }, [
                  domsugar('span', {
                    text: language_list[i].text.toUpperCase()
                  })
                ])
              ])
            );
          }
          domsugar(gadget.element.querySelector('.languages'),
                   [domsugar('ul', child_list)]);
        }
      }
      if (modification_dict.hasOwnProperty('sitemap')) {
        renderSitemap(
          JSON.parse(gadget.state.sitemap),
          gadget.element.querySelector(NAV_ITEM_LIST),
          gadget.state.current_language
        );
        // Show the campaign banner text in the visitor's language, with the
        // candidate's name in bold at full size and the rest smaller, so the
        // name stands out.
        var banner_text = {
          fr: "Votez Sven Franck pour la co-présidence",
          en: "Vote Sven Franck for co-president",
          de: "Wählt Sven Franck zum Co-Präsidenten"
        };
        var banner_element = gadget.element.querySelector('header h2');
        if (banner_element) {
          var banner_full = banner_text[gadget.state.current_language] || banner_text.en;
          var banner_parts = banner_full.split("Sven Franck");
          domsugar(banner_element, [
            domsugar('span', {'class': 'banner-lead', text: banner_parts[0]}),
            domsugar('strong', {'class': 'banner-name', text: 'Sven Franck'}),
            domsugar('span', {'class': 'banner-lead', text: banner_parts[1] || ''})
          ]);
        }
      }
      if (modification_dict.hasOwnProperty('social_media_list')) {
        renderSocialMediaList(
          JSON.parse(gadget.state.social_media_list),
          gadget.element.querySelector(SCM_ITEM_LIST)
        );
      }
      if (modification_dict.hasOwnProperty('footer_html_content')) {
        domsugar(gadget.element.querySelector('footer'), [
          domsugar("section", {
            "class": "footer-content",
            "html": JSON.parse(gadget.state.footer_html_content)
          })
        ]);
        setupSocialEasterEgg(gadget);
      }
      if ((modification_dict.hasOwnProperty('form_html_content')) ||
          (modification_dict.hasOwnProperty('html_content'))) {
        if (gadget.state.form_html_content) {
          // In case of form, display it directly
          domsugar(gadget.element.querySelector('main'), [
            domsugar('div', {'class': 'form_container',
                             html: gadget.state.form_html_content
                            }),
            domsugar('div', {'class': 'notify_loading invisible'})
          ]);
           // Manually add require to input
          div_list = gadget.element.querySelector('main .form_container').querySelectorAll('div.required');
          for (i = 0; i < div_list.length; i += 1) {
            input = div_list[i].querySelector('input');
            if (input) {
              input.required = true;
            }
          }
          // Move container to easily manage hidden
          gadget.element.querySelector('main .notify_loading')
            .appendChild(gadget.element.querySelector('main .form_container .loading').parentElement);
        } else {
          // Try to find the Web Page content only
          div = document.createElement('div');
          div.innerHTML = gadget.state.html_content;
          input = div.querySelector('div.input');
          if (input) {
            html_content = input.firstChild;
            domsugar(gadget.element.querySelector('main'), [
              domsugar("section", {
                "class": "sec-layout-highlight",
                "html": html_content.innerHTML
              })
            ]);
          }
          return gadget.renderVideo();
        }
      }
    })
    .declareJob('renderVideo', function () {
      var gadget = this,
        iframe,
        video_placeholder = gadget.element.querySelector('div[data-youtube]'),
        promise_list = [],
        video_placeholder_list,
        i;
      if (video_placeholder && window.self === window.top) {
        domsugar(video_placeholder, [
          domsugar('iframe', {
            'allow': "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
            'src': video_placeholder.getAttribute("data-youtube").replace("youtube.com", "youtube-nocookie.com"),
            'width': "80%",
            'height': "auto",
            'min-height': "315",
            'frameborder': "0",
            'loading': "lazy"
          })
        ]);
        iframe = video_placeholder.querySelector('iframe');
        return promiseEventListener(iframe, "load", "false");
      }

      if (window.self === window.top) {
        video_placeholder_list = gadget.element.querySelectorAll('div[data-peertube]');
        for (i = 0; i < video_placeholder_list.length; i += 1) {
          video_placeholder = video_placeholder_list[i];
          domsugar(video_placeholder, [
            domsugar('iframe', {
              'allow': "picture-in-picture",
              'sandbox': "allow-same-origin allow-scripts allow-popups",
              'src': video_placeholder.getAttribute("data-peertube"),
              'width': "80%",
              'height': "auto",
              'min-height': "315",
              'frameborder': "0",
              'loading': "lazy",
              'allowfullscreen': true
            })
          ]);
          iframe = video_placeholder.querySelector('iframe');
          promise_list.push(promiseEventListener(iframe, "load", "false"));
        }
      }
      return RSVP.all(promise_list);
    })
    .onEvent('click', function (evt) {
      var gadget = this,
        target_element = evt.target.closest(HAMBURGER),
        is_open = gadget.element.querySelector(NAVIGATION).classList.contains(OPEN);
      if (target_element !== null) {
        gadget.element.querySelector(NAVIGATION).classList.toggle(OPEN);
        target_element.classList.toggle(CLOSE);
      } else if (is_open) {
        gadget.element.querySelector(NAVIGATION).classList.toggle(OPEN);
        gadget.element.querySelector(HAMBURGER).classList.toggle(CLOSE);
      }
    }, false, false);



}(window, document, RSVP, rJS, XMLHttpRequest, domsugar, Date));
