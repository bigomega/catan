import Board from "../board/board.js"
import Game from "../game.js"
import Player from "../player/player.js"
import BoardUI from "./board_ui.js"
import PlayerUI from "./player_ui.js"
import AlertUI from "./alert_ui.js"
import RobberDropUI from "./robber_drop_ui.js"
import AllPlayersUI from "./all_players_ui.js"
import TradeUI from "./trade_ui.js"
import ResSelectionUI from "./res_selection_ui.js"
import AnimationUI from "./animations_ui.js"
const $ = document.querySelector.bind(document)

export default class UI {
  #game; #board; #player; #game_config
  board_ui; player_ui; alert_ui; trade_ui
  #temp = {}
  $splash = $('.splash')

  /** @param {Game} game, @param {Board} board, @param {Player} player  */
  constructor(game, board, player, opponents) {
    this.#game = game
    this.#board = board
    this.#player = player
    this.#game_config = game.config

    this.alert_ui = new AlertUI(player, st => game.saveStatus(st), game.config.alert.time)
    this.board_ui = new BoardUI(board, (loc, id) => game.onBoardClick(loc, id))
    this.all_players_ui = new AllPlayersUI(player, opponents)
    this.animation_ui = new AnimationUI()

    this.player_ui = new PlayerUI(player, {
      onDiceClick: _ => game.onDiceClick(),
      onPieceClick: (piece, is_active) => game.onPieceClick(piece, is_active),
      onBuyDevCardClick: _ => game.onBuyDevCardClick(),
      onTradeClick: _ => this.trade_ui.renderTradeSelection(),
      onExitTrade: _ => this.trade_ui.clearSelections(),
      onEndTurnClick: _ => game.onEndTurn(),
      onCardClick: type => game.onCardClick(type),
      canPlayDevCard: type => game.canPlayDevCard(type),
      onDevCardActivate: type => {
        this.animation_ui.animateDevelopmentCard(type, true)
        game.onDevCardActivate(type)
      },
      getPossibleLocations: p => game.getPossibleLocations(p),
      toggleBoardBlur: hide => { this.board_ui.toggleBlur(hide); this.all_players_ui.toggleBlur(hide) },
    })

    this.robber_drop_ui = new RobberDropUI({
      onDropSubmit: res => game.onGiveToRobber(res),
      onTakenBack: type => this.player_ui.toggleHandResource(type, true),
      playRobberAudio: _ => game.playRobberAudio(),
    })

    this.trade_ui = new TradeUI(player, game.config, {
      toggleHandRes: type => this.player_ui.toggleHandResource(type),
      resetHand: _ => this.player_ui.renderHand(),
      toggleBoardBlur: hide => { this.board_ui.toggleBlur(hide); this.all_players_ui.toggleBlur(hide) },
      onTradeProposal: (...params) => game.onTradeProposal(...params),
      onTradeResponse: (id, resp) => game.onTradeResponse(id, resp),
    })

    this.res_selection_ui = new ResSelectionUI({
      onSubmit: (type, res1, res2) => game.onMonopolyYearOfPlentyResSelection(type, res1, res2),
      onDevCardClick: type => this.player_ui.clickCard(type),
    })
  }

  render() {
    this.board_ui.render()
    this.player_ui.render()
    this.all_players_ui.render()
    this.alert_ui.render()
    this.trade_ui.render()
    this.res_selection_ui.render()
    this.$splash.classList.add('hide')
    this.#setUpEvents()
  }

  #setUpEvents() {
    document.addEventListener('keydown', e => {
      e.code === 'Escape' && this.#game.clearDevCardUsage()
    })
  }

  showDiceValue() {
    // Animation + Visuals
  }

  robberDrop(count) {
    this.board_ui.toggleBlur(true)
    this.robber_drop_ui.render(count, this.#player.closed_cards)
    this.player_ui.activateResourceCards()
  }

  build(pid, piece, loc) {
    this.hideAllShown()
    this.board_ui.build(pid, piece, loc)
  }

  moveRobber(id) {
    this.hideAllShown()
    this.board_ui.moveRobber(id)
  }

  toggleActions(bool) {
    bool && this.#game.updateAllPossibleLocations()
    this.player_ui.checkAndToggleActions(bool)
  }

  setTimer(t, pid) { this.player_ui.resetRenderTimer(t, pid) }
  showCorners(ids) { this.player_ui.toggleHandBlur(1); this.board_ui.showCorners(ids) }
  showEdges(ids) { this.player_ui.toggleHandBlur(1); this.board_ui.showEdges(ids) }
  showTiles(ids) { this.player_ui.toggleHandBlur(1); this.board_ui.showTiles(ids) }
  hideAllShown() {
    this.player_ui.toggleHandBlur()
    this.board_ui.hideAllShown()
    this.trade_ui.clearSelections()
    this.player_ui.closeCardPreview()
    this.res_selection_ui.hide()
  }
}
