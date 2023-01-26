// eslint-disable-next-line max-classes-per-file
import {
    AutoIncrement, entity, integer, PrimaryKey, Reference,
} from '@deepkit/type';

@entity.name('losos')
export class LososEntity {

    public id: AutoIncrement & integer & PrimaryKey = 0;

    public constructor(
        public name: string = 'l',
    ) {
    }

}

@entity.name('example')
export default class ExampleEntity {

    public id: AutoIncrement & integer & PrimaryKey = 0;

    public constructor(
        public name: string,
        public losos: LososEntity & Reference,
    ) {
    }

}
