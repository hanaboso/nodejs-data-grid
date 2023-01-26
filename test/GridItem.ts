export default class GridItem {

    public constructor(public id: number, public name: string, public losos: string) {
    }

    public static fromRaw(data: Record<string, unknown>): GridItem {
        return new GridItem(
            data.id as number,
            data.name as string,
            data.losos as string,
        );
    }

}
