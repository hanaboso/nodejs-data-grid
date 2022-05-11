import {
  entity, PrimaryKey, AutoIncrement, integer, Reference,
} from '@deepkit/type';

@entity.name('losos')
export class LososEntity {

  public id: integer & PrimaryKey & AutoIncrement = 0;

  constructor(
      public name: string = 'l',
  ) {
  }

}

@entity.name('example')
export default class ExampleEntity {

  public id: integer & PrimaryKey & AutoIncrement = 0;

  constructor(
    public name: string,
    public losos: LososEntity & Reference
  ) {
  }

}
