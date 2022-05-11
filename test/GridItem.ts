export default class GridItem {
    constructor (public id: number, public name: string, public losos: string) {
    }

    static fromRaw(data: Record<string, unknown>) {
        return new GridItem(
            // @ts-ignore
            data['id'],
            data['name'],
            data['losos'],
        );
    }
}