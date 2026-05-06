(function () {
  var MQ = '(max-width: 767px)';

  function mobileMatches() {
    return window.matchMedia(MQ).matches;
  }

  function syncHtmlClass() {
    document.documentElement.classList.toggle('is-mobile', mobileMatches());
  }

  function closeDrawer() {
    document.body.classList.remove('drawer-open');
    var btn = document.querySelector('.mobile-menu-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function teardown() {
    document.documentElement.classList.remove('mobile-nav-ready');
    closeDrawer();
    document.querySelectorAll('.mobile-menu-btn').forEach(function (el) {
      el.remove();
    });
    var d = document.getElementById('mobile-drawer');
    if (d) d.remove();
  }

  function build() {
    if (!mobileMatches()) {
      teardown();
      return;
    }

    var header = document.querySelector('.site-header');
    var sidebar = document.querySelector('.sidebar');
    if (!header || !sidebar) return;

    document.documentElement.classList.add('mobile-nav-ready');

    if (!document.querySelector('.mobile-menu-btn')) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mobile-menu-btn';
      btn.setAttribute('aria-label', 'メニューを開く');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<span class="mobile-menu-icon" aria-hidden="true"></span>';
      header.appendChild(btn);
      btn.addEventListener('click', function () {
        var open = !document.body.classList.contains('drawer-open');
        document.body.classList.toggle('drawer-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    if (!document.getElementById('mobile-drawer')) {
      var drawer = document.createElement('div');
      drawer.id = 'mobile-drawer';
      drawer.innerHTML =
        '<div class="mobile-drawer-backdrop"></div>' +
        '<div class="mobile-drawer-panel">' +
        '<button type="button" class="mobile-drawer-close" aria-label="メニューを閉じる">&times;</button>' +
        '<div class="mobile-drawer-inner"></div>' +
        '</div>';
      document.body.appendChild(drawer);

      var inner = drawer.querySelector('.mobile-drawer-inner');
      inner.appendChild(sidebar.cloneNode(true));

      drawer.querySelector('.mobile-drawer-backdrop').addEventListener('click', closeDrawer);
      drawer.querySelector('.mobile-drawer-close').addEventListener('click', closeDrawer);
      inner.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', closeDrawer);
      });
    }
  }

  function onKey(e) {
    if (e.key === 'Escape') closeDrawer();
  }

  function init() {
    syncHtmlClass();
    build();
  }

  window.addEventListener('resize', init);
  document.addEventListener('keydown', onKey);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
