import {
    CellType,
    GRID_HEIGHT,
    GRID_WIDTH,
    gridToWorld,
    ISLAND_DATA,
    isValidGridPosition,
    PATHFINDING_CONFIG,
    worldToGrid,
} from '../config/IslandConfig'
import type { PositionComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

// Grid node for A* pathfinding
interface GridNode {
    x: number
    z: number
    cellType: CellType
    gCost: number
    hCost: number
    fCost: number
    parent: GridNode | null
}

export class PathfindingSystem extends System {
    private navigationGrid: CellType[][]
    private gridInitialized: boolean = false

    constructor(world: World) {
        super(world, [])
        this.navigationGrid = []
        this.initializeGrid()
    }

    update(_deltaTime: number): void {
        // This system doesn't need regular updates
        // It provides pathfinding services to other systems
    }

    private initializeGrid(): void {
        console.log('🗺️ Initializing pathfinding grid...')

        // Initialize grid with all sea cells
        this.navigationGrid = Array(GRID_HEIGHT)
            .fill(null)
            .map(() => Array(GRID_WIDTH).fill(CellType.SEA))

        // Mark island cells as blocked
        for (const island of ISLAND_DATA) {
            this.markIslandCells(island)
        }

        this.gridInitialized = true
        console.log(`🗺️ Grid initialized: ${GRID_WIDTH}x${GRID_HEIGHT} cells`)
    }

    private markIslandCells(island: (typeof ISLAND_DATA)[0]): void {
        const centerGrid = worldToGrid(island.position.x, island.position.z)
        const effectiveRadius =
            island.collisionRadius + PATHFINDING_CONFIG.islandPadding

        // Mark cells within the island's radius as blocked
        const gridRadius = Math.ceil(
            effectiveRadius / PATHFINDING_CONFIG.gridSize,
        )

        for (let z = -gridRadius; z <= gridRadius; z++) {
            for (let x = -gridRadius; x <= gridRadius; x++) {
                const gridX = centerGrid.x + x
                const gridZ = centerGrid.z + z

                if (!isValidGridPosition(gridX, gridZ)) continue

                // Check if this grid cell is within the island's collision radius
                const worldPos = gridToWorld(gridX, gridZ)
                const dx = worldPos.x - island.position.x
                const dz = worldPos.z - island.position.z
                const distance = Math.sqrt(dx * dx + dz * dz)

                if (distance <= effectiveRadius) {
                    this.navigationGrid[gridZ][gridX] = CellType.ISLAND
                }
            }
        }
    }

    // Public method to get cell type at world position
    public getCellTypeAt(worldX: number, worldZ: number): CellType {
        if (!this.gridInitialized) return CellType.SEA

        const grid = worldToGrid(worldX, worldZ)
        if (!isValidGridPosition(grid.x, grid.z)) return CellType.ISLAND // Out of bounds = blocked

        return this.navigationGrid[grid.z][grid.x]
    }

    // Public method to check if a position is navigable
    public isNavigable(worldX: number, worldZ: number): boolean {
        return this.getCellTypeAt(worldX, worldZ) === CellType.SEA
    }

    // Main pathfinding method - finds path from start to goal
    public findPath(
        startX: number,
        startZ: number,
        goalX: number,
        goalZ: number,
    ): { x: number; z: number }[] | null {
        if (!this.gridInitialized) {
            console.warn('⚠️ Pathfinding grid not initialized')
            return null
        }

        const startGrid = worldToGrid(startX, startZ)
        const goalGrid = worldToGrid(goalX, goalZ)

        // Validate positions
        if (
            !isValidGridPosition(startGrid.x, startGrid.z) ||
            !isValidGridPosition(goalGrid.x, goalGrid.z)
        ) {
            return null
        }

        // If goal is blocked, find nearest navigable cell
        if (this.navigationGrid[goalGrid.z][goalGrid.x] === CellType.ISLAND) {
            const nearestNavigable = this.findNearestNavigableCell(
                goalGrid.x,
                goalGrid.z,
            )
            if (!nearestNavigable) return null
            goalGrid.x = nearestNavigable.x
            goalGrid.z = nearestNavigable.z
        }

        // Run A* algorithm
        const path = this.runAStar(startGrid, goalGrid)
        if (!path) return null

        // Convert grid path to world coordinates
        return path.map((node) => gridToWorld(node.x, node.z))
    }

    private findNearestNavigableCell(
        gridX: number,
        gridZ: number,
    ): { x: number; z: number } | null {
        const maxRadius = 20 // Search within 20 cells

        for (let radius = 1; radius <= maxRadius; radius++) {
            for (let z = -radius; z <= radius; z++) {
                for (let x = -radius; x <= radius; x++) {
                    // Only check cells on the current radius perimeter
                    if (Math.abs(x) !== radius && Math.abs(z) !== radius)
                        continue

                    const checkX = gridX + x
                    const checkZ = gridZ + z

                    if (
                        isValidGridPosition(checkX, checkZ) &&
                        this.navigationGrid[checkZ][checkX] === CellType.SEA
                    ) {
                        return { x: checkX, z: checkZ }
                    }
                }
            }
        }
        return null
    }

    private runAStar(
        start: { x: number; z: number },
        goal: { x: number; z: number },
    ): GridNode[] | null {
        const openSet: GridNode[] = []
        const closedSet: Set<string> = new Set()

        const startNode: GridNode = {
            x: start.x,
            z: start.z,
            cellType: this.navigationGrid[start.z][start.x],
            gCost: 0,
            hCost: this.calculateHeuristic(start.x, start.z, goal.x, goal.z),
            fCost: 0,
            parent: null,
        }
        startNode.fCost = startNode.gCost + startNode.hCost

        openSet.push(startNode)

        while (openSet.length > 0) {
            // Find node with lowest fCost
            let currentNode = openSet[0]
            let currentIndex = 0

            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].fCost < currentNode.fCost) {
                    currentNode = openSet[i]
                    currentIndex = i
                }
            }

            // Move current node from open to closed set
            openSet.splice(currentIndex, 1)
            closedSet.add(`${currentNode.x},${currentNode.z}`)

            // Check if we reached the goal
            if (currentNode.x === goal.x && currentNode.z === goal.z) {
                return this.reconstructPath(currentNode)
            }

            // Check all neighbors
            const neighbors = this.getNeighbors(currentNode.x, currentNode.z)
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.z}`

                if (closedSet.has(neighborKey)) continue
                if (
                    this.navigationGrid[neighbor.z][neighbor.x] ===
                    CellType.ISLAND
                )
                    continue

                const gCost =
                    currentNode.gCost +
                    this.calculateMoveCost(currentNode, neighbor)
                const hCost = this.calculateHeuristic(
                    neighbor.x,
                    neighbor.z,
                    goal.x,
                    goal.z,
                )

                // Check if this path to neighbor is better
                const existingNode = openSet.find(
                    (n) => n.x === neighbor.x && n.z === neighbor.z,
                )

                if (!existingNode) {
                    // Add new node to open set
                    const newNode: GridNode = {
                        x: neighbor.x,
                        z: neighbor.z,
                        cellType: this.navigationGrid[neighbor.z][neighbor.x],
                        gCost,
                        hCost,
                        fCost: gCost + hCost,
                        parent: currentNode,
                    }
                    openSet.push(newNode)
                } else if (gCost < existingNode.gCost) {
                    // Update existing node with better path
                    existingNode.gCost = gCost
                    existingNode.fCost = gCost + existingNode.hCost
                    existingNode.parent = currentNode
                }
            }
        }

        return null // No path found
    }

    private getNeighbors(x: number, z: number): { x: number; z: number }[] {
        const neighbors: { x: number; z: number }[] = []

        // 8-directional movement (including diagonals)
        const directions = [
            { x: -1, z: -1 },
            { x: 0, z: -1 },
            { x: 1, z: -1 },
            { x: -1, z: 0 },
            { x: 1, z: 0 },
            { x: -1, z: 1 },
            { x: 0, z: 1 },
            { x: 1, z: 1 },
        ]

        for (const dir of directions) {
            const newX = x + dir.x
            const newZ = z + dir.z

            if (isValidGridPosition(newX, newZ)) {
                neighbors.push({ x: newX, z: newZ })
            }
        }

        return neighbors
    }

    private calculateHeuristic(
        x1: number,
        z1: number,
        x2: number,
        z2: number,
    ): number {
        // Using Euclidean distance for better pathfinding with diagonal movement
        const dx = Math.abs(x2 - x1)
        const dz = Math.abs(z2 - z1)
        return Math.sqrt(dx * dx + dz * dz)
    }

    private calculateMoveCost(
        from: GridNode,
        to: { x: number; z: number },
    ): number {
        const dx = Math.abs(to.x - from.x)
        const dz = Math.abs(to.z - from.z)

        // Diagonal movement costs more
        if (dx === 1 && dz === 1) {
            return 1.414 // sqrt(2)
        } else {
            return 1.0 // Straight movement
        }
    }

    private reconstructPath(goalNode: GridNode): GridNode[] {
        const path: GridNode[] = []
        let currentNode: GridNode | null = goalNode

        while (currentNode !== null) {
            path.unshift(currentNode)
            currentNode = currentNode.parent
        }

        return path
    }

    // Debug method to visualize the grid
    public getNavigationGrid(): CellType[][] {
        return this.navigationGrid
    }
}
