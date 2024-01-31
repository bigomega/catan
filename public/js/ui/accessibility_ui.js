export default class AccessibilityUI {
  #toggleBoardZoom
  $el = document.querySelector('#game > .accessibility-zone')

  constructor({ toggleBoardZoom }) {
    this.#toggleBoardZoom = toggleBoardZoom
  }

  render() {
    this.$el.innerHTML = `
      <div class="full-screen" title="Full screen (f)"></div>
      <div class="zoom-in" title="Zoom In (=)">✚</div>
      <div class="zoom-out" title="Zoom Out (-)">-</div>
      <div class="music" title="Mute (m)"></div>
      <div class="question-mark" title="Shortcuts (?)">?</div>
      <div class="info" title="About author & game">ℹ</div>
    `
    this.#setupEvents()
  }

  #setupEvents() {
    this.$el.querySelector('.full-screen').addEventListener('click', e => this.toggleFullScreen())
    this.$el.querySelector('.zoom-in').addEventListener('click', e => this.toggleZoom())
    this.$el.querySelector('.zoom-out').addEventListener('click', e => this.toggleZoom(true))
    this.$el.querySelector('.music').addEventListener('click', e => this.toggleMute())
    this.$el.querySelector('.question-mark').addEventListener('click', e => this.showHideKeyboardShortcuts())
    this.$el.querySelector('.info').addEventListener('click', e => this.showHideInfo())
    document.addEventListener('keydown', e => {
      switch (e.code) {
        case 'KeyF': this.toggleFullScreen(); break
        case 'Equal': this.toggleZoom(); break
        case 'Minus': this.toggleZoom(true); break
        case 'KeyM': this.toggleMute(); break
      }
      e.key === '?' && this.showHideKeyboardShortcuts()
    })
  }

  toggleFullScreen(exit) {
    if (document.fullscreenElement) {
      document.exitFullscreen?.()
      this.$el.querySelector('.full-screen').classList.remove('on')
    } else {
      document.documentElement.requestFullscreen?.()
      this.$el.querySelector('.full-screen').classList.add('on')
    }
  }

  toggleZoom(out) { this.#toggleBoardZoom(out) }
  toggleMute() {}
  showHideKeyboardShortcuts() {}
  showHideInfo() {}
}
