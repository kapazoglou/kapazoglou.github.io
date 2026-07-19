function loadSearch(){
    // Create a new Index
    idx = lunr(function(){
        this.field('id')
        this.field('title', { boost: 10 })
        this.field('summary')
    })
 
    // Send a request to get the content json file
    $.getJSON('/content.json', function(data){
 
        // Put the data into the window global so it can be used later
        window.searchData = data
 
        // Loop through each entry and add it to the index
        $.each(data, function(index, entry){
            idx.add($.extend({"id": index}, entry))
        })
    })
 
    // When search is pressed on the menu toggle the search box
    $('#search').on('click', function(){
        $('.searchForm').toggleClass('show')
    })
 
    // When the search form is submitted
    $('#searchForm').on('submit', function(e){
        // Stop the default action
        e.preventDefault()
 
        // Find the results from lunr
        results = idx.search($('#searchField').val())
 
        // Empty #content and put a list in for the results
        $('#content').html('<h1>Search Results (' + results.length + ')</h1>')
        $('#content').append('<ul id="searchResults"></ul>')
 
        // Loop through results
        $.each(results, function(index, result){
            // Get the entry from the window global
            entry = window.searchData[result.ref]
 
            // Append the entry to the list.
            $('#searchResults').append('<li><a href="' + entry.url + '">' + entry.title + '</li>')
        })
    })
}

;(function () {
  function updatePageFadeFrom() {
    var canvas = document.querySelector('.page-canvas')
    var marker = document.querySelector('.page-bg-fade-start')
    if (!canvas || !marker) {
      if (canvas) canvas.style.removeProperty('--page-fade-from')
      return
    }
    var canvasRect = canvas.getBoundingClientRect()
    var markerRect = marker.getBoundingClientRect()
    var vhThird = window.innerHeight / 3
    var fromTop = markerRect.bottom - vhThird - canvasRect.top
    if (fromTop < 0) fromTop = 0
    canvas.style.setProperty('--page-fade-from', fromTop + 'px')
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updatePageFadeFrom)
  } else {
    updatePageFadeFrom()
  }
  window.addEventListener('resize', updatePageFadeFrom)
})()

/* Hide fixed navbar once the top of the primary slab reaches the viewport top (see threshold in theme.js). */
;(function () {
  var nav = document.querySelector('body > nav.navbar')
  if (!nav) return

  var ticking = false

  /**
   * Viewport Y of the slab’s top edge: hide header when this is <= 0 (slab top hits top of viewport).
   * Home (top intro): .home-hero-intro in the shell (gray slab, not the portrait bleed).
   * Home (mid blurb): .home-hero-intro--mid. Posts/pages: .post-page-heading.
   */
  function slabTopPx() {
    var shell = document.querySelector('.home-hero-intro-shell')
    if (shell) {
      var slab = shell.querySelector('.home-hero-intro')
      if (slab) return slab.getBoundingClientRect().top
    }

    var midBlurb = document.querySelector('.home-hero-intro--mid')
    if (midBlurb) return midBlurb.getBoundingClientRect().top

    var postHeading = document.querySelector('.post-page-heading')
    if (postHeading) return postHeading.getBoundingClientRect().top

    return null
  }

  function update() {
    ticking = false
    if (document.documentElement.classList.contains('post-nav-projects-sheet-lock')) return

    var y = slabTopPx()
    if (y == null) {
      document.body.classList.remove('navbar-auto-hidden')
      return
    }
    document.body.classList.toggle('navbar-auto-hidden', y <= 0)
  }

  function onScroll() {
    if (!ticking) {
      ticking = true
      window.requestAnimationFrame(update)
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', update)
  update()
})()

/* Footer back-to-top: smooth scroll + chromatic aberration for this scroll only (runs before rainbow click capture) */
;(function () {
  var canvas = document.querySelector('.page-canvas')
  if (!canvas) return

  document.addEventListener(
    'click',
    function (e) {
      if (e.button !== 0) return
      var bt = e.target.closest && e.target.closest('.footer-back-top-btn')
      if (!bt) bt = e.target.closest && e.target.closest('.categories-back-top-btn')
      if (!bt) return
      var href = (bt.getAttribute('href') || '').trim()
      if (href !== '#top' && href !== '#') return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      e.preventDefault()
      e.stopImmediatePropagation()

      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      function stripHashFromUrl() {
        try {
          history.replaceState(null, '', window.location.pathname + window.location.search)
        } catch (err) {}
      }

      if (reduced) {
        window.scrollTo(0, 0)
        stripHashFromUrl()
        return
      }

      var start = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0
      if (start <= 1) {
        stripHashFromUrl()
        return
      }

      var duration = Math.min(1400, Math.max(520, start * 0.42))
      var startTime = null
      var cls = 'page-canvas--back-top-scroll'

      canvas.classList.add(cls)
      canvas.style.setProperty('--scroll-ca-dir', '-1')

      function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3)
      }

      function cleanup() {
        canvas.classList.remove(cls)
        canvas.style.removeProperty('--scroll-ca')
        canvas.style.removeProperty('--scroll-ca-dir')
        window.scrollTo(0, 0)
        stripHashFromUrl()
      }

      function step(now) {
        if (startTime === null) startTime = now
        var elapsed = now - startTime
        var t = Math.min(1, elapsed / duration)
        var eased = easeOutCubic(t)
        var y = start * (1 - eased)
        window.scrollTo(0, y)
        canvas.style.setProperty('--scroll-ca', Math.sin(Math.PI * eased).toFixed(4))
        if (t < 1) {
          window.requestAnimationFrame(step)
        } else {
          cleanup()
        }
      }

      window.requestAnimationFrame(step)
    },
    true
  )
})()

;(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  var CONFETTI_COLORS = [
    'hsl(185 85% 55%)',
    'hsl(55 90% 55%)',
    'hsl(28 95% 60%)',
    'hsl(330 85% 60%)',
    'hsl(270 80% 58%)'
  ]

  function removeEl(el) {
    if (el.parentNode) el.parentNode.removeChild(el)
  }

  function spawnConfetti(clientX, clientY) {
    var n = 34
    for (var i = 0; i < n; i++) {
      var piece = document.createElement('span')
      piece.className = 'click-confetti-piece'
      piece.setAttribute('aria-hidden', 'true')
      var angle = (Math.PI * 2 * (i + Math.random())) / n
      var speed = 85 + Math.random() * 140
      var dx = Math.cos(angle) * speed
      var dy = Math.sin(angle) * speed + 50 + Math.random() * 55
      piece.style.left = clientX + 'px'
      piece.style.top = clientY + 'px'
      piece.style.setProperty('--dx', dx.toFixed(1) + 'px')
      piece.style.setProperty('--dy', dy.toFixed(1) + 'px')
      piece.style.setProperty(
        '--spin',
        Math.round(260 + Math.random() * 500) * (Math.random() > 0.5 ? 1 : -1) + 'deg'
      )
      piece.style.setProperty('--w', (3 + Math.random() * 2.5).toFixed(1) + 'px')
      piece.style.setProperty('--h', (3.5 + Math.random() * 5).toFixed(1) + 'px')
      piece.style.setProperty(
        '--c',
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
      )
      piece.style.animationDelay = (Math.random() * 0.05).toFixed(3) + 's'
      document.body.appendChild(piece)
      ;(function (el) {
        var done = function () {
          el.removeEventListener('animationend', done)
          removeEl(el)
        }
        el.addEventListener('animationend', done)
        window.setTimeout(done, 950)
      })(piece)
    }
  }

  function spawnRainbowDisc(clientX, clientY) {
    var el = document.createElement('span')
    el.className = 'click-rainbow-burst'
    el.setAttribute('aria-hidden', 'true')
    el.style.left = clientX + 'px'
    el.style.top = clientY + 'px'
    document.body.appendChild(el)
    var done = function () {
      el.removeEventListener('animationend', done)
      removeEl(el)
    }
    el.addEventListener('animationend', done)
    window.setTimeout(done, 900)
  }

  function spawnRainbowBurst(clientX, clientY) {
    spawnRainbowDisc(clientX, clientY)
    spawnConfetti(clientX, clientY)
  }

  /** ~1/3 of activations skip FX after the first on each page load */
  var ANIMATION_SKIP_CHANCE = 1 / 3
  var firstInteractionOnPage = true
  var lastPrimaryPointerDown = 0
  var pointerSkippedFx = false

  var EFFECT_MS = 200
  var FX_SCROLL_DELTA_PX = 3
  var FX_CANCEL_DY_PX = 10
  var FX_CANCEL_DIST_PX = 20
  var FX_CANCEL_DIST_SQ = FX_CANCEL_DIST_PX * FX_CANCEL_DIST_PX
  var effectLock = false
  var replaying = false
  var ignoreClicksUntil = 0
  var holdIntervalId = null
  var sessionX = 0
  var sessionY = 0
  var sessionTarget = null
  var sessionMeta = false
  var sessionCtrl = false
  var activeFxPointerId = null
  var fxDownX = 0
  var fxDownY = 0
  var fxDownScrollY = 0
  var fxScrollListenerAttached = false
  var fxCancelledByScroll = false

  function shouldCancelFxForScrollOrDrag(clientX, clientY) {
    if (Math.abs(window.scrollY - fxDownScrollY) >= FX_SCROLL_DELTA_PX) return true
    var dx = clientX - fxDownX
    var dy = clientY - fxDownY
    if (Math.abs(dy) >= FX_CANCEL_DY_PX) return true
    if (dx * dx + dy * dy >= FX_CANCEL_DIST_SQ) return true
    return false
  }

  function onFxScrollDuringSession() {
    if (activeFxPointerId === null || fxCancelledByScroll) return
    if (Math.abs(window.scrollY - fxDownScrollY) >= FX_SCROLL_DELTA_PX) {
      cancelFxForScrollOrDrag()
    }
  }

  function attachFxScrollListener() {
    if (fxScrollListenerAttached) return
    window.addEventListener('scroll', onFxScrollDuringSession, { capture: true, passive: true })
    fxScrollListenerAttached = true
  }

  function detachFxScrollListener() {
    if (!fxScrollListenerAttached) return
    window.removeEventListener('scroll', onFxScrollDuringSession, { capture: true })
    fxScrollListenerAttached = false
  }

  function clearFxParticles() {
    var nodes = document.querySelectorAll('.click-rainbow-burst, .click-confetti-piece')
    for (var i = 0; i < nodes.length; i++) {
      removeEl(nodes[i])
    }
  }

  function cancelFxForScrollOrDrag() {
    fxCancelledByScroll = true
    stopHoldInterval()
    clearFxParticles()
    effectLock = false
    sessionTarget = null
    ignoreClicksUntil = Date.now() + 350
    detachFxScrollListener()
  }

  /** Bootstrap collapse toggles on Deep Dive + Categories — open panel immediately; FX runs in parallel */
  function isCollapseAccordionToggle(el) {
    if (!el || typeof el.closest !== 'function') return false
    var toggle = el.closest('[data-toggle="collapse"]')
    if (!toggle) return false
    return !!(
      toggle.closest('.categories-page-accordion') ||
      toggle.closest('.curated-product-accordion')
    )
  }

  function findClickTarget(el) {
    if (!el) return null
    if (el.nodeType !== 1) el = el.parentElement
    if (!el || typeof el.closest !== 'function') return null
    var a = el.closest('a[href]')
    if (a) return a
    var btn = el.closest('button:not([disabled])')
    if (btn) return btn
    var inp = el.closest('input, select, textarea')
    if (inp && !inp.disabled) return inp
    var lb = el.closest('label')
    if (lb) return lb
    return el.closest('[role="button"]')
  }

  function replayDeferred(el, meta, ctrl) {
    if (!el) return
    replaying = true
    try {
      var tag = el.tagName
      if (tag === 'A') {
        var href = el.getAttribute('href')
        if (!href) return
        if (meta || ctrl) {
          window.open(el.href, '_blank', 'noopener,noreferrer')
          return
        }
        if (el.target && el.target.toLowerCase() === '_blank') {
          window.open(el.href, el.target, 'noopener,noreferrer')
          return
        }
        window.location.assign(el.href)
        return
      }
      if (typeof el.click === 'function') el.click()
    } finally {
      replaying = false
    }
  }

  function stopHoldInterval() {
    if (holdIntervalId !== null) {
      clearInterval(holdIntervalId)
      holdIntervalId = null
    }
  }

  function finishPointerSession() {
    stopHoldInterval()
    ignoreClicksUntil = Date.now() + 350
    window.setTimeout(function () {
      effectLock = false
      replayDeferred(sessionTarget, sessionMeta, sessionCtrl)
      sessionTarget = null
    }, EFFECT_MS)
  }

  document.addEventListener(
    'pointerdown',
    function (e) {
      if (replaying) return
      if (e.button !== 0) return
      if (e.target.closest && e.target.closest('.footer-back-top-btn')) return
      if (e.target.closest && e.target.closest('.categories-back-top-btn')) return
      if (e.target.closest && e.target.closest('nav.navbar .nav-link[href]')) return
      if (e.target.closest && e.target.closest('nav.navbar .navbar-brand[href]')) return
      if (isCollapseAccordionToggle(e.target)) {
        lastPrimaryPointerDown = Date.now()
        var skipAccordionFx = !firstInteractionOnPage && Math.random() < ANIMATION_SKIP_CHANCE
        firstInteractionOnPage = false
        if (!skipAccordionFx) spawnRainbowBurst(e.clientX, e.clientY)
        return
      }
      lastPrimaryPointerDown = Date.now()
      var skipFxRoll = !firstInteractionOnPage && Math.random() < ANIMATION_SKIP_CHANCE
      if (skipFxRoll) {
        pointerSkippedFx = true
        return
      }
      firstInteractionOnPage = false
      pointerSkippedFx = false
      if (effectLock) {
        e.preventDefault()
        e.stopImmediatePropagation()
        return
      }
      ignoreClicksUntil = 0
      activeFxPointerId = e.pointerId
      fxDownX = e.clientX
      fxDownY = e.clientY
      fxDownScrollY = window.scrollY
      fxCancelledByScroll = false
      attachFxScrollListener()
      sessionX = e.clientX
      sessionY = e.clientY
      sessionTarget = findClickTarget(e.target)
      sessionMeta = e.metaKey
      sessionCtrl = e.ctrlKey
      effectLock = true
      spawnRainbowBurst(sessionX, sessionY)
      holdIntervalId = window.setInterval(function () {
        spawnRainbowDisc(sessionX, sessionY)
        spawnConfetti(sessionX, sessionY)
      }, 260)
    },
    true
  )

  document.addEventListener(
    'pointermove',
    function (e) {
      if (activeFxPointerId === null || e.pointerId !== activeFxPointerId) return
      if (fxCancelledByScroll) return
      if (shouldCancelFxForScrollOrDrag(e.clientX, e.clientY)) {
        cancelFxForScrollOrDrag()
      }
    },
    { capture: true, passive: true }
  )

  function onPointerEnd(e) {
    if (e.button !== 0) return
    if (activeFxPointerId === null) return
    if (e.pointerId !== activeFxPointerId) return
    activeFxPointerId = null
    detachFxScrollListener()
    if (fxCancelledByScroll) {
      fxCancelledByScroll = false
      return
    }
    if (holdIntervalId === null) return
    if (shouldCancelFxForScrollOrDrag(e.clientX, e.clientY)) {
      cancelFxForScrollOrDrag()
      fxCancelledByScroll = false
      return
    }
    e.preventDefault()
    e.stopImmediatePropagation()
    finishPointerSession()
  }

  document.addEventListener('pointerup', onPointerEnd, true)
  document.addEventListener('pointercancel', onPointerEnd, true)

  document.addEventListener(
    'click',
    function (e) {
      if (replaying) return
      if (e.button !== 0) return
      if (e.target.closest && e.target.closest('nav.navbar .nav-link[href]')) return
      if (e.target.closest && e.target.closest('nav.navbar .navbar-brand[href]')) return
      if (isCollapseAccordionToggle(e.target)) return

      var fromPointer = Date.now() - lastPrimaryPointerDown < 750
      if (fromPointer && pointerSkippedFx) {
        pointerSkippedFx = false
        return
      }
      if (!fromPointer) pointerSkippedFx = false
      if (!fromPointer && !firstInteractionOnPage && Math.random() < ANIMATION_SKIP_CHANCE) return

      if (Date.now() < ignoreClicksUntil) {
        e.preventDefault()
        e.stopImmediatePropagation()
        return
      }
      if (effectLock) {
        e.preventDefault()
        e.stopImmediatePropagation()
        return
      }
      e.preventDefault()
      e.stopImmediatePropagation()
      firstInteractionOnPage = false
      var el = findClickTarget(e.target)
      var meta = e.metaKey
      var ctrl = e.ctrlKey
      effectLock = true
      spawnRainbowBurst(e.clientX, e.clientY)
      window.setTimeout(function () {
        effectLock = false
        replayDeferred(el, meta, ctrl)
      }, EFFECT_MS)
    },
    true
  )
})()

/* Curated Product + Categories page: open accordion panel that matches #hash */
;(function () {
  function openAccordionPanelsFromHash() {
    if (!window.jQuery) return
    var hash = window.location.hash
    if (!hash || hash.length < 2) return
    var card = document.querySelector(hash)
    if (
      !card ||
      (!card.classList.contains('curated-product-accordion__item') &&
        !card.classList.contains('categories-page-accordion__item'))
    ) {
      return
    }
    var panel = card.querySelector('.collapse')
    if (!panel) return
    window.jQuery(panel).collapse('show')
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', openAccordionPanelsFromHash)
  } else {
    openAccordionPanelsFromHash()
  }
  window.addEventListener('hashchange', openAccordionPanelsFromHash)
})()

/* Categories + curated product: when a panel opens, scroll so its title tile clears the fixed navbar */
;(function () {
  if (!window.jQuery) return
  window.jQuery(document).on(
    'shown.bs.collapse',
    '.categories-page-accordion .collapse, .curated-product-accordion .collapse',
    function () {
      var card = this.closest && this.closest('.card')
      if (!card) return
      var instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      card.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'start' })
    }
  )
})()

/* Back-to-top: only while footer is in view */
;(function () {
  var footer = document.querySelector('footer.footer')
  var btn = document.querySelector('.footer-back-top-btn')
  if (!footer || !btn) return

  function setShown(show) {
    btn.classList.toggle('footer-back-top-btn--visible', show)
    btn.setAttribute('aria-hidden', show ? 'false' : 'true')
    if (show) btn.removeAttribute('tabindex')
    else btn.setAttribute('tabindex', '-1')
  }

  if (!('IntersectionObserver' in window)) {
    setShown(true)
    return
  }

  var observer = new IntersectionObserver(
    function (entries) {
      setShown(entries.length && entries[0].isIntersecting)
    },
    { threshold: 0, rootMargin: '0px' }
  )
  observer.observe(footer)
})()

/* Small-screen post nav dock: keep it above the footer while footer is visible */
;(function () {
  var dock = document.querySelector('.post-page-heading-band__dock')
  var footer = document.querySelector('footer.footer')
  if (!dock || !footer) return

  var mq = window.matchMedia('(max-width: 575.98px)')
  var gapPx = 8
  var raf = 0

  function compute() {
    raf = 0
    if (!mq.matches) {
      document.documentElement.style.removeProperty('--post-nav-dock-lift')
      return
    }
    var ft = footer.getBoundingClientRect()
    var vh = window.innerHeight
    var visTop = Math.max(0, ft.top)
    var visBottom = Math.min(vh, ft.bottom)
    var visibleFooterH = Math.max(0, visBottom - visTop)
    var lift = visibleFooterH > 0 ? visibleFooterH + gapPx : 0
    document.documentElement.style.setProperty('--post-nav-dock-lift', lift + 'px')
  }

  function schedule() {
    if (raf) return
    raf = window.requestAnimationFrame(compute)
  }

  compute()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  if (typeof mq.addEventListener === 'function') mq.addEventListener('change', compute)
  else if (typeof mq.addListener === 'function') mq.addListener(compute)
})()

/* Posts/pages ≡ menu picker: unblock dock overflow when open + mobile sheet backdrop */
;(function ($) {
  if (!$) return

  function isSmallNav() {
    return window.matchMedia('(max-width: 575.98px)').matches
  }

  /* Bootstrap 4.1 jQuery dropdown has no '.dropdown("hide")' — only toggle/dispose/update. */
  function closeAllBootstrapDropdowns() {
    var Ctor = $.fn.dropdown && $.fn.dropdown.Constructor
    if (Ctor && typeof Ctor._clearMenus === 'function') {
      Ctor._clearMenus()
      return
    }
    $('.post-nav-projects-dropdown.show').each(function () {
      var toggle = $(this).find('[data-toggle="dropdown"]')[0]
      var menu = $(this).find('.dropdown-menu')[0]
      var data = toggle ? $(toggle).data('bs.dropdown') : null
      if (data && data._popper) {
        data._popper.destroy()
        data._popper = null
      }
      if (toggle) toggle.setAttribute('aria-expanded', 'false')
      if (menu) $(menu).removeClass('show')
      $(this).removeClass('show').trigger($.Event('hidden.bs.dropdown', { relatedTarget: toggle }))
    })
  }

  function blurProjectsMenuToggle(toggleEl) {
    window.setTimeout(function () {
      var t = toggleEl || document.querySelector('.post-nav-projects-dropdown > .dropdown-toggle')
      if (t) t.blur()
    }, 0)
  }

  $(document).on('show.bs.dropdown', '.post-nav-projects-dropdown', function () {
    var inner = $(this).closest('.post-page-heading-band__dock-inner')[0]
    if (inner) inner.classList.add('post-nav-dock-overflow-visible')

    var $toggleBtn = $(this).find('[data-toggle="dropdown"]')
    if ($toggleBtn.length) {
      $toggleBtn.attr('aria-label', 'Close project list')
    }

    document.documentElement.classList.add('post-nav-projects-sheet-lock')

    if (document.querySelector('.post-nav-projects-sheet-backdrop')) return

    var backdrop = document.createElement('div')
    backdrop.className = 'post-nav-projects-sheet-backdrop'
    backdrop.setAttribute('aria-hidden', 'true')
    /* Must live inside <main>; .page-canvas > main creates z-index stacking so a backdrop
       sibling after main would paint above all post UI (drops clicks on the sheet). */
    var host = document.querySelector('.page-canvas > main')
    if (!host) host = document.querySelector('.page-canvas')
    if (!host) host = document.body
    host.appendChild(backdrop)

    backdrop.addEventListener('click', function onBackdrop() {
      closeAllBootstrapDropdowns()
      blurProjectsMenuToggle()
    })

    window.requestAnimationFrame(function () {
      backdrop.classList.add('post-nav-projects-sheet-backdrop--visible')
    })
  })

  /* Large viewports: drop focus from the rail toggle so the × chip does not stay “selected”. */
  $(document).on('shown.bs.dropdown', '.post-nav-projects-dropdown', function () {
    if (!isSmallNav()) blurProjectsMenuToggle()
  })

  $(document).on('click', '[data-post-nav-projects-close]', function (e) {
    e.preventDefault()
    closeAllBootstrapDropdowns()
    blurProjectsMenuToggle()
  })

  $(document).on('hidden.bs.dropdown', '.post-nav-projects-dropdown', function () {
    var inner = $(this).closest('.post-page-heading-band__dock-inner')[0]
    if (inner) inner.classList.remove('post-nav-dock-overflow-visible')

    $(this).find('[data-toggle="dropdown"]').attr('aria-label', 'Browse all projects')

    document.documentElement.classList.remove('post-nav-projects-sheet-lock')

    /* Big screens: clicking the × (same control as the toggle) leaves focus on the button — blur so
       it doesn’t stay “selected”. Small screens: keep focus for sheet close + keyboard flow if any. */
    if (!isSmallNav()) {
      blurProjectsMenuToggle($(this).find('[data-toggle="dropdown"]')[0])
    }

    var bk = document.querySelector('.post-nav-projects-sheet-backdrop')
    if (!bk) return
    bk.classList.remove('post-nav-projects-sheet-backdrop--visible')
    window.setTimeout(function () {
      if (bk && bk.parentNode) bk.parentNode.removeChild(bk)
    }, 280)
  })
})(window.jQuery)

/* Home index: filter masonry cards by category (buttons in .home-category-nav) */
;(function () {
  var wrap = document.getElementById('home-masonry')
  if (!wrap) return
  var col = wrap.querySelector('.card-columns')
  if (!col) return
  var nav = document.querySelector('.home-category-nav')
  if (!nav) return
  var buttons = nav.querySelectorAll('.home-masonry-filter-btn')
  var emptyMsg = wrap.querySelector('.home-masonry-empty')
  if (!buttons.length) return

  var FILTERED_OUT_CLASS = 'home-masonry-card--filtered-out'

  function masonryCards() {
    var list = []
    var kids = col.children
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i]
      if (el && el.nodeType === 1 && el.classList.contains('card')) {
        list.push(el)
      }
    }
    return list
  }

  if (!masonryCards().length) return

  function parseCatSlugs(raw) {
    var out = []
    var parts = (raw || '').split(',')
    for (var p = 0; p < parts.length; p++) {
      var s = parts[p].replace(/^\s+|\s+$/g, '')
      if (s) out.push(s)
    }
    return out
  }

  function applyFilter(slug) {
    slug = String(slug == null ? '' : slug).trim()
    var cards = masonryCards()
    var n = 0
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i]
      var raw = card.getAttribute('data-post-categories') || ''
      var cardCats = parseCatSlugs(raw)
      var show = !slug || cardCats.indexOf(slug) !== -1
      card.style.removeProperty('display')
      if (show) {
        card.classList.remove(FILTERED_OUT_CLASS)
      } else {
        card.classList.add(FILTERED_OUT_CLASS)
      }
      if (show) n++
    }
    if (emptyMsg) emptyMsg.hidden = n !== 0
    for (var j = 0; j < buttons.length; j++) {
      var b = buttons[j]
      var bslugRaw = b.getAttribute('data-category-slug')
      var bslug = String(bslugRaw == null ? '' : bslugRaw).trim()
      var isAll = b.classList.contains('home-masonry-filter-all')
      var on = slug ? bslug === slug : isAll
      b.classList.toggle('active', on)
      b.setAttribute('aria-pressed', on ? 'true' : 'false')
    }
  }

  /* Force All after layout: some engines apply column rules after first paint and can race with inline display */
  function resetToAllFilter() {
    applyFilter('')
    if (typeof window.requestAnimationFrame !== 'function') return
    window.requestAnimationFrame(function () {
      applyFilter('')
      window.requestAnimationFrame(function () {
        applyFilter('')
      })
    })
  }

  nav.addEventListener(
    'click',
    function (e) {
      var el = e.target
      var t =
        el && typeof el.closest === 'function'
          ? el.closest('.home-masonry-filter-btn')
          : null
      if (!t) {
        for (var p = el; p && p !== nav; p = p.parentElement) {
          if (
            p.classList &&
            p.classList.contains('home-masonry-filter-btn') &&
            p.nodeName === 'BUTTON'
          ) {
            t = p
            break
          }
        }
      }
      if (!t || t.nodeName !== 'BUTTON') return
      e.preventDefault()
      var slug = String(t.getAttribute('data-category-slug') == null ? '' : t.getAttribute('data-category-slug')).trim()
      applyFilter(slug)
    },
    false
  )

  resetToAllFilter()
  window.addEventListener('pageshow', resetToAllFilter)
  window.addEventListener('load', resetToAllFilter)
})()

/* Figma embed: poster opens near–full-screen iframe overlay */
;(function () {
  var shell = document.getElementById('figma-embed-shell')
  var iframe = shell ? shell.querySelector('.figma-embed-shell__iframe') : null
  var externalDlg = document.getElementById('embed-external-link-dialog')
  var zoomHint = shell ? shell.querySelector('.figma-embed-shell__zoom-hint') : null
  var pendingExternalUrl = ''
  var lastFocus = null
  var scrollLockY = 0

  function isFigmaEmbedUrl(url) {
    if (!url || typeof url !== 'string') return false
    return url.toLowerCase().indexOf('embed.figma.com') !== -1
  }

  function embedLinkNeedsConfirmation(absUrl) {
    try {
      var proto = absUrl.protocol.replace(':', '').toLowerCase()
      if (proto === 'mailto' || proto === 'tel' || proto === 'javascript' || proto === 'data') return true
      if (proto !== 'http' && proto !== 'https') return false
      return absUrl.origin !== window.location.origin
    } catch (err) {
      return false
    }
  }

  function anchorFromTarget(doc, target) {
    if (!doc || !target || typeof target.closest !== 'function') return null
    var a = target.closest('a[href]')
    return a && doc.documentElement.contains(a) ? a : null
  }

  function maybeInterceptEmbedNavigation(e, doc) {
    var a = anchorFromTarget(doc, e.target)
    if (!a) return
    var raw = a.getAttribute('href')
    if (raw == null || raw === '') return
    var resolved
    try {
      resolved = new URL(raw, doc.location.href)
    } catch (err) {
      return
    }
    if (!embedLinkNeedsConfirmation(resolved)) return
    e.preventDefault()
    e.stopPropagation()
    openEmbedExternalDialog(resolved.href)
  }

  function attachEmbedLinkGuard(doc) {
    if (!doc || !doc.documentElement) return
    if (doc.documentElement.getAttribute('data-embed-link-guard') === '1') return
    doc.documentElement.setAttribute('data-embed-link-guard', '1')
    doc.addEventListener(
      'click',
      function (e) {
        maybeInterceptEmbedNavigation(e, doc)
      },
      true
    )
    doc.addEventListener(
      'auxclick',
      function (e) {
        if (e.button !== 1) return
        maybeInterceptEmbedNavigation(e, doc)
      },
      true
    )
  }

  function openEmbedExternalDialog(url) {
    if (!externalDlg) return
    pendingExternalUrl = url || ''
    var linkEl = document.getElementById('embed-external-link-dialog-url')
    if (linkEl) {
      linkEl.textContent = pendingExternalUrl
      linkEl.href = pendingExternalUrl
    }
    externalDlg.hidden = false
    try {
      externalDlg.focus({ preventScroll: true })
    } catch (err2) {}
    var primary = document.getElementById('embed-external-link-dialog-open')
    if (primary && typeof primary.focus === 'function') {
      try {
        primary.focus()
      } catch (err3) {}
    }
  }

  function closeEmbedExternalDialog() {
    if (!externalDlg) return
    externalDlg.hidden = true
    pendingExternalUrl = ''
  }

  if (externalDlg) {
    externalDlg.addEventListener(
      'click',
      function (e) {
        if (e.target.closest && e.target.closest('[data-embed-external-link-dismiss]')) {
          closeEmbedExternalDialog()
        }
      },
      false
    )
    var openBtn = document.getElementById('embed-external-link-dialog-open')
    if (openBtn) {
      openBtn.addEventListener('click', function () {
        var u = pendingExternalUrl
        closeEmbedExternalDialog()
        if (u) window.open(u, '_blank', 'noopener,noreferrer')
      })
    }
  }

  function lockPageScroll() {
    scrollLockY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0
    document.body.style.top = -scrollLockY + 'px'
    document.documentElement.classList.add('figma-embed-shell--open')
    document.body.classList.add('figma-embed-shell--open')
  }

  function unlockPageScroll() {
    document.documentElement.classList.remove('figma-embed-shell--open')
    document.body.classList.remove('figma-embed-shell--open')
    document.body.style.top = ''
    window.scrollTo(0, scrollLockY)
    scrollLockY = 0
  }

  function applyEmbedIframeScale(scaleStr) {
    if (!iframe) return
    if (scaleStr == null || String(scaleStr).trim() === '') {
      iframe.style.transform = ''
      iframe.style.transformOrigin = ''
      return
    }
    var raw = String(scaleStr).trim()
    var n = parseFloat(raw, 10)
    if (/%\s*$/.test(raw)) {
      n = n / 100
    }
    if (isNaN(n) || n <= 0 || n === 1) {
      iframe.style.transform = ''
      iframe.style.transformOrigin = ''
      return
    }
    iframe.style.transform = 'scale(' + n + ')'
    iframe.style.transformOrigin = 'center center'
  }

  function closeShell() {
    if (!iframe || !shell) return
    applyEmbedIframeScale('')
    iframe.src = ''
    shell.hidden = true
    if (zoomHint) zoomHint.hidden = true
    unlockPageScroll()
    closeEmbedExternalDialog()
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try {
        lastFocus.focus()
      } catch (e) {}
    }
    lastFocus = null
  }

  function openShell(url, showZoomHintExplicit, iframeScaleStr) {
    if (!iframe || !shell) return
    lastFocus = document.activeElement
    var showZoom =
      showZoomHintExplicit === true
        ? true
        : showZoomHintExplicit === false
          ? false
          : isFigmaEmbedUrl(url)
    if (zoomHint) zoomHint.hidden = !showZoom
    applyEmbedIframeScale(iframeScaleStr)
    iframe.src = url
    shell.hidden = false
    lockPageScroll()
    try {
      shell.focus({ preventScroll: true })
    } catch (e) {}
  }

  if (iframe) {
    iframe.addEventListener('load', function () {
      try {
        var doc = iframe.contentDocument
        if (doc) attachEmbedLinkGuard(doc)
      } catch (err) {}
    })
  }

  if (!shell || !iframe) return

  document.addEventListener(
    'click',
    function (e) {
      var btn = e.target.closest && e.target.closest('[data-figma-embed-open]')
      if (!btn) return
      e.preventDefault()
      var url = btn.getAttribute('data-figma-embed-url')
      if (!url) return
      var zhRaw = btn.getAttribute('data-figma-zoom-hint')
      var showZh = zhRaw === 'true' ? true : zhRaw === 'false' ? false : undefined
      var scaleRaw = btn.getAttribute('data-figma-iframe-scale')
      openShell(url, showZh, scaleRaw)
    },
    false
  )

  shell.addEventListener(
    'click',
    function (e) {
      if (e.target.closest && e.target.closest('[data-figma-embed-close]')) {
        closeShell()
      }
    },
    false
  )

  function isEventForIframeContent(target) {
    if (!target || !iframe) return false
    if (target === iframe) return true
    return iframe.contains(target)
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return
    if (externalDlg && !externalDlg.hidden) {
      e.preventDefault()
      closeEmbedExternalDialog()
      return
    }
    if (shell.hidden) return
    closeShell()
  })

  /* Wheel/touch on the shell but outside the iframe targets backdrop only — block scroll chaining to locked body */
  shell.addEventListener(
    'wheel',
    function (e) {
      if (shell.hidden) return
      if (isEventForIframeContent(e.target)) return
      e.preventDefault()
    },
    { passive: false }
  )

  shell.addEventListener(
    'touchmove',
    function (e) {
      if (shell.hidden) return
      if (isEventForIframeContent(e.target)) return
      e.preventDefault()
    },
    { passive: false }
  )
})()

;(function () {
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault()
  })
})()