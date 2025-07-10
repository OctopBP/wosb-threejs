import type { Scene } from '@babylonjs/core'
import { type Mesh, MeshBuilder } from '@babylonjs/core'
import type {
    PositionComponent,
    ProjectileComponent,
    RenderableComponent,
    VelocityComponent,
    WeaponComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class WeaponSystem extends System {
    private scene: Scene

    constructor(world: World, scene: Scene) {
        super(world, ['weapon', 'position'])
        this.scene = scene
    }

    update(deltaTime: number): void {
        const currentTime = performance.now() / 1000 // Convert to seconds
        const entities = this.getEntities()

        for (const entity of entities) {
            const weapon = entity.getComponent<WeaponComponent>('weapon')
            const position = entity.getComponent<PositionComponent>('position')

            if (!weapon || !position) continue

            // Check if enough time has passed since last shot
            const timeSinceLastShot = currentTime - weapon.lastShotTime
            const fireInterval = 1 / weapon.fireRate // Convert fire rate to interval

            if (timeSinceLastShot >= fireInterval) {
                this.fireProjectile(entity.id, weapon, position, currentTime)
                weapon.lastShotTime = currentTime
            }
        }
    }

    private fireProjectile(
        shooterId: number,
        weapon: WeaponComponent,
        shooterPosition: PositionComponent,
        currentTime: number,
    ): void {
        // Create projectile entity
        const projectile = this.world.createEntity()

        // Calculate forward direction based on shooter's rotation
        const forwardX = Math.sin(shooterPosition.rotationY)
        const forwardZ = Math.cos(shooterPosition.rotationY)

        // Position component - start slightly in front of shooter
        const projectilePosition: PositionComponent = {
            type: 'position',
            x: shooterPosition.x + forwardX * 0.5, // Offset forward
            y: shooterPosition.y,
            z: shooterPosition.z + forwardZ * 0.5,
            rotationX: 0,
            rotationY: shooterPosition.rotationY,
            rotationZ: 0,
        }
        projectile.addComponent(projectilePosition)

        // Velocity component - projectile moves forward
        const projectileVelocity: VelocityComponent = {
            type: 'velocity',
            dx: forwardX * weapon.projectileSpeed,
            dy: 0,
            dz: forwardZ * weapon.projectileSpeed,
            angularVelocityX: 0,
            angularVelocityY: 0,
            angularVelocityZ: 0,
        }
        projectile.addComponent(projectileVelocity)

        // Projectile component
        const projectileComp: ProjectileComponent = {
            type: 'projectile',
            damage: weapon.damage,
            speed: weapon.projectileSpeed,
            ownerId: shooterId,
            maxLifetime: weapon.range / weapon.projectileSpeed, // Calculate lifetime based on range
            currentLifetime: 0,
        }
        projectile.addComponent(projectileComp)

        // Renderable component - sphere mesh
        const renderable: RenderableComponent = {
            type: 'renderable',
            meshId: `projectile_${projectile.id}`,
            mesh: this.createProjectileMesh(`projectile_${projectile.id}`),
            meshType: 'sphere' as any, // Type assertion since this isn't in MODEL_CONFIGS
            visible: true,
        }
        projectile.addComponent(renderable)
    }

    private createProjectileMesh(meshId: string): Mesh {
        // Create a simple sphere for the projectile
        const sphere = MeshBuilder.CreateSphere(
            meshId,
            {
                diameter: 0.2,
                segments: 8, // Low poly for performance
            },
            this.scene,
        )

        // Optional: Set material properties for visibility
        // You could create a simple material here if needed

        return sphere
    }
}
