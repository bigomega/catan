export default class AccessibilityUI {
  muted = !!+localStorage.getItem('mute')
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
      ['Show this section', '?'],
      ['Cancel action / Close stuff', '\` (Backquote)'],
    ]
  ]

  constructor({ toggleBoardZoom, toggleBgm, toggleNotificationsAudio }) {
    this.#toggleBoardZoom = toggleBoardZoom
    this.#toggleBgm = toggleBgm
    this.#toggleNotificationsAudio = toggleNotificationsAudio
  }

  render() {
    this.$el.innerHTML = `
      <div class="icon full-screen" title="Full screen (f)"></div>
      <div class="grouped">
        <div class="icon zoom-in" title="Zoom In (=)">✚</div>
        <div class="icon zoom-out" title="Zoom Out (-)">-</div>
      </div>
      <div class="grouped">
        <div class="icon notifications ${this.muted_notif ? 'off' : ''}" title="${this.muted_notif ? 'Unmute' : 'Mute'} Notifications (n)"></div>
        <div class="icon bgm ${this.muted ? 'off' : ''}" title="${this.muted ? 'Unmute' : 'Mute'} Background Music (m)">♫</div>
      </div>
      <div class="icon question-mark" title="Keyboard Shortcuts (?)">?</div>
      <div class="icon info" title="About author & game">ℹ</div>
      <div class="keyboard-shortcuts hide">${this.keyboard_shortcuts.map(group =>
        `<div class="shortcuts-container">${group.map(([title, shortcut]) =>
          `<div class="shortcut">
            <div class="title">${title}</div>
            <div class="key">${shortcut}</div>
          </div>`).join('')}
        </div>`).join('')}
        <div class="close">X</div>
      </div>
    `
    this.#setupEvents()
  }

  #setupEvents() {
    this.$el.querySelector('.full-screen').addEventListener('click', e => this.toggleFullScreen())
    this.$el.querySelector('.zoom-in').addEventListener('click', e => this.toggleZoom())
    this.$el.querySelector('.zoom-out').addEventListener('click', e => this.toggleZoom(true))
    this.$el.querySelector('.notifications').addEventListener('click', e => this.toggleMuteNotications())
    this.$el.querySelector('.bgm').addEventListener('click', e => this.toggleMuteBgm())
    this.$el.querySelector('.question-mark').addEventListener('click', e => this.showHideKeyboardShortcuts(true))
    this.$el.querySelector('.info').addEventListener('click', e => this.showHideInfo())
    this.$el.querySelector('.keyboard-shortcuts .close').addEventListener('click', e => this.showHideKeyboardShortcuts(false))
    document.addEventListener('keydown', e => {
      switch (e.code) {
        case 'KeyF': this.toggleFullScreen(); break
        case 'Equal': this.toggleZoom(); break
        case 'Minus': this.toggleZoom(true); break
        case 'KeyN': this.toggleMuteNotications(); break
        case 'KeyM': this.toggleMuteBgm(); break
        case 'Backquote': this.showHideKeyboardShortcuts(false); break
      }
      e.key === '?' && this.showHideKeyboardShortcuts(true)
    })
  }

  toggleFullScreen() {
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
    this.muted = !this.muted
    localStorage.setItem('mute', +this.muted)
    this.#toggleBgm(!this.muted)
    this.$el.querySelector('.bgm').classList[this.muted ? 'add' : 'remove']('off')
    this.$el.querySelector('.bgm').setAttribute('title', (this.muted ? 'Unm' : 'M')+'ute Background Music (m)')
  }

  toggleMuteNotications() {
    this.muted_notif = !this.muted_notif
    localStorage.setItem('mute-notifications', +this.muted_notif)
    this.#toggleNotificationsAudio(!this.muted_notif)
    this.$el.querySelector('.notifications').classList[this.muted_notif ? 'add' : 'remove']('off')
    this.$el.querySelector('.notifications').setAttribute('title', (this.muted_notif ? 'Unm' : 'M') + 'ute Notifications (n)')
  }

  toggleZoom(out) { this.#toggleBoardZoom(out) }
  showHideKeyboardShortcuts(show) {
    this.$el.querySelector('.keyboard-shortcuts').classList[show ? 'remove' : 'add']('hide')
  }
  showHideInfo() {}
}