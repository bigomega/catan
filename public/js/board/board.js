import * as CONST from "../const.js"
import Corner from "./corner.js"
import Edge from "./edge.js"
import Tile from './tile.js'

export default class Board {
  head_tile; existing_changes; robber_loc;
  tile_rows = []
  numbers = [...Array(13)].map(_ => [])
  /** @type {Tile[]} */ #tile_refs = []
  /** @type {Corner[]} */ #corner_refs = []
  /** @type {Edge[]} */ #edge_refs = []

  constructor(mapkey, existing_changes = [], no_edge_corner) {
    this.mapkey = mapkey
    this.existing_changes = existing_changes
    /**
     * ============
     * MAP DECODING
     * ============
     * row split by +/- and every row except the first MUST have a sign preceeding
     * + or - represent where the hex starts in the next line. bottom right or left
     * each tile is split by dor (.) and each tile has it's own regex
     * Sea -> S(direction _ ResourceKey number)? <sea has optional trade in a direction>
     * Desert -> D
     * ResourceTile -> TileKey number {F|G|J|C|M}
     * ex., S.J5+S(r-L2).F3.G5.C6.M12.S
     *
     * Since decoding always happens from left to right and top to bottom,
     * we reuse previous corners
     */
    const mapkey_list = mapkey.trim().split(/[-,+]/)
    for (let i = 0; i < mapkey_list.length; i++) {
      let row_map = mapkey_list[i].trim()
      const prev_row = i > 0 ? this.tile_rows[i - 1] : null
      const row_data = []
      // ONLY ONE +/- can be used for Row Difference
      mapkey_list.slice(0, i).reduce((mem, _) => mem + _.length, 0)
      const plus_minus = mapkey[mapkey_list.slice(0, i).reduce((mem, _) => mem + _.length, 0) + i - 1]
      if (plus_minus === '+' || plus_minus === '-') {
        row_data.diff = +(plus_minus + '1')
      } else {
        row_data.diff = 1
      }
      const row_map_arr = row_map.split('.')
      for (let j = 0; j < row_map_arr.length; j++) {
        const tile_map = row_map_arr[j].trim()
        const prev_tile = j > 0 ? row_data[j - 1] : null
        const row_diff_tmp = row_data.diff < 0 ? -1 : 0
        const adjacent_tiles = {
          left: prev_tile,
          top_left: prev_row?.[j + row_diff_tmp],
          top_right: prev_row?.[j + row_diff_tmp + 1],
        }
        const tile_params = {
          id: this.#tile_refs.length, createCorner: this.createCorner.bind(this),
          createEdge: this.createEdge.bind(this), no_edge_corner, ...adjacent_tiles
        }
        if (tile_map[0] == 'S') {
          const { dir, res, num } =
            tile_map.match(new RegExp(CONST.SEA_REGEX))?.groups || {}
          tile_params.trade_edge = ({
            tl: 'top_left', tr: 'top_right', l: 'left',
            r: 'right', bl: 'bottom_left', br: 'bottom_right',
          })[dir]
          tile_params.trade_type = res
          tile_params.trade_ratio = num
          tile_params.type = 'S'
        } else if (tile_map[0] == 'D') {
          tile_params.type = 'D'
          tile_params.robbed = true
          // Keep moving the robber to the last Desert found
          if (this.robber_loc) { this.findTile(this.robber_loc)?.toggleRobbed(false) }
          this.robber_loc = tile_params.id
        } else {
          const { tile_type, num } =
            tile_map.match(new RegExp(CONST.RESOURCE_REGEX))?.groups || {}
          tile_params.type = tile_type
          tile_params.num = num
        }
        const tile = new Tile(tile_params)
        tile.num && tile.num > 1 && tile.num < 13 && this.numbers[tile.num].push(tile)
        this.#tile_refs.push(tile)
        row_data.push(tile)
      }
      this.tile_rows.push(row_data)
    }
    this.head_tile = this.tile_rows[0]?.[0]
    return this
  }

  createCorner(tile) {
    const corner = new Corner(this.#corner_refs.length, tile)
    this.#corner_refs.push(corner)
    return corner
  }

  createEdge(c1, c2) {
    const edge = new Edge(this.#edge_refs.length, c1, c2)
    this.#edge_refs.push(edge)
    return edge
  }

  /**
   * @description Returns empty corner location without any corner neighbours
   * @param {number} [player_id]
   *          -1 : locations with at least one empty edge
   *          id : locations with at least one player(id) road
   * @returns {Corner[]}
   */
  getSettlementLocations(player_id) {
    const locations = []
    this.#corner_refs.forEach(corner => {
      if (!corner.tiles.filter(t => t.type !== 'S').length) return
      const no_neighbours = corner.hasNoNeighbours()
      const road_count = corner.getEdges(player_id).length
      // C.getEdges(pid) handles the "-1" case
      !corner.piece && no_neighbours && road_count && locations.push(corner)
    })
    return locations
  }

  getSettlementLocationsFromRoads(existing_roads = []) {
    if (!existing_roads.length) return []
    const corners = []
    const check_corner = id => {
      const corner = this.findCorner(id)
      return !corners.includes(id) && !corner.piece && corner.hasNoNeighbours()
    }
    existing_roads.forEach(r_loc => {
      const edge = this.findEdge(r_loc)
      if (!edge) return
      check_corner(edge.corner1.id) && corners.push(edge.corner1.id)
      check_corner(edge.corner2.id) && corners.push(edge.corner2.id)
    })
    return corners
  }

  getRoadLocationsFromRoads(existing_roads = []) {
    if (!existing_roads.length) return []
    const valid_edges = existing_roads
      .reduce((mem, r_loc) => {
        const edge = this.findEdge(r_loc)
        const c1_edges = edge?.corner1.getEdges(-1)
        const c2_edges = edge?.corner2.getEdges(-1)
        return mem.concat(c1_edges, c2_edges)
      }, [])
      .filter(_ => !_.corner1.surroundedBySea() && !_.corner2.surroundedBySea()) // Not into sea
      .map(e => e.id)
    ;
    return [...new Set(valid_edges)] // remove duplicates
  }

  getRobbableTiles() {
    return this.#tile_refs.filter(t => !t.robbed && t.type !== 'S').map(t => t.id)
  }

  build(pid, piece, loc) {
    switch (piece) {
      case 'S': this.findCorner(loc)?.buildSettlement(pid); break;
      case 'C': this.findCorner(loc)?.buildCity(); break;
      case 'R': this.findEdge(loc)?.buildRoad(pid); break;
    }
  }

  moveRobber(id) {
    if (!this.getRobbableTiles().includes(id)) return
    this.findTile(id).toggleRobbed(true)
    this.findTile(this.robber_loc).toggleRobbed(false)
    this.robber_loc = id
  }

  /** @returns {Array[Object]} {pid, res, count}[] */
  distribute(number) {
    return this.numbers[number]?.reduce((mem, tile) => {
      if (tile.robbed) return mem
      const res = CONST.TILE_RES[tile.type]
      return mem.concat(tile.getOccupiedCorners().map(corner =>
        ({ pid: corner.player_id, res, count: +(corner.piece === 'C') + 1 })
      ))
    }, [])
  }

  findLongestPathFromRoads(pid, locs) {
    if (!pid || !locs?.length) return []

    return locs.reduce((mem1, loc) => {
      const starting_edge = this.findEdge(loc)
      if (!starting_edge || starting_edge.road !== pid) return mem1

      const explored = []
      const recursiveFn = (edge, from_cid) => {
        if (explored.includes(edge.id)) return []
        explored.push(edge.id)
        const c1_possible = from_cid !== edge.corner1.id
          && (!edge.corner1.player_id || edge.corner1.player_id === pid)
        const c2_possible = from_cid !== edge.corner2.id
          && (!edge.corner2.player_id || edge.corner2.player_id === pid)
        const c1_longest = c1_possible
          ? edge.corner1.getEdges(pid)
            .filter(_ => _.id !== edge.id)
            .reduce((mem, e) => {
              const path = recursiveFn(e, edge.corner1.id)
              return path.length > mem.length ? path : mem
            }, [])
          : []
        const c2_longest = c2_possible
          ? edge.corner2.getEdges(pid)
            .filter(_ => _.id !== edge.id)
            .reduce((mem, e) => {
              const path = recursiveFn(e, edge.corner2.id)
              return path.length > mem.length ? path : mem
            }, [])
          : []
        return [edge.id, ...c1_longest.length > c2_longest.length ? c1_longest : c2_longest]
      }

      const longest = recursiveFn(starting_edge)
      return longest.length > mem1.length ? longest : mem1
    }, [])
  }

  addTakenCornersAlongEdgePath(locs) {
    if (!locs?.length || locs.length < 2) return []
    const findCommonCorner = (e1, e2) => {
      if (e1.corner1 === e2.corner1) return e1.corner1
      if (e1.corner1 === e2.corner2) return e1.corner1
      return e1.corner2
    }
    const new_list = [{id: locs[0], type: 'e'}]
    locs.reduce((old_edge, eid) => {
      const edge = this.findEdge(eid)
      if (!old_edge) return edge
      const c = findCommonCorner(old_edge, edge)
      c.player_id && new_list.push({id: c.id, type: 'c'})
      new_list.push({id: eid, type: 'e'})
      return edge
    }, null)
    return new_list
  }

  getRobbedTile() { return this.findTile(this.robber_loc) }
  findCorner(id) { return this.#corner_refs[id] }
  findEdge(id) { return this.#edge_refs[id] }
  findTile(id) { return this.#tile_refs[id] }
}
