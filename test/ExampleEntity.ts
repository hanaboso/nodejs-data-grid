import { entity, PrimaryKey, AutoIncrement, integer } from '@deepkit/type';

@entity.name('example')
export default class ExampleEntity {

  public id: integer & PrimaryKey & AutoIncrement = 0;

  constructor(
    public name: string,
  ) {
  }

}
