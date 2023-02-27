// ==UserScript==
// @author         chewbie88
// @name           Bannergress : Download Badges
// @category       Utils
// @version        1.0.0
// @description    Download Badges visuals.
// @id             bannergress-plugin-download-badges@Chewbie88
// @match          https://bannergress.com/*
// @updateURL      https://github.com/chewbie88/bannergress-plugins/raw/main/bannergress-plugin-download-badges.user.js
// @downloadURL    https://github.com/chewbie88/bannergress-plugins/raw/main/bannergress-plugin-download-badges.user.js
// ==/UserScript==

function wrapper(){
  // ensure plugin framework is there, even if iitc is not yet loaded
  if(typeof window.plugin !== 'function') window.plugin = function(){};

  // PLUGIN START ////////////////////////////////////////////////////////

  // use own namespace for plugin
  window.plugin.downloadBadges = function() {};

  window.plugin.downloadBadges.url = location.href;
  window.plugin.downloadBadges.data = [];
  window.plugin.downloadBadges.debug = false;

  window.plugin.downloadBadges.urlChanged = function() {
    return window.plugin.downloadBadges.url !== location.href;
  };

  window.plugin.downloadBadges.setCurrentUrl = function() {
    window.plugin.downloadBadges.url = location.href;
  };

  window.plugin.downloadBadges.isBannerUrl = function() {
    return location.href.indexOf('/banner/') != -1;
  };

  window.plugin.downloadBadges.getBannerId = function() {
    return location.href.split('/').at(-1);
  };

  window.plugin.downloadBadges.loadBannerInfos = function() {
    $.getJSON('https://api.bannergress.com/bnrs/' + window.plugin.downloadBadges.getBannerId(), function(data) {
      window.plugin.downloadBadges.data.title = data.title;
      window.plugin.downloadBadges.data.urls = [];

      window.plugin.downloadBadges.data.urls.push('https://api.bannergress.com' + data.picture);
      $.each(data. missions, function(key, item) {
        window.plugin.downloadBadges.data.urls.push(item.picture);
      });
    });
  };

  window.plugin.downloadBadges.init = function() {
    if(window.plugin.downloadBadges.isBannerUrl()){
      window.plugin.downloadBadges.loadBannerInfos();

      window.plugin.downloadBadges.onElementLoaded("div.banner-card")
      .then(()=>window.plugin.downloadBadges.initZip())
      .catch((e)=>{
        console.log(e);
      });
    }
  };

  window.plugin.downloadBadges.initZip = function() {

    var zip = new JSZip();

    var banner_name = window.plugin.downloadBadges.data.title;
    function request(url, index) {
      return new Promise(function(resolve) {
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.open("GET", url);
        xhr.onload = function() {
          var filename;
          if (index == 0) {
            filename = banner_name + '_preview';
          } else {
            filename = 'badges/' + banner_name + '_' + index;
          }
          zip.file(filename + '.jpg', this.response);
          resolve()
        }
        xhr.send()
      })
    }

    Promise.all(window.plugin.downloadBadges.data.urls.map(function(url, index) {
      return request(url, index)
    }))
    .then(function() {
      zip.generateAsync({
          type: "blob"
        })
        .then((content) => window.plugin.downloadBadges.addButton(content, banner_name));
    });
  };

  window.plugin.downloadBadges.addButton = function(content, banner_name) {
    var a = $('<a class="download-banner ant-btn bg-button bg-button-default">Download Badges</a>');

    var location = URL.createObjectURL(content);
    a.prop('download', banner_name);
    a.prop('href', location);
    a.html('Click to Download ' + banner_name);

    $('.banner-card').after(a);
  };

  /**
   *
   * Wait for an HTML element to be loaded like `div`, `span`, `img`, etc.
   * ex: `onElementLoaded("div.some_class").then(()=>{}).catch(()=>{})`
   * @param {*} elementToObserve wait for this element to load
   * @param {*} parentStaticElement (optional) if parent element is not passed then `document` is used
   * @return {*} Promise - return promise when `elementToObserve` is loaded
   */
  window.plugin.downloadBadges.onElementLoaded = function(elementToObserve, parentStaticElement) {
    const promise = new Promise((resolve, reject) => {
      try {
        if (document.querySelector(elementToObserve)) {
          console.log(`element already present: ${elementToObserve}`);
          resolve(true);
          return;
        }
        const parentElement = parentStaticElement
          ? document.querySelector(parentStaticElement)
          : document;

        const observer = new MutationObserver((mutationList, obsrvr) => {
          const divToCheck = document.querySelector(elementToObserve);

          if (divToCheck) {
            obsrvr.disconnect(); // stop observing
            resolve(true);
          }
        });

        // start observing for dynamic div
        observer.observe(parentElement, {
          childList: true,
          subtree: true,
        });
      } catch (e) {
        console.log(e);
        reject(Error("some issue... promise rejected"));
      }
    });
    return promise;
  }

  document.body.addEventListener('click', ()=>{
      requestAnimationFrame(()=>{
        if(window.plugin.downloadBadges.urlChanged()){
          window.plugin.downloadBadges.setCurrentUrl();
          window.plugin.downloadBadges.init();
        }
      });
  }, true);

  window.addEventListener('load', ()=>{
    window.plugin.downloadBadges.init();
  }, false);

  // PLUGIN END //////////////////////////////////////////////////////////
}; // wrapper end

// inject code into site context
var script_jquery = document.createElement('script');
script_jquery.type = 'text/javascript';
script_jquery.src = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js';
(document.body || document.head || document.documentElement).appendChild(script_jquery);

var script_zip = document.createElement('script');
script_zip.type = 'text/javascript';
script_zip.src = 'https://stuk.github.io/jszip/dist/jszip.js';
(document.body || document.head || document.documentElement).appendChild(script_zip);

// plugin lib
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
