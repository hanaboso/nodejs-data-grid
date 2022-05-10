import {
    entity, PrimaryKey, AutoIncrement, integer, Reference,
} from '@deepkit/type';

@entity.name('losos')
export class LososEntity {
    public id: integer & PrimaryKey & AutoIncrement = 0;

    constructor (
        public name: string,
    ) {
    }

}

@entity.name('example')
export default class ExampleEntity {
    public id: integer & PrimaryKey & AutoIncrement = 0;

    constructor (
        public name: string,
        public losos: LososEntity & Reference<{ onDelete: 'RESTRICT', onUpdate: 'RESTRICT' }>,
    ) {
    }

}
