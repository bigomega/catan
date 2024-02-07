const _dummyFn = _ => _
export default class AccessibilityUI {
  #shown_icons
  muted = true
  // muted = !!+localStorage.getItem('mute')
  muted_notif = !!+localStorage.getItem('mute-notifications')
  #toggleBoardZoom; #toggleBgm; #toggleNotificationsAudio
  $el = document.querySelector('#game > .accessibility-zone')

  keyboard_shortcuts = [
    [
      ['Roll Dice', 'SPACE'],
      ['Build Road', 'r'],
      ['Build Settlement', 's'],
      ['Build City', 'c'],
      ['Buy Development Card', 'd'],
      ['Trade options', 't'],
      ['Play Knight Card', 'k'],
      ['End Turn', 'e (or) SPACE'],
    ], [
      ['Full Screen', 'f'],
      ['Board Zoom In', '='],
      ['Board Zoom Out', '-'],
      ['Toggle Background Music', 'm'],
      ['Toggle Notification Sounds', 'n'],
      ['Show Status History', 'h'],
      ['Show this section', '?'],
      ['Cancel action / Close stuff', '\` (Backquote)'],
    ]
  ]

  constructor({ toggleBoardZoom = _dummyFn, toggleBgm = _dummyFn, toggleNotificationsAudio = _dummyFn,
    icons: { fullscreen = true, zoom = true, bgm = true, notifcation_sounds = true,
      shorcuts = true, info = true, quit = true } = {}} = {}) {
    this.#shown_icons = { fullscreen, zoom, bgm, notifcation_sounds, shorcuts, info, quit }
    this.#toggleBoardZoom = toggleBoardZoom
    this.#toggleBgm = toggleBgm
    this.#toggleNotificationsAudio = toggleNotificationsAudio
  }

  render() {
    this.$el.innerHTML = `
      ${this.#shown_icons.fullscreen ? `<button class="icon full-screen" title="Full screen (f)"></button>` : ''}
      ${this.#shown_icons.zoom ? `<div class="grouped">
        <button class="icon zoom-in" title="Zoom In (=)">✚</button>
        <button class="icon zoom-out" title="Zoom Out (-)">-</button>
      </div>` : ''}
      <div class="grouped">
        ${this.#shown_icons.notifcation_sounds
          ? `<button class="icon notifications ${this.muted_notif ? 'off' : ''}"
              title="${this.muted_notif ? 'Unmute' : 'Mute'} Notifications (n)">
            </button>` : ''}
        ${this.#shown_icons.bgm
          ? `<button class="icon bgm ${this.muted ? 'off' : ''}"
              title="${this.muted ? 'Unmute' : 'Mute'} Background Music (m)">♫
            </button>` : ''}
      </div>
      ${this.#shown_icons.shorcuts ? `<button class="icon question-mark" title="Keyboard Shortcuts (?)">?</button>` : ''}
      ${this.#shown_icons.info ? `<button class="icon info" title="About">ℹ</button>` : ''}
      ${this.#shown_icons.quit ? `<button class="icon quit" title="Quit Game"><b></b></button>` : ''}<!-- ⦿◎◉●◦◦⚬☉ -->
      ${this.#shown_icons.shorcuts ? `
        <div class="keyboard-shortcuts hide">${this.keyboard_shortcuts.map(group =>
          `<div class="shortcuts-container">${group.map(([title, shortcut]) =>
            `<div class="shortcut">
              <div class="title">${title}</div>
              <div class="key">${shortcut}</div>
            </div>`).join('')}
          </div>`).join('')}
          <button class="close">X</button>
        </div>
      `: ''}
      ${this.#shown_icons.info ? `
        <div class="info-zone hide">
          <div class="container">
            <div class="img-container">
              <a href="https://bharathraja.in/#connect" target="_blank"><img class="logo" src="/images/logo-animation-loop.gif"></a>
              <img class="dp" src="/images/dp2.png">
            </div>
            <div class="text-container">
              <div class="title">Bharath Raja</div>
              <div class="subtitle">
                I go by <a href="https://bharathraja.in/#connect" target="_blank">bigOmega</a>
                <a class="social-icon github" href="https://github.com/bigomega/" target="_blank"></a>
                <a class="social-icon linkedin" href="https://www.linkedin.com/in/bigomega" target="_blank"></a>
                <a class="social-icon twitter" href="https://twitter.com/bigomega" target="_blank"></a>
                <a class="social-icon youtube" href="https://www.youtube.com/c/bigomega" target="_blank"></a>
                <a class="social-icon email" href="mailto:bharathraja04@gmail.com" target="_blank"></a>
              </div>
              <p>I've always been fascinated by the hexagonal structures of beehives 🐝. This game was built from my love for <b>open source</b>, my expression of visual thinking, my expertise in front-end web, and my gratitude for a favourite board game.
                I took <b>🕰 10-14 hours</b> every day over <b>40 straight days</b> to curate, design, architect, build, refactor and deploy this. I've gone pure <b>vanilla</b> with JS and CSS and <b>built everything from scratch</b> for a refreshing change of pace.
                I acquired the images and sounds from the internet, and yet it took quite a lot of editing with Preview, Pixlr & iMovie. I'd be happy to redraw them as and when possible.</p>
              <p>When I built this in early 2024, I was on a small break from my career. My life revolved around <b>🪂 paragliding</b> in the Himalayas, <b>🚶🏻‍♂️ silent walks</b> alone in nature, <b>🤔 deep conversations</b> with my thoughtful partner,
                😥 heavily missing Hackathon scenes, 👨🏻‍💻 introverted <b>Developer Evangelism</b> and a healthy mix of 🎮 <a href="https://www.klei.com/games/dont-starve-together" target="_blank">DST</a>, ONI and AOE4.</p>
              <p>Feel free to <a href="https://github.com/bigomega/catan" target="_blank" style="font-weight:bold;">Modify this Project</a> as you see fit and <b>enjoy playing it with your friends and family</b>.
                If you catch me online, don't hesitate to <b>say hi</b>; I'm always open to converse.</p>
              <p class="cheers">Cheers <span>☕️</span></p>
              <div class="title game-title">How to Play?</div>
              <p>You can read the <a class="rules" href="https://www.catan.com/sites/default/files/2021-06/catan_base_rules_2020_200707.pdf" target="_blank">Game Rules & Almanac</a> here.
            </div>
          </div>
          <button class="close">X</button>
        </div>
      ` : ''}
    `
    this.#setupEvents()
  }

  #setupEvents() {
    this.$el.querySelector('.full-screen')?.addEventListener('click', e => this.toggleFullScreen())
    this.$el.querySelector('.zoom-in')?.addEventListener('click', e => this.toggleZoom())
    this.$el.querySelector('.zoom-out')?.addEventListener('click', e => this.toggleZoom(true))
    this.$el.querySelector('.notifications')?.addEventListener('click', e => this.toggleMuteNotications())
    this.$el.querySelector('.bgm')?.addEventListener('click', e => this.toggleMuteBgm())
    this.$el.querySelector('.question-mark')?.addEventListener('click', e => this.showHideKeyboardShortcuts(true))
    this.$el.querySelector('.quit')?.addEventListener('click', e => window.location.href = '/logout')
    this.$el.querySelector('.info')?.addEventListener('click', e => this.showHideInfo(true))
    this.$el.querySelector('.keyboard-shortcuts .close')?.addEventListener('click', e => this.showHideKeyboardShortcuts(false))
    this.$el.querySelector('.info-zone .close')?.addEventListener('click', e => this.showHideInfo(false))
    document.addEventListener('keydown', e => {
      switch (e.code) {
        case 'KeyF': this.toggleFullScreen(); break
        case 'Equal': this.toggleZoom(); break
        case 'Minus': this.toggleZoom(true); break
        case 'KeyN': this.toggleMuteNotications(); break
        case 'KeyM': this.toggleMuteBgm(); break
        case 'Backquote':
          this.showHideKeyboardShortcuts(false)
          this.showHideInfo(false)
          break
      }
      e.key === '?' && this.showHideKeyboardShortcuts(true)
    })
  }

  toggleFullScreen() {
    if (!this.#shown_icons.fullscreen) return
    if (document.querySelector('input[type="text"]:focus')) return
    if (document.fullscreenElement) {
      document.exitFullscreen?.()
      this.$el.querySelector('.full-screen').classList.remove('on')
      this.$el.querySelector('.full-screen').setAttribute('title', 'Full screen (f)')
    } else {
      document.documentElement.requestFullscreen?.()
      this.$el.querySelector('.full-screen').classList.add('on')
      this.$el.querySelector('.full-screen').setAttribute('title', 'Exit full screen (f)')
    }
  }

  toggleMuteBgm() {
    if (!this.#shown_icons.bgm) return
    if (document.querySelector('input[type="text"]:focus')) return
    this.muted = !this.muted
    // localStorage.setItem('mute', +this.muted)
    this.#toggleBgm(!this.muted)
    this.$el.querySelector('.bgm').classList[this.muted ? 'add' : 'remove']('off')
    this.$el.querySelector('.bgm').setAttribute('title', (this.muted ? 'Unm' : 'M')+'ute Background Music (m)')
  }

  toggleMuteNotications() {
    if (!this.#shown_icons.notifcation_sounds) return
    this.muted_notif = !this.muted_notif
    localStorage.setItem('mute-notifications', +this.muted_notif)
    this.#toggleNotificationsAudio(!this.muted_notif)
    this.$el.querySelector('.notifications').classList[this.muted_notif ? 'add' : 'remove']('off')
    this.$el.querySelector('.notifications').setAttribute('title', (this.muted_notif ? 'Unm' : 'M') + 'ute Notifications (n)')
  }

  toggleZoom(out) { this.#shown_icons.zoom && this.#toggleBoardZoom(out) }

  showHideKeyboardShortcuts(show) {
    this.#shown_icons.shorcuts
      && this.$el.querySelector('.keyboard-shortcuts').classList[show ? 'remove' : 'add']('hide')
  }

  showHideInfo(show) {
    if (!this.#shown_icons.info) return
    if (document.querySelector('input[type="text"]:focus')) return
    this.#shown_icons.info
      && this.$el.querySelector('.info-zone').classList[show ? 'remove' : 'add']('hide')
  }
}
