export abstract class Component {
    entityId: number;
    
    constructor(entityId: number) {
        this.entityId = entityId;
    }
}

export type ComponentClass<T extends Component = Component> = new (entityId: number, ...args: any[]) => T;